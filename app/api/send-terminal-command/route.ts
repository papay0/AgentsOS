import { NextRequest, NextResponse } from 'next/server';
import { DaytonaClient } from '@/lib/daytona';

interface SendCommandRequest {
  sandboxId: string;
  command: string;
  type: 'text' | 'key' | 'paste';
}

interface SendCommandResponse {
  success: boolean;
  message: string;
  output?: string;
}

export async function POST(request: NextRequest): Promise<NextResponse<SendCommandResponse>> {
  try {
    const body: SendCommandRequest = await request.json();
    const { sandboxId, command, type } = body;

    if (!sandboxId || !command) {
      return NextResponse.json(
        { success: false, message: 'Missing sandboxId or command' },
        { status: 400 }
      );
    }

    const apiKey = process.env.DAYTONA_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { success: false, message: 'Daytona API key not configured' },
        { status: 500 }
      );
    }

    const client = new DaytonaClient(apiKey);
    
    // Get the sandbox
    const sandbox = await client['manager']['daytona'].get(sandboxId);
    
    if (!sandbox) {
      return NextResponse.json(
        { success: false, message: 'Workspace not found' },
        { status: 404 }
      );
    }

    if (sandbox.state !== 'started') {
      return NextResponse.json(
        { success: false, message: 'Workspace is not running' },
        { status: 400 }
      );
    }

    const rootDir = await sandbox.getUserRootDir();
    if (!rootDir) {
      return NextResponse.json(
        { success: false, message: 'Could not get workspace root directory' },
        { status: 500 }
      );
    }

    let shellCommand = '';
    
    switch (type) {
      case 'text':
        // Try to send to ttyd/terminal session first, then fallback to direct execution
        if (command.match(/^[a-zA-Z0-9\s\-_\.\/]+$/)) {
          // Try to write command to the terminal's input (if ttyd is using a named pipe or file)
          shellCommand = `
            # Try multiple approaches to send to terminal
            (
              # Method 1: Try to send via screen if available
              screen -S main -X stuff "${command}\\n" 2>/dev/null ||
              # Method 2: Try to write to terminal device
              echo "${command}" > /dev/pts/0 2>/dev/null ||
              # Method 3: Try to find and signal ttyd process
              pkill -USR1 ttyd 2>/dev/null ||
              # Method 4: Fallback - execute directly and show output
              (echo "# Executing: ${command}" && ${command})
            )
          `;
        } else {
          shellCommand = `echo "${command.replace(/"/g, '\\"')}" > /tmp/cmd_input && cat /tmp/cmd_input`;
        }
        break;
        
      case 'key':
        // Handle special keys by sending appropriate commands
        switch (command) {
          case 'Enter':
            shellCommand = 'echo ""; # Simulate Enter key';
            break;
          case 'Ctrl+C':
            shellCommand = 'pkill -INT -f bash'; // Send interrupt to bash processes
            break;
          case 'Ctrl+D':
            shellCommand = 'echo "# Ctrl+D pressed"';
            break;
          case 'Ctrl+L':
            shellCommand = 'clear';
            break;
          case 'ArrowUp':
          case 'ArrowDown':
          case 'ArrowLeft':
          case 'ArrowRight':
          case 'Home':
          case 'End':
          case 'Backspace':
          case 'Delete':
          case 'Tab':
          case 'Escape':
            shellCommand = `echo "# ${command} key pressed"`;
            break;
          default:
            shellCommand = `echo "# Unknown key: ${command}"`;
        }
        break;
        
      case 'paste':
        // For paste, try to execute if it looks like a command, otherwise just echo
        if (command.includes('\n') || command.length > 100) {
          // Multi-line or long text - save to file
          shellCommand = `echo "${command.replace(/"/g, '\\"')}" > /tmp/pasted_content && echo "Pasted content saved to /tmp/pasted_content"`;
        } else if (command.match(/^[a-zA-Z0-9\s\-_\.\/]+$/)) {
          // Simple command - execute it
          shellCommand = command;
        } else {
          // Other text - just echo it
          shellCommand = `echo "${command.replace(/"/g, '\\"')}"`;
        }
        break;
        
      default:
        return NextResponse.json(
          { success: false, message: 'Invalid command type' },
          { status: 400 }
        );
    }

    console.log('Executing shell command:', shellCommand);

    // Execute the command
    const result = await sandbox.process.executeCommand(
      shellCommand,
      rootDir,
      undefined,
      5000 // 5 second timeout
    );

    return NextResponse.json({
      success: true,
      message: 'Command sent successfully',
      output: result.result
    });

  } catch (error) {
    console.error('Error sending terminal command:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: error instanceof Error ? error.message : 'Unknown error occurred' 
      },
      { status: 500 }
    );
  }
}