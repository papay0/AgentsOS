# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

AgentsPod is a cloud development environment platform that enables instant workspace creation with VSCode and Claude Code CLI pre-installed. The platform provides a browser-based development environment accessible from any device, including mobile.

## Commands

### Development
- `npm run dev` - Start development server with Turbopack at http://localhost:3000
- `npm run build` - Production build (runs tests + linting first)
- `npm run build:skip-tests` - Fast production build without tests
- `npm start` - Start production server
- `npm run lint` - Run Next.js linting

### Testing
- `npm run test` - Run Vitest in watch mode (interactive)
- `npm run test:run` - Run all tests once (CI mode)
- `npm run test:ui` - Open Vitest UI for visual test debugging
- `npm run test:coverage` - Generate test coverage report
- Test files: `*.test.ts` or `*.test.tsx` in `/app/home-os/` directories
- Setup file: `/src/test/setup.ts` (mocks, React 19 compatibility fixes)

### Environment Setup
Copy `.env.example` to `.env.local` and add:
1. **Daytona**: `DAYTONA_API_KEY` for workspace orchestration
2. **Clerk**: Authentication keys (publishable + secret)
3. **Firebase**: Project config for analytics/Firestore
4. **Firebase Admin**: Server-side auth (optional, via service-account-key.json)

## Architecture Overview

Next.js 15.4.4 + React 19.1.0 application using App Router, TypeScript 5, and Tailwind CSS v4. The platform consists of two main experiences:

1. **AgentsPod** (`/` and `/home/*`): Original workspace launcher
2. **AgentsOS** (`/home-os`): New desktop/mobile OS-like environment with window management

### Key Technologies
- **Framework**: Next.js 15.4.4 with App Router + React 19.1.0
- **Authentication**: Clerk for user management, sign-in/sign-up flows
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
1. **Landing Page** (`/`) - Public homepage showcasing features
2. **Authentication** - Clerk handles sign-in/sign-up (required for `/home/*`)
3. **Launch Page** (`/home`) - Protected workspace creation interface
4. **Workspace** (`/home/workspace/[sandboxId]`) - Protected development environment
5. **API Layer** (`/api/create-workspace`) - Workspace creation endpoint

### Project Structure
```
/app                          # Next.js App Router
├── layout.tsx               # Root layout with ClerkProvider + Geist font
├── page.tsx                 # Public landing page
├── home/
│   ├── page.tsx            # Protected workspace launch page
│   └── workspace/
│       └── [sandboxId]/
│           └── page.tsx    # Protected workspace environment
└── api/
    └── create-workspace/
        └── route.ts        # Workspace creation API

/middleware.ts               # Clerk route protection

/components
├── ui/                     # shadcn/ui component library (40+ components)
├── workspace/              # Modular workspace components
│   ├── vscode-editor.tsx  # VSCode integration
│   ├── terminal-panel.tsx # Multi-tab terminal management
│   ├── terminal-tabs.tsx  # Terminal tab interface
│   ├── terminal-grid.tsx  # Resizable terminal layout
│   └── terminal-pane.tsx  # Individual terminal instance
├── header.tsx             # Application header with auth buttons
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

### Testing Best Practices
- Write tests AFTER successfully implementing features
- Use Vitest + React Testing Library (v16.3.0 for React 19 support)
- Mock complex UI components to prevent timeout issues
- Test pattern: `/app/home-os/**/*.test.{ts,tsx}`
- Run `npm run test:run` before committing
- Never use `.skip()` - implement fully or don't include

### React 19 Compatibility
The project uses React 19.1.0 with special test setup:
- Testing libraries: `@testing-library/react@16.3.0` (React 19 compatible)
- Setup file `/src/test/setup.ts` includes React.act compatibility fixes
- All 270+ tests passing in CI/CD

### Key Services Architecture

#### Workspace Orchestration (`/lib`)
- `daytona.ts` - Main client for workspace lifecycle
- `workspace-creator.ts` - Handles workspace creation flow
- `workspace-services.ts` - Service management (VSCode, ttyd, Claude CLI)
- `workspace-installer.ts` - Package installation logic

#### AgentsOS Components (`/app/home-os`)
- **Window Management**: Draggable, resizable windows with snap zones
- **State Management**: Zustand stores (`windowStore`, `workspaceStore`)
- **App System**: Modular apps (VSCode, Claude, Terminal, Settings)
- **Mobile Support**: Full mobile UI with app launcher and dock

### Authentication & Data Flow
1. **Clerk Auth**: Handles user sign-in/sign-up (`middleware.ts` protects routes)
2. **Firebase Auth**: Secondary auth for Firestore access (auto-syncs with Clerk)
3. **User Service**: Manages user profiles and workspace data
4. **Workspace API**: Creates Daytona sandboxes with pre-installed tools

### Workspace Creation Process
1. User clicks "Launch Workspace" → API endpoint `/api/create-workspace`
2. Creates Daytona sandbox with Node.js 20 base image
3. Installs: curl, wget, git, ttyd (terminal), code-server (VSCode), Claude CLI
4. Starts services on ports: 8080 (VSCode), 9999 (bash), 9998 (Claude)
5. Returns iframe URLs → Redirects to `/home/workspace/[sandboxId]`

## AgentsOS Window Management

The `/home-os` route provides a desktop OS experience with:
- **Desktop Mode**: Draggable/resizable windows, snap zones, dock, menu bar
- **Mobile Mode**: Native app launcher, swipe navigation, optimized touch UI
- **Apps**: VSCode, Claude Code, Terminal, Settings (more coming)
- **State**: Zustand stores manage windows, workspaces, and app states
- **Persistence**: User preferences and workspace data saved to Firestore

### App Icon System
Flexible icon system with fallback hierarchy:
1. React component (Lucide icons)
2. URL image (optimized with Next.js Image)
3. Emoji fallback
4. Text fallback

Icon definition: `{ icon?: ReactNode, url?: string, emoji?: string, fallback: string }`