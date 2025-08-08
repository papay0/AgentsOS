export interface ServiceStatus {
  service: string;
  port: number;
  status: 'running' | 'stopped' | 'error';
  pid?: number;
  url?: string;
  error?: string;
}

export interface HealthCheckResponse {
  sandboxId: string;
  sandboxState: string;
  summary: {
    running: number;
    total: number;
    healthy: boolean;
  };
  services: ServiceStatus[];
  processes: string[];
  repositories: Array<{
    name: string;
    sourceType: string;
    ports: { vscode: number; terminal: number; claude: number; };
  }>;
  timestamp: string;
}