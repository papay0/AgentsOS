import { MonacoEditor } from '@/app/home/components/ui/monaco-editor';
import { VSCodeAppProps } from '../BaseApp';

export const VSCodeMobile = ({ workspaceId }: VSCodeAppProps) => {
  // Use Monaco Editor with API integration
  if (workspaceId) {
    return (
      <div className="absolute inset-0">
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
      </div>
    );
  }

  // Show guidance for Monaco Editor
  return (
    <div className="w-full h-full bg-background text-foreground p-4 flex items-center justify-center">
      <div className="text-center max-w-xs">
        <div className="text-4xl mb-3">📝</div>
        <h2 className="text-lg font-semibold mb-3">Monaco Editor</h2>
        <p className="text-muted-foreground text-sm mb-4">
          Code editor with syntax highlighting and IntelliSense
        </p>
        <div className="bg-muted/50 rounded-lg p-3 text-xs text-left">
          <p className="font-medium mb-1">Features:</p>
          <ul className="space-y-1 text-muted-foreground">
            <li>• TypeScript IntelliSense</li>
            <li>• File navigation</li>
            <li>• Auto-save</li>
            <li>• Multi-file editing</li>
          </ul>
        </div>
      </div>
    </div>
  );
};