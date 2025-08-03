# AgentsPod App System

This directory contains the app architecture for AgentsPod - a type-safe, modular system for creating window-based applications.

## Architecture Overview

The app system follows an App Store-like pattern where each app is:
- **Self-contained**: All app logic, content, and metadata in one place
- **Type-safe**: Compile-time validation of app structure
- **Validated**: Runtime validation with helpful error messages
- **Cross-platform**: Supports both desktop and mobile interfaces

## Creating a New App

### 1. Define Your App

```typescript
// MyApp.tsx
import { createApp } from './BaseApp';
import MobileAppTemplate from './MobileAppTemplate';

const MyAppDesktopContent = () => (
  <div className="w-full h-full p-4">
    {/* Your desktop app content */}
  </div>
);

const MyAppMobileContent = () => (
  <MobileAppTemplate
    title="My App"
    subtitle="App Description"
    bottomContent={<div>Status: Ready</div>}
  >
    {/* Your mobile app content */}
    <div className="space-y-4">
      <p>Mobile app content goes here</p>
    </div>
  </MobileAppTemplate>
);

export const MyApp = createApp({
  metadata: {
    id: 'my-app',                    // Unique identifier (lowercase, alphanumeric + dashes)
    name: 'My App',                  // Display name (1-30 characters)
    description: 'A sample app',     // Description (10-200 characters)
    version: '1.0.0',               // Semantic version
    author: 'Your Name',             // Author name
    category: 'productivity',        // 'development' | 'productivity' | 'system' | 'utility'
    icon: {
      emoji: '📱',                   // Emoji icon (required)
      url: 'https://...',           // Optional URL for high-res icon
      fallback: '📱'                // Fallback if URL fails
    },
    colors: {
      primary: 'bg-blue-500',       // Primary color class
      background: 'bg-white',       // Background color
      text: 'text-gray-800'         // Text color
    },
    comingSoon: false               // Optional: mark as coming soon
  },
  window: {
    defaultSize: { width: 800, height: 600 },   // Default window size
    minSize: { width: 400, height: 300 },       // Minimum window size
    resizable: true,                             // Can user resize?
    position: 'center'                           // 'center' | 'cascade' | {x, y}
  },
  content: {
    desktop: MyAppDesktopContent,   // Desktop component
    mobile: MyAppMobileContent     // Mobile component
  },
  actions: {
    onOpen: () => console.log('App opened'),     // Optional callbacks
    onClose: () => console.log('App closed'),
    onFocus: () => console.log('App focused'),
  }
});
```

### 2. Register Your App

Add your app to the registry in `index.ts`:

```typescript
// index.ts
import { MyApp } from './MyApp';

export const AppStore: AppRegistry = {
  // ... existing apps
  'my-app': MyApp,
};
```

### 3. Update Type Definitions

Update the window store types to include your new app:

```typescript
// stores/windowStore.ts
export interface Window {
  // ...
  type: 'vscode' | 'claude' | 'diff' | 'settings' | 'terminal' | 'my-app';
  // ...
}
```

## Validation Rules

Apps are automatically validated at startup (development mode). Common validation errors:

- **ID**: Must be lowercase alphanumeric with dashes only
- **Name**: 1-30 characters
- **Description**: 10-200 characters  
- **Version**: Must follow semver format (e.g., "1.0.0")
- **Window size**: Default must be at least 200x150, minimum at least 150x100
- **Content**: Both desktop and mobile components required

## Available Apps

| App | ID | Category | Status |
|-----|----|---------|---------| 
| VSCode | `vscode` | development | ✅ Active |
| Claude Code | `claude` | development | ✅ Active |
| Settings | `settings` | system | ✅ Active |
| Terminal | `terminal` | development | ✅ Active |
| Code Diff | `diff` | development | 🚧 Coming Soon |

## Mobile App Template

Use the `MobileAppTemplate` component for consistent mobile app layouts:

```typescript
import MobileAppTemplate from './MobileAppTemplate';

const MyMobileContent = () => (
  <MobileAppTemplate
    title="App Name"                    // Required: App title
    subtitle="App Description"         // Optional: App subtitle  
    backgroundColor="bg-white dark:bg-gray-800"  // Optional: Custom background
    bottomContent={                     // Optional: Bottom status/action area
      <div className="flex items-center space-x-2">
        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
        <span>Online</span>
      </div>
    }
  >
    {/* Your app content - automatically gets proper flexbox layout */}
    <div className="space-y-4">
      <p>Your content here</p>
    </div>
  </MobileAppTemplate>
);
```

**Features:**
- ✅ Automatic full-height layout (`h-full flex flex-col`)
- ✅ Proper header/content/footer structure
- ✅ Dark mode support
- ✅ Expandable content area (`flex-1`)
- ✅ Optional bottom section for status/actions

## Best Practices

1. **Mobile Layout**: Always use `MobileAppTemplate` for consistent mobile experiences
2. **Responsive Design**: Ensure your components work at minimum window sizes
3. **Theme Support**: Use Tailwind's dark mode classes for proper theming
4. **Performance**: Use React.memo for complex components
5. **Accessibility**: Include proper ARIA labels and keyboard support
6. **Error Handling**: Gracefully handle loading states and errors
7. **Consistent UX**: Follow established patterns from existing apps

## App Store Features

- **Type Safety**: Compile-time validation prevents runtime errors
- **Hot Reloading**: Changes to apps reflect immediately in development
- **Validation**: Helpful error messages for configuration issues
- **Categorization**: Apps can be filtered by category
- **Coming Soon**: Mark apps as coming soon to show in UI but disable functionality
- **Cross-Platform**: Single app definition works on desktop and mobile

## File Structure

```
apps/
├── BaseApp.ts           # Base interfaces and validation
├── index.ts             # App registry and exports
├── VSCodeApp.tsx        # VSCode app implementation
├── ClaudeApp.tsx        # Claude Code app implementation
├── SettingsApp.tsx      # Settings app implementation
├── TerminalApp.tsx      # Terminal app implementation
├── DiffApp.tsx          # Code Diff app (coming soon)
└── README.md           # This file
```

## Migration from Old System

The new app system replaces the previous hardcoded approach:

- ✅ **Before**: Hardcoded switch statements in Window component
- ✅ **After**: Dynamic app loading from registry
- ✅ **Before**: Manual icon and color management  
- ✅ **After**: Centralized app metadata
- ✅ **Before**: No validation or type safety
- ✅ **After**: Compile-time + runtime validation