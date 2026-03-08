/**
 * Module for setting up logging.
 */

export type LogLevel = 'DEBUG' | 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL';

const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
  DEBUG: 0,
  INFO: 1,
  WARNING: 2,
  ERROR: 3,
  CRITICAL: 4,
};

export interface Logger {
  debug(message: string, ...args: any[]): void;
  info(message: string, ...args: any[]): void;
  warn(message: string, ...args: any[]): void;
  error(message: string, ...args: any[]): void;
}

let currentLevel: LogLevel = 'INFO';
let debugFileStream: import('fs').WriteStream | null = null;

function formatMessage(level: string, name: string, message: string, args: any[]): string {
  let formatted = message;
  for (const arg of args) {
    formatted = formatted.replace(/%[sdifoO]/, String(arg));
  }
  if (currentLevel === 'DEBUG') {
    return `${level} ${name}: ${formatted}`;
  }
  return `${level}: ${formatted}`;
}

function shouldLog(level: LogLevel): boolean {
  return LOG_LEVEL_PRIORITY[level] >= LOG_LEVEL_PRIORITY[currentLevel];
}

export function getLogger(name: string): Logger {
  return {
    debug(message: string, ...args: any[]) {
      const formatted = formatMessage('DEBUG', name, message, args);
      if (debugFileStream) {
        debugFileStream.write(formatted + '\n');
      }
      if (shouldLog('DEBUG')) {
        console.log(formatted);
      }
    },
    info(message: string, ...args: any[]) {
      const formatted = formatMessage('INFO', name, message, args);
      if (debugFileStream) {
        debugFileStream.write(formatted + '\n');
      }
      if (shouldLog('INFO')) {
        console.log(formatted);
      }
    },
    warn(message: string, ...args: any[]) {
      const formatted = formatMessage('WARNING', name, message, args);
      if (debugFileStream) {
        debugFileStream.write(formatted + '\n');
      }
      if (shouldLog('WARNING')) {
        console.warn(formatted);
      }
    },
    error(message: string, ...args: any[]) {
      const formatted = formatMessage('ERROR', name, message, args);
      if (debugFileStream) {
        debugFileStream.write(formatted + '\n');
      }
      if (shouldLog('ERROR')) {
        console.error(formatted);
      }
    },
  };
}

/**
 * Configure logging for biscuitcutter.
 *
 * Set up logging to stdout with given level. If `debugFile` is given set
 * up logging to file with DEBUG level.
 */
export function configureLogger(
  streamLevel: LogLevel = 'DEBUG',
  debugFile?: string | null,
): void {
  currentLevel = streamLevel;

  if (debugFile) {
    const fs = require('fs');
    debugFileStream = fs.createWriteStream(debugFile, { flags: 'a' });
  }
}
