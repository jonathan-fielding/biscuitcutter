/**
 * Nunjucks extensions (filters and globals) — TypeScript equivalents of Jinja2 extensions.
 */

import * as nunjucks from 'nunjucks';
import { randomUUID } from 'crypto';

let polyfillsApplied = false;

/**
 * Simple strftime implementation for common format codes.
 */
function strftime(format: string, date: Date): string {
  const pad = (n: number, width: number = 2): string =>
    String(n).padStart(width, '0');

  return format.replace(/%[YmdHIMSpBbAa%]/g, (match) => {
    switch (match) {
      case '%Y':
        return String(date.getFullYear());
      case '%m':
        return pad(date.getMonth() + 1);
      case '%d':
        return pad(date.getDate());
      case '%H':
        return pad(date.getHours());
      case '%I': {
        const h = date.getHours() % 12;
        return pad(h === 0 ? 12 : h);
      }
      case '%M':
        return pad(date.getMinutes());
      case '%S':
        return pad(date.getSeconds());
      case '%p':
        return date.getHours() >= 12 ? 'PM' : 'AM';
      case '%B': {
        const months = [
          'January', 'February', 'March', 'April', 'May', 'June',
          'July', 'August', 'September', 'October', 'November', 'December',
        ];
        return months[date.getMonth()];
      }
      case '%b': {
        const monthsShort = [
          'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
          'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
        ];
        return monthsShort[date.getMonth()];
      }
      case '%A': {
        const days = [
          'Sunday', 'Monday', 'Tuesday', 'Wednesday',
          'Thursday', 'Friday', 'Saturday',
        ];
        return days[date.getDay()];
      }
      case '%a': {
        const daysShort = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        return daysShort[date.getDay()];
      }
      case '%%':
        return '%';
      default:
        return match;
    }
  });
}

/**
 * Nunjucks Extension for {% now %} tag (Jinja2 compatible).
 * Usage: {% now 'utc', '%Y-%m-%d' %} or {% now 'local', '%Y' %}
 */
export class NowExtension implements nunjucks.Extension {
  tags = ['now'];

  parse(parser: any, nodes: any, _lexer: any): any {
    const tok = parser.nextToken();
    const args = parser.parseSignature(null, true);
    parser.advanceAfterBlockEnd(tok.value);

    return new nodes.CallExtension(this, 'run', args, null);
  }

  run(_context: any, ...args: any[]): string {
    // Filter out the callback function that Nunjucks adds
    const filteredArgs = args.filter(arg => typeof arg !== 'function');
    
    // Default format
    let format = '%Y-%m-%d';
    
    // Parse arguments: {% now 'utc', '%Y' %} or {% now '%Y' %}
    if (filteredArgs.length >= 2) {
      // timezone (ignored), format
      format = filteredArgs[1];
    } else if (filteredArgs.length === 1) {
      // Could be timezone or format
      const arg = filteredArgs[0];
      if (arg && arg.startsWith('%')) {
        format = arg;
      }
      // If it's just 'utc' or 'local', use default format
    }
    
    return strftime(format, new Date());
  }
}

function applyPythonStringPolyfills(): void {
  if (polyfillsApplied) return;

  const defineMethod = (name: string, fn: any) => {
    if (!Object.hasOwn(String.prototype, name)) {
      // eslint-disable-next-line no-extend-native
      Object.defineProperty(String.prototype, name, {
        value: fn,
        writable: true,
        configurable: true,
        enumerable: false,
      });
    }
  };

  defineMethod('lower', function (this: string) { return this.toLowerCase(); });
  defineMethod('upper', function (this: string) { return this.toUpperCase(); });
  defineMethod('capitalize', function (this: string) {
    return this.charAt(0).toUpperCase() + this.slice(1).toLowerCase();
  });
  defineMethod('title', function (this: string) {
    return this.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.slice(1).toLowerCase());
  });
  defineMethod('strip', function (this: string, chars?: string) {
    if (chars) {
      const escaped = chars.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      return this.replace(new RegExp(`^[${escaped}]+|[${escaped}]+$`, 'g'), '');
    }
    return this.trim();
  });
  defineMethod('lstrip', function (this: string, chars?: string) {
    if (chars) {
      const escaped = chars.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      return this.replace(new RegExp(`^[${escaped}]+`, 'g'), '');
    }
    return this.trimStart();
  });
  defineMethod('rstrip', function (this: string, chars?: string) {
    if (chars) {
      const escaped = chars.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      return this.replace(new RegExp(`[${escaped}]+$`, 'g'), '');
    }
    return this.trimEnd();
  });
  defineMethod('startswith', function (this: string, str: string) { return this.startsWith(str); });
  defineMethod('endswith', function (this: string, str: string) { return this.endsWith(str); });

  // Jinja2 .split() without arguments splits by whitespace and filters out empty strings.
  const originalSplit = String.prototype.split;
  defineMethod('split_jinja', function (this: string, separator?: string | RegExp, limit?: number) {
    if (separator === undefined) {
      return this.trim().split(/\s+/);
    }
    return originalSplit.call(this, separator as any, limit);
  });

  // We can't safely override String.prototype.split permanently globally because it breaks JS apps.
  // We handle replace & split inside the env.renderString proxy wrapper safely!

  polyfillsApplied = true;
}

/**
 * Simple strftime implementation for common format codes.
 */
function strftime(format: string, date: Date): string {
  const pad = (n: number, width: number = 2): string => String(n).padStart(width, '0');

  return format.replace(/%[YmdHIMSpBbAa%]/g, (match) => {
    switch (match) {
      case '%Y':
        return String(date.getFullYear());
      case '%m':
        return pad(date.getMonth() + 1);
      case '%d':
        return pad(date.getDate());
      case '%H':
        return pad(date.getHours());
      case '%I': {
        const h = date.getHours() % 12;
        return pad(h === 0 ? 12 : h);
      }
      case '%M':
        return pad(date.getMinutes());
      case '%S':
        return pad(date.getSeconds());
      case '%p':
        return date.getHours() >= 12 ? 'PM' : 'AM';
      case '%B': {
        const months = [
          'January', 'February', 'March', 'April', 'May', 'June',
          'July', 'August', 'September', 'October', 'November', 'December',
        ];
        return months[date.getMonth()];
      }
      case '%b': {
        const monthsShort = [
          'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
          'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
        ];
        return monthsShort[date.getMonth()];
      }
      case '%A': {
        const days = [
          'Sunday', 'Monday', 'Tuesday', 'Wednesday',
          'Thursday', 'Friday', 'Saturday',
        ];
        return days[date.getDay()];
      }
      case '%a': {
        const daysShort = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        return daysShort[date.getDay()];
      }
      case '%%':
        return '%';
      default:
        return match;
    }
  });
}

/**
 * Register all default extensions (filters and globals) on the given environment.
 */
export function registerDefaultExtensions(env: nunjucks.Environment): void {
  applyPythonStringPolyfills();

  // Register {% now %} tag extension
  env.addExtension('NowExtension', new NowExtension());

  // Jsonify filter
  env.addFilter('jsonify', (obj: any, indent: number = 4) => JSON.stringify(obj, Object.keys(obj).sort(), indent));

  // Slugify filter
  env.addFilter('slugify', (value: string, options?: Record<string, any>) => {
    // Simple slugify implementation
    let slug = String(value)
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_]+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '');

    if (options?.maxLength && options.maxLength > 0) {
      slug = slug.substring(0, options.maxLength);
    }

    return slug;
  });

  // Jinja2 Map Filter Polyfill
  env.addFilter(
    'map',
    (arr: any[], filterNameOrAttr?: string | Record<string, any>, ...args: any[]) => {
      if (!Array.isArray(arr) || !arr) return arr;

      // Handle keyword arguments e.g. map(attribute='name')
      if (
        filterNameOrAttr
        && typeof filterNameOrAttr === 'object'
        && filterNameOrAttr.__keywords
      ) {
        const attr = filterNameOrAttr.attribute;
        if (attr) {
          return arr.map((item: any) => item?.[attr]);
        }
        return arr;
      }

      const prop = filterNameOrAttr as string;

      try {
        const filter = env.getFilter(prop);
        if (filter) {
          return arr.map((item) => filter(item, ...args));
        }
      } catch {
        // filter not found, fallback to attribute
      }

      return arr.map((item: any) => item?.[prop]);
    },
  );

  // UUID4 global
  env.addGlobal('uuid4', () => randomUUID());

  // Random ASCII string global
  env.addGlobal(
    'random_ascii_string',
    (length: number, punctuation: boolean = false) => {
      const letters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
      const punct = '!"#$%&\'()*+,-./:;<=>?@[\\]^_`{|}~';
      const corpus = punctuation ? letters + punct : letters;
      let result = '';
      for (let i = 0; i < length; i++) {
        result += corpus.charAt(Math.floor(Math.random() * corpus.length));
      }
      return result;
    },
  );

  // Now tag — provides current date formatting
  // Handles both positional args and Nunjucks keyword args (passed as object with __keywords: true)
  env.addGlobal('now', (timezoneOrKwargs?: string | Record<string, any>, format?: string) => {
    let fmt = '%Y-%m-%d';

    // Check if first arg is Nunjucks keyword arguments object
    if (timezoneOrKwargs && typeof timezoneOrKwargs === 'object' && timezoneOrKwargs.__keywords) {
      fmt = timezoneOrKwargs.format || fmt;
    } else if (format) {
      fmt = format;
    } else if (typeof timezoneOrKwargs === 'string' && timezoneOrKwargs.startsWith('%')) {
      // First positional arg looks like a format string
      fmt = timezoneOrKwargs;
    }

    return strftime(fmt, new Date());
  });
}
