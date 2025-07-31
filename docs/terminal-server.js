const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const pty = require('node-pty');
const cors = require('cors');

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

const sessions = new Map(); // Session management
let connectionId = 1;

wss.on('connection', function connection(ws, request) {
  const url = new URL(request.url || '', `http://${request.headers.host}`);
  const command = url.searchParams.get('cmd') || 'bash';
  const sessionId = url.searchParams.get('session') || `${command}_default`;
  const connId = `conn_${connectionId++}`;
  
  console.log(`📡 New WebSocket connection: ${connId} for session: ${sessionId} (command: ${command})`);

  let session;
  
  // Check if we have an existing session
  if (sessions.has(sessionId)) {
    session = sessions.get(sessionId);
    console.log(`🔄 Reconnecting to existing terminal session: ${sessionId}`);
  } else {
    // Create a new session with pty process
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
    
    session = {
      sessionId,
      ptyProcess,
      connections: new Map(),
      command
    };
    
    sessions.set(sessionId, session);
    console.log(`🆕 Created new terminal session: ${sessionId}`);
    
    // Set up data handler for this session
    ptyProcess.onData((data) => {
      // Send data to all connections in this session
      session.connections.forEach((connData, id) => {
        if (connData.ws.readyState === WebSocket.OPEN) {
          connData.ws.send(data);
        }
      });
    });
    
    // Handle pty process exit
    ptyProcess.onExit((exitCode) => {
      console.log(`📤 Terminal session ${sessionId} exited with code: ${exitCode.exitCode || exitCode}`);
      
      // Close all connections for this session
      session.connections.forEach((connData, id) => {
        if (connData.ws.readyState === WebSocket.OPEN) {
          connData.ws.close();
        }
      });
      
      sessions.delete(sessionId);
    });
  }

  // Add this connection to the session
  session.connections.set(connId, { ws, connId });

  // Handle WebSocket messages (user input)
  ws.on('message', function message(data) {
    try {
      const msg = JSON.parse(data.toString());
      if (msg.type === 'resize') {
        session.ptyProcess.resize(msg.cols, msg.rows);
        console.log(`📐 Terminal session ${sessionId} resized to ${msg.cols}x${msg.rows}`);
        return;
      }
    } catch (e) {
      // Not JSON, treat as terminal input
    }
    if (session && session.ptyProcess) {
      session.ptyProcess.write(data.toString());
    }
  });

  // Handle WebSocket close - remove connection from session
  ws.on('close', function close() {
    console.log(`🔌 WebSocket connection ${connId} closed for session ${sessionId}`);
    if (session) {
      session.connections.delete(connId);
      
      // If no more connections, optionally keep session alive for a while
      if (session.connections.size === 0) {
        console.log(`💤 Session ${sessionId} has no active connections, keeping alive...`);
      }
    }
  });

  // Handle WebSocket errors - remove connection from session
  ws.on('error', function error(err) {
    console.error(`❌ WebSocket connection ${connId} error for session ${sessionId}:`, err);
    if (session) {
      session.connections.delete(connId);
    }
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  let totalConnections = 0;
  sessions.forEach(session => {
    totalConnections += session.connections.size;
  });
  
  res.json({ 
    status: 'ok', 
    activeSessions: sessions.size,
    totalConnections: totalConnections,
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