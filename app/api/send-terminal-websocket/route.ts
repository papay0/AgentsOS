import { NextRequest, NextResponse } from 'next/server';
import { DaytonaClient } from '@/lib/daytona';
import WebSocket from 'ws';

interface SendWSCommandRequest {
  sandboxId: string;
  command: string;
  type: 'text' | 'key' | 'paste';
}

interface SendWSCommandResponse {
  success: boolean;
  message: string;
  output?: string;
}

export async function POST(request: NextRequest): Promise<NextResponse<SendWSCommandResponse>> {
  try {
    const body: SendWSCommandRequest = await request.json();
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
    const sandbox = await client['manager']['daytona'].get(sandboxId);
    
    if (!sandbox || sandbox.state !== 'started') {
      return NextResponse.json(
        { success: false, message: 'Workspace not found or not running' },
        { status: 404 }
      );
    }

    // Try to connect to the ttyd WebSocket from the backend
    const terminalUrl = `https://9999-${sandboxId}.proxy.daytona.work/`;
    const wsUrl = terminalUrl.replace('https://', 'wss://').replace(/\/$/, '') + '/ws';
    
    console.log('Backend connecting to:', wsUrl);

    // Use Node.js WebSocket to connect from backend
    
    return new Promise((resolve) => {
      const ws = new WebSocket(wsUrl);
      // eslint-disable-next-line prefer-const
      let timeoutId: NodeJS.Timeout;

      const cleanup = () => {
        if (timeoutId) clearTimeout(timeoutId);
        if (ws.readyState === WebSocket.OPEN) {
          ws.close();
        }
      };

      // Set timeout
      timeoutId = setTimeout(() => {
        cleanup();
        resolve(NextResponse.json({
          success: false,
          message: 'Connection timeout'
        }));
      }, 5000);

      ws.on('open', () => {
        console.log('Backend WebSocket connected to ttyd');
        
        // Send auth if needed
        try {
          ws.send(JSON.stringify({ AuthToken: "" }));
        } catch (e) {
          console.log('Auth send failed:', e);
        }

        // Send terminal resize
        setTimeout(() => {
          try {
            ws.send('1' + JSON.stringify({ columns: 80, rows: 24 }));
          } catch (e) {
            console.log('Resize send failed:', e);
          }

          // Send the actual command
          setTimeout(() => {
            let message = '';
            
            switch (type) {
              case 'text':
                message = '0' + command;
                break;
              case 'key':
                const keyMappings: { [key: string]: string } = {
                  'Enter': '\r',
                  'Backspace': '\x7f',
                  'Tab': '\t',
                  'Escape': '\x1b',
                  'ArrowUp': '\x1b[A',
                  'ArrowDown': '\x1b[B',
                  'ArrowRight': '\x1b[C',
                  'ArrowLeft': '\x1b[D',
                  'Home': '\x1b[H',
                  'End': '\x1b[F',
                  'Delete': '\x1b[3~',
                  'Ctrl+C': '\x03',
                  'Ctrl+D': '\x04',
                  'Ctrl+L': '\x0c',
                };
                message = '0' + (keyMappings[command] || command);
                break;
              case 'paste':
                message = '0' + command;
                break;
            }

            console.log('Sending to ttyd:', { message, bytes: Array.from(message).map(c => c.charCodeAt(0)) });
            
            try {
              ws.send(message);
              
              // Wait a bit for response
              setTimeout(() => {
                cleanup();
                resolve(NextResponse.json({
                  success: true,
                  message: 'Command sent to terminal via WebSocket'
                }));
              }, 1000);
              
            } catch (e) {
              cleanup();
              resolve(NextResponse.json({
                success: false,
                message: 'Failed to send command: ' + e
              }));
            }
          }, 200);
        }, 200);
      });

      ws.on('error', (error: Error) => {
        console.error('Backend WebSocket error:', error);
        cleanup();
        resolve(NextResponse.json({
          success: false,
          message: 'WebSocket connection failed: ' + error.message
        }));
      });

      ws.on('message', (data: Buffer) => {
        console.log('Backend received from ttyd:', data.toString());
      });
    });

  } catch (error) {
    console.error('Error in backend WebSocket:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: error instanceof Error ? error.message : 'Unknown error occurred' 
      },
      { status: 500 }
    );
  }
}