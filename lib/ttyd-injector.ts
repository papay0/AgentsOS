/**
 * ttyd Terminal Command Injector
 * 
 * This utility injects commands into a ttyd terminal iframe by:
 * 1. Using postMessage to communicate with the iframe
 * 2. Injecting JavaScript into the iframe that accesses ttyd's WebSocket
 * 3. Sending terminal escape sequences directly to the WebSocket
 */

export interface TerminalCommand {
  type: 'text' | 'key' | 'paste';
  command: string;
}

export class TTYDInjector {
  private iframe: HTMLIFrameElement;
  private injected = false;

  constructor(iframe: HTMLIFrameElement) {
    this.iframe = iframe;
    this.setupMessageListener();
  }

  private setupMessageListener() {
    window.addEventListener('message', (event) => {
      // Only listen to messages from our terminal iframe
      if (event.source !== this.iframe.contentWindow) return;
      
      if (event.data.type === 'ttyd-injector-ready') {
        console.log('🟢 ttyd injector ready in iframe');
        this.injected = true;
      } else if (event.data.type === 'ttyd-injector-result') {
        console.log('📤 Command result:', event.data);
      } else if (event.data.type === 'ttyd-injector-error') {
        console.error('❌ Injector error:', event.data.error);
      }
    });
  }

  /**
   * Inject the command sender script into the iframe
   */
  async injectScript(): Promise<boolean> {
    console.log('🚀 Starting script injection...');
    return new Promise((resolve) => {
      const script = `
        (function() {
          if (window.ttydInjectorInstalled) return;
          window.ttydInjectorInstalled = true;
          
          console.log('🚀 Installing ttyd command injector...');
          
          // Find ttyd's WebSocket connection
          let ttydWebSocket = null;
          
          // Override WebSocket constructor to capture ttyd's connection
          const OriginalWebSocket = window.WebSocket;
          window.WebSocket = function(url, protocols) {
            const ws = new OriginalWebSocket(url, protocols);
            
            // If this looks like ttyd's WebSocket, capture it
            if (url.includes('/ws') || url.includes('websocket')) {
              console.log('🔗 Captured WebSocket connection:', url);
              ttydWebSocket = ws;
              
              // Log WebSocket messages for debugging
              const originalSend = ws.send.bind(ws);
              ws.send = function(data) {
                console.log('📤 WebSocket send:', data);
                return originalSend(data);
              };
              
              ws.addEventListener('message', (event) => {
                console.log('📥 WebSocket receive:', event.data);
              });
            }
            
            return ws;
          };
          
          // Copy static properties
          Object.setPrototypeOf(window.WebSocket, OriginalWebSocket);
          Object.defineProperty(window.WebSocket, 'prototype', {
            value: OriginalWebSocket.prototype,
            writable: false
          });
          
          // Function to send commands to terminal
          window.sendTerminalCommand = function(type, command) {
            if (!ttydWebSocket || ttydWebSocket.readyState !== 1) {
              const error = 'WebSocket not connected';
              console.error('❌', error);
              parent.postMessage({
                type: 'ttyd-injector-error',
                error: error
              }, '*');
              return false;
            }
            
            let message = '';
            
            switch (type) {
              case 'text':
                message = '0' + command;
                break;
                
              case 'key':
                const keyMappings = {
                  'Enter': '\\r',
                  'Backspace': '\\x7f',
                  'Tab': '\\t',
                  'Escape': '\\x1b',
                  'ArrowUp': '\\x1b[A',
                  'ArrowDown': '\\x1b[B',
                  'ArrowRight': '\\x1b[C',
                  'ArrowLeft': '\\x1b[D',
                  'Home': '\\x1b[H',
                  'End': '\\x1b[F',
                  'Delete': '\\x1b[3~',
                  'Ctrl+C': '\\x03',
                  'Ctrl+D': '\\x04',
                  'Ctrl+L': '\\x0c',
                  'Ctrl+Z': '\\x1a',
                };
                const keyCode = keyMappings[command] || command;
                message = '0' + keyCode.replace(/\\\\x/g, '\\x').replace(/\\\\r/g, '\\r').replace(/\\\\t/g, '\\t').replace(/\\\\n/g, '\\n');
                break;
                
              case 'paste':
                message = '0' + command;
                break;
                
              default:
                const error = 'Unknown command type: ' + type;
                console.error('❌', error);
                parent.postMessage({
                  type: 'ttyd-injector-error',
                  error: error
                }, '*');
                return false;
            }
            
            try {
              console.log('📤 Sending to ttyd:', { type, command, message });
              ttydWebSocket.send(message);
              
              parent.postMessage({
                type: 'ttyd-injector-result',
                success: true,
                message: 'Command sent successfully'
              }, '*');
              
              return true;
            } catch (error) {
              console.error('❌ Failed to send command:', error);
              parent.postMessage({
                type: 'ttyd-injector-error',
                error: error.message
              }, '*');
              return false;
            }
          };
          
          // Listen for commands from parent
          window.addEventListener('message', function(event) {
            if (event.data.type === 'send-terminal-command') {
              const { commandType, command } = event.data;
              window.sendTerminalCommand(commandType, command);
            }
          });
          
          // Notify parent that injector is ready
          parent.postMessage({
            type: 'ttyd-injector-ready'
          }, '*');
          
          console.log('✅ ttyd command injector installed');
        })();
      `;

      // Multiple injection strategies
      let attempts = 0;
      const maxAttempts = 10;
      
      const injectWhenReady = () => {
        attempts++;
        console.log(`📝 Injection attempt ${attempts}/${maxAttempts}`);
        
        try {
          // Strategy 1: Direct script execution (most reliable)
          if (this.iframe.contentDocument && this.iframe.contentWindow) {
            console.log('🎯 Trying direct script injection...');
            const scriptEl = this.iframe.contentDocument.createElement('script');
            scriptEl.textContent = script;
            scriptEl.type = 'text/javascript';
            
            // Try to append to head first, then body as fallback
            const target = this.iframe.contentDocument.head || this.iframe.contentDocument.body;
            if (target) {
              target.appendChild(scriptEl);
              console.log('✅ Script element added to', target.tagName);
            }
            
            // Also try eval as a fallback
            try {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              (this.iframe.contentWindow as any).eval(script);
              console.log('✅ Script evaluated via eval()');
            } catch (evalError) {
              console.log('⚠️ eval() failed:', evalError);
            }
          }
          
          // Strategy 2: PostMessage (for cross-origin scenarios)
          if (this.iframe.contentWindow) {
            console.log('📮 Trying postMessage injection...');
            this.iframe.contentWindow.postMessage({
              type: 'inject-script',
              script: script
            }, '*');
          }
          
          // Check if injection worked after a delay
          setTimeout(() => {
            if (this.injected) {
              console.log('🎉 Injection successful!');
              resolve(true);
            } else if (attempts < maxAttempts) {
              console.log('🔄 Retrying injection...');
              setTimeout(injectWhenReady, 1000);
            } else {
              console.error('❌ Injection failed after', maxAttempts, 'attempts');
              resolve(false);
            }
          }, 500);
          
        } catch (error) {
          console.error('💥 Injection error:', error);
          if (attempts < maxAttempts) {
            setTimeout(injectWhenReady, 1000);
          } else {
            resolve(false);
          }
        }
      };

      // Start injection when iframe is ready
      const startInjection = () => {
        const readyState = this.iframe.contentDocument?.readyState;
        console.log('📄 Iframe ready state:', readyState);
        
        if (readyState === 'complete' || readyState === 'interactive') {
          // Small delay to ensure everything is loaded
          setTimeout(injectWhenReady, 100);
        } else {
          // Wait for load event
          this.iframe.addEventListener('load', () => {
            console.log('🔄 Iframe loaded, starting injection...');
            setTimeout(injectWhenReady, 100);
          }, { once: true });
        }
      };

      startInjection();
    });
  }

  /**
   * Send a command to the terminal
   */
  sendCommand(type: 'text' | 'key' | 'paste', command: string): Promise<boolean> {
    return new Promise((resolve) => {
      if (!this.injected) {
        console.error('❌ Injector not ready. Call injectScript() first.');
        resolve(false);
        return;
      }

      const messageHandler = (event: MessageEvent) => {
        if (event.source !== this.iframe.contentWindow) return;
        
        if (event.data.type === 'ttyd-injector-result') {
          window.removeEventListener('message', messageHandler);
          resolve(event.data.success);
        } else if (event.data.type === 'ttyd-injector-error') {
          window.removeEventListener('message', messageHandler);
          resolve(false);
        }
      };

      window.addEventListener('message', messageHandler);
      
      // Send command to iframe
      this.iframe.contentWindow?.postMessage({
        type: 'send-terminal-command',
        commandType: type,
        command: command
      }, '*');
      
      // Timeout after 5 seconds
      setTimeout(() => {
        window.removeEventListener('message', messageHandler);
        resolve(false);
      }, 5000);
    });
  }

  /**
   * Send text to terminal
   */
  async sendText(text: string): Promise<boolean> {
    return this.sendCommand('text', text);
  }

  /**
   * Send a key press to terminal
   */
  async sendKey(key: string): Promise<boolean> {
    return this.sendCommand('key', key);
  }

  /**
   * Paste text to terminal
   */
  async paste(text: string): Promise<boolean> {
    return this.sendCommand('paste', text);
  }

  /**
   * Common terminal commands
   */
  async interrupt(): Promise<boolean> {
    return this.sendKey('Ctrl+C');
  }

  async clear(): Promise<boolean> {
    return this.sendKey('Ctrl+L');
  }

  async eof(): Promise<boolean> {
    return this.sendKey('Ctrl+D');
  }

  async enter(): Promise<boolean> {
    return this.sendKey('Enter');
  }
}