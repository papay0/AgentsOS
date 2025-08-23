import { NextRequest, NextResponse } from 'next/server';

// Mock file contents - later this will read from Daytona workspace
const mockFileContents: Record<string, string> = {
  '/src/App.tsx': `import React from 'react';
import { Button } from './components/Button';
import { Input } from './components/Input';
import { formatMessage } from './utils/helpers';

const App: React.FC = () => {
  const [message, setMessage] = React.useState('');

  const handleClick = () => {
    console.log(formatMessage(message));
  };

  return (
    <div className="app">
      <h1>My React App</h1>
      <Input 
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Enter a message"
      />
      <Button onClick={handleClick}>
        Click me!
      </Button>
    </div>
  );
};

export default App;`,

  '/src/components/Button.tsx': `import React from 'react';

interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary';
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  onClick, 
  disabled = false,
  variant = 'primary' 
}) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={\`btn btn-\${variant}\`}
    >
      {children}
    </button>
  );
};`,

  '/src/components/Input.tsx': `import React from 'react';

interface InputProps {
  value: string;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  disabled?: boolean;
  type?: 'text' | 'email' | 'password';
}

export const Input: React.FC<InputProps> = ({
  value,
  onChange,
  placeholder,
  disabled = false,
  type = 'text'
}) => {
  return (
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      disabled={disabled}
      className="input"
    />
  );
};`,

  '/src/utils/helpers.ts': `export const formatMessage = (message: string): string => {
  return \`[INFO] \${new Date().toISOString()}: \${message}\`;
};

export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

export const capitalizeFirst = (str: string): string => {
  return str.charAt(0).toUpperCase() + str.slice(1);
};`,

  '/src/index.ts': `import App from './App';

export { App };
export * from './components';
export * from './utils';`,

  '/package.json': `{
  "name": "monaco-demo-project",
  "version": "1.0.0",
  "description": "A demo project for Monaco Editor integration",
  "main": "src/index.ts",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "test": "vitest",
    "lint": "eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0"
  },
  "dependencies": {
    "react": "^19.1.0",
    "react-dom": "^19.1.0"
  },
  "devDependencies": {
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "@typescript-eslint/eslint-plugin": "^8.0.0",
    "@typescript-eslint/parser": "^8.0.0",
    "eslint": "^9.18.0",
    "typescript": "^5.7.3",
    "vite": "^6.0.0",
    "vitest": "^2.0.0"
  }
}`,

  '/README.md': `# Monaco Demo Project

This is a sample React project used to demonstrate Monaco Editor integration with AgentsOS.

## Features

- **React Components**: Reusable Button and Input components
- **TypeScript**: Full type safety throughout the project
- **Utilities**: Helper functions for common operations
- **Modern Setup**: Vite, ESLint, and Vitest for development

## Getting Started

\`\`\`bash
npm install
npm run dev
\`\`\`

## Project Structure

- \`src/components/\` - Reusable React components
- \`src/utils/\` - Utility functions and helpers
- \`src/App.tsx\` - Main application component
- \`src/index.ts\` - Module exports

## Usage

The main App component demonstrates how to use the Button and Input components together with utility functions.
`
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const filePath = searchParams.get('path');
    
    if (!filePath) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'File path is required' 
        },
        { status: 400 }
      );
    }

    // TODO: Later, get workspaceId and read real file from Daytona workspace
    // const workspaceId = searchParams.get('workspaceId');
    
    const content = mockFileContents[filePath];
    
    if (content === undefined) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'File not found' 
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        path: filePath,
        content,
        lastModified: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error fetching file content:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch file content' 
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { path, content } = body;
    
    if (!path || content === undefined) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Path and content are required' 
        },
        { status: 400 }
      );
    }

    // TODO: Later, save to actual Daytona workspace
    // For now, just simulate success
    console.log(`Saving file ${path}:`, content.substring(0, 100) + '...');
    
    return NextResponse.json({
      success: true,
      data: {
        path,
        saved: true,
        lastModified: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error saving file:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to save file' 
      },
      { status: 500 }
    );
  }
}