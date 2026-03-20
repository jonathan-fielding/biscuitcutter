/**
 * Nunjucks Extension for {% now %} tag (Jinja2 compatible).
 * Usage: {% now 'utc', '%Y-%m-%d' %} or {% now 'local', '%Y' %}
 */

import * as nunjucks from 'nunjucks';
import { strftime } from './strftime.js';

export class NowExtension implements nunjucks.Extension {
  tags = ['now'];

  parse(parser: any, nodes: any, _lexer: any): any {
    const tok = parser.nextToken();
    const args = parser.parseSignature(null, true);
    parser.advanceAfterBlockEnd(tok.value);

    return new nodes.CallExtension(this, 'run', args, null);
  }

  // eslint-disable-next-line class-methods-use-this
  run(_context: any, ...args: any[]): string {
    // Filter out the callback function that Nunjucks adds
    const filteredArgs = args.filter((arg) => typeof arg !== 'function');

    // Default format
    let format = '%Y-%m-%d';

    // Parse arguments: {% now 'utc', '%Y' %} or {% now '%Y' %}
    if (filteredArgs.length >= 2) {
      // timezone (ignored), format
      [, format] = filteredArgs;
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
