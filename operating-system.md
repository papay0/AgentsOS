# AgentsOS: AI-Native Development Environment

## Vision

A cloud-based development environment that feels like a native operating system. Users get a familiar desktop interface where they can run VSCode, terminals, and AI assistants as native applications - all powered by Daytona cloud workspaces with automatic GitHub repository cloning.

## Current Status

### ✅ Complete Implementation
- **Native Onboarding**: macOS/iOS-style setup wizard with GitHub repo selection
- **Automatic Workspace Creation**: Real Daytona workspace creation with repository cloning
- **Window Management**: Draggable, resizable windows with snap zones
- **Desktop & Mobile**: Responsive design that works on all devices
- **Core Apps**: VSCode, Claude Code, Terminal, Settings
- **Smart Detection**: Automatically shows onboarding only for new users
- **API Integration**: Full workspace management through reusable API client
- **Type-Safe**: Full TypeScript with 100% test coverage

## Core Concept

A development environment that feels native:
- **Instant Access**: Log in and start coding immediately
- **Familiar Interface**: Desktop with dock, windows, and apps
- **Integrated Tools**: VSCode, terminals, and Claude work together
- **Cloud Powered**: All computation happens in Daytona workspaces
- **Mobile Ready**: Full functionality on phones and tablets

## Architecture

### Daytona-Powered Workspace
Each user gets a dedicated Daytona workspace with:
- **VSCode Server**: Browser-based code editing
- **Terminal Access**: Multiple terminal sessions
- **Claude Code CLI**: AI assistance built-in
- **File System**: Persistent project storage
- **Service Ports**: For running web servers and apps

### Core Applications
- 💻 **VSCode** - Full-featured code editor
- 🤖 **Claude Code** - AI development assistant
- ⚡ **Terminal** - Command line interface
- ⚙️ **Settings** - Workspace configuration
- 📊 **Activity** - See what Claude is doing (coming soon)

## User Interface

### Desktop Experience
- **Menu Bar**: System status and quick actions
- **Desktop**: Open windows for each app
- **Dock**: Quick app launcher with running indicators
- **Windows**: Draggable, resizable, with standard controls
- **Keyboard Shortcuts**: Cmd+Tab, Cmd+Q, etc.

### Mobile Experience  
- **App Grid**: Touch-friendly app launcher
- **Full Screen Apps**: Each app takes full screen
- **Gestures**: Swipe between apps, pinch to zoom
- **Adaptive UI**: Optimized for smaller screens

## Window Management

### Desktop
- **Drag & Drop**: Move windows anywhere
- **Resize**: Grab edges or corners
- **Minimize/Maximize**: Standard window controls
- **Snap Zones**: Drag to screen edges for split view
- **Focus**: Click to bring window to front

### Mobile
- **Swipe**: Navigate between apps
- **Long Press**: App options
- **Pinch**: Zoom in code editor

## Claude Integration

### How It Works
- **Pre-installed**: Claude Code CLI is ready to use
- **Full Access**: Can read/write files and run commands
- **Context Aware**: Understands your project structure
- **Terminal App**: Dedicated Claude terminal for AI assistance

### Example Usage
```
You: "Create a React component for user profile"
Claude: *creates UserProfile.tsx with proper imports and styling*

You: "Add TypeScript types"  
Claude: *adds interface definitions and props typing*

You: "Write tests for it"
Claude: *creates UserProfile.test.tsx with comprehensive tests*
```

## Activity Monitor (Coming Soon)

See what Claude is doing in real-time:
- **File Changes**: Live view of modifications
- **Commands**: Terminal commands being executed
- **Diffs**: Before/after comparisons
- **History**: Timeline of all actions

## Performance

- **60fps Animations**: Smooth window movements and transitions
- **Instant Response**: Optimistic updates for all actions
- **Fast Loading**: Service workers for offline support
- **Efficient Rendering**: Only render what's visible
- **Native Feel**: Natural animations and interactions

## Technical Stack

- **React 19 + TypeScript**: Modern, type-safe foundation
- **Next.js 15**: Server-side rendering and routing
- **Tailwind CSS**: Responsive styling
- **Daytona SDK**: Workspace management
- **WebSockets**: Real-time terminal connections
- **Service Workers**: Offline capability

## User Experience

### Desktop Workflow
1. **Sign In**: Authenticate with GitHub
2. **Launch Apps**: Click apps in the dock
3. **Arrange Windows**: Drag and resize as needed
4. **Use Claude**: Open terminal for AI assistance
5. **Switch Apps**: Click dock or use Cmd+Tab

### Mobile Workflow  
1. **App Grid**: Tap to launch apps
2. **Full Screen**: Each app maximizes
3. **Swipe**: Navigate between apps
4. **Touch Optimized**: All controls work with touch

## Onboarding Experience

### Native 4-Step Setup (Auto-detects new users)

**Step 1: Welcome**
- Professional welcome screen with AgentsOS branding
- Clear value proposition and key features
- Native macOS/iOS-style UI design

**Step 2: GitHub Authentication (Optional)**  
- Connect with GitHub to access repositories
- Can skip for users without GitHub accounts
- Native GitHub icon and professional styling

**Step 3: Repository Selection**
- **AgentsOS** - AI-native development platform (Next.js, TypeScript, React)
- **Claude Templates** - Template collection for Claude Code CLI
- Shows repository details and technology stack

**Step 4: Workspace Creation**
- Real Daytona workspace creation with repository cloning
- Live progress tracking with status updates
- Automatic redirection to desktop when ready
- Creates actual cloud development environment

### What Gets Created

Each workspace includes:
- **8GB RAM, 4 CPU cores** (default, upgradeable)
- **50GB persistent storage**
- **Selected GitHub repository** automatically cloned
- **VSCode** on port 8080 with project loaded
- **Terminal** on port 9999 in project directory
- **Claude Code CLI** pre-installed and ready
- **Git, Node.js, Python** and all development tools

### Optional First-Run Tutorial
After workspace loads, optional interactive tutorial:
1. **Quick Tour**: Shows dock, windows, and apps
2. **Try Claude**: Simple example command
3. **Open VSCode**: Create first file
4. **Ready to Code**: Dismiss tutorial

## Future Enhancements

### Near Term
- **Activity Monitor**: See Claude's changes in real-time
- **Git Integration**: Visual git status and operations
- **Preview Windows**: See running web apps
- **Workspace Persistence**: Resume where you left off

### Long Term
- **Collaboration**: Multiple users in same workspace
- **Custom Templates**: Save and share workspace configs
- **Extension System**: Add custom apps to the dock


## Implementation Status

### ✅ Completed
- Window management system
- Responsive design (desktop & mobile)
- Dock with app launcher
- Core apps (VSCode, Claude, Terminal, Settings)
- 100% test coverage

### 🚀 Next Steps
1. **Onboarding Flow** - Welcome screens and setup wizard
2. **Workspace Health** - Status indicators and monitoring
3. **Activity Monitor** - See Claude's actions in real-time
4. **Git Integration** - Visual git status
5. **Performance Tuning** - Optimize for larger projects

## Key Design Principles

### Simplicity First
- **One Workspace**: Single Daytona instance per user
- **Clear Purpose**: Development environment, not a general OS
- **Familiar UI**: Desktop metaphor everyone understands
- **Fast Setup**: From signup to coding in 60 seconds

### Why Daytona?
- **Real Computing**: Actual Linux environment for development
- **Persistent Storage**: Your code stays safe between sessions
- **Pre-configured**: All tools installed and ready
- **Scalable**: Upgrade resources as needed

### Technical Benefits
- **No Local Setup**: Works on any device with a browser
- **Consistent Environment**: Same tools for entire team
- **Cloud Native**: Access from anywhere
- **Cost Effective**: Pay only for what you use

## Mobile Implementation Roadmap

### 📱 iOS-Style Mobile Experience Todo List

Based on the desktop improvements completed, here's the comprehensive roadmap for bringing the same polished experience to mobile with iOS-style navigation:

#### 🎯 Core Mobile UX Improvements
- [ ] **iOS-Style Page System**: One page per repository (Page 1: Project A, Page 2: Project B, etc.)
- [ ] **Swipe Navigation**: Smooth horizontal swiping between repository pages
- [ ] **Page Indicators**: Dot navigation near dock showing current page and total pages (like iOS)
- [ ] **Mobile Boot Screen**: Port OSBootScreen.tsx to mobile with 1.8-second animation
- [ ] **Mobile Loading States**: Rotating activity messages during workspace creation
- [ ] **Touch-Optimized Animations**: All transitions optimized for touch devices

#### 🔄 Onboarding System Port
- [ ] **Mobile Onboarding Polish**: Update MobileOnboarding.tsx with desktop improvements
- [ ] **Repository Selection UI**: Touch-friendly repository cards with selection indicators
- [ ] **Launch Button UX**: Fix duplicate button issues from desktop port
- [ ] **Progress Animation**: Port rotating activity messages to mobile creation flow
- [ ] **Error Handling**: Proper error states and retry mechanisms

#### 🏠 Page-Based Workspace Architecture
- [ ] **Page Container System**: Create MobilePage.tsx component for each repository
- [ ] **Repository Store Integration**: Connect page system to workspace store
- [ ] **Page Transitions**: Smooth slide animations between pages
- [ ] **Active Page Tracking**: State management for current page index
- [ ] **Page Indicators Component**: Dot navigation with smooth animations

#### 📱 Mobile App Organization
- [ ] **Per-Page App Layout**: Each repository page has its own app instances
- [ ] **VSCode Integration**: Full-screen VSCode per repository
- [ ] **Terminal Access**: Repository-specific terminal instances
- [ ] **Claude Code Mobile**: Touch-optimized Claude interface per project
- [ ] **Settings Persistence**: Per-repository settings and preferences

#### 🎨 Visual & Animation Polish
- [ ] **Gesture Recognition**: Swipe threshold and velocity detection
- [ ] **Spring Animations**: iOS-like bounce and spring effects
- [ ] **Loading Indicators**: Skeleton screens and progressive loading
- [ ] **Touch Feedback**: Haptic feedback simulation and visual feedback
- [ ] **Dark Mode Support**: Consistent theming across all mobile components

#### 🔧 Mobile-Specific Features
- [ ] **Pull-to-Refresh**: Refresh workspace status and services
- [ ] **Long-Press Menus**: Context menus for repositories and apps
- [ ] **Mobile Keyboard**: Optimize for on-screen keyboard interactions
- [ ] **Safe Area Handling**: Proper notch and safe area support
- [ ] **Responsive Typography**: Mobile-optimized text sizes and spacing

#### 🏗️ Technical Infrastructure
- [ ] **Mobile State Management**: Extend useWorkspaceStore for page-based navigation
- [ ] **Touch Event Handling**: Custom hooks for swipe and gesture detection
- [ ] **Performance Optimization**: Lazy loading and virtualization for multiple pages
- [ ] **Memory Management**: Efficient cleanup when switching between pages
- [ ] **Service Worker Updates**: Mobile-specific caching strategies

#### 🧪 Testing & Quality
- [ ] **Mobile Test Suite**: Update all mobile component tests
- [ ] **Touch Testing**: Verify all gestures work correctly
- [ ] **Cross-Device Testing**: Test on various mobile screen sizes
- [ ] **Performance Testing**: Ensure smooth animations on slower devices
- [ ] **Accessibility**: Mobile screen reader and accessibility support

#### 🚀 Advanced Mobile Features
- [ ] **Workspace Switching**: Quick switcher between multiple workspaces
- [ ] **Mobile Shortcuts**: Touch shortcuts for common development tasks
- [ ] **Split Screen Support**: Basic split-screen on larger mobile devices
- [ ] **Mobile-Specific Apps**: Mobile-optimized versions of desktop apps

### Implementation Priority

**Phase 1: Core iOS-Style Navigation (High Priority)**
1. Page-based architecture with swipe navigation
2. Page indicators and smooth transitions
3. Mobile boot screen and loading states

**Phase 2: Onboarding & UX Polish (High Priority)**
4. Mobile onboarding improvements
5. Repository selection and workspace creation flow
6. Error handling and retry mechanisms

**Phase 3: App Integration (Medium Priority)**
7. Per-page app instances
8. Mobile-optimized VSCode and terminal
9. Touch-optimized Claude interface

**Phase 4: Advanced Features (Lower Priority)**
10. Advanced gestures and animations
11. Performance optimizations
12. Mobile-specific features and shortcuts

This comprehensive mobile roadmap ensures the mobile experience matches the polish and functionality of the desktop version while embracing iOS-style navigation patterns for an intuitive touch experience.

## Summary

AgentsOS transforms cloud development by providing a familiar desktop experience powered by Daytona workspaces. With pre-installed tools like VSCode and Claude Code CLI, developers can start coding immediately without any local setup.

The combination of a native-feeling UI and cloud computing creates the best of both worlds: the familiarity of a desktop OS with the power and flexibility of cloud development.