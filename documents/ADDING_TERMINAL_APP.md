# Adding a New Terminal App to AgentsOS

This guide documents the complete process for adding a new AI terminal application (like Claude or Gemini) to AgentsOS. Follow this checklist for consistent, scalable implementation.

## Overview

AgentsOS supports multiple AI terminal apps that run in tmux sessions via ttyd. Each app gets its own dedicated port and appears in the dock. The system is designed to automatically handle service discovery, port allocation, and token management.

## Architecture Principles

1. **Centralized Configuration**: All services are defined in `WORKSPACE_SERVICES` constant
2. **Dynamic Port Allocation**: Ports are calculated based on repository slot index
3. **Automatic Migration**: Bootstrap API automatically adds missing services to existing workspaces
4. **Consistent Patterns**: All terminal apps follow the same code structure

## Step-by-Step Implementation

### 1. Update Core Constants

**File**: `/lib/workspace-constants.ts`

```typescript
// Add your new service to the array
export const WORKSPACE_SERVICES = ['vscode', 'terminal', 'claude', 'gemini', 'your-new-app'] as const;

// Add port range for your service
export const SERVICE_PORT_RANGES = {
  vscode: 8080,    // 8080+
  terminal: 10000, // 10000+  
  claude: 4000,    // 4000+
  gemini: 5000,    // 5000+
  'your-new-app': 6000, // 6000+ (choose next available range)
} as const;

// Add display name
export const SERVICE_DISPLAY_NAMES: Record<WorkspaceService, string> = {
  vscode: 'VSCode',
  terminal: 'Terminal',
  claude: 'Claude',
  gemini: 'Gemini',
  'your-new-app': 'Your App Name'
} as const;
```

### 2. Update Type Definitions

**File**: `/types/workspace.ts`

```typescript
// Add your service to Repository interface
export interface Repository {
  ports: {
    vscode: number;
    terminal: number;
    claude: number;
    gemini: number;
    'your-new-app': number; // Add this line
  };
  serviceUrls?: {
    vscode: string;
    terminal: string;
    claude: string;
    gemini: string;
    'your-new-app': string; // Add this line
  };
  tokens?: {
    vscode: string | null;
    terminal: string | null;
    claude: string | null;
    gemini: string | null;
    'your-new-app': string | null; // Add this line
  };
}

// Also update RepositoryWithUrls interface similarly
```

### 3. Update Port Manager

**File**: `/lib/port-manager.ts`

```typescript
static getPortsForSlot(slot: number) {
  return {
    vscode: 8080 + slot,
    terminal: 10000 + slot,
    claude: 4000 + slot,
    gemini: 5000 + slot,
    'your-new-app': 6000 + slot, // Add this line
  };
}
```

### 4. Add CLI Installation

**🚨 CRITICAL: Use the Scalable CLI Installation System**

The modern approach is to add your CLI to the centralized `CLI_TOOLS` configuration:

**File**: `/lib/workspace-installer.ts`

```typescript
// Add to CLI_TOOLS constant
private static readonly CLI_TOOLS = {
  claude: {
    name: 'Claude Code CLI',
    command: 'claude',
    installCommand: 'curl -L https://github.com/anthropics/claude-cli/releases/latest/download/linux-amd64.tar.gz | tar xz && mv claude /usr/local/bin/',
    checkCommand: 'claude --version'
  },
  gemini: {
    name: 'Gemini CLI',
    command: 'gemini',
    installCommand: 'npm install -g @google/gemini-cli',
    checkCommand: 'gemini --version'
  },
  'your-new-app': {
    name: 'Your App CLI',
    command: 'your-cli-command',
    installCommand: 'npm install -g @your-company/your-cli-package',
    checkCommand: 'your-cli-command --version'
  }
} as const;
```

**Benefits**:
- ✅ **Automatic installation** during workspace creation via `ensureCLITools()`
- ✅ **Automatic installation** for existing workspaces during service restart
- ✅ **Graceful error handling** - continues if installation fails
- ✅ **Only installs missing tools** - checks if already installed first
- ✅ **Scalable** - future CLI tools just need config additions

**No code changes needed elsewhere** - the `ensureCLITools()` method automatically handles all CLI tools!

### 5. Add Tmux Script Generation

**File**: `/lib/tmux-script-generator.ts`

```typescript
/**
 * Generate Your App CLI startup script with tmux session management
 */
static generateYourNewAppScript(repoPath: string, repoName: string): string {
  return this.generateScript({
    repoPath,
    repoName,
    sessionName: `your-new-app-${repoName}`,
    command: 'your-cli-command' // The actual command to run your CLI
  });
}
```

### 6. Update Service Management

**File**: `/lib/workspace-service-manager.ts`

The beauty of our centralized system is that service management is now **automatic**! The `WORKSPACE_SERVICES` constant drives everything:

- Port allocation ✓ (automatic)
- Health checks ✓ (automatic) 
- Service restarts ✓ (automatic)
- Token refresh ✓ (automatic)

You just need to add script generation to `restartServices()`:

```typescript
// Add script creation
sandbox.process.executeCommand(
  TmuxScriptGenerator.generateScriptCreationCommand(
    TmuxScriptGenerator.generateYourNewAppScript(repoPath, repo.name),
    `/tmp/start-your-new-app-${repo.name}.sh`
  ),
  rootDir
),

// Add service startup
sandbox.process.executeCommand(
  `nohup ttyd --port ${repo.ports['your-new-app']} --writable -t 'theme=${TTYD_THEME}' "${yourAppScript}" > /tmp/your-new-app-${repo.name}-${repo.ports['your-new-app']}.log 2>&1 &`,
  rootDir
)
```

### 7. Create App Components

**File**: `/app/home/apps/YourNewAppApp.tsx`

```typescript
import { createApp } from './BaseApp';
import { YourNewAppDesktop } from './your-new-app/desktop';
import { YourNewAppMobile } from './your-new-app/mobile';

export const YourNewAppApp = createApp<'your-new-app'>({
  metadata: {
    id: 'your-new-app',
    name: 'Your App Name',
    description: 'Your app description',
    version: '1.0.0',
    author: 'Your Company',
    category: 'development',
    icon: {
      emoji: '🚀',
      url: 'https://your-icon-url.com/icon.png',
      fallback: '🚀'
    },
    colors: {
      primary: 'bg-blue-500',
      background: 'bg-white dark:bg-gray-800',
      text: 'text-gray-800 dark:text-gray-200'
    },
    isOpenAtStartup: false,
    isFullyHidden: false
  },
  window: {
    defaultSize: { width: 800, height: 600 },
    minSize: { width: 500, height: 400 },
    resizable: true,
    position: 'cascade'
  },
  content: {
    desktop: YourNewAppDesktop,
    mobile: YourNewAppMobile
  },
  actions: {
    onOpen: () => {},
    onClose: () => {}
  }
});
```

**Files**: `/app/home/apps/your-new-app/desktop.tsx` and `mobile.tsx`

Copy the structure from `/app/home/apps/gemini/` and replace:
- `geminiPort` → `yourNewAppPort`
- `'Gemini'` → `'Your App Name'`
- Authentication and WebSocket handling stays the same

### 8. Update App System

**File**: `/app/home/apps/BaseApp.ts`

```typescript
// Add props interface
export interface YourNewAppProps {
  yourNewAppPort?: number;
}

// Add to props map
export interface AppPropsMap {
  terminal: TerminalAppProps;
  claude: ClaudeAppProps;
  gemini: GeminiAppProps;
  'your-new-app': YourNewAppProps; // Add this line
  // ... other apps
}
```

**File**: `/app/home/apps/index.ts`

```typescript
import { YourNewAppApp } from './YourNewAppApp';

export const AppStore: AppRegistry = {
  vscode: VSCodeApp,
  claude: ClaudeApp,
  gemini: GeminiApp,
  'your-new-app': YourNewAppApp, // Add this line
  // ... other apps
} as const;

// Add to validation switch
switch (id) {
  case 'terminal': return validateApp(app as BaseApp<'terminal'>);
  case 'claude': return validateApp(app as BaseApp<'claude'>);
  case 'gemini': return validateApp(app as BaseApp<'gemini'>);
  case 'your-new-app': return validateApp(app as BaseApp<'your-new-app'>); // Add this line
  // ... other cases
}
```

### 9. Update UI Components

**File**: `/app/home/components/desktop/Dock.tsx`

```typescript
// Add to type union
const handleAppClick = (type: 'vscode' | 'claude' | 'gemini' | 'your-new-app' | 'diff' | 'settings' | 'terminal' | 'setup') => {

// Add to repository URL switch
case 'your-new-app':
  return activeWorkspace.repository.urls?.['your-new-app'] || '';

// Add to port assignment switch  
case 'your-new-app':
  windowProps.yourNewAppPort = activeWorkspace.repository.ports?.['your-new-app'];
  break;
```

### 10. Update Store Interfaces

Update any local Repository interfaces in store files to include your new service in the same pattern as shown in the type definitions.

### 11. Update WebSocket Proxy Types

**🚨 CRITICAL: Update AgentsOS-websocket-proxy Repository Types**

**File**: `/AgentsOS-websocket-proxy/src/firebase-service.ts`

```typescript
interface Repository {
  name: string;
  sourceType: string;
  ports: {
    vscode: number;
    terminal: number;
    claude: number;
    gemini: number;
    'your-new-app': number; // Add this line
  };
  tokens?: {
    vscode: string | null;
    terminal: string | null;
    claude: string | null;
    gemini: string | null;
    'your-new-app': string | null; // Add this line
  };
}
```

**And update the port validation logic:**

```typescript
// In validateUserPort method, add your service to both port checks
if (repo.ports.terminal === port ||
    repo.ports.vscode === port ||
    repo.ports.claude === port ||
    repo.ports.gemini === port ||
    repo.ports['your-new-app'] === port) {
```

**⚠️ WHY THIS IS CRITICAL:**
- The WebSocket proxy validates incoming connections by checking if the requested port exists in the user's workspace
- If your service isn't included in the validation logic, the proxy will **reject all WebSocket connections**
- This causes infinite re-renders and connection failures in the UI
- The bootstrap API will correctly add the port to Firestore, but the proxy won't recognize it

### 12. Update Tests

Add your new service to all test mock objects:
- Port objects: `{ vscode: 8080, terminal: 10000, claude: 4000, gemini: 5000, 'your-new-app': 6000 }`
- URL objects: Include your service URL
- Token objects: Include your service token
- Service counts: Update from 4 to 5 services per repository

## Key Benefits of This Architecture

### ✅ **Automatic Migration**
The bootstrap API automatically detects and adds missing services to existing workspaces. No manual database updates needed!

### ✅ **Centralized Configuration** 
Adding one line to `WORKSPACE_SERVICES` automatically enables:
- Port allocation
- Health checks  
- Service restarts
- Token refresh
- Service counting

### ✅ **Type Safety**
TypeScript ensures all interfaces stay in sync across the entire codebase.

### ✅ **Testing**
Centralized constants make it easy to update all tests consistently.

### ✅ **Future-Proof**
The next terminal app will be even faster to add using this pattern.

## Common Pitfalls to Avoid

❌ **Don't hardcode service names** - Use `WORKSPACE_SERVICES` constant  
❌ **Don't hardcode service counts** - Use `SERVICES_PER_REPOSITORY`  
❌ **Don't add service-specific migration logic** - Let the generic bootstrap handle it  
❌ **Don't forget to update test mocks** - All ports, URLs, and tokens need updating  
❌ **Don't skip the CLI installation step** - Apps won't work without their CLI tools  
❌ **Don't forget the WebSocket proxy types** - This is the #1 cause of connection failures

## Debugging Guide

### Problem: App Shows Black/Blue Screen or Infinite Re-renders

**Root Cause**: WebSocket proxy rejecting connections because port validation fails.

**Symptoms**:
- Component renders but shows loading state forever
- Console logs show connection failures and retry attempts
- Proxy logs show: `Port XXXX not found in cached workspace`

**Debug Steps**:

1. **Check Daytona Service**: SSH into workspace and verify service works directly
   ```bash
   curl -I http://localhost:YOUR_PORT  # Should return 200 OK
   wscat -c ws://localhost:YOUR_PORT/ws  # Should connect successfully
   ```

2. **Check Bootstrap Logs**: Verify bootstrap API is adding your port to Firestore
   ```
   🔍 Bootstrap: Checking default - current ports: { ..., your-app: XXXX }
   ✅ Bootstrap: Updated N repositories with fresh tokens and service URLs
   ```

3. **Check Proxy Logs**: Look for port validation failures
   ```
   Port XXXX not found in cached workspace for user
   Connection setup failed: Error: Port XXXX not found
   ```

4. **Fix**: Update WebSocket proxy Repository interface and validation logic

### Problem: CLI Not Found in Terminal

**Root Cause**: CLI installation failed or wasn't added to scalable system.

**Debug Steps**:
1. SSH into workspace: `which your-cli-command`
2. Check installation logs in service manager output
3. Manually test CLI installation command

**Fix**: Add CLI to `CLI_TOOLS` constant in workspace-installer.ts

### Problem: Service Won't Start

**Root Cause**: Tmux script errors or CLI command failures.

**Debug Steps**:
1. Check tmux session: `tmux list-sessions`
2. Check service logs: `cat /tmp/your-app-repo-port.log`  
3. Test script manually: `bash /tmp/start-your-app-repo.sh`

**Fix**: Update tmux script generation or CLI command  

## Verification Checklist

- [ ] App appears in dock on desktop and mobile
- [ ] Clicking opens terminal window with your CLI
- [ ] Window can be minimized/maximized/focused
- [ ] All tests pass (`npm run test:run`)
- [ ] TypeScript compiles (`npm run type-check`)
- [ ] Build succeeds (`npm run build`)
- [ ] Bootstrap API handles missing ports for existing workspaces

## Future Improvements

This architecture enables easy enhancements:

1. **Service Health Monitoring**: Add health check endpoints
2. **Resource Management**: Track CPU/memory usage per service  
3. **Load Balancing**: Distribute services across multiple containers
4. **Plugin System**: Allow third-party terminal app integrations

---

**Next Terminal App**: With this guide, adding the next terminal app should take ~1 hour instead of a full day!