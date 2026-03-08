/**
 * BiscuitCutter - A TypeScript port of Cookiecutter.
 *
 * A command-line utility that creates projects from project templates.
 */

// Core business logic
export { biscuitcutter, BiscuitCutterOptions } from './core/main';
export { generateContext, generateFiles, generateFile } from './core/generate';
export { promptForConfig, chooseNestedTemplate, renderVariable } from './core/prompt';
export { dump as replayDump, load as replayLoad } from './core/replay';
export { findTemplate } from './core/find';

// Repository handling
export { determineRepoDir, isRepoUrl, isZipFile, expandAbbreviations } from './repository/repository';
export { clone, identifyRepo, isVcsInstalled } from './repository/vcs';
export { unzip } from './repository/zipfile';

// Configuration
export { getUserConfig, getConfig, mergeConfigs, BiscuitCutterConfig } from './config/config';

// Template engine
export { createStrictEnvironment } from './template/environment';

// Utilities
export { configureLogger, getLogger } from './utils/log';
export {
  rmtree,
  makeSurePathExists,
  workIn,
  makeExecutable,
  createTmpRepoDir,
  createEnvWithContext,
} from './utils/utils';
export {
  BiscuitCutterError,
  NonTemplatedInputDirError,
  UnknownTemplateDirError,
  MissingProjectDirError,
  ConfigDoesNotExistError,
  InvalidConfigurationError,
  UnknownRepoTypeError,
  VCSNotInstalledError,
  ContextDecodingError,
  OutputDirExistsError,
  EmptyDirNameError,
  InvalidModeError,
  FailedHookError,
  UndefinedVariableInTemplateError,
  UnknownExtensionError,
  RepositoryNotFoundError,
  RepositoryCloneFailedError,
  InvalidZipRepositoryError,
} from './utils/exceptions';
