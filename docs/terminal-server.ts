/**
 * REFERENCE FILE - Terminal Server TypeScript Source
 * 
 * This file provides TypeScript syntax highlighting and linting for development.
 * The actual deployed version is converted to CommonJS in setup-agentspod.ts
 * 
 * Dependencies (installed in sandbox, not in main project):
 * - express: Web server framework
 * - ws: WebSocket server
 * - node-pty: Real pseudoterminal (same as VSCode)
 * - cors: Cross-origin resource sharing
 */

// @ts-nocheck - This is a reference file, not compiled
import express from 'express';
import http from 'http';
import WebSocket from 'ws';
import * as pty from 'node-pty';
import cors from 'cors';

const app = express();
const server = http.createServer(app);

// Enable CORS for all routes
app.use(cors({
  origin: true,
  credentials: true
}));

// Create WebSocket server
const wss = new WebSocket.Server({ 
  server,
  path: '/terminal'
});

console.log('🚀 AgentsPod Terminal Server Starting...');

interface TerminalSession {
  ptyProcess: pty.IPty;
  ws: WebSocket;
}

const terminals = new Map<string, TerminalSession>();
let terminalId = 1;

wss.on('connection', function connection(ws: WebSocket, request: http.IncomingMessage) {
  const url = new URL(request.url || '', `http://${request.headers.host}`);
  const command = url.searchParams.get('cmd') || 'bash';
  const id = `term_${terminalId++}`;
  
  console.log(`📡 New terminal connection: ${id} (command: ${command})`);

  // Create a new pty process (real pseudoterminal - same as VSCode!)
  const ptyProcess = pty.spawn(command === 'claude' ? 'bash' : command, 
    command === 'claude' ? ['-c', 'cd /root/project && echo "🤖 Claude AI Terminal Ready!" && claude || bash'] : [], 
    {
      name: 'xterm-color',
      cols: 80,
      rows: 24,
      cwd: '/root/project',
      env: {
        ...process.env,
        TERM: 'xterm-256color',
        COLORTERM: 'truecolor'
      }
    }
  );

  terminals.set(id, { ptyProcess, ws });

  // Send data from pty to WebSocket
  ptyProcess.onData((data: string) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(data);
    }
  });

  // Handle pty process exit
  ptyProcess.onExit((exitCode: { exitCode: number; signal?: number }) => {
    console.log(`📤 Terminal ${id} exited with code: ${exitCode.exitCode}`);
    terminals.delete(id);
    if (ws.readyState === WebSocket.OPEN) {
      ws.close();
    }
  });

  // Handle WebSocket messages (user input)
  ws.on('message', function message(data: WebSocket.RawData) {
    try {
      const msg = JSON.parse(data.toString());
      if (msg.type === 'resize') {
        ptyProcess.resize(msg.cols, msg.rows);
        console.log(`📐 Terminal ${id} resized to ${msg.cols}x${msg.rows}`);
        return;
      }
    } catch (e) {
      // Not JSON, treat as terminal input
    }
    if (ptyProcess) {
      ptyProcess.write(data.toString());
    }
  });

  // Handle WebSocket close
  ws.on('close', function close() {
    console.log(`🔌 Terminal ${id} WebSocket closed`);
    if (ptyProcess) {
      ptyProcess.kill();
    }
    terminals.delete(id);
  });

  // Handle WebSocket errors
  ws.on('error', function error(err: Error) {
    console.error(`❌ Terminal ${id} WebSocket error:`, err);
    if (ptyProcess) {
      ptyProcess.kill();
    }
    terminals.delete(id);
  });
});

// Health check endpoint
app.get('/health', (req: express.Request, res: express.Response) => {
  res.json({ 
    status: 'ok', 
    terminals: terminals.size,
    uptime: process.uptime()
  });
});

const PORT = process.env.PORT || 9999;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`⚡ Lightning Terminal Server running on port ${PORT}`);
  console.log(`🌐 WebSocket endpoint: ws://localhost:${PORT}/terminal`);
  console.log(`🤖 Claude terminal: ws://localhost:${PORT}/terminal?cmd=claude`);
  console.log(`💻 Bash terminal: ws://localhost:${PORT}/terminal?cmd=bash`);
});

process.on('SIGTERM', () => {
  console.log('🛑 Shutting down terminal server...');
  terminals.forEach(({ ptyProcess }) => {
    ptyProcess.kill();
  });
  process.exit(0);
});