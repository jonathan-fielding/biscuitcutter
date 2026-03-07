/**
 * BiscuitCutter - A TypeScript port of Cookiecutter.
 *
 * A command-line utility that creates projects from project templates.
 */

export { biscuitcutter, BiscuitCutterOptions } from './main';
export { generateContext, generateFiles, generateFile } from './generate';
export { getUserConfig, getConfig, mergeConfigs, BiscuitCutterConfig } from './config';
export { determineRepoDir, isRepoUrl, isZipFile, expandAbbreviations } from './repository';
export { promptForConfig, chooseNestedTemplate, renderVariable } from './prompt';
export { dump as replayDump, load as replayLoad } from './replay';
export { findTemplate } from './find';
export { clone, identifyRepo, isVcsInstalled } from './vcs';
export { unzip } from './zipfile';
export { configureLogger, getLogger } from './log';
export { createStrictEnvironment } from './environment';
export {
  rmtree,
  makeSurePathExists,
  workIn,
  makeExecutable,
  createTmpRepoDir,
  createEnvWithContext,
} from './utils';
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
} from './exceptions';
