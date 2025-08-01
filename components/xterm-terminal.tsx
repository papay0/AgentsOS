'use client';

import React, { useEffect, useRef, useState, forwardRef, useImperativeHandle, useCallback } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { WebLinksAddon } from '@xterm/addon-web-links';
import '@xterm/xterm/css/xterm.css';

interface XtermTerminalProps {
  wsUrl: string;
  onConnectionChange?: (connected: boolean) => void;
  onStatusChange?: (status: string) => void;
}

export interface XtermTerminalRef {
  sendCommand: (command: string, addEnter?: boolean) => void;
  sendKey: (key: string) => void;
  isConnected: () => boolean;
}

const XtermTerminal = forwardRef<XtermTerminalRef, XtermTerminalProps>(({ 
  wsUrl, 
  onConnectionChange, 
  onStatusChange 
}, ref) => {
  const terminalRef = useRef<HTMLDivElement>(null);
  const terminal = useRef<Terminal | null>(null);
  const fitAddon = useRef<FitAddon | null>(null);
  const websocket = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useImperativeHandle(ref, () => ({
    sendCommand: (command: string, addEnter = true) => {
      if (websocket.current?.readyState === WebSocket.OPEN) {
        const data = addEnter ? command + '\r' : command;
        console.log('📤 Sending custom:', data);
        
        // INPUT = '0' (0x30) + command bytes as binary
        const commandBytes = new TextEncoder().encode(data);
        const payload = new Uint8Array(commandBytes.length + 1);
        payload[0] = 0x30; // '0' as byte
        payload.set(commandBytes, 1);
        websocket.current.send(payload);
      }
    },
    sendKey: (key: string) => {
      if (websocket.current?.readyState === WebSocket.OPEN) {
        let data = '';
        switch (key) {
          case 'Ctrl+C':
            data = '\x03';
            break;
          case 'Ctrl+L':
            data = '\x0c';
            break;
          case 'Ctrl+D':
            data = '\x04';
            break;
          case 'Enter':
            data = '\r';
            break;
          case 'ArrowUp':
            data = '\x1b[A';
            break;
          case 'ArrowDown':
            data = '\x1b[B';
            break;
          case 'ArrowLeft':
            data = '\x1b[D';
            break;
          case 'ArrowRight':
            data = '\x1b[C';
            break;
          default:
            data = key;
        }
        console.log('📤 Sending key:', key, '=>', data);
        
        // INPUT = '0' (0x30) + key bytes as binary
        const keyBytes = new TextEncoder().encode(data);
        const payload = new Uint8Array(keyBytes.length + 1);
        payload[0] = 0x30; // '0' as byte
        payload.set(keyBytes, 1);
        websocket.current.send(payload);
      }
    },
    isConnected: () => isConnected
  }));

  const connectWebSocket = useCallback(() => {
    onStatusChange?.('Connecting...');
    console.log('🔗 Connecting to WebSocket:', wsUrl);

    // Try different endpoint paths in case /ws doesn't work
    const wsUrlToTry = wsUrl;
    
    // If this is the first try and it's /ws, try it
    // If it fails, we'll try other paths
    console.log('🔄 Trying WebSocket URL:', wsUrlToTry);

    // ttyd requires the "tty" subprotocol
    websocket.current = new WebSocket(wsUrlToTry, ['tty']);
    websocket.current.binaryType = 'arraybuffer';
    console.log('🔧 Created WebSocket with "tty" protocol and arraybuffer binary type');

    websocket.current.onopen = () => {
      console.log('✅ WebSocket connected');
      setIsConnected(true);
      onConnectionChange?.(true);
      onStatusChange?.('Connected');
      
      // Step 1: Send initial authentication and window size
      // CRITICAL: JSON_DATA messages do NOT have operation code prefix
      const authMessage = JSON.stringify({
        AuthToken: "",  // Empty if no auth required
        columns: 120,   // Terminal width
        rows: 30        // Terminal height
      });
      
      console.log('📤 Sending auth/init:', authMessage);
      websocket.current!.send(new TextEncoder().encode(authMessage));
      
      // Wait for ttyd to process auth, then send proper resize
      setTimeout(() => {
        if (websocket.current?.readyState === WebSocket.OPEN && terminal.current && fitAddon.current) {
          const dimensions = fitAddon.current.proposeDimensions();
          if (dimensions) {
            // RESIZE_TERMINAL = '1' (0x31) + JSON data as binary
            const resizeData = JSON.stringify({ columns: dimensions.cols, rows: dimensions.rows });
            const resizeBytes = new TextEncoder().encode(resizeData);
            const payload = new Uint8Array(resizeBytes.length + 1);
            payload[0] = 0x31; // '1' as byte
            payload.set(resizeBytes, 1);
            
            console.log('📏 Sending proper binary resize:', dimensions);
            websocket.current!.send(payload);
          }
        }
      }, 200);

      // Wait for ttyd to send initial data, then try to wake up the shell
      console.log('🤝 Waiting for ttyd to send initial prompt...');
      
      // After receiving the initial messages, try to get a shell prompt
      setTimeout(() => {
        if (websocket.current?.readyState === WebSocket.OPEN) {
          console.log('🔄 Sending newline to wake up shell');
          // INPUT = '0' (0x30) + command bytes as binary
          const commandBytes = new TextEncoder().encode('\r');
          const payload = new Uint8Array(commandBytes.length + 1);
          payload[0] = 0x30; // '0' as byte
          payload.set(commandBytes, 1);
          websocket.current!.send(payload);
        }
      }, 1000);
    };

    websocket.current.onmessage = (event) => {
      console.log('📥 Received raw:', event.data);
      console.log('📥 Data type:', typeof event.data);
      console.log('📥 Data length:', event.data.length);
      
      if (terminal.current) {
        // ttyd sends messages with different prefixes
        // '0' = output data, '1' = resize, '2' = set title
        const data = event.data;
        
        if (typeof data === 'string') {
          if (data.startsWith('0')) {
            // Output data - remove the '0' prefix
            const output = data.slice(1);
            console.log('📝 Writing to terminal:', JSON.stringify(output));
            terminal.current.write(output);
          } else {
            console.log('📋 Non-output message:', data);
          }
        } else {
          // Handle binary data (Blob)
          console.log('📦 Received binary data:', data);
          
          if (data instanceof Blob) {
            // Convert Blob to text
            data.arrayBuffer().then(buffer => {
              const text = new TextDecoder().decode(buffer);
              console.log('📦 Decoded blob as text:', JSON.stringify(text));
              
              if (text.startsWith('0')) {
                // Output data - remove the '0' prefix
                const output = text.slice(1);
                console.log('📝 Writing blob output to terminal:', JSON.stringify(output));
                terminal.current?.write(output);
              } else if (text.startsWith('1')) {
                // Terminal title - remove the '1' prefix
                const title = text.slice(1);
                console.log('📋 Terminal title:', title);
                // Could set document title here if needed
              } else if (text.startsWith('2')) {
                // Theme/settings - remove the '2' prefix
                const settings = text.slice(1);
                console.log('📋 Terminal settings:', settings);
                try {
                  const themeData = JSON.parse(settings);
                  console.log('🎨 Received theme from ttyd:', themeData);
                } catch (e) {
                  console.log('📋 Non-JSON settings:', settings);
                }
              } else {
                console.log('📋 Unknown message type:', text);
              }
            }).catch(err => {
              console.error('❌ Failed to decode blob:', err);
            });
          } else if (data instanceof ArrayBuffer || data instanceof Uint8Array) {
            const text = new TextDecoder().decode(data);
            console.log('📦 Decoded binary as text:', JSON.stringify(text));
            if (text.startsWith('0')) {
              terminal.current.write(text.slice(1));
            }
          }
        }
      }
    };

    websocket.current.onclose = (event) => {
      console.log(`🔌 WebSocket closed: ${event.code} - ${event.reason}`);
      setIsConnected(false);
      onConnectionChange?.(false);
      onStatusChange?.(`Disconnected (${event.code})`);
      
      // Only auto-reconnect for network issues, not protocol errors
      if (event.code === 1006 && event.reason === '') {
        console.log('🚫 Stopping reconnection - likely protocol issue');
        onStatusChange?.('Connection failed - check ttyd compatibility');
      } else if (event.code !== 1000) {
        // Auto-reconnect after 3 seconds for other errors
        setTimeout(() => {
          if (websocket.current?.readyState === WebSocket.CLOSED) {
            console.log('🔄 Attempting reconnection...');
            connectWebSocket();
          }
        }, 3000);
      }
    };

    websocket.current.onerror = (error) => {
      console.error('❌ WebSocket error:', error);
      onStatusChange?.('Error');
    };

    // Handle terminal input
    if (terminal.current) {
      terminal.current.onData((data) => {
        console.log('📤 Sending terminal input:', data);
        if (websocket.current?.readyState === WebSocket.OPEN) {
          // INPUT = '0' (0x30) + data bytes as binary
          const inputBytes = new TextEncoder().encode(data);
          const payload = new Uint8Array(inputBytes.length + 1);
          payload[0] = 0x30; // '0' as byte
          payload.set(inputBytes, 1);
          websocket.current.send(payload);
        }
      });

      // Handle resize
      terminal.current.onResize((dimensions) => {
        console.log('📏 Terminal resized:', dimensions);
        if (websocket.current?.readyState === WebSocket.OPEN) {
          // RESIZE_TERMINAL = '1' (0x31) + JSON data as binary
          const resizeData = JSON.stringify({ columns: dimensions.cols, rows: dimensions.rows });
          const resizeBytes = new TextEncoder().encode(resizeData);
          const payload = new Uint8Array(resizeBytes.length + 1);
          payload[0] = 0x31; // '1' as byte
          payload.set(resizeBytes, 1);
          websocket.current.send(payload);
        }
      });
    }
  }, [wsUrl, onStatusChange, onConnectionChange]);

  useEffect(() => {
    if (!terminalRef.current) return;

    // Initialize terminal
    terminal.current = new Terminal({
      theme: {
        background: '#1e1e1e',
        foreground: '#ffffff',
        cursor: '#ffffff',
        selectionBackground: '#264f78',
      },
      fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace',
      fontSize: 14,
      lineHeight: 1.2,
      cursorBlink: true,
      allowTransparency: false,
    });

    // Add addons
    fitAddon.current = new FitAddon();
    terminal.current.loadAddon(fitAddon.current);
    terminal.current.loadAddon(new WebLinksAddon());

    // Open terminal in DOM
    terminal.current.open(terminalRef.current);
    
    // Small delay to ensure DOM is ready
    setTimeout(() => {
      if (fitAddon.current) {
        fitAddon.current.fit();
      }
    }, 100);

    // Connect to WebSocket
    connectWebSocket();

    // Handle window resize
    const handleResize = () => {
      if (fitAddon.current) {
        fitAddon.current.fit();
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      websocket.current?.close();
      terminal.current?.dispose();
    };
  }, [wsUrl, connectWebSocket]);

  return (
    <div 
      ref={terminalRef}
      className="h-96 p-2"
      style={{ minHeight: '400px' }}
    />
  );
});

XtermTerminal.displayName = 'XtermTerminal';

export default XtermTerminal;