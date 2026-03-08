/**
 * Nunjucks environment and extension loading.
 */

import * as nunjucks from 'nunjucks';
import { getLogger } from '../utils/log';
import { registerDefaultExtensions } from './extensions';

const logger = getLogger('biscuitcutter.environment');

export interface EnvironmentOptions {
  context?: Record<string, any>;
  keepTrailingNewline?: boolean;
  searchPaths?: string | string[];
  [key: string]: any;
}

/**
 * Create a Nunjucks environment with extensions loaded from the context.
 *
 * 1. Registers default extensions (jsonify, slugify, uuid, time, randomString).
 * 2. Reads extensions set in the cookiecutter.json _extensions key (logged as warning since
 *    Python Jinja2 extensions can't be directly loaded in Nunjucks).
 * 3. Sets strict undefined handling.
 */
export function createStrictEnvironment(options: EnvironmentOptions = {}): nunjucks.Environment {
  const { context, searchPaths, ...envVars } = options;
  const ctx = context || {};

  // Read user-requested extensions from context (warn about incompatibility)
  const userExtensions = readExtensions(ctx);
  if (userExtensions.length > 0) {
    logger.warn(
      'Python Jinja2 extensions are not directly supported in Nunjucks: %s',
      userExtensions.join(', '),
    );
  }

  // Get jinja2 env vars from context
  const contextEnvVars = ctx.cookiecutter?._jinja2_env_vars || {};

  const loader = searchPaths
    ? new nunjucks.FileSystemLoader(searchPaths, { noCache: true })
    : null;

  const env = new nunjucks.Environment(loader as any, {
    autoescape: false,
    throwOnUndefined: true,
    trimBlocks: false,
    lstripBlocks: false,
    ...contextEnvVars,
    ...envVars,
  });

  // Register default filters and globals
  registerDefaultExtensions(env);

  return env;
}

/**
 * Read extensions from the context's cookiecutter._extensions key.
 */
function readExtensions(context: Record<string, any>): string[] {
  try {
    const extensions = context.cookiecutter?._extensions;
    if (Array.isArray(extensions)) {
      return extensions.map(String);
    }
    return [];
  } catch {
    return [];
  }
}

/**
 * The variable start/end strings used by nunjucks (equivalent to Jinja2's {{ and }}).
 */
export const VARIABLE_START_STRING = '{{';
export const VARIABLE_END_STRING = '}}';
