/**
 * Functions for generating a project from a project template.
 */

import * as fs from 'fs';
import * as path from 'path';
import * as nunjucks from 'nunjucks';
import * as fsExtra from 'fs-extra';
import { getLogger } from './log';
import {
  ContextDecodingError,
  EmptyDirNameError,
  OutputDirExistsError,
  UndefinedVariableInTemplateError,
} from './exceptions';
import { findTemplate } from './find';
import { runHookFromRepoDir } from './hooks';
import { processYesNoResponse } from './prompt';
import {
  createEnvWithContext,
  makeSurePathExists,
  rmtree,
  workIn,
} from './utils';

const logger = getLogger('biscuitcutter.generate');

/**
 * Check whether the given `filePath` should only be copied and not rendered.
 */
export function isCopyOnlyPath(
  filePath: string,
  context: Record<string, any>,
): boolean {
  try {
    const dontRender: string[] =
      context.cookiecutter?._copy_without_render || [];
    for (const pattern of dontRender) {
      if (minimatch(filePath, pattern)) {
        return true;
      }
    }
  } catch {
    return false;
  }
  return false;
}

/**
 * Simple glob/fnmatch implementation.
 */
function minimatch(filepath: string, pattern: string): boolean {
  // Convert fnmatch pattern to regex
  let regexStr = pattern
    .replace(/[.+^${}()|[\]\\]/g, '\\$&')
    .replace(/\*/g, '.*')
    .replace(/\?/g, '.');
  regexStr = '^' + regexStr + '$';
  return new RegExp(regexStr).test(filepath);
}

/**
 * Modify the given context in place based on the overwrite_context.
 */
export function applyOverwritesToContext(
  context: Record<string, any>,
  overwriteContext: Record<string, any>,
  inDictionaryVariable: boolean = false,
): void {
  for (const [variable, overwrite] of Object.entries(overwriteContext)) {
    if (!(variable in context)) {
      if (!inDictionaryVariable) {
        continue;
      }
      context[variable] = overwrite;
    }

    const contextValue = context[variable];

    if (Array.isArray(contextValue)) {
      if (inDictionaryVariable) {
        context[variable] = overwrite;
        continue;
      }
      if (Array.isArray(overwrite)) {
        // Multichoice variable
        const overwriteSet = new Set(overwrite as string[]);
        const contextSet = new Set(contextValue as string[]);
        const isSubset = [...overwriteSet].every((item) => contextSet.has(item));
        if (isSubset) {
          context[variable] = overwrite;
        } else {
          throw new Error(
            `${JSON.stringify(overwrite)} provided for multi-choice variable ` +
              `${variable}, but valid choices are ${JSON.stringify(contextValue)}`,
          );
        }
      } else {
        // Choice variable
        const idx = contextValue.indexOf(overwrite);
        if (idx !== -1) {
          contextValue.splice(idx, 1);
          contextValue.unshift(overwrite);
        } else {
          throw new Error(
            `${overwrite} provided for choice variable ` +
              `${variable}, but the choices are ${JSON.stringify(contextValue)}.`,
          );
        }
      }
    } else if (
      typeof contextValue === 'object' &&
      contextValue !== null &&
      typeof overwrite === 'object' &&
      overwrite !== null &&
      !Array.isArray(overwrite)
    ) {
      applyOverwritesToContext(contextValue, overwrite, true);
      context[variable] = contextValue;
    } else if (typeof contextValue === 'boolean' && typeof overwrite === 'string') {
      try {
        context[variable] = processYesNoResponse(overwrite);
      } catch {
        throw new Error(
          `${overwrite} provided for variable ` +
            `${variable} could not be converted to a boolean.`,
        );
      }
    } else {
      context[variable] = overwrite;
    }
  }
}

/**
 * Generate the context for a BiscuitCutter project template.
 *
 * Loads the JSON file as an object, with key being the JSON filename stem.
 */
export function generateContext(
  contextFile: string = 'cookiecutter.json',
  defaultContext?: Record<string, any> | null,
  extraContext?: Record<string, any> | null,
): Record<string, any> {
  const context: Record<string, any> = {};

  let obj: Record<string, any>;
  try {
    const content = fs.readFileSync(contextFile, 'utf-8');
    obj = JSON.parse(content);
  } catch (e: any) {
    const fullPath = path.resolve(contextFile);
    throw new ContextDecodingError(
      `JSON decoding error while loading '${fullPath}'. ` +
        `Decoding error details: '${e.message}'`,
    );
  }

  // Add the object to the context dictionary
  const fileName = path.basename(contextFile);
  const fileStem = fileName.split('.')[0];
  context[fileStem] = obj;

  // Overwrite context variable defaults with the default context
  if (defaultContext) {
    try {
      applyOverwritesToContext(obj, defaultContext);
    } catch (error: any) {
      console.warn(`Invalid default received: ${error.message}`);
    }
  }
  if (extraContext) {
    applyOverwritesToContext(obj, extraContext);
  }

  logger.debug('Context generated is %s', JSON.stringify(context));
  return context;
}

/**
 * Check if a file is binary.
 */
function isBinaryFile(filePath: string): boolean {
  try {
    const { isTextSync } = require('istextorbinary');
    return !isTextSync(filePath);
  } catch {
    // Fallback: read first 8000 bytes and check for null bytes
    const buffer = Buffer.alloc(8000);
    const fd = fs.openSync(filePath, 'r');
    const bytesRead = fs.readSync(fd, buffer, 0, 8000, 0);
    fs.closeSync(fd);
    for (let i = 0; i < bytesRead; i++) {
      if (buffer[i] === 0) return true;
    }
    return false;
  }
}

/**
 * Render filename of infile as name of outfile, handle infile correctly.
 */
export function generateFile(
  projectDir: string,
  infile: string,
  context: Record<string, any>,
  env: nunjucks.Environment,
  skipIfFileExists: boolean = false,
): void {
  logger.debug('Processing file %s', infile);

  // Render the path to the output file
  const outfileRendered = env.renderString(infile, context);
  const outfile = path.join(projectDir, outfileRendered);

  if (fs.existsSync(outfile) && fs.statSync(outfile).isDirectory()) {
    logger.debug('The resulting file name is empty: %s', outfile);
    return;
  }

  if (skipIfFileExists && fs.existsSync(outfile)) {
    logger.debug('The resulting file already exists: %s', outfile);
    return;
  }

  // Ensure parent directory exists
  makeSurePathExists(path.dirname(outfile));

  logger.debug('Created file at %s', outfile);

  // Just copy over binary files. Don't render.
  logger.debug('Check %s to see if it\'s a binary', infile);
  if (isBinaryFile(infile)) {
    logger.debug('Copying binary %s to %s without rendering', infile, outfile);
    fs.copyFileSync(infile, outfile);
    return;
  }

  // Render the file
  const infileContent = fs.readFileSync(infile, 'utf-8');

  let rendered: string;
  try {
    rendered = env.renderString(infileContent, context);
  } catch (err: any) {
    if (err.name === 'Template render error') {
      // Re-throw with more detail
      throw err;
    }
    throw err;
  }

  // Detect original line ending
  let newline = '\n';
  if (infileContent.includes('\r\n')) {
    newline = '\r\n';
  } else if (infileContent.includes('\r')) {
    newline = '\r';
  }

  // Check for configured newlines
  if (context.cookiecutter?._new_lines) {
    newline = context.cookiecutter._new_lines;
    logger.debug('Using configured newline character %s', JSON.stringify(newline));
  }

  // Normalize line endings in rendered output
  const normalized = rendered.replace(/\r\n|\r|\n/g, newline);

  fs.writeFileSync(outfile, normalized, 'utf-8');

  // Copy file permissions
  try {
    const stat = fs.statSync(infile);
    fs.chmodSync(outfile, stat.mode);
  } catch {
    // Ignore permission copy errors (e.g., on Windows)
  }
}

/**
 * Render name of a directory, create the directory, return its path.
 */
export function renderAndCreateDir(
  dirname: string,
  context: Record<string, any>,
  outputDir: string,
  environment: nunjucks.Environment,
  overwriteIfExists: boolean = false,
): [string, boolean] {
  if (!dirname || dirname === '') {
    throw new EmptyDirNameError('Error: directory name is empty');
  }

  const renderedDirname = environment.renderString(dirname, context);
  const dirToCreate = path.join(outputDir, renderedDirname);

  logger.debug(
    'Rendered dir %s must exist in output_dir %s',
    dirToCreate,
    outputDir,
  );

  const outputDirExists = fs.existsSync(dirToCreate);

  if (outputDirExists) {
    if (overwriteIfExists) {
      logger.debug(
        'Output directory %s already exists, overwriting it',
        dirToCreate,
      );
    } else {
      throw new OutputDirExistsError(
        `Error: "${dirToCreate}" directory already exists`,
      );
    }
  } else {
    makeSurePathExists(dirToCreate);
  }

  return [dirToCreate, !outputDirExists];
}

/**
 * Walk a directory tree synchronously, yielding [root, dirs, files].
 */
function* walkSync(
  dir: string,
): Generator<[string, string[], string[]]> {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const dirs: string[] = [];
  const files: string[] = [];

  for (const entry of entries) {
    if (entry.isDirectory()) {
      dirs.push(entry.name);
    } else {
      files.push(entry.name);
    }
  }

  yield [dir, dirs, files];

  for (const d of dirs) {
    yield* walkSync(path.join(dir, d));
  }
}

/**
 * Render the templates and save them to files.
 */
export function generateFiles(
  repoDir: string,
  context?: Record<string, any> | null,
  outputDir: string = '.',
  overwriteIfExists: boolean = false,
  skipIfFileExists: boolean = false,
  acceptHooks: boolean = true,
  keepProjectOnFailure: boolean = false,
): string {
  context = context || {};

  const env = createEnvWithContext(context);
  const templateDir = findTemplate(repoDir);
  logger.debug('Generating project from %s...', templateDir);

  const unrenderedDir = path.basename(templateDir);

  let projectDir: string;
  let outputDirectoryCreated: boolean;

  try {
    [projectDir, outputDirectoryCreated] = renderAndCreateDir(
      unrenderedDir,
      context,
      outputDir,
      env,
      overwriteIfExists,
    );
  } catch (err: any) {
    if (err.message?.includes('not defined')) {
      throw new UndefinedVariableInTemplateError(
        `Unable to create project directory '${unrenderedDir}'`,
        err,
        context,
      );
    }
    throw err;
  }

  projectDir = path.resolve(projectDir);
  logger.debug('Project directory is %s', projectDir);

  const deleteProjectOnFailure =
    outputDirectoryCreated && !keepProjectOnFailure;

  if (acceptHooks) {
    runHookFromRepoDir(
      repoDir,
      'pre_gen_project',
      projectDir,
      context,
      deleteProjectOnFailure,
    );
  }

  workIn(templateDir, () => {
    // Set up nunjucks to load templates from current dir and ../templates
    const loader = new nunjucks.FileSystemLoader(['.', '../templates'], {
      noCache: true,
    });
    const renderEnv = new nunjucks.Environment(loader, {
      autoescape: false,
      throwOnUndefined: true,
    });

    // Register extensions on the render env too
    const { registerDefaultExtensions } = require('./extensions');
    registerDefaultExtensions(renderEnv);

    // Walk the template directory
    for (const [root, dirs, files] of walkSync('.')) {
      const copyDirs: string[] = [];
      const renderDirs: string[] = [];

      for (const d of [...dirs].sort()) {
        const normalizedPath = path.normalize(path.join(root, d));
        if (isCopyOnlyPath(normalizedPath, context!)) {
          logger.debug('Found copy only path %s', d);
          copyDirs.push(d);
        } else {
          renderDirs.push(d);
        }
      }

      for (const copyDir of copyDirs) {
        const indir = path.normalize(path.join(root, copyDir));
        let outdir = path.normalize(path.join(projectDir, indir));
        outdir = env.renderString(outdir, context!);
        logger.debug(
          'Copying dir %s to %s without rendering',
          indir,
          outdir,
        );

        if (fs.existsSync(outdir) && fs.statSync(outdir).isDirectory()) {
          fs.rmSync(outdir, { recursive: true, force: true });
        }
        fsExtra.copySync(indir, outdir);
      }

      // Mutate dirs to only include render dirs
      dirs.length = 0;
      dirs.push(...renderDirs);

      for (const d of dirs) {
        const unrenderedSubdir = path.join(projectDir, root, d);
        try {
          renderAndCreateDir(
            unrenderedSubdir,
            context!,
            outputDir,
            env,
            overwriteIfExists,
          );
        } catch (err: any) {
          if (err.message?.includes('not defined')) {
            if (deleteProjectOnFailure) {
              rmtree(projectDir);
            }
            const relDir = path.relative(outputDir, unrenderedSubdir);
            throw new UndefinedVariableInTemplateError(
              `Unable to create directory '${relDir}'`,
              err,
              context!,
            );
          }
          throw err;
        }
      }

      for (const f of [...files].sort()) {
        const infile = path.normalize(path.join(root, f));
        if (isCopyOnlyPath(infile, context!)) {
          const outfileRendered = env.renderString(infile, context!);
          const outfile = path.join(projectDir, outfileRendered);
          logger.debug(
            'Copying file %s to %s without rendering',
            infile,
            outfile,
          );
          makeSurePathExists(path.dirname(outfile));
          fs.copyFileSync(infile, outfile);
          continue;
        }
        try {
          generateFile(projectDir, infile, context!, renderEnv, skipIfFileExists);
        } catch (err: any) {
          if (err.message?.includes('not defined')) {
            if (deleteProjectOnFailure) {
              rmtree(projectDir);
            }
            throw new UndefinedVariableInTemplateError(
              `Unable to create file '${infile}'`,
              err,
              context!,
            );
          }
          throw err;
        }
      }
    }
  });

  if (acceptHooks) {
    runHookFromRepoDir(
      repoDir,
      'post_gen_project',
      projectDir,
      context,
      deleteProjectOnFailure,
    );
  }

  return projectDir;
}
