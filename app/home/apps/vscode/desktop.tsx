import { MonacoEditor } from '@/app/home/components/ui/monaco-editor';
import { VSCodeAppProps } from '../BaseApp';

export const VSCodeDesktop = ({ workspaceId }: VSCodeAppProps) => {
  // Use Monaco Editor with API integration
  if (workspaceId) {
    return (
      <MonacoEditor 
        workspaceId={workspaceId}
        className="w-full h-full" 
        theme="light"
        onFileChange={(path) => {
          console.log(`File changed: ${path}`);
        }}
        onError={(error) => {
          console.error('Monaco Editor error:', error);
        }}
      />
    );
  }

  // Show guidance for Monaco Editor
  return (
    <div className="w-full h-full bg-background text-foreground p-8 flex items-center justify-center">
      <div className="text-center max-w-md">
        <div className="text-6xl mb-4">📝</div>
        <h2 className="text-2xl font-semibold mb-4">Monaco Code Editor</h2>
        <p className="text-muted-foreground mb-6">
          A powerful code editor with syntax highlighting, IntelliSense, and multi-file support.
        </p>
        <div className="bg-muted/50 rounded-lg p-4 text-sm text-left">
          <p className="font-medium mb-2">Features:</p>
          <ul className="space-y-1 text-muted-foreground">
            <li>• TypeScript/JavaScript IntelliSense</li>
            <li>• Cmd+Click to navigate files</li>
            <li>• Auto-save functionality</li>
            <li>• Multi-file editing</li>
            <li>• Syntax highlighting</li>
          </ul>
        </div>
      </div>
    </div>
  );
};