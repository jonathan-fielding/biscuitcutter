#!/usr/bin/env node
/**
 * Main `biscuitcutter` CLI.
 */

import { Command } from 'commander';
import * as fs from 'fs';
import * as path from 'path';
import { getUserConfig } from './config';
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
} from './exceptions';
import { configureLogger } from './log';
import { biscuitcutter } from './main';

const VERSION = '1.0.0';

function versionMsg(): string {
  const location = path.dirname(path.dirname(path.resolve(__filename)));
  return `BiscuitCutter ${VERSION} from ${location} (Node.js ${process.version})`;
}

function validateExtraContext(value: string, previous: Record<string, string>): Record<string, string> {
  if (!value.includes('=')) {
    console.error(
      `EXTRA_CONTEXT should contain items of the form key=value; '${value}' doesn't match that form`,
    );
    process.exit(1);
  }
  const [key, ...rest] = value.split('=');
  previous[key] = rest.join('=');
  return previous;
}

function listInstalledTemplates(
  defaultConfig: boolean,
  passedConfigFile?: string | null,
): void {
  const config = getUserConfig(passedConfigFile, defaultConfig);
  const biscuitcutterFolder = config.cookiecutters_dir;

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
        path.join(biscuitcutterFolder, folder, 'cookiecutter.json'),
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
    'Do not prompt for parameters and only use cookiecutter.json file content',
  )
  .option(
    '-c, --checkout <checkout>',
    'Branch, tag or commit to checkout after git clone',
  )
  .option(
    '--directory <directory>',
    'Directory within repo that holds cookiecutter.json file',
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

export function main(): void {
  program.parse(process.argv);
}

if (require.main === module) {
  main();
}
