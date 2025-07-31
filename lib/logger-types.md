# Logger Strict Type Definitions

This document outlines the strict type system implemented for the logger to avoid using `unknown` or `any` types.

## Type Interfaces

### ErrorLogData
Used for error logging with structured error information:
```typescript
interface ErrorLogData {
  error?: Error | string;
  stack?: string;
  code?: string | number;
  details?: Record<string, string | number | boolean>;
}
```

### ServiceLogData  
Used for service-related logging:
```typescript
interface ServiceLogData {
  service?: string;
  port?: number;
  status?: 'starting' | 'running' | 'stopped' | 'failed';
  url?: string;
  pid?: number;
}
```

### WorkspaceLogData
Used for workspace operations:
```typescript
interface WorkspaceLogData {
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
```

### UserLogData
Used for user-related operations:
```typescript
interface UserLogData {
  userId?: string;
  email?: string;
  action?: string;
  timestamp?: Date;
  metadata?: Record<string, string | number | boolean>;
}
```

### SystemLogData
Used for system performance and monitoring:
```typescript
interface SystemLogData {
  component?: string;
  version?: string;
  environment?: string;
  performance?: {
    duration: number;
    memory?: number;
    cpu?: number;
  };
}
```

## Specialized Logging Methods

The logger now includes type-safe methods for different types of logging:

- `logService(message: string, serviceData: ServiceLogData)`
- `logWorkspace(message: string, workspaceData: WorkspaceLogData)`
- `logUser(message: string, userData: UserLogData)`
- `logSystem(message: string, systemData: SystemLogData)`
- `logError(message: string, errorData: ErrorLogData)`

## Union Type for Flexibility

All types are combined into a union type for maximum type safety while maintaining flexibility:

```typescript
type LogData = 
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
```

This approach eliminates the need for `unknown` or `any` types while providing comprehensive coverage for all logging scenarios in the application.