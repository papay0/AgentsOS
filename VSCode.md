# VSCode Web Integration with code-server

This document outlines the implementation plan for integrating VSCode web interface into AgentsPod using [code-server](https://github.com/coder/code-server).

## Overview

code-server is VS Code running on a remote server, accessible through the browser. It provides the full VS Code experience including extensions, themes, integrated terminal, and all the features developers expect.

## Architecture Integration

### Current AgentsPod Structure
```
AgentsPod Layout:
├── Left Panel (60%) - Future VSCode area
└── Right Panel (40%) - Terminal tabs
```

### Proposed Integration
```
AgentsPod with VSCode:
├── Left Panel (60%) - code-server iframe
└── Right Panel (40%) - Terminal tabs (existing)
```

## Implementation Plan

### 1. Setup Script Modifications (`scripts/setup-agentspod.ts`)

#### Install code-server
```typescript
// Add after Claude Code CLI installation
console.log('Installing code-server (VSCode web)...');

// Install code-server using their install script
const codeServerInstallResult = await sandbox.process.executeCommand(
  `curl -fsSL https://code-server.dev/install.sh | sh`,
  projectDir,
  undefined,
  300000 // 5 minute timeout
);

if (codeServerInstallResult.exitCode !== 0) {
  console.error("code-server install failed:", codeServerInstallResult.result);
  throw new Error("Failed to install code-server");
}
console.log('✓ code-server installed');
```

#### Configure and Start code-server
```typescript
// Create code-server config
const configDir = `${rootDir}/.config/code-server`;
await sandbox.process.executeCommand(`mkdir -p ${configDir}`, rootDir);

// Create config file
const configContent = `bind-addr: 0.0.0.0:8080
auth: none
cert: false
disable-telemetry: true
disable-update-check: true
`;

await sandbox.process.executeCommand(
  `echo '${configContent}' > ${configDir}/config.yaml`,
  rootDir
);

// Start code-server
const startCodeServerResult = await sandbox.process.executeCommand(
  `nohup code-server --config ${configDir}/config.yaml ${projectDir} > code-server.log 2>&1 & echo "code-server starting on port 8080..."`,
  rootDir
);

console.log('code-server start output:', startCodeServerResult.result);
console.log('✓ code-server started in background');
```

#### Health Check
```typescript
// Check if code-server is running
const checkCodeServer = await sandbox.process.executeCommand(
  "curl -s -o /dev/null -w '%{http_code}' http://localhost:8080 || echo 'failed'",
  projectDir
);

console.log('code-server check result:', checkCodeServer.result);

if (checkCodeServer.result?.trim() === '200') {
  console.log('✓ code-server is running!');
} else {
  console.log('⚠️ code-server might still be starting...');
  const codeServerLogs = await sandbox.process.executeCommand(
    "tail -20 code-server.log || echo 'No code-server logs yet'",
    rootDir
  );
  console.log('code-server logs:', codeServerLogs.result);
}
```

#### Get Preview URL
```typescript
// Get the code-server URL
const codeServerInfo = await sandbox.getPreviewLink(8080);

console.log(`VSCode Web URL: ${codeServerInfo.url}`);
console.log('🎨 VSCode web interface:', codeServerInfo.url);
```

### 2. Frontend Component Creation

#### Create VSCode Component (`components/vscode.tsx`)
```typescript
'use client';

import { useState, useEffect } from 'react';
import { useTheme } from '@/components/theme-provider';

interface VSCodeProps {
  sandboxId: string;
}

export default function VSCode({ sandboxId }: VSCodeProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { theme } = useTheme();

  const isDark = theme === 'dark' || (theme === 'system' && typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  const vscodeUrl = `https://8080-${sandboxId}.proxy.daytona.work/`;

  const handleIframeLoad = () => {
    setLoading(false);
    setError(null);
  };

  const handleIframeError = () => {
    setLoading(false);
    setError('Failed to load VSCode. The service might still be starting up.');
  };

  return (
    <div className={`h-full flex flex-col ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4"></div>
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Loading VSCode...</p>
          </div>
        </div>
      )}
      
      {error ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{error}</p>
          </div>
        </div>
      ) : (
        <iframe
          src={vscodeUrl}
          className="w-full h-full border-0"
          title="VSCode Web"
          onLoad={handleIframeLoad}
          onError={handleIframeError}
          allow="clipboard-read; clipboard-write; fullscreen"
          referrerPolicy="no-referrer-when-downgrade"
        />
      )}
    </div>
  );
}
```

#### Update Home Page (`app/home/[id]/page.tsx`)
```typescript
// Import VSCode component
import VSCode from '@/components/vscode';

// Replace the "VSCode Coming Soon" section with:
<div className="w-3/5 border-r border-gray-200">
  <VSCode sandboxId={resolvedParams.id} />
</div>
```

### 3. Advanced Configuration Options

#### Extensions Auto-Installation
```typescript
// Install popular extensions
const installExtensions = async () => {
  const extensions = [
    'ms-vscode.vscode-typescript-next',
    'esbenp.prettier-vscode',
    'bradlc.vscode-tailwindcss',
    'ms-vscode.vscode-json',
    'formulahendry.auto-rename-tag',
    'christian-kohler.path-intellisense'
  ];

  for (const ext of extensions) {
    await sandbox.process.executeCommand(
      `code-server --install-extension ${ext}`,
      projectDir
    );
  }
};
```

#### Workspace Settings
```typescript
// Create workspace settings
const workspaceSettings = {
  "editor.fontSize": 14,
  "editor.tabSize": 2,
  "editor.insertSpaces": true,
  "files.autoSave": "afterDelay",
  "workbench.colorTheme": "Default Dark+",
  "terminal.integrated.shell.linux": "/bin/bash",
  "typescript.suggest.autoImports": true,
  "editor.formatOnSave": true
};

await sandbox.process.executeCommand(
  `mkdir -p ${projectDir}/.vscode && echo '${JSON.stringify(workspaceSettings, null, 2)}' > ${projectDir}/.vscode/settings.json`,
  rootDir
);
```

### 4. Integration Considerations

#### Security
- code-server runs with `auth: none` for simplicity within the sandboxed environment
- All access is through Daytona's proxy which handles authentication
- No direct internet access to the code-server instance

#### Performance
- code-server is lightweight and runs efficiently
- Uses WebSocket for real-time communication
- Shares the same container resources as the project

#### Synchronization with Terminal
- Both VSCode and terminal access the same file system
- Changes made in VSCode terminal will reflect in our separate terminal tabs
- File changes are instantly visible across both interfaces

### 5. Benefits

#### Developer Experience
- Full VSCode experience in the browser
- All familiar keyboard shortcuts and features
- IntelliSense, debugging, Git integration
- Extension marketplace access

#### Integration with AgentsPod
- Seamless workflow between VSCode and Claude terminal
- Shared file system and project context
- No need to switch between applications

#### Collaboration
- Easy sharing of development environment
- Consistent setup across different machines
- Perfect for pair programming and code reviews

## Implementation Steps

1. **Modify setup script** to install and configure code-server
2. **Create VSCode component** for the frontend
3. **Update home page** to embed VSCode in left panel
4. **Test integration** with existing terminal functionality
5. **Add extensions and workspace configuration**
6. **Optimize performance and user experience**

## Potential Challenges

### Resource Usage
- code-server adds memory and CPU overhead
- Need to ensure container has sufficient resources
- May need to optimize Daytona container specifications

### Startup Time
- code-server takes time to initialize
- Need proper loading states and error handling
- Consider pre-warming containers with code-server

### Extension Compatibility
- Some extensions may not work in web environment
- Need to test popular extensions for compatibility
- May need to provide curated extension list

### Theme Synchronization
- AgentsPod theme switching should ideally sync with VSCode theme
- Requires additional configuration and API calls

## Success Metrics

- [ ] VSCode loads successfully in iframe
- [ ] File operations work correctly
- [ ] Terminal integration functions properly
- [ ] Extensions can be installed and used
- [ ] Performance is acceptable (< 3s load time)
- [ ] No conflicts with existing terminal functionality

## Future Enhancements

- **Theme synchronization** between AgentsPod and VSCode
- **Extension management** UI within AgentsPod
- **Multi-user collaboration** features
- **Custom keybindings** for AgentsPod integration
- **File tree synchronization** with terminal operations

---

This implementation will transform AgentsPod from a terminal-focused tool into a full-featured cloud development environment combining the power of VSCode with AI-powered development through Claude.