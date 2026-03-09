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
  const contextEnvVars = ctx.biscuitcutter?._jinja2_env_vars || {};

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

  // Add backwards compatibility for templates that use {{ cookiecutter.some_var }}
  if (ctx && ctx.biscuitcutter) {
    env.addGlobal('cookiecutter', ctx.biscuitcutter);
  }

  // Wrap renderString to safely polyfill Python's global `.replace()` and zero-arg `.split()`
  const originalRenderString = env.renderString.bind(env);
  env.renderString = function (str: string, context?: any) {
    const originalReplace = String.prototype.replace;
    const originalSplit = String.prototype.split;
    try {
      (String.prototype as any).replace = function (this: string, ...args: any[]) {
        const [searchValue, ...rest] = args;
        if (typeof searchValue === 'string') {
          return this.split(searchValue).join(rest[0] as string);
        }
        return originalReplace.apply(this, args as any);
      };

      (String.prototype as any).split = function (this: string, separator?: string | RegExp, limit?: number) {
        if (separator === undefined) {
          return this.trim().split(/\s+/);
        }
        return originalSplit.call(this, separator as any, limit);
      };

      return originalRenderString(str, context);
    } finally {
      (String.prototype as any).replace = originalReplace;
      (String.prototype as any).split = originalSplit;
    }
  } as any;

  return env;
}

/**
 * Read extensions from the context's cookiecutter._extensions key.
 */
function readExtensions(context: Record<string, any>): string[] {
  try {
    const extensions = context.biscuitcutter?._extensions;
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
