export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'success';

// Simple, flexible type that accepts any serializable data
export type LogData = unknown;

// Specialized interfaces for better IDE support and documentation
export interface ServiceLogData {
  service?: string;
  port?: number;
  status?: 'starting' | 'running' | 'stopped' | 'failed' | 'error';
  url?: string;
  pid?: number;
  error?: string;
}

export interface WorkspaceLogData {
  sandboxId?: string;
  userId?: string;
  repositories?: number;
  state?: string;
  rootDir?: string;
  image?: string;
  duration?: string;
  resources?: {
    cpu?: number;
    memory?: number;
  };
  urls?: Record<string, string>;
}

export interface PerformanceLogData {
  operation?: string;
  duration?: number;
  startTime?: number;
  endTime?: number;
  memory?: number;
  cpu?: number;
}

export interface AuthLogData {
  userId?: string;
  action?: string;
  success?: boolean;
  method?: string;
  ip?: string;
}

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: Date;
  context: string;
  data?: LogData;
}

export class Logger {
  private static instances = new Map<string, Logger>();
  private context: string;
  private enabledLevels: Set<LogLevel>;

  private readonly colors = {
    debug: '\x1b[90m',    // Gray
    info: '\x1b[36m',     // Cyan  
    warn: '\x1b[33m',     // Yellow
    error: '\x1b[31m',    // Red
    success: '\x1b[32m',  // Green
    reset: '\x1b[0m',     // Reset
    bold: '\x1b[1m',      // Bold
    dim: '\x1b[2m'        // Dim
  } as const;

  private readonly icons = {
    debug: '🔍',
    info: 'ℹ️', 
    warn: '⚠️',
    error: '❌',
    success: '✅'
  } as const;

  private constructor(
    context: string = 'App', 
    enabledLevels: LogLevel[] = ['debug', 'info', 'warn', 'error', 'success']
  ) {
    this.context = context;
    this.enabledLevels = new Set(enabledLevels);
  }

  static create(context: string, enabledLevels?: LogLevel[]): Logger {
    const key = `${context}-${enabledLevels?.join(',') || 'default'}`;
    
    if (!Logger.instances.has(key)) {
      Logger.instances.set(key, new Logger(context, enabledLevels));
    }
    
    return Logger.instances.get(key)!;
  }

  static getInstance(context: string = 'App'): Logger {
    return Logger.create(context);
  }

  private formatTimestamp(date: Date): string {
    return date.toISOString().replace('T', ' ').replace('Z', '');
  }

  private safeStringify(obj: LogData): string {
    if (obj === null || obj === undefined) {
      return String(obj);
    }

    // Handle primitive types
    if (typeof obj === 'string' || typeof obj === 'number' || typeof obj === 'boolean') {
      return String(obj);
    }

    // Handle Error objects
    if (obj instanceof Error) {
      return JSON.stringify({
        name: obj.name,
        message: obj.message,
        stack: obj.stack?.split('\n').slice(0, 3).join('\n')
      }, null, 2);
    }

    // Handle Date objects
    if (obj instanceof Date) {
      return obj.toISOString();
    }

    // Handle complex objects
    const seen = new WeakSet();
    
    try {
      const result = JSON.stringify(obj, (_key, value) => {
        if (value === null || value === undefined) {
          return value;
        }

        if (value instanceof Date) {
          return value.toISOString();
        }

        if (value instanceof Error) {
          return {
            name: value.name,
            message: value.message,
            stack: value.stack?.split('\n').slice(0, 3).join('\n')
          };
        }

        if (typeof value === 'object' && value !== null) {
          if (seen.has(value)) {
            return '[Circular Reference]';
          }
          seen.add(value);
        }

        return value;
      }, 2);

      return result.length > 1000 ? result.substring(0, 1000) + '...[truncated]' : result;
    } catch (error) {
      return `[Serialization Error: ${error instanceof Error ? error.message : String(error)}]`;
    }
  }

  private formatMessage(entry: LogEntry): string {
    const { level, message, timestamp, context, data } = entry;
    const color = this.colors[level];
    const icon = this.icons[level];
    const formattedTime = this.formatTimestamp(timestamp);
    
    let logLine = `${this.colors.dim}[${formattedTime}]${this.colors.reset} ${icon} ${color}${this.colors.bold}[${level.toUpperCase()}]${this.colors.reset} ${this.colors.bold}[${context}]${this.colors.reset} ${message}`;
    
    if (data !== undefined && data !== null) {
      const dataStr = this.safeStringify(data);
      if (dataStr && dataStr !== '{}' && dataStr !== 'null' && dataStr !== 'undefined') {
        logLine += `\n${this.colors.dim}${dataStr}${this.colors.reset}`;
      }
    }
    
    return logLine;
  }

  private log(level: LogLevel, message: string, data?: LogData, context?: string): void {
    if (!this.enabledLevels.has(level)) {
      return;
    }

    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date(),
      context: context || this.context,
      data
    };

    const formattedMessage = this.formatMessage(entry);
    console.log(formattedMessage);
  }

  // Core logging methods
  debug(message: string, data?: LogData, context?: string): void {
    this.log('debug', message, data, context);
  }

  info(message: string, data?: LogData, context?: string): void {
    this.log('info', message, data, context);
  }

  warn(message: string, data?: LogData, context?: string): void {
    this.log('warn', message, data, context);
  }

  error(message: string, data?: LogData, context?: string): void {
    this.log('error', message, data, context);
  }

  success(message: string, data?: LogData, context?: string): void {
    this.log('success', message, data, context);
  }

  // Specialized logging methods with better type hints
  logService(message: string, data: ServiceLogData, context: string = 'SERVICE'): void {
    this.info(message, data, context);
  }

  logWorkspace(message: string, data: WorkspaceLogData, context: string = 'WORKSPACE'): void {
    this.info(message, data, context);
  }

  logAuth(message: string, data: AuthLogData, context: string = 'AUTH'): void {
    this.info(message, data, context);
  }

  logPerformance(message: string, data: PerformanceLogData, context: string = 'PERF'): void {
    this.info(message, data, context);
  }

  // Backward compatibility method
  logError(message: string, data: LogData, context?: string): void {
    this.error(message, data, context);
  }

  // Utility methods
  group(title: string, callback: () => void | Promise<void>): void | Promise<void> {
    this.info(`┌─ ${title}`, undefined, 'GROUP');
    
    try {
      const result = callback();
      
      if (result instanceof Promise) {
        return result
          .then(() => this.info(`└─ Completed: ${title}`, undefined, 'GROUP'))
          .catch((error) => {
            this.error(`└─ Failed: ${title}`, { error: String(error) }, 'GROUP');
            throw error;
          });
      } else {
        this.info(`└─ Completed: ${title}`, undefined, 'GROUP');
        return result;
      }
    } catch (error) {
      this.error(`└─ Failed: ${title}`, { error: String(error) }, 'GROUP');
      throw error;
    }
  }

  async time<T>(label: string, operation: () => Promise<T>): Promise<T> {
    const startTime = Date.now();
    this.debug(`⏱️ Starting: ${label}`, undefined, 'TIMER');
    
    try {
      const result = await operation();
      const duration = Date.now() - startTime;
      
      this.success(`⏱️ Completed: ${label}`, {
        operation: label,
        duration,
        startTime,
        endTime: Date.now()
      } satisfies PerformanceLogData, 'TIMER');
      
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      
      this.error(`⏱️ Failed: ${label}`, {
        operation: label,
        error: String(error),
        duration,
        startTime,
        endTime: Date.now()
      }, 'TIMER');
      
      throw error;
    }
  }

  progress(message: string, current: number, total: number): void {
    const percentage = Math.round((current / total) * 100);
    const progressBar = '█'.repeat(Math.floor(percentage / 5)) + '░'.repeat(20 - Math.floor(percentage / 5));
    
    this.info(`${message} [${progressBar}] ${percentage}%`, {
      current,
      total,
      percentage,
      remaining: total - current
    }, 'PROGRESS');
  }

  // Create child logger with additional context
  child(childContext: string): Logger {
    return Logger.create(`${this.context}:${childContext}`, Array.from(this.enabledLevels));
  }

  // Update log levels at runtime
  setLevel(levels: LogLevel[]): void {
    this.enabledLevels = new Set(levels);
  }

  // Check if a level is enabled
  isEnabled(level: LogLevel): boolean {
    return this.enabledLevels.has(level);
  }

  // Backward compatibility: workspace shorthand methods
  workspace = {
    creating: (message?: string) => this.info(`🚀 ${message || 'Creating workspace...'}`, undefined, 'WORKSPACE'),
    installing: (packageName: string) => this.info(`📦 Installing ${packageName}...`, undefined, 'INSTALL'),
    starting: (service: string) => this.info(`🔄 Starting ${service}...`, undefined, 'SERVICE'),
    ready: (message?: string) => this.success(`✨ ${message || 'Workspace ready!'}`, undefined, 'WORKSPACE'),
    checking: (what: string) => this.debug(`🔍 Checking ${what}...`, undefined, 'HEALTH'),
    retry: (attempt: number, maxRetries: number) => this.warn(`🔄 Retry attempt ${attempt}/${maxRetries}`, undefined, 'RETRY')
  };
}

// Export default instances for convenience
export const logger = Logger.create('App');
export const workspaceLogger = Logger.create('Workspace');
export const authLogger = Logger.create('Auth');
export const serviceLogger = Logger.create('Service');