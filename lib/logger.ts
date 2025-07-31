export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'success';

// Strict type definitions for log data
export interface ErrorLogData {
  error?: Error | string;
  stack?: string;
  code?: string | number;
  details?: Record<string, string | number | boolean>;
}

export interface ServiceLogData {
  service?: string;
  port?: number;
  status?: 'starting' | 'running' | 'stopped' | 'failed';
  url?: string;
  pid?: number;
}

export interface WorkspaceLogData {
  sandboxId?: string;
  image?: string;
  resources?: {
    cpu: number;
    memory: number;
  };
  urls?: {
    vscode?: string;
    terminal?: string;
    claude?: string;
  };
}

export interface UserLogData {
  userId?: string;
  email?: string;
  action?: string;
  timestamp?: Date;
  metadata?: Record<string, string | number | boolean>;
}

export interface SystemLogData {
  component?: string;
  version?: string;
  environment?: string;
  performance?: {
    duration: number;
    memory?: number;
    cpu?: number;
  };
}

// Union type for all possible log data
export type LogData = 
  | ErrorLogData 
  | ServiceLogData 
  | WorkspaceLogData 
  | UserLogData 
  | SystemLogData 
  | Record<string, string | number | boolean | Date | null | undefined>
  | string
  | number
  | boolean
  | null;

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: Date;
  context?: string;
  data?: LogData;
}

export class Logger {
  private static instance: Logger;
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
  };

  private readonly icons = {
    debug: '🔍',
    info: 'ℹ️',
    warn: '⚠️',
    error: '❌',
    success: '✅'
  };

  private constructor(context: string = 'App', enabledLevels: LogLevel[] = ['debug', 'info', 'warn', 'error', 'success']) {
    this.context = context;
    this.enabledLevels = new Set(enabledLevels);
  }

  static getInstance(context?: string): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger(context);
    }
    return Logger.instance;
  }

  static create(context: string, enabledLevels?: LogLevel[]): Logger {
    return new Logger(context, enabledLevels);
  }

  private formatTimestamp(date: Date): string {
    return date.toISOString().replace('T', ' ').replace('Z', '');
  }

  private formatMessage(entry: LogEntry): string {
    const { level, message, timestamp, context, data } = entry;
    const color = this.colors[level];
    const icon = this.icons[level];
    const formattedTime = this.formatTimestamp(timestamp);
    
    let logLine = `${this.colors.dim}[${formattedTime}]${this.colors.reset} ${icon} ${color}${this.colors.bold}[${level.toUpperCase()}]${this.colors.reset} ${this.colors.bold}[${context || this.context}]${this.colors.reset} ${message}`;
    
    if (data !== undefined) {
      logLine += `\n${this.colors.dim}${JSON.stringify(data, null, 2)}${this.colors.reset}`;
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

  debug(message: string, data?: LogData, context?: string): void {
    this.log('debug', message, data, context);
  }

  info(message: string, data?: LogData, context?: string): void {
    this.log('info', message, data, context);
  }

  warn(message: string, data?: LogData, context?: string): void {
    this.log('warn', message, data, context);
  }

  error(message: string, data?: ErrorLogData | string, context?: string): void {
    this.log('error', message, data, context);
  }

  success(message: string, data?: LogData, context?: string): void {
    this.log('success', message, data, context);
  }

  // Specialized logging methods with strict typing
  logService(message: string, serviceData: ServiceLogData, context: string = 'SERVICE'): void {
    this.info(message, serviceData, context);
  }

  logWorkspace(message: string, workspaceData: WorkspaceLogData, context: string = 'WORKSPACE'): void {
    this.info(message, workspaceData, context);
  }

  logUser(message: string, userData: UserLogData, context: string = 'USER'): void {
    this.info(message, userData, context);
  }

  logSystem(message: string, systemData: SystemLogData, context: string = 'SYSTEM'): void {
    this.info(message, systemData, context);
  }

  logError(message: string, errorData: ErrorLogData, context?: string): void {
    this.error(message, errorData, context);
  }

  // Workspace-specific logging methods
  workspace = {
    creating: (message: string = 'Creating workspace...') => this.info(`🚀 ${message}`, undefined, 'WORKSPACE'),
    installing: (packageName: string) => this.info(`📦 Installing ${packageName}...`, undefined, 'INSTALL'),
    starting: (service: string) => this.info(`🔄 Starting ${service}...`, undefined, 'SERVICE'),
    ready: (message: string = 'Workspace ready!') => this.success(`✨ ${message}`, undefined, 'WORKSPACE'),
    checking: (what: string) => this.debug(`🔍 Checking ${what}...`, undefined, 'HEALTH'),
    retry: (attempt: number, maxRetries: number) => this.warn(`🔄 Retry attempt ${attempt}/${maxRetries}`, undefined, 'RETRY')
  };

  // Progress bar simulation for longer operations
  progress(message: string, current: number, total: number): void {
    const percentage = Math.round((current / total) * 100);
    const progressBar = '█'.repeat(Math.floor(percentage / 5)) + '░'.repeat(20 - Math.floor(percentage / 5));
    this.info(`${message} [${progressBar}] ${percentage}%`, undefined, 'PROGRESS');
  }

  // Group related logs
  group(title: string, callback: () => void): void {
    this.info(`┌─ ${title}`, undefined, 'GROUP');
    callback();
    this.info(`└─ Completed: ${title}`, undefined, 'GROUP');
  }

  // Time execution
  async time<T>(label: string, operation: () => Promise<T>): Promise<T> {
    const start = Date.now();
    this.debug(`⏱️ Starting: ${label}`, undefined, 'TIMER');
    
    try {
      const result = await operation();
      const duration = Date.now() - start;
      const performanceData: SystemLogData = {
        component: 'Timer',
        performance: { duration }
      };
      this.success(`⏱️ Completed: ${label} (${duration}ms)`, performanceData, 'TIMER');
      return result;
    } catch (error) {
      const duration = Date.now() - start;
      const errorData: ErrorLogData = {
        error: error instanceof Error ? error : String(error),
        details: { duration }
      };
      this.error(`⏱️ Failed: ${label} (${duration}ms)`, errorData, 'TIMER');
      throw error;
    }
  }
}

// Export a default instance for convenience
export const logger = Logger.create('DaytonaClient');