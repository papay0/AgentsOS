import { logger, type UserLogData, type ServiceLogData, type WorkspaceLogData, type ErrorLogData } from './logger';

// Demo function to show off the logger capabilities
export function demoLogger() {
  console.log('=== Logger Demo ===\n');
  
  // Basic logging levels
  logger.debug('This is a debug message');
  logger.info('Application started successfully');
  logger.warn('This is a warning message');
  logger.error('This is an error message');
  logger.success('Operation completed successfully');

  console.log('');

  // Workspace-specific logging
  logger.workspace.creating();
  logger.workspace.installing('Node.js dependencies');
  logger.workspace.starting('VSCode server');
  logger.workspace.checking('service health');
  logger.workspace.retry(1, 3);
  logger.workspace.ready();

  console.log('');

  // Logging with strict typed data
  const userData: UserLogData = {
    userId: '123',
    email: 'user@example.com',
    action: 'signup',
    timestamp: new Date(),
    metadata: {
      source: 'web',
      plan: 'free'
    }
  };
  logger.logUser('User account created', userData);

  const serviceData: ServiceLogData = {
    service: 'vscode-server',
    port: 8080,
    status: 'running',
    url: 'http://localhost:8080',
    pid: 12345
  };
  logger.logService('VSCode server started', serviceData);

  const workspaceData: WorkspaceLogData = {
    sandboxId: 'sb_abc123',
    image: 'node:20',
    resources: {
      cpu: 2,
      memory: 4
    },
    urls: {
      vscode: 'https://vscode.example.com',
      terminal: 'https://terminal.example.com',
      claude: 'https://claude.example.com'
    }
  };
  logger.logWorkspace('Workspace created successfully', workspaceData);

  const errorData: ErrorLogData = {
    error: new Error('Connection timeout'),
    code: 'TIMEOUT',
    details: {
      retries: 3,
      timeout: 30000,
      endpoint: 'api.example.com'
    }
  };
  logger.logError('Failed to connect to service', errorData);

  // Progress simulation
  logger.progress('Installing packages', 3, 10);
  logger.progress('Installing packages', 7, 10);
  logger.progress('Installing packages', 10, 10);

  console.log('');

  // Group demonstration
  logger.group('Service Setup', () => {
    logger.info('Configuring database');
    logger.info('Setting up authentication');
    logger.success('All services configured');
  });

  console.log('\n=== Logger Demo Complete ===');
}

// Uncomment to run the demo
// demoLogger();