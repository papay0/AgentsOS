'use client';

import React, { useEffect, useRef, useState, forwardRef, useImperativeHandle, useCallback } from 'react';
import { Terminal, ITerminalAddon } from '@xterm/xterm';
import { useTheme } from './theme-provider';
import '@xterm/xterm/css/xterm.css';

const terminalThemes = {
  light: {
    background: '#ffffff',
    foreground: '#000000',
    cursor: '#000000',
    selectionBackground: '#add6ff',
    black: '#000000',
    red: '#cd3131',
    green: '#00bc00',
    yellow: '#949800',
    blue: '#0451a5',
    magenta: '#bc05bc',
    cyan: '#0598bc',
    white: '#555555',
    brightBlack: '#666666',
    brightRed: '#f14c4c',
    brightGreen: '#23d18b',
    brightYellow: '#f5f543',
    brightBlue: '#3b8eea',
    brightMagenta: '#d670d6',
    brightCyan: '#29b8db',
    brightWhite: '#e5e5e5',
  },
  dark: {
    background: '#1e1e1e',
    foreground: '#ffffff',
    cursor: '#ffffff',
    selectionBackground: '#264f78',
    black: '#000000',
    red: '#cd3131',
    green: '#0dbc79',
    yellow: '#e5e510',
    blue: '#2472c8',
    magenta: '#bc3fbc',
    cyan: '#11a8cd',
    white: '#e5e5e5',
    brightBlack: '#666666',
    brightRed: '#f14c4c',
    brightGreen: '#23d18b',
    brightYellow: '#f5f543',
    brightBlue: '#3b8eea',
    brightMagenta: '#d670d6',
    brightCyan: '#29b8db',
    brightWhite: '#ffffff',
  }
} as const;

interface TTYDTerminalProps {
  /** WebSocket URL for the ttyd server */
  wsUrl: string;
  /** Called when connection status changes */
  onConnectionChange?: (connected: boolean) => void;
  /** Called when status message changes */
  onStatusChange?: (status: string) => void;
  /** Custom CSS class for the terminal container */
  className?: string;
}

export interface TTYDTerminalRef {
  /** Send a command to the terminal */
  sendCommand: (command: string, addEnter?: boolean) => void;
  /** Send a special key combination */
  sendKey: (key: string) => void;
  /** Check if terminal is connected */
  isConnected: () => boolean;
}

/**
 * TTYDTerminal - A ttyd terminal component
 * 
 * Connects directly to ttyd servers using the correct WebSocket protocol.
 * Perfect for cloud development environments and remote terminal access.
 */
const TTYDTerminal = forwardRef<TTYDTerminalRef, TTYDTerminalProps>(({ 
  wsUrl, 
  onConnectionChange, 
  onStatusChange,
  className
}, ref) => {
  const terminalRef = useRef<HTMLDivElement>(null);
  const terminal = useRef<Terminal | null>(null);
  const fitAddon = useRef<ITerminalAddon & { fit: () => void; proposeDimensions: () => { cols: number; rows: number } | undefined } | null>(null);
  const websocket = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  
  // Theme management
  const { theme } = useTheme();
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('dark');

  // Resolve theme (handle system theme)
  useEffect(() => {
    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const updateTheme = () => {
        setResolvedTheme(mediaQuery.matches ? 'dark' : 'light');
      };
      
      updateTheme(); // Set initial value
      mediaQuery.addEventListener('change', updateTheme);
      
      return () => mediaQuery.removeEventListener('change', updateTheme);
    } else {
      setResolvedTheme(theme as 'light' | 'dark');
    }
  }, [theme]);

  useImperativeHandle(ref, () => ({
    sendCommand: (command: string, addEnter = true) => {
      if (websocket.current?.readyState === WebSocket.OPEN) {
        const data = addEnter ? command + '\r' : command;
        
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
          case 'Ctrl+C': data = '\x03'; break;
          case 'Ctrl+L': data = '\x0c'; break;
          case 'Ctrl+D': data = '\x04'; break;
          case 'Enter': data = '\r'; break;
          case 'ArrowUp': data = '\x1b[A'; break;
          case 'ArrowDown': data = '\x1b[B'; break;
          case 'ArrowLeft': data = '\x1b[D'; break;
          case 'ArrowRight': data = '\x1b[C'; break;
          default: data = key;
        }
        
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

    // ttyd requires the "tty" subprotocol
    websocket.current = new WebSocket(wsUrl, ['tty']);
    websocket.current.binaryType = 'arraybuffer';

    websocket.current.onopen = () => {
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
            
            websocket.current!.send(payload);
          }
        }
      }, 200);

    };

    websocket.current.onmessage = (event) => {
      if (terminal.current) {
        const data = event.data;
        
        if (typeof data === 'string') {
          if (data.startsWith('0')) {
            // Output data - remove the '0' prefix
            const output = data.slice(1);
            terminal.current.write(output);
          }
        } else {
          // Handle binary data (ArrayBuffer/Blob)
          if (data instanceof Blob) {
            // Convert Blob to text
            data.arrayBuffer().then(buffer => {
              const text = new TextDecoder().decode(buffer);
              
              if (text.startsWith('0')) {
                // Output data - remove the '0' prefix
                const output = text.slice(1);
                terminal.current?.write(output);
              }
            }).catch(err => {
              console.error('Failed to decode blob:', err);
            });
          } else if (data instanceof ArrayBuffer || data instanceof Uint8Array) {
            const text = new TextDecoder().decode(data);
            if (text.startsWith('0')) {
              terminal.current.write(text.slice(1));
            }
          }
        }
      }
    };

    websocket.current.onclose = (event) => {
      setIsConnected(false);
      onConnectionChange?.(false);
      onStatusChange?.(event.code === 1000 ? 'Disconnected' : `Connection failed (${event.code})`);
      
      // Auto-reconnect for network issues (not user-initiated close)
      if (event.code !== 1000) {
        setTimeout(() => {
          if (websocket.current?.readyState === WebSocket.CLOSED) {
            connectWebSocket();
          }
        }, 3000);
      }
    };

    websocket.current.onerror = (error) => {
      console.error('WebSocket error:', error);
      onStatusChange?.('Connection error');
    };

    // Handle terminal input
    if (terminal.current) {
      terminal.current.onData((data) => {
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

    // Initialize terminal with current theme
    terminal.current = new Terminal({
      theme: terminalThemes[resolvedTheme],
      fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace',
      fontSize: 14,
      lineHeight: 1.2,
      cursorBlink: true,
      allowTransparency: false,
    });

    // Dynamically import and add addons
    Promise.all([
      import('@xterm/addon-fit').then(mod => mod.FitAddon),
      import('@xterm/addon-web-links').then(mod => mod.WebLinksAddon)
    ]).then(([FitAddon, WebLinksAddon]) => {
      if (terminal.current) {
        fitAddon.current = new FitAddon() as ITerminalAddon & { fit: () => void; proposeDimensions: () => { cols: number; rows: number } | undefined };
        terminal.current.loadAddon(fitAddon.current);
        terminal.current.loadAddon(new WebLinksAddon());
      }
    });

    // Open terminal in DOM
    terminal.current.open(terminalRef.current);
    
    // Force xterm elements to take full height
    setTimeout(() => {
      if (terminalRef.current) {
        const xtermScreen = terminalRef.current.querySelector('.xterm-screen');
        const xtermViewport = terminalRef.current.querySelector('.xterm-viewport');
        
        if (xtermScreen) {
          (xtermScreen as HTMLElement).style.height = '100%';
        }
        if (xtermViewport) {
          (xtermViewport as HTMLElement).style.height = '100%';
        }
        
        // Make the terminal container flex
        const xtermContainer = terminalRef.current.querySelector('.terminal');
        if (xtermContainer) {
          (xtermContainer as HTMLElement).style.height = '100%';
          (xtermContainer as HTMLElement).style.display = 'flex';
          (xtermContainer as HTMLElement).style.flexDirection = 'column';
        }
      }
      
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
    
    // Handle window content resize (from AgentsOS windows)
    const handleWindowContentResize = () => {
      // Add a small delay to ensure the container has resized
      setTimeout(() => {
        if (fitAddon.current) {
          fitAddon.current.fit();
        }
      }, 50);
    };
    
    window.addEventListener('resize', handleResize);
    window.addEventListener('windowContentResize', handleWindowContentResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('windowContentResize', handleWindowContentResize);
      websocket.current?.close();
      terminal.current?.dispose();
    };
  }, [wsUrl, connectWebSocket]);

  // Update terminal theme when resolved theme changes
  useEffect(() => {
    if (terminal.current) {
      terminal.current.options.theme = terminalThemes[resolvedTheme];
    }
  }, [resolvedTheme]);

  return (
    <div 
      ref={terminalRef}
      className={`h-full ${className || ''}`}
      style={{
        display: 'flex',
        flexDirection: 'column'
      }}
    />
  );
});

TTYDTerminal.displayName = 'TTYDTerminal';

export default TTYDTerminal;