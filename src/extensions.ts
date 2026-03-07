/**
 * Nunjucks extensions (filters and globals) — TypeScript equivalents of Jinja2 extensions.
 */

import * as nunjucks from 'nunjucks';
import { randomUUID } from 'crypto';

/**
 * Register all default extensions (filters and globals) on the given environment.
 */
export function registerDefaultExtensions(env: nunjucks.Environment): void {
  // Jsonify filter
  env.addFilter('jsonify', (obj: any, indent: number = 4) => {
    return JSON.stringify(obj, Object.keys(obj).sort(), indent);
  });

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

  // UUID4 global
  env.addGlobal('uuid4', () => randomUUID());

  // Random ASCII string global
  env.addGlobal(
    'random_ascii_string',
    (length: number, punctuation: boolean = false) => {
      const letters =
        'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
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
