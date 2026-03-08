#!/usr/bin/env node
/**
 * Main `biscuitcutter` CLI.
 */

import { Command } from 'commander';
import * as fs from 'fs';
import * as path from 'path';
import { getUserConfig } from '../config/config';
import {
  ContextDecodingError,
  EmptyDirNameError,
  FailedHookError,
  InvalidModeError,
  InvalidZipRepositoryError,
  OutputDirExistsError,
  RepositoryCloneFailedError,
  RepositoryNotFoundError,
  UndefinedVariableInTemplateError,
  UnknownExtensionError,
  TemplateStateNotFoundError,
  TemplateStateExistsError,
  DirtyGitRepositoryError,
} from '../utils/exceptions';
import { configureLogger } from '../utils/log';
import { biscuitcutter } from '../core/main';
import {
  create,
  check,
  update,
  diff,
  link,
} from '../core/tracking';
import { version as VERSION } from '../../package.json';

function versionMsg(): string {
  const location = path.dirname(path.dirname(path.resolve(__filename)));
  return `BiscuitCutter ${VERSION} from ${location} (Node.js ${process.version})`;
}


function listInstalledTemplates(
  defaultConfig: boolean,
  passedConfigFile?: string | null,
): void {
  const config = getUserConfig(passedConfigFile, defaultConfig);
  const biscuitcutterFolder = config.biscuitcutters_dir;

  if (!fs.existsSync(biscuitcutterFolder)) {
    console.error(
      `Error: Cannot list installed templates. Folder does not exist: ${biscuitcutterFolder}`,
    );
    process.exit(-1);
  }

  const templateNames = fs
    .readdirSync(biscuitcutterFolder)
    .filter((folder) =>
      fs.existsSync(
        path.join(biscuitcutterFolder, folder, 'biscuitcutter.json'),
      ) || fs.existsSync(
        path.join(biscuitcutterFolder, folder, 'biscuitcutter.json (or cookiecutter.json)'),
      ),
    );

  console.log(`${templateNames.length} installed templates: `);
  for (const name of templateNames) {
    console.log(` * ${name}`);
  }
}

const program = new Command();

program
  .name('biscuitcutter')
  .description(
    'Create a project from a BiscuitCutter project template (TEMPLATE).\n\n' +
      'BiscuitCutter is a port of the popular Cookiecutter tool to TypeScript.',
  )
  .version(versionMsg(), '-V, --version')
  .argument('[template]', 'Template directory or repository URL')
  .option(
    '-e, --extra-context <items...>',
    'Extra context items in key=value format',
  )
  .option(
    '--no-input',
    'Do not prompt for parameters and only use biscuitcutter.json (or cookiecutter.json) file content',
  )
  .option(
    '-c, --checkout <checkout>',
    'Branch, tag or commit to checkout after git clone',
  )
  .option(
    '--directory <directory>',
    'Directory within repo that holds biscuitcutter.json (or cookiecutter.json) file',
  )
  .option('-v, --verbose', 'Print debug information', false)
  .option(
    '--replay',
    'Do not prompt for parameters and only use information entered previously',
    false,
  )
  .option(
    '--replay-file <path>',
    'Use this file for replay instead of the default',
  )
  .option(
    '-f, --overwrite-if-exists',
    'Overwrite the contents of the output directory if it already exists',
    false,
  )
  .option(
    '-s, --skip-if-file-exists',
    'Skip the files in the corresponding directories if they already exist',
    false,
  )
  .option(
    '-o, --output-dir <dir>',
    'Where to output the generated project dir into',
    '.',
  )
  .option('--config-file <path>', 'User configuration file')
  .option(
    '--default-config',
    'Do not load a config file. Use the defaults instead',
    false,
  )
  .option(
    '--debug-file <path>',
    'File to be used as a stream for DEBUG logging',
  )
  .option(
    '--accept-hooks <value>',
    'Accept pre/post hooks (yes/ask/no)',
    'yes',
  )
  .option(
    '-l, --list-installed',
    'List currently installed templates',
    false,
  )
  .option(
    '--keep-project-on-failure',
    'Do not delete project folder on failure',
    false,
  )
  .action(async (template: string | undefined, opts: any) => {
    // Commands that should work without arguments
    if (opts.listInstalled) {
      listInstalledTemplates(opts.defaultConfig, opts.configFile);
      process.exit(0);
    }

    if (!template || template.toLowerCase() === 'help') {
      program.help();
      process.exit(0);
    }

    configureLogger(
      opts.verbose ? 'DEBUG' : 'INFO',
      opts.debugFile,
    );

    // Parse extra context
    let extraContext: Record<string, string> | null = null;
    if (opts.extraContext) {
      extraContext = {};
      for (const item of opts.extraContext) {
        if (!item.includes('=')) {
          console.error(
            `EXTRA_CONTEXT should contain items of the form key=value; '${item}' doesn't match that form`,
          );
          process.exit(1);
        }
        const [key, ...rest] = item.split('=');
        extraContext[key] = rest.join('=');
      }
    }

    // Handle accept-hooks
    let acceptHooks: boolean;
    if (opts.acceptHooks === 'ask') {
      const readline = require('readline');
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
      });
      acceptHooks = await new Promise<boolean>((resolve) => {
        rl.question('Do you want to execute hooks? [y/N]: ', (answer: string) => {
          rl.close();
          resolve(answer.toLowerCase().startsWith('y'));
        });
      });
    } else {
      acceptHooks = opts.acceptHooks === 'yes';
    }

    let replay: boolean | string = opts.replay;
    if (opts.replayFile) {
      replay = opts.replayFile;
    }

    try {
      await biscuitcutter({
        template,
        checkout: opts.checkout,
        noInput: opts.noInput === false ? false : !opts.input,
        extraContext,
        replay,
        overwriteIfExists: opts.overwriteIfExists,
        outputDir: opts.outputDir,
        configFile: opts.configFile,
        defaultConfig: opts.defaultConfig,
        password: process.env['BISCUITCUTTER_REPO_PASSWORD'],
        directory: opts.directory,
        skipIfFileExists: opts.skipIfFileExists,
        acceptHooks,
        keepProjectOnFailure: opts.keepProjectOnFailure,
      });
    } catch (e: any) {
      if (
        e instanceof ContextDecodingError ||
        e instanceof OutputDirExistsError ||
        e instanceof EmptyDirNameError ||
        e instanceof InvalidModeError ||
        e instanceof FailedHookError ||
        e instanceof UnknownExtensionError ||
        e instanceof InvalidZipRepositoryError ||
        e instanceof RepositoryNotFoundError ||
        e instanceof RepositoryCloneFailedError
      ) {
        console.error(e.message);
        process.exit(1);
      } else if (e instanceof UndefinedVariableInTemplateError) {
        console.error(e.message);
        console.error(`Error message: ${e.error.message}`);
        console.error(
          `Context: ${JSON.stringify(e.context, null, 4)}`,
        );
        process.exit(1);
      } else {
        throw e;
      }
    }
  });

// ==========================================
// Template tracking commands
// ==========================================

/**
 * Handle template tracking errors.
 */
function handleTrackingError(e: any): void {
  if (
    e instanceof TemplateStateNotFoundError ||
    e instanceof TemplateStateExistsError ||
    e instanceof DirtyGitRepositoryError ||
    e instanceof RepositoryNotFoundError ||
    e instanceof RepositoryCloneFailedError
  ) {
    console.error(e.message);
    process.exit(1);
  } else {
    throw e;
  }
}

/**
 * Parse extra context from CLI arguments.
 */
function parseExtraContext(items: string[] | undefined): Record<string, any> | null {
  if (!items) return null;
  const extraContext: Record<string, any> = {};
  for (const item of items) {
    if (!item.includes('=')) {
      console.error(`Extra context should be in key=value format; '${item}' is invalid`);
      process.exit(1);
    }
    const [key, ...rest] = item.split('=');
    extraContext[key] = rest.join('=');
  }
  return extraContext;
}

// Create command - create a new project with template tracking
program
  .command('create <template>')
  .description('Create a new project from a template with update tracking enabled')
  .option('-o, --output-dir <dir>', 'Where to output the generated project', '.')
  .option('-c, --checkout <checkout>', 'Branch, tag, or commit to checkout')
  .option('--directory <directory>', 'Directory within repo that holds biscuitcutter.json (or cookiecutter.json)')
  .option('--no-input', 'Do not prompt for parameters')
  .option('-e, --extra-context <items...>', 'Extra context items in key=value format')
  .option('--extra-context-file <path>', 'JSON file with extra context')
  .option('--config-file <path>', 'User configuration file')
  .option('--default-config', 'Use default config values', false)
  .option('-f, --overwrite-if-exists', 'Overwrite output directory if it exists', false)
  .option('--skip <paths...>', 'Paths to skip during updates')
  .option('-v, --verbose', 'Print debug information', false)
  .action(async (template: string, opts: any) => {
    configureLogger(opts.verbose ? 'DEBUG' : 'INFO');

    try {
      const projectDir = await create({
        templateGitUrl: template,
        outputDir: opts.outputDir,
        checkout: opts.checkout,
        directory: opts.directory,
        noInput: !opts.input,
        extraContext: parseExtraContext(opts.extraContext),
        extraContextFile: opts.extraContextFile,
        configFile: opts.configFile,
        defaultConfig: opts.defaultConfig,
        overwriteIfExists: opts.overwriteIfExists,
        skip: opts.skip,
      });
      console.log(`Project created at ${projectDir}`);
    } catch (e: any) {
      handleTrackingError(e);
    }
  });

// Check command - check if project is up to date
program
  .command('check')
  .description('Check if the project is up to date with its template')
  .option('-p, --project-dir <dir>', 'The project directory to check', '.')
  .option('-c, --checkout <checkout>', 'Branch, tag, or commit to check against')
  .option('--strict', 'Require exact commit match', true)
  .option('--no-strict', 'Allow ancestry matching')
  .option('-v, --verbose', 'Print debug information', false)
  .action(async (opts: any) => {
    configureLogger(opts.verbose ? 'DEBUG' : 'INFO');

    try {
      const result = await check({
        projectDir: opts.projectDir,
        checkout: opts.checkout,
        strict: opts.strict,
      });

      if (result.upToDate) {
        console.log('\x1b[32m%s\x1b[0m', `SUCCESS: ${result.message}`);
        process.exit(0);
      } else {
        console.log('\x1b[31m%s\x1b[0m', `FAILURE: ${result.message}`);
        process.exit(1);
      }
    } catch (e: any) {
      handleTrackingError(e);
    }
  });

// Update command - update project to latest template version
program
  .command('update')
  .description('Update the project to the latest template version')
  .option('-p, --project-dir <dir>', 'The project directory to update', '.')
  .option('-c, --checkout <checkout>', 'Branch, tag, or commit to update to')
  .option('--template-path <path>', 'Override the template path')
  .option('--cookiecutter-input', 'Prompt for cookiecutter input during update', false)
  .option('--refresh-private-variables', 'Refresh private variables from template', false)
  .option('-y, --yes', 'Skip asking to apply changes', false)
  .option('--skip-update', 'Skip applying update (just mark as updated)', false)
  .option('--strict', 'Require exact commit match for up-to-date check', true)
  .option('--no-strict', 'Allow ancestry matching')
  .option('--allow-untracked-files', 'Allow untracked files in working directory', false)
  .option('-e, --extra-context <items...>', 'Extra context items in key=value format')
  .option('--extra-context-file <path>', 'JSON file with extra context')
  .option('-v, --verbose', 'Print debug information', false)
  .action(async (opts: any) => {
    configureLogger(opts.verbose ? 'DEBUG' : 'INFO');

    try {
      const result = await update({
        projectDir: opts.projectDir,
        checkout: opts.checkout,
        templatePath: opts.templatePath,
        biscuitcutterInput: opts.biscuitcutterInput,
        refreshPrivateVariables: opts.refreshPrivateVariables,
        skipApplyAsk: opts.yes,
        skipUpdate: opts.skipUpdate,
        strict: opts.strict,
        allowUntrackedFiles: opts.allowUntrackedFiles,
        extraContext: parseExtraContext(opts.extraContext),
        extraContextFile: opts.extraContextFile,
      });

      if (result.success) {
        console.log('\x1b[32m%s\x1b[0m', result.message);
      } else {
        console.log('\x1b[31m%s\x1b[0m', result.message);
        process.exit(1);
      }
    } catch (e: any) {
      handleTrackingError(e);
    }
  });

// Diff command - show diff between project and template
program
  .command('diff')
  .description('Show the diff between the project and its template')
  .option('-p, --project-dir <dir>', 'The project directory to check', '.')
  .option('-c, --checkout <checkout>', 'Branch, tag, or commit to compare against')
  .option('--exit-code', 'Return non-zero exit code if there are differences', false)
  .option('-v, --verbose', 'Print debug information', false)
  .action(async (opts: any) => {
    configureLogger(opts.verbose ? 'DEBUG' : 'INFO');

    try {
      const result = await diff({
        projectDir: opts.projectDir,
        checkout: opts.checkout,
        exitCode: opts.exitCode,
      });

      process.exit(result.exitCode);
    } catch (e: any) {
      handleTrackingError(e);
    }
  });

// Link command - link existing project to a template
program
  .command('link <template>')
  .description('Link an existing project to a cookiecutter template')
  .option('-p, --project-dir <dir>', 'The project directory to link', '.')
  .option('-c, --checkout <checkout>', 'Branch, tag, or commit to link to')
  .option('--directory <directory>', 'Directory within repo that holds biscuitcutter.json (or cookiecutter.json)')
  .option('--no-input', 'Do not prompt for parameters')
  .option('-e, --extra-context <items...>', 'Extra context items in key=value format')
  .option('--config-file <path>', 'User configuration file')
  .option('--default-config', 'Use default config values', false)
  .option('-v, --verbose', 'Print debug information', false)
  .action(async (template: string, opts: any) => {
    configureLogger(opts.verbose ? 'DEBUG' : 'INFO');

    try {
      await link({
        templateGitUrl: template,
        projectDir: opts.projectDir,
        checkout: opts.checkout,
        directory: opts.directory,
        noInput: !opts.input,
        extraContext: parseExtraContext(opts.extraContext),
        configFile: opts.configFile,
        defaultConfig: opts.defaultConfig,
      });
      console.log('\x1b[32m%s\x1b[0m', 'Project linked successfully!');
    } catch (e: any) {
      handleTrackingError(e);
    }
  });

export function main(): void {
  program.parse(process.argv);
}

if (require.main === module) {
  main();
}
