import { NextResponse } from 'next/server';

export interface FileTreeItem {
  name: string;
  path: string;
  type: 'file' | 'directory';
  children?: FileTreeItem[];
  size?: number;
  lastModified?: string;
}

// Mock file structure for now - later this will connect to Daytona workspace
const mockFileStructure: FileTreeItem[] = [
  {
    name: 'src',
    path: '/src',
    type: 'directory',
    children: [
      {
        name: 'components',
        path: '/src/components',
        type: 'directory',
        children: [
          {
            name: 'Button.tsx',
            path: '/src/components/Button.tsx',
            type: 'file',
            size: 1024,
            lastModified: '2024-01-15T10:30:00Z'
          },
          {
            name: 'Input.tsx',
            path: '/src/components/Input.tsx',
            type: 'file',
            size: 856,
            lastModified: '2024-01-14T15:20:00Z'
          }
        ]
      },
      {
        name: 'utils',
        path: '/src/utils',
        type: 'directory',
        children: [
          {
            name: 'helpers.ts',
            path: '/src/utils/helpers.ts',
            type: 'file',
            size: 512,
            lastModified: '2024-01-13T09:15:00Z'
          }
        ]
      },
      {
        name: 'App.tsx',
        path: '/src/App.tsx',
        type: 'file',
        size: 2048,
        lastModified: '2024-01-15T14:45:00Z'
      },
      {
        name: 'index.ts',
        path: '/src/index.ts',
        type: 'file',
        size: 256,
        lastModified: '2024-01-12T11:00:00Z'
      }
    ]
  },
  {
    name: 'package.json',
    path: '/package.json',
    type: 'file',
    size: 1536,
    lastModified: '2024-01-10T16:30:00Z'
  },
  {
    name: 'README.md',
    path: '/README.md',
    type: 'file',
    size: 2048,
    lastModified: '2024-01-11T12:00:00Z'
  }
];

export async function GET() {
  try {
    // TODO: Later, get workspaceId from query params and fetch real structure
    // const { searchParams } = new URL(request.url);
    // const workspaceId = searchParams.get('workspaceId');
    
    // For now, return mock data
    return NextResponse.json({
      success: true,
      data: mockFileStructure
    });
  } catch (error) {
    console.error('Error fetching file structure:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch file structure' 
      },
      { status: 500 }
    );
  }
}