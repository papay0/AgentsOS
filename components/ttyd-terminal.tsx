'use client';

import React, { useEffect, useRef, useState, forwardRef, useImperativeHandle, useCallback } from 'react';
import { Terminal, ITerminalAddon } from '@xterm/xterm';
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
  /** Focus the terminal */
  focusTerminal: () => void;
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
  
  // Get current theme from document (set by ThemeProvider)
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('dark');

  // Watch for theme changes from ThemeProvider
  useEffect(() => {
    const updateResolvedTheme = () => {
      const isDark = document.documentElement.classList.contains('dark');
      const newTheme = isDark ? 'dark' : 'light';
      setResolvedTheme(newTheme);
    };

    // Set initial theme
    updateResolvedTheme();

    // Listen for class changes on document element
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
          updateResolvedTheme();
        }
      });
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });

    return () => observer.disconnect();
  }, []);

  // Handle mobile keyboard visibility for proper scrolling behavior
  useEffect(() => {
    if (!window.visualViewport) return;

    let scrollTimeout: NodeJS.Timeout;
    const handleViewportChange = () => {
      // Clear any pending scroll operations
      clearTimeout(scrollTimeout);

      const viewport = window.visualViewport;
      if (!viewport) return;

      // Calculate keyboard height
      const keyboardHeight = window.innerHeight - viewport.height;
      
      // Only act if keyboard is visible (threshold to avoid false positives)
      if (keyboardHeight > 50) {
        // Find the command palette element (parent container)
        const commandPalette = document.querySelector('.mobile-terminal-palette');
        if (commandPalette) {
          const paletteRect = commandPalette.getBoundingClientRect();
          const viewportTop = viewport.offsetTop;
          const viewportBottom = viewport.offsetTop + viewport.height;

          // Check if command palette is obscured by keyboard
          if (paletteRect.bottom > viewportBottom || paletteRect.top > viewportBottom - 50) {
            // Calculate scroll to show entire command palette above keyboard
            const scrollTarget = viewportTop + paletteRect.bottom - viewport.height + 10; // 10px padding

            // Smooth scroll with a slight delay to ensure keyboard animation is complete
            scrollTimeout = setTimeout(() => {
              window.scrollTo({
                top: scrollTarget,
                behavior: 'smooth'
              });
            }, 100);
          }
        }
      }
    };

    // Listen for viewport changes (keyboard show/hide)
    window.visualViewport.addEventListener('resize', handleViewportChange);
    window.visualViewport.addEventListener('scroll', handleViewportChange);

    return () => {
      clearTimeout(scrollTimeout);
      window.visualViewport?.removeEventListener('resize', handleViewportChange);
      window.visualViewport?.removeEventListener('scroll', handleViewportChange);
    };
  }, []);

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
    focusTerminal: () => {
      if (terminal.current) {
        terminal.current.focus();
      }
    },
    sendKey: (key: string) => {
      if (websocket.current?.readyState === WebSocket.OPEN) {
        let data = '';
        switch (key) {
          case 'Ctrl+C': data = '\x03'; break;
          case 'Ctrl+L': data = '\x0c'; break;
          case 'Ctrl+D': data = '\x04'; break;
          case 'Ctrl+U': data = '\x15'; break;
          case 'Tab': data = '\x09'; break;
          case 'Enter': data = '\r'; break;
          case 'ArrowUp': data = '\x1b[A'; break;
          case 'ArrowDown': data = '\x1b[B'; break;
          case 'ArrowLeft': data = '\x1b[D'; break;
          case 'ArrowRight': data = '\x1b[C'; break;
          case 'Insert': data = '\x1b[2~'; break;
          case '\x09': data = '\x09'; break; // Handle raw tab
          case '\x7f': data = '\x7f'; break; // Handle raw delete
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
    
    // Force xterm elements to take full height and fit properly
    const fitTerminal = () => {
      if (terminalRef.current) {
        const xtermScreen = terminalRef.current.querySelector('.xterm-screen');
        const xtermViewport = terminalRef.current.querySelector('.xterm-viewport');
        
        if (xtermScreen) {
          (xtermScreen as HTMLElement).style.height = '100%';
          (xtermScreen as HTMLElement).style.width = '100%';
        }
        if (xtermViewport) {
          (xtermViewport as HTMLElement).style.height = '100%';
          (xtermViewport as HTMLElement).style.width = '100%';
        }
        
        // Make the terminal container flex and full size
        const xtermContainer = terminalRef.current.querySelector('.terminal');
        if (xtermContainer) {
          (xtermContainer as HTMLElement).style.height = '100%';
          (xtermContainer as HTMLElement).style.width = '100%';
          (xtermContainer as HTMLElement).style.display = 'flex';
          (xtermContainer as HTMLElement).style.flexDirection = 'column';
        }
      }
      
      if (fitAddon.current) {
        fitAddon.current.fit();
      }
    };
    
    // Initial fits with delays for mobile animation
    setTimeout(fitTerminal, 100);
    setTimeout(fitTerminal, 350);
    setTimeout(fitTerminal, 600);

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
  }, [wsUrl, connectWebSocket]); // eslint-disable-line react-hooks/exhaustive-deps

  // Update terminal theme when resolved theme changes
  useEffect(() => {
    if (terminal.current) {
      terminal.current.options.theme = terminalThemes[resolvedTheme];
    }
  }, [resolvedTheme]);

  // Handle terminal click/tap for mobile keyboard focus
  const handleTerminalInteraction = useCallback(() => {
    // Only trigger on mobile devices
    if (window.visualViewport && /iPhone|iPad|Android/i.test(navigator.userAgent)) {
      // Small delay to allow keyboard to start appearing
      setTimeout(() => {
        const viewport = window.visualViewport;
        if (viewport) {
          const keyboardHeight = window.innerHeight - viewport.height;
          
          // If keyboard is appearing, ensure command palette is visible
          if (keyboardHeight > 50) {
            const commandPalette = document.querySelector('.mobile-terminal-palette');
            if (commandPalette) {
              const paletteRect = commandPalette.getBoundingClientRect();
              const viewportBottom = viewport.offsetTop + viewport.height;
              
              if (paletteRect.bottom > viewportBottom) {
                commandPalette.scrollIntoView({
                  behavior: 'smooth',
                  block: 'end',
                  inline: 'nearest'
                });
              }
            }
          }
        }
      }, 300);
    }
  }, []);

  return (
    <div 
      ref={terminalRef}
      className={className || ''}
      onClick={handleTerminalInteraction}
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        position: 'relative'
      }}
    />
  );
});

TTYDTerminal.displayName = 'TTYDTerminal';

export default TTYDTerminal;