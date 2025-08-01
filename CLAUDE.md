# CLAUDE.md

This file provides guidance to Claude Code when working with the AgentsPod codebase.

## Project Overview

AgentsPod is a cloud development environment platform that enables developers to launch on-demand workspaces with VSCode and Claude Code CLI pre-installed. Users can create isolated development environments in seconds through a clean web interface.

## Commands

### Development
- `npm run dev` - Start the development server at http://localhost:3000
- `npm run build` - Build the production application
- `npm start` - Start the production server
- `npm run lint` - Run Next.js linting

### Environment Setup
- Requires `DAYTONA_API_KEY` environment variable for workspace creation
- Uses Firebase configuration (`NEXT_PUBLIC_FIREBASE_*` variables)
- Create `.env.local` file with your Daytona API key and Firebase config

## Architecture Overview

This is a Next.js 15.4.4 application using App Router with React 19.1.0 and TypeScript. The app provides a clean interface for creating and managing cloud development workspaces via the Daytona platform.

### Key Technologies
- **Framework**: Next.js 15.4.4 with App Router + React 19.1.0
- **UI Components**: shadcn/ui component library with 40+ pre-built components
- **Styling**: Tailwind CSS v4 with CSS variables (New York theme)
- **Icons**: Lucide React for consistent iconography
- **Cloud Platform**: Daytona SDK for workspace orchestration
- **Database**: Firebase Firestore for waitlist and user data
- **Analytics**: Firebase Analytics for usage tracking
- **Code Editor**: code-server for VSCode in browser
- **Terminal**: ttyd for web-based terminal access with light theme
- **State Management**: React hooks with TypeScript

### Application Flow
1. **Landing Page** (`/`) - Professional homepage showcasing features
2. **Launch Page** (`/home`) - Simple workspace creation interface
3. **Workspace** (`/home/workspace/[sandboxId]`) - Full development environment
4. **API Layer** (`/api/create-workspace`) - Workspace creation endpoint

### Project Structure
```
/app                          # Next.js App Router
├── layout.tsx               # Root layout with Geist font
├── page.tsx                 # Landing page
├── home/
│   ├── page.tsx            # Workspace launch page
│   └── workspace/
│       └── [sandboxId]/
│           └── page.tsx    # Full workspace environment
└── api/
    └── create-workspace/
        └── route.ts        # Workspace creation API

/components
├── ui/                     # shadcn/ui component library (40+ components)
├── workspace/              # Modular workspace components
│   ├── vscode-editor.tsx  # VSCode integration
│   ├── terminal-panel.tsx # Multi-tab terminal management
│   ├── terminal-tabs.tsx  # Terminal tab interface
│   ├── terminal-grid.tsx  # Resizable terminal layout
│   └── terminal-pane.tsx  # Individual terminal instance
├── header.tsx             # Application header
├── theme-provider.tsx     # Theme management
└── theme-toggle.tsx       # Dark/light mode toggle

/lib
├── daytona.ts            # DaytonaClient facade
├── workspace-manager.ts  # Basic workspace operations
├── workspace-creator.ts  # Workspace creation orchestration
├── workspace-orchestrator.ts # Complex service coordination
├── workspace-installer.ts # Package installation
├── workspace-services.ts # Service management
├── firebase.ts           # Firebase configuration
├── analytics.ts          # Analytics tracking utilities
├── logger.ts             # Custom logging system
└── utils.ts              # Utility functions

/types
├── workspace.ts          # Workspace-related types
└── daytona.ts           # Daytona SDK types

/hooks
└── use-mobile.ts        # Mobile detection hook
```

### Core Components

#### Service Layer
- **`DaytonaClient`** (`/lib/daytona.ts`) - Manages workspace lifecycle
  - `createWorkspace()` - Creates new development environment

#### Workspace Components
- **`VSCodeEditor`** - Embeds code-server for browser-based VSCode
- **`TerminalPanel`** - Manages multiple terminal tabs and instances
- **`TerminalGrid`** - Handles resizable terminal layouts
- **`TerminalPane`** - Individual terminal with ttyd integration
- **`TerminalTabs`** - Tab interface for terminal management

### Workspace Creation Process
1. User clicks "Launch Terminal" on `/home`
2. API creates Daytona sandbox with Node.js 20 image
3. Installs system packages (curl, wget, git)
4. Installs ttyd for terminal access
5. Installs code-server for VSCode
6. Installs Claude Code CLI globally
7. Starts services on ports 8080 (VSCode), 9999 (bash), 9998 (Claude)
8. Returns URLs for iframe embedding
9. User redirected to `/home/workspace/[sandboxId]`

### Workspace Features
- **Split Layout**: VSCode (60%) + Terminals (40%) with resizable panels
- **Multi-Terminal**: Tabbed interface with bash and Claude terminals
- **Terminal Splitting**: Add multiple terminals per tab
- **Light Theme**: Consistent light theme across VSCode and terminals
- **Responsive**: Works on desktop and mobile devices

### TypeScript Integration
- Full type safety with custom interfaces in `/types`
- Proper error handling with typed responses
- Type-safe API routes with `CreateWorkspaceResponse`
- Component props fully typed

### Path Aliases
```typescript
// tsconfig.json aliases
"@/*"           // Project root
"@/components"  // Component directory
"@/lib"         // Service layer
"@/types"       // Type definitions
"@/hooks"       // Custom hooks
```

### Development Notes
- All components use modern React patterns (hooks, functional components)
- Error boundaries handle workspace creation failures gracefully
- Components are modular and reusable
- Clean separation between UI and business logic
- Responsive design with Tailwind CSS
- Professional UI following shadcn/ui design system

### Environment Variables
```bash
# Required for workspace creation
DAYTONA_API_KEY=your_daytona_api_key_here

# Firebase configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

### Firebase Integration
- **Analytics**: Automatic tracking of workspace usage, user engagement, and feature adoption
- **Firestore**: Ready for waitlist functionality and user data storage
- **Configuration**: Uses your own Firebase project setup
- **Analytics Events**: workspace_created, workspace_started, workspace_stopped, page_view, button_click, feature_used

The application is designed to be simple, fast, and reliable for creating development environments with minimal configuration.