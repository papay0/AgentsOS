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
  /** Called when terminal is clicked/focused - for window management */
  onFocus?: () => void;
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
  onFocus,
  className
}, ref) => {
  const terminalRef = useRef<HTMLDivElement>(null);
  const terminal = useRef<Terminal | null>(null);
  const fitAddon = useRef<ITerminalAddon & { fit: () => void; proposeDimensions: () => { cols: number; rows: number } | undefined } | null>(null);
  const websocket = useRef<WebSocket | null>(null);
  const onDataDisposable = useRef<{ dispose: () => void } | null>(null);
  const onResizeDisposable = useRef<{ dispose: () => void } | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const resizeDebounceTimer = useRef<NodeJS.Timeout | null>(null);
  const lastResizeTime = useRef<number>(0);
  const isResizing = useRef<boolean>(false);
  const lastDimensions = useRef<{ cols: number; rows: number } | null>(null);
  
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
      
      // Send initial resize after connection using unified system
      setTimeout(() => triggerTerminalResize('Initial Connection', true), 150);
      
      // Do a follow-up resize to catch any lingering issues
      setTimeout(() => triggerTerminalResize('Connection Stabilization', true), 500);

    };

    let firstDataReceived = false;
    websocket.current.onmessage = (event) => {
      if (terminal.current) {
        const data = event.data;
        
        if (typeof data === 'string') {
          console.log('📨 Received from proxy (string):', data.substring(0, 100));
          if (data.startsWith('0')) {
            // Terminal output data - remove the '0' prefix
            const output = data.slice(1);
            terminal.current.write(output);
            
            // After first data, trigger resize to fix any display issues
            if (!firstDataReceived) {
              firstDataReceived = true;
              setTimeout(() => triggerTerminalResize('First Data Received', true), 100);
            }
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
      } else {
        console.log(`🚫 TTYDTerminal: Normal close (code 1000) - no auto-reconnect`);
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

      // Handle xterm.js internal resize events (when terminal dimensions change)
      onResizeDisposable.current = terminal.current.onResize((dimensions) => {
        // Only send if dimensions actually changed
        const dimensionsChanged = !lastDimensions.current || 
          lastDimensions.current.cols !== dimensions.cols || 
          lastDimensions.current.rows !== dimensions.rows;
        
        if (dimensionsChanged && websocket.current?.readyState === WebSocket.OPEN) {
          const resizeData = JSON.stringify({ columns: dimensions.cols, rows: dimensions.rows });
          const resizeBytes = new TextEncoder().encode(resizeData);
          const payload = new Uint8Array(resizeBytes.length + 1);
          payload[0] = 0x31; // '1' as byte
          payload.set(resizeBytes, 1);
          websocket.current.send(payload);
          console.log('📏 XTerm resize sent:', dimensions);
          lastDimensions.current = { cols: dimensions.cols, rows: dimensions.rows };
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
        // Don't stopPropagation() - let window focus still work
        
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
        // Don't stopPropagation() - let window focus still work
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
    
    // Initial fit after DOM is ready
    setTimeout(fitTerminal, 100);

    // Connect to WebSocket
    connectWebSocket();

    // UNIFIED RESIZE SYSTEM - handles ALL resize scenarios
    const triggerTerminalResize = (reason: string, immediate = false) => {
      if (!terminal.current || !fitAddon.current || !websocket.current || websocket.current.readyState !== WebSocket.OPEN) {
        return;
      }

      const now = Date.now();
      
      const performResize = () => {
        if (!terminal.current || !fitAddon.current || !websocket.current) return;
        
        // FORCE dimension recalculation by triggering DOM measurement
        // This ensures we get the actual current container dimensions
        const container = terminalRef.current;
        if (container) {
          // Force a reflow to get accurate dimensions
          const actualHeight = container.offsetHeight;
          const actualWidth = container.offsetWidth;
          console.log(`📐 Container actual size: ${actualWidth}x${actualHeight}px`);
        }
        
        // Clear xterm's internal size cache by resetting the terminal size
        // This forces it to recalculate based on current container dimensions
        if (terminal.current.element && terminal.current.element.parentElement) {
          terminal.current.element.style.width = '100%';
          terminal.current.element.style.height = '100%';
        }
        
        // Now fit and get fresh dimensions
        fitAddon.current.fit();
        const dimensions = fitAddon.current.proposeDimensions();
        if (dimensions) {
          // ONLY send resize if dimensions actually changed
          const dimensionsChanged = !lastDimensions.current || 
            lastDimensions.current.cols !== dimensions.cols || 
            lastDimensions.current.rows !== dimensions.rows;
          
          if (dimensionsChanged) {
            console.log(`🎯 ${reason}${immediate ? '' : ' (debounced)'} - sending resize:`, dimensions);
            const resizeData = JSON.stringify({ columns: dimensions.cols, rows: dimensions.rows });
            const resizeBytes = new TextEncoder().encode(resizeData);
            const payload = new Uint8Array(resizeBytes.length + 1);
            payload[0] = 0x31; // '1' as byte (resize command)
            payload.set(resizeBytes, 1);
            websocket.current.send(payload);
            
            terminal.current.refresh(0, terminal.current.rows - 1);
            lastResizeTime.current = now;
            lastDimensions.current = { cols: dimensions.cols, rows: dimensions.rows };
          } else {
            console.log(`⏭️ Skipping resize - dimensions unchanged: ${dimensions.cols}x${dimensions.rows}`);
          }
        }
      };
      
      // For immediate resizes (focus, snap), skip debouncing
      if (immediate) {
        if (resizeDebounceTimer.current) {
          clearTimeout(resizeDebounceTimer.current);
        }
        performResize();
        return;
      }

      // For debounced resizes (window resize, drag), use 150ms debounce
      if (resizeDebounceTimer.current) {
        clearTimeout(resizeDebounceTimer.current);
      }
      
      isResizing.current = true;
      resizeDebounceTimer.current = setTimeout(() => {
        performResize();
        isResizing.current = false;
      }, 150);
    };

    // ALL RESIZE EVENT HANDLERS - using unified system
    const handleResize = () => {
      console.log('🔴 RESIZE EVENT FIRED');
      // Just call the same thing that focus does - immediate resize
      triggerTerminalResize('Browser/Window Resize', true);
    };
    const handleWindowContentResize = () => {
      console.log('🔵 WINDOW CONTENT RESIZE EVENT FIRED');
      triggerTerminalResize('AgentsOS Window Content Resize', true);
    };  
    const handleFocus = () => {
      console.log('🟢 FOCUS EVENT FIRED');
      triggerTerminalResize('Terminal Focus/Click', true);
    }
    const handleWindowMove = () => triggerTerminalResize('Window Move/Drag', true); // Immediate
    const handleWindowSnap = () => triggerTerminalResize('Window Snap/Dock', true); // Immediate
    
    // COMPREHENSIVE RESIZE EVENT LISTENERS
    // Browser/System events
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', () => triggerTerminalResize('Orientation Change', true));
    
    // AgentsOS window management events  
    window.addEventListener('windowContentResize', handleWindowContentResize);
    window.addEventListener('windowMoved', handleWindowMove);
    window.addEventListener('windowPositionChanged', handleWindowMove);
    window.addEventListener('windowSnapped', handleWindowSnap);
    window.addEventListener('windowDocked', handleWindowSnap);
    window.addEventListener('windowMaximized', () => triggerTerminalResize('Window Maximized', true));
    window.addEventListener('windowRestored', () => triggerTerminalResize('Window Restored', true));
    window.addEventListener('windowStateChanged', () => triggerTerminalResize('Window State Change', true));
    
    // Developer/Debug events
    window.addEventListener('devtoolschange', () => triggerTerminalResize('DevTools Toggle', true));
    
    // Visual Viewport (mobile keyboard, zoom changes)
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', () => triggerTerminalResize('Viewport Resize', true));
    }
    
    // Listen for terminal container focus - use capture to get clicks before xterm.js
    if (terminalRef.current) {
      terminalRef.current.addEventListener('focus', handleFocus, true);
      terminalRef.current.addEventListener('click', () => {
        onFocus?.(); // Bring window to front FIRST
        handleFocus(); // Then handle terminal focus and resize
      }, true); // Capture phase - runs before xterm.js handlers
    }

    return () => {
      console.log('🧹 TTYDTerminal: useEffect cleanup for URL:', wsUrl);
      
      // Clear any pending resize timers
      if (resizeDebounceTimer.current) {
        clearTimeout(resizeDebounceTimer.current);
      }
      
      // COMPREHENSIVE EVENT LISTENER CLEANUP
      // Browser/System events
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', () => triggerTerminalResize('Orientation Change', true));
      
      // AgentsOS window management events
      window.removeEventListener('windowContentResize', handleWindowContentResize);
      window.removeEventListener('windowMoved', handleWindowMove);
      window.removeEventListener('windowPositionChanged', handleWindowMove);
      window.removeEventListener('windowSnapped', handleWindowSnap);
      window.removeEventListener('windowDocked', handleWindowSnap);
      window.removeEventListener('windowMaximized', () => triggerTerminalResize('Window Maximized', true));
      window.removeEventListener('windowRestored', () => triggerTerminalResize('Window Restored', true));
      window.removeEventListener('windowStateChanged', () => triggerTerminalResize('Window State Change', true));
      
      // Developer/Debug events
      window.removeEventListener('devtoolschange', () => triggerTerminalResize('DevTools Toggle', true));
      
      // Visual Viewport cleanup
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', () => triggerTerminalResize('Viewport Resize', true));
      }
      
      // Remove focus listeners from terminal container
      if (terminalRef.current) {
        terminalRef.current.removeEventListener('focus', handleFocus, true);
        terminalRef.current.removeEventListener('click', () => {
          onFocus?.();
          handleFocus();
        }, true);
      }
      
      // Clean up terminal event handlers when URL changes
      onDataDisposable.current?.dispose();
      onResizeDisposable.current?.dispose();
    };
  }, [wsUrl, connectWebSocket, resolvedTheme]); // Only reconnect when URL actually changes

  // Cleanup on component unmount only  
  useEffect(() => {
    const portMatch = wsUrl.match(/port=(\d+)/);
    const port = portMatch ? portMatch[1] : 'unknown';
    console.log(`🔧 TTYDTerminal: Component mounted for port ${port} (URL: ${wsUrl})`);
    
    return () => {
      console.log(`🧹 TTYDTerminal: Component unmounting for port ${port} (URL: ${wsUrl})`);
      
      // SIMPLE: Don't close WebSocket on unmount - let proxy handle lifecycle
      // The proxy server will handle connection reuse when components remount
      // This prevents connection drops when switching repos
      
      // Only dispose the terminal instance, not the WebSocket
      terminal.current?.dispose();
    };
  }, []); // Empty deps = only runs on unmount

  // Update terminal theme when resolved theme changes
  useEffect(() => {
    if (terminal.current) {
      terminal.current.options.theme = terminalThemes[resolvedTheme];
    }
  }, [resolvedTheme]);

  // Handle terminal click/tap for mobile keyboard focus
  const handleTerminalInteraction = useCallback((e: React.MouseEvent) => {
    // ALWAYS call onFocus immediately to bring window to front
    // This ensures window focus happens on first click, not just second click
    onFocus?.();
    
    // Also ensure terminal gets focus
    if (terminal.current) {
      terminal.current.focus();
    }
    
    // Only trigger mobile logic on mobile devices
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