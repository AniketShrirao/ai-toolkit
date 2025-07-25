export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: Date;
  context?: any;
}

export class TestLogger {
  private logs: LogEntry[] = [];
  private currentLevel: LogLevel = 'info';
  private levelPriority: Record<LogLevel, number> = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
  };

  setLevel(level: LogLevel): void {
    this.currentLevel = level;
  }

  debug(message: string, context?: any): void {
    this.log('debug', message, context);
  }

  info(message: string, context?: any): void {
    this.log('info', message, context);
  }

  warn(message: string, context?: any): void {
    this.log('warn', message, context);
  }

  error(message: string, context?: any): void {
    this.log('error', message, context);
  }

  private log(level: LogLevel, message: string, context?: any): void {
    if (this.levelPriority[level] >= this.levelPriority[this.currentLevel]) {
      const entry: LogEntry = {
        level,
        message,
        timestamp: new Date(),
        context,
      };
      
      this.logs.push(entry);
      
      // Only output to console in test environment if explicitly enabled
      if (process.env.TEST_VERBOSE === 'true') {
        const timestamp = entry.timestamp.toISOString();
        const contextStr = context ? ` ${JSON.stringify(context)}` : '';
        console.log(`[${timestamp}] ${level.toUpperCase()}: ${message}${contextStr}`);
      }
    }
  }

  getLogs(level?: LogLevel): LogEntry[] {
    if (level) {
      return this.logs.filter(log => log.level === level);
    }
    return [...this.logs];
  }

  getLogsByLevel(level: LogLevel): LogEntry[] {
    return this.logs.filter(log => log.level === level);
  }

  hasLogs(level?: LogLevel): boolean {
    if (level) {
      return this.logs.some(log => log.level === level);
    }
    return this.logs.length > 0;
  }

  clearLogs(): void {
    this.logs = [];
  }

  getLastLog(level?: LogLevel): LogEntry | undefined {
    const filteredLogs = level ? this.logs.filter(log => log.level === level) : this.logs;
    return filteredLogs[filteredLogs.length - 1];
  }

  findLogs(predicate: (log: LogEntry) => boolean): LogEntry[] {
    return this.logs.filter(predicate);
  }

  getLogCount(level?: LogLevel): number {
    if (level) {
      return this.logs.filter(log => log.level === level).length;
    }
    return this.logs.length;
  }

  exportLogs(): string {
    return this.logs
      .map(log => {
        const timestamp = log.timestamp.toISOString();
        const contextStr = log.context ? ` ${JSON.stringify(log.context)}` : '';
        return `[${timestamp}] ${log.level.toUpperCase()}: ${log.message}${contextStr}`;
      })
      .join('\n');
  }
}