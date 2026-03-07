/**
 * All exceptions used in the BiscuitCutter code base are defined here.
 */

/** Base exception class. All BiscuitCutter-specific exceptions should extend this. */
export class BiscuitCutterError extends Error {
  constructor(message?: string) {
    super(message);
    this.name = 'BiscuitCutterError';
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/**
 * Exception for when a project's input dir is not templated.
 * The name of the input directory should always contain a string that is
 * rendered to something else, so that input_dir != output_dir.
 */
export class NonTemplatedInputDirError extends BiscuitCutterError {
  constructor(message?: string) {
    super(message);
    this.name = 'NonTemplatedInputDirError';
  }
}

/**
 * Exception for ambiguous project template directory.
 * Raised when BiscuitCutter cannot determine which directory is the project
 * template, e.g. more than one dir appears to be a template dir.
 */
export class UnknownTemplateDirError extends BiscuitCutterError {
  constructor(message?: string) {
    super(message);
    this.name = 'UnknownTemplateDirError';
  }
}

/**
 * Exception for missing generated project directory.
 * Raised during cleanup when a generated project directory can't be found.
 */
export class MissingProjectDirError extends BiscuitCutterError {
  constructor(message?: string) {
    super(message);
    this.name = 'MissingProjectDirError';
  }
}

/**
 * Exception for missing config file.
 * Raised when getConfig() is passed a path to a config file, but no file
 * is found at that path.
 */
export class ConfigDoesNotExistError extends BiscuitCutterError {
  constructor(message?: string) {
    super(message);
    this.name = 'ConfigDoesNotExistError';
  }
}

/**
 * Exception for invalid configuration file.
 * Raised if the global configuration file is not valid YAML or is
 * badly constructed.
 */
export class InvalidConfigurationError extends BiscuitCutterError {
  constructor(message?: string) {
    super(message);
    this.name = 'InvalidConfigurationError';
  }
}

/**
 * Exception for unknown repo types.
 * Raised if a repo's type cannot be determined.
 */
export class UnknownRepoTypeError extends BiscuitCutterError {
  constructor(message?: string) {
    super(message);
    this.name = 'UnknownRepoTypeError';
  }
}

/**
 * Exception when version control is unavailable.
 * Raised if the version control system (git or hg) is not installed.
 */
export class VCSNotInstalledError extends BiscuitCutterError {
  constructor(message?: string) {
    super(message);
    this.name = 'VCSNotInstalledError';
  }
}

/**
 * Exception for failed JSON decoding.
 * Raised when a project's JSON context file can not be decoded.
 */
export class ContextDecodingError extends BiscuitCutterError {
  constructor(message?: string) {
    super(message);
    this.name = 'ContextDecodingError';
  }
}

/**
 * Exception for existing output directory.
 * Raised when the output directory of the project exists already.
 */
export class OutputDirExistsError extends BiscuitCutterError {
  constructor(message?: string) {
    super(message);
    this.name = 'OutputDirExistsError';
  }
}

/**
 * Exception for an empty directory name.
 * Raised when the directory name provided is empty.
 */
export class EmptyDirNameError extends BiscuitCutterError {
  constructor(message?: string) {
    super(message);
    this.name = 'EmptyDirNameError';
  }
}

/**
 * Exception for incompatible modes.
 * Raised when biscuitcutter is called with both `noInput==true` and
 * `replay==true` at the same time.
 */
export class InvalidModeError extends BiscuitCutterError {
  constructor(message?: string) {
    super(message);
    this.name = 'InvalidModeError';
  }
}

/**
 * Exception for hook failures.
 * Raised when a hook script fails.
 */
export class FailedHookError extends BiscuitCutterError {
  constructor(message?: string) {
    super(message);
    this.name = 'FailedHookError';
  }
}

/**
 * Exception for out-of-scope variables.
 * Raised when a template uses a variable which is not defined in the context.
 */
export class UndefinedVariableInTemplateError extends BiscuitCutterError {
  public error: Error;
  public context: Record<string, any>;

  constructor(message: string, error: Error, context: Record<string, any>) {
    super(message);
    this.name = 'UndefinedVariableInTemplateError';
    this.error = error;
    this.context = context;
  }

  toString(): string {
    return (
      `${this.message}. ` +
      `Error message: ${this.error.message}. ` +
      `Context: ${JSON.stringify(this.context)}`
    );
  }
}

/**
 * Exception for un-importable extension.
 * Raised when an environment is unable to import a required extension.
 */
export class UnknownExtensionError extends BiscuitCutterError {
  constructor(message?: string) {
    super(message);
    this.name = 'UnknownExtensionError';
  }
}

/**
 * Exception for missing repo.
 * Raised when the specified biscuitcutter repository doesn't exist.
 */
export class RepositoryNotFoundError extends BiscuitCutterError {
  constructor(message?: string) {
    super(message);
    this.name = 'RepositoryNotFoundError';
  }
}

/**
 * Exception for un-cloneable repo.
 * Raised when a biscuitcutter template can't be cloned.
 */
export class RepositoryCloneFailedError extends BiscuitCutterError {
  constructor(message?: string) {
    super(message);
    this.name = 'RepositoryCloneFailedError';
  }
}

/**
 * Exception for bad zip repo.
 * Raised when the specified biscuitcutter repository isn't a valid Zip archive.
 */
export class InvalidZipRepositoryError extends BiscuitCutterError {
  constructor(message?: string) {
    super(message);
    this.name = 'InvalidZipRepositoryError';
  }
}
