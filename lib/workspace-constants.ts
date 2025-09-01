// TTYD theme configuration for light terminal
export const TTYD_THEME = JSON.stringify({
  background: "#ffffff",
  foreground: "#000000",
  cursor: "#000000",
  selectionBackground: "#316AC5",
  black: "#000000",
  red: "#C91B00",
  green: "#00C200",
  yellow: "#C7C400",
  blue: "#0037DA",
  magenta: "#C800C8",
  cyan: "#00C5C7",
  white: "#C7C7C7",
  brightBlack: "#686868",
  brightRed: "#FF6D6B",
  brightGreen: "#6BC46D",
  brightYellow: "#F9F871",
  brightBlue: "#6B9EFF",
  brightMagenta: "#FF6BFF",
  brightCyan: "#6BFFFF",
  brightWhite: "#FFFFFF"
});

// Service definitions
export const WORKSPACE_SERVICES = ['vscode', 'terminal', 'claude', 'gemini'] as const;
export type WorkspaceService = typeof WORKSPACE_SERVICES[number];

// Number of services per repository
export const SERVICES_PER_REPOSITORY = WORKSPACE_SERVICES.length;

// Port ranges for services
export const SERVICE_PORT_RANGES = {
  vscode: 8080,    // 8080+
  terminal: 10000, // 10000+  
  claude: 4000,    // 4000+
  gemini: 5000,    // 5000+
} as const;

// Service display names
export const SERVICE_DISPLAY_NAMES: Record<WorkspaceService, string> = {
  vscode: 'VSCode',
  terminal: 'Terminal',
  claude: 'Claude',
  gemini: 'Gemini'
} as const;