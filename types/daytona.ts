// Daytona SDK types (since they're not exported properly)
export interface DaytonaSandbox {
  id: string;
  getUserRootDir(): Promise<string | undefined>;
  getPreviewLink(port: number): Promise<{ url: string }>;
  process: {
    executeCommand(
      command: string,
      workingDir: string,
      env?: Record<string, string>,
      timeout?: number
    ): Promise<{ exitCode: number; result: string }>;
  };
}

export interface CommandResult {
  exitCode: number;
  result: string;
}