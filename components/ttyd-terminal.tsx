/*
 * MOBILE TMUX SCROLLING ATTEMPTS - DEBUGGING LOG
 * 
 * Problem: Mobile touch scrolling doesn't work properly with tmux sessions.
 * When tmux mouse mode is enabled, desktop mouse wheel works but mobile touch doesn't.
 * 
 * Attempts made:
 * 
 * 1. ARROW KEYS APPROACH (Failed)
 *    - Sent Up/Down arrow keys (\x1b[A, \x1b[B) 
 *    - Problem: These interfere with command history navigation at shell prompt
 *    - Result: Scrolling through command history instead of terminal buffer
 * 
 * 2. PAGE UP/DOWN APPROACH (Failed)  
 *    - Sent Page Up/Down keys (\x1b[5~, \x1b[6~)
 *    - Problem: Still keyboard events, not proper scrolling in tmux
 *    - Result: Similar issues with command interference
 * 
 * 3. MOUSE WHEEL EVENTS APPROACH (Failed)
 *    - Sent mouse wheel events (\x1b[M\x60, \x1b[M\x61)
 *    - Problem: Incorrect mouse protocol format
 *    - Result: Character "_" being inserted into terminal input
 * 
 * 4. TMUX COPY-MODE APPROACH (Working but slow)
 *    - Enter copy-mode with Ctrl+B [, send arrows, exit with Escape
 *    - Problem: Too slow, need to increase scroll speed
 *    - Result: Works but scrolls too slowly for good UX
 * 
 * 5. FAST COPY-MODE APPROACH (Major UX issues)
 *    - Same as #4 but with more arrows and Page Up/Down for large gestures
 *    - Problems: 
 *      - Always returns to bottom when exiting copy-mode
 *      - Scroll direction is reversed (not intuitive for mobile)
 *      - Feels broken compared to desktop experience
 * 
 * 6. PROPER SGR MOUSE PROTOCOL APPROACH (Current attempt)
 *    - Try modern SGR mouse protocol that tmux supports
 *    - Send proper wheel events with correct coordinates and encoding
 *    - Should behave exactly like desktop mouse wheel
 */

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
 * TTYDTerminal - A ttyd terminal component with mobile scroll support
 * 
 * Connects directly to ttyd servers using the correct WebSocket protocol.
 * Perfect for cloud development environments and remote terminal access.
 * Enhanced with mobile touch scrolling support for tmux.
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
  const onDataDisposable = useRef<{ dispose: () => void } | null>(null);
  const onResizeDisposable = useRef<{ dispose: () => void } | null>(null);
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
    console.log('🔌 TTYDTerminal: Attempting WebSocket connection to:', wsUrl);
    onStatusChange?.('Connecting...');

    // Close existing connection if any
    if (websocket.current) {
      if (websocket.current.readyState === WebSocket.OPEN || websocket.current.readyState === WebSocket.CONNECTING) {
        console.log('🔌 Closing existing WebSocket connection');
        websocket.current.close(1000, 'Reconnecting');
      }
      websocket.current = null;
    }

    // ttyd requires the "tty" subprotocol
    websocket.current = new WebSocket(wsUrl, ['tty']);
    websocket.current.binaryType = 'arraybuffer';

    websocket.current.onopen = () => {
      console.log('✅ TTYDTerminal: WebSocket connection opened successfully');
      setIsConnected(true);
      onConnectionChange?.(true);
      onStatusChange?.('Connected');
      
      // Proxy handles ttyd auth automatically - no need to send auth message
      
      // Then send proper resize after short delay
      setTimeout(() => {
        if (websocket.current?.readyState === WebSocket.OPEN && terminal.current && fitAddon.current) {
          const dimensions = fitAddon.current.proposeDimensions();
          if (dimensions) {
            console.log('📏 Sending terminal dimensions:', dimensions);
            const resizeData = JSON.stringify({ columns: dimensions.cols, rows: dimensions.rows });
            const resizeBytes = new TextEncoder().encode(resizeData);
            const payload = new Uint8Array(resizeBytes.length + 1);
            payload[0] = 0x31; // '1' as byte
            payload.set(resizeBytes, 1);
            websocket.current!.send(payload);
          }
        }
      }, 100);

    };

    websocket.current.onmessage = (event) => {
      if (terminal.current) {
        const data = event.data;
        
        if (typeof data === 'string') {
          console.log('📨 Received from proxy (string):', data.substring(0, 100));
          if (data.startsWith('0')) {
            // Terminal output data - remove the '0' prefix
            const output = data.slice(1);
            terminal.current.write(output);
          } else if (data.startsWith('1')) {
            // Control message (resize, shell startup, etc) - don't display
            const output = data.slice(1);
            console.log('📝 Control message:', output.substring(0, 100));
          } else {
            console.log('⚠️ Ignoring message type:', data.substring(0, 50));
          }
        } else {
          // Handle binary data (ArrayBuffer/Blob)
          if (data instanceof Blob) {
            // Convert Blob to text
            data.arrayBuffer().then(buffer => {
              const text = new TextDecoder().decode(buffer);
              console.log('📨 Received from proxy (blob):', text.substring(0, 100));
              
              if (text.startsWith('0')) {
                // Terminal output data - remove the '0' prefix
                const output = text.slice(1);
                terminal.current?.write(output);
              } else if (text.startsWith('1')) {
                // Control message (resize, etc) - don't display
                const output = text.slice(1);
                console.log('📝 Control message (blob):', output.substring(0, 100));
                // Don't write control messages to terminal
              } else {
                console.log('⚠️ Ignoring blob message type:', text.substring(0, 50));
              }
            }).catch(err => {
              console.error('Failed to decode blob:', err);
            });
          } else if (data instanceof ArrayBuffer || data instanceof Uint8Array) {
            const text = new TextDecoder().decode(data);
            console.log('📨 Received from proxy (binary):', text.substring(0, 100));
            if (text.startsWith('0')) {
              // Terminal output data - remove the '0' prefix
              terminal.current.write(text.slice(1));
            } else if (text.startsWith('1')) {
              // Control message (resize, etc) - don't display
              const output = text.slice(1);
              console.log('📝 Control message (binary):', output.substring(0, 100));
              // Don't write control messages to terminal
            } else {
              console.log('⚠️ Ignoring binary message type:', text.substring(0, 50));
            }
          }
        }
      }
    };

    websocket.current.onclose = (event) => {
      console.log(`🔌 TTYDTerminal: WebSocket closed with code ${event.code}: ${event.reason}`);
      setIsConnected(false);
      onConnectionChange?.(false);
      onStatusChange?.(event.code === 1000 ? 'Disconnected' : `Connection failed (${event.code})`);
      
      
      // Auto-reconnect for network issues (not user-initiated close)
      if (event.code !== 1000) {
        console.log(`🔄 TTYDTerminal: Auto-reconnecting in 3 seconds (close code: ${event.code})`);
        setTimeout(() => {
          if (websocket.current?.readyState === WebSocket.CLOSED) {
            connectWebSocket();
          }
        }, 3000);
      }
    };

    websocket.current.onerror = (error) => {
      console.error('❌ TTYDTerminal: WebSocket error for URL:', wsUrl, error);
      onStatusChange?.('Connection error');
    };

    // Clean up previous terminal event handlers
    onDataDisposable.current?.dispose();
    onResizeDisposable.current?.dispose();

    // Handle terminal input
    if (terminal.current) {
      onDataDisposable.current = terminal.current.onData((data) => {
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
      onResizeDisposable.current = terminal.current.onResize((dimensions) => {
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

  // ATTEMPT 6: Proper SGR mouse protocol for tmux compatibility (Fixed coordinates)
  useEffect(() => {
    if (!terminalRef.current || !terminal.current) return;

    let startY = 0;
    let isScrolling = false;
    let lastScrollTime = 0;

    const handleTouchStart = (e: TouchEvent) => {
      startY = e.touches[0].clientY;
      isScrolling = false;
      lastScrollTime = Date.now();
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isConnected || !websocket.current) return;

      const currentY = e.touches[0].clientY;
      const deltaY = startY - currentY;
      const currentTime = Date.now();
      
      // Only handle vertical scrolling gestures with minimum threshold
      if (Math.abs(deltaY) > 20) {
        isScrolling = true;
        e.preventDefault(); // Prevent browser scrolling
        e.stopPropagation(); // Stop event bubbling
        
        // Throttle scroll events
        if (currentTime - lastScrollTime > 100) {
          // Get actual terminal dimensions from xterm.js
          if (terminal.current && fitAddon.current) {
            const dimensions = fitAddon.current.proposeDimensions();
            if (dimensions) {
              // Use center of terminal for mouse position
              const charX = Math.floor(dimensions.cols / 2);
              const charY = Math.floor(dimensions.rows / 2);
              
              // Calculate scroll steps based on gesture size
              const scrollSteps = Math.min(Math.ceil(Math.abs(deltaY) / 40), 5);
              
              for (let i = 0; i < scrollSteps; i++) {
                // Fixed scroll direction: swipe down = scroll up (show earlier content)
                if (deltaY < 0) {
                  // Swiping down = scroll up (wheel up) = show earlier content
                  // SGR format: \x1b[<64;x;yM (wheel up)
                  const sgrWheelUp = `\x1b[<64;${charX};${charY}M`;
                  const wheelUpBytes = new TextEncoder().encode(sgrWheelUp);
                  const payload = new Uint8Array(wheelUpBytes.length + 1);
                  payload[0] = 0x30;
                  payload.set(wheelUpBytes, 1);
                  websocket.current.send(payload);
                } else {
                  // Swiping up = scroll down (wheel down) = show later content  
                  // SGR format: \x1b[<65;x;yM (wheel down)
                  const sgrWheelDown = `\x1b[<65;${charX};${charY}M`;
                  const wheelDownBytes = new TextEncoder().encode(sgrWheelDown);
                  const payload = new Uint8Array(wheelDownBytes.length + 1);
                  payload[0] = 0x30;
                  payload.set(wheelDownBytes, 1);
                  websocket.current.send(payload);
                }
              }
            }
          }
          
          lastScrollTime = currentTime;
          startY = currentY;
        }
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (isScrolling) {
        e.preventDefault();
        e.stopPropagation();
      }
      isScrolling = false;
    };

    const terminalElement = terminalRef.current;
    
    terminalElement.addEventListener('touchstart', handleTouchStart, { passive: false });
    terminalElement.addEventListener('touchmove', handleTouchMove, { passive: false });
    terminalElement.addEventListener('touchend', handleTouchEnd, { passive: false });

    return () => {
      if (terminalElement) {
        terminalElement.removeEventListener('touchstart', handleTouchStart);
        terminalElement.removeEventListener('touchmove', handleTouchMove);
        terminalElement.removeEventListener('touchend', handleTouchEnd);
      }
    };
  }, [isConnected]);

  // For desktop, let's just disable custom wheel handling and let tmux mouse mode handle it
  useEffect(() => {
    if (!terminalRef.current || !terminal.current) return;

    const handleWheel = () => {
      // Let the default tmux mouse handling take care of desktop scrolling
      // Don't preventDefault here - let it pass through to tmux
      return;
    };

    const terminalElement = terminalRef.current;
    terminalElement.addEventListener('wheel', handleWheel, { passive: true });

    return () => {
      if (terminalElement) {
        terminalElement.removeEventListener('wheel', handleWheel);
      }
    };
  }, [isConnected]);

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
      disableStdin: false,
      convertEol: true,
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
      console.log('🧹 TTYDTerminal: Cleaning up WebSocket connection');
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('windowContentResize', handleWindowContentResize);
      if (websocket.current?.readyState === WebSocket.OPEN) {
        websocket.current.close(1000, 'Component unmounting');
      }
      onDataDisposable.current?.dispose();
      onResizeDisposable.current?.dispose();
      terminal.current?.dispose();
    };
  }, [wsUrl]); // Only reconnect when URL actually changes

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
        position: 'relative',
        touchAction: 'none' // Prevent default touch behaviors
      }}
    />
  );
});

TTYDTerminal.displayName = 'TTYDTerminal';

export default TTYDTerminal;