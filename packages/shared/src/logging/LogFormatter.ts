/**
 * Log formatters for different output formats
 */

import {
  LogLevel,
  LogLevelNames,
  LogLevelColors,
  RESET_COLOR,
} from "./LogLevel.js";
import { LogEntry } from "./LogTransport.js";

export interface LogFormatter {
  format(entry: LogEntry): string;
}

/**
 * JSON formatter for structured logging
 */
export class JsonLogFormatter implements LogFormatter {
  format(entry: LogEntry): string {
    const logObject = {
      timestamp: entry.timestamp.toISOString(),
      level: LogLevelNames[entry.level],
      message: entry.message,
      ...(entry.component && { component: entry.component }),
      ...(entry.requestId && { requestId: entry.requestId }),
      ...(entry.userId && { userId: entry.userId }),
      ...(entry.sessionId && { sessionId: entry.sessionId }),
      ...(entry.data && { data: entry.data }),
    };

    return JSON.stringify(logObject);
  }
}

/**
 * Console formatter for human-readable output
 */
export class ConsoleLogFormatter implements LogFormatter {
  private useColors: boolean;

  constructor(useColors: boolean = true) {
    this.useColors = useColors;
  }

  format(entry: LogEntry): string {
    const timestamp = entry.timestamp.toISOString();
    const level = LogLevelNames[entry.level];
    const color = this.useColors ? LogLevelColors[entry.level] : "";
    const reset = this.useColors ? RESET_COLOR : "";

    let formatted = `${color}[${timestamp}] ${level}${reset}`;

    if (entry.component) {
      formatted += ` [${entry.component}]`;
    }

    if (entry.requestId) {
      formatted += ` [req:${entry.requestId.substring(0, 8)}]`;
    }

    formatted += `: ${entry.message}`;

    if (entry.data && Object.keys(entry.data).length > 0) {
      formatted += `\n${color}Data:${reset} ${JSON.stringify(entry.data, null, 2)}`;
    }

    return formatted;
  }
}

/**
 * Simple formatter for basic text output
 */
export class SimpleFormatter implements LogFormatter {
  format(entry: LogEntry): string {
    const timestamp = entry.timestamp.toISOString();
    const level = LogLevelNames[entry.level];

    let formatted = `${timestamp} ${level}: ${entry.message}`;

    if (entry.component) {
      formatted = `${timestamp} ${level} [${entry.component}]: ${entry.message}`;
    }

    return formatted;
  }
}

/**
 * Compact formatter for minimal output
 */
export class CompactFormatter implements LogFormatter {
  format(entry: LogEntry): string {
    const time = entry.timestamp.toTimeString().split(" ")[0];
    const level = LogLevelNames[entry.level].charAt(0);

    return `${time} ${level} ${entry.message}`;
  }
}
