/**
 * PostMessage-based ttyd Terminal Command Injector
 * 
 * Based on https://javascriptbit.com/transfer-data-between-parent-window-and-iframe-postmessage-api/
 * This injects a message listener into the iframe that can access the terminal's WebSocket
 */

export interface TerminalCommand {
  type: 'text' | 'key' | 'paste';
  command: string;
}

export class PostMessageTTYDInjector {
  private iframe: HTMLIFrameElement;
  private ready = false;
  private messageListener?: (event: MessageEvent) => void;

  constructor(iframe: HTMLIFrameElement) {
    this.iframe = iframe;
    this.setupParentListener();
  }

  private setupParentListener() {
    // Listen for responses from the iframe
    this.messageListener = (event: MessageEvent) => {
      // Only accept messages from our iframe
      if (event.source !== this.iframe.contentWindow) return;
      
      if (event.data.type === 'ttyd-injector-ready') {
        console.log('✅ PostMessage injector ready in iframe');
        this.ready = true;
      } else if (event.data.type === 'ttyd-command-result') {
        console.log('📡 Command result from iframe:', event.data);
      } else if (event.data.type === 'ttyd-error') {
        console.error('❌ Error from iframe:', event.data.error);
      }
    };
    
    window.addEventListener('message', this.messageListener);
  }

  /**
   * Initialize by injecting the message handler into the iframe
   */
  async initialize(): Promise<boolean> {
    console.log('📨 Initializing PostMessage ttyd injector...');
    
    return new Promise((resolve) => {
      let attempts = 0;
      const maxAttempts = 10;
      
      const injectScript = () => {
        attempts++;
        console.log(`📝 Injection attempt ${attempts}/${maxAttempts}`);
        
        try {
          // The script to inject into the iframe
          const script = `
            (function() {
              if (window.ttydPostMessageHandler) return;
              
              console.log('🚀 Installing ttyd PostMessage handler...');
              
              let ttydWebSocket = null;
              let isCapturing = false;
              
              // Function to capture the ttyd WebSocket connection
              function captureWebSocket() {
                if (isCapturing) return;
                isCapturing = true;
                
                const originalWebSocket = window.WebSocket;
                window.WebSocket = function(url, protocols) {
                  const ws = new originalWebSocket(url, protocols);
                  
                  // If this looks like ttyd's WebSocket, capture it
                  if (url.includes('/ws') && url.includes('9999')) {
                    console.log('🎯 Captured ttyd WebSocket:', url);
                    ttydWebSocket = ws;
                    
                    ws.addEventListener('open', () => {
                      console.log('🔗 ttyd WebSocket opened');
                      parent.postMessage({
                        type: 'ttyd-injector-ready'
                      }, '*');
                    });
                    
                    ws.addEventListener('message', (event) => {
                      console.log('📥 ttyd received:', event.data);
                    });
                    
                    ws.addEventListener('close', () => {
                      console.log('🔌 ttyd WebSocket closed');
                      ttydWebSocket = null;
                    });
                  }
                  
                  return ws;
                };
                
                // Copy prototype
                window.WebSocket.prototype = originalWebSocket.prototype;
              }
              
              // Start capturing WebSocket connections
              captureWebSocket();
              
              // Listen for commands from parent
              window.addEventListener('message', function(event) {
                if (event.data.type === 'send-terminal-command') {
                  console.log('📨 Received command from parent:', event.data);
                  
                  const { commandType, command } = event.data;
                  
                  if (!ttydWebSocket || ttydWebSocket.readyState !== 1) {
                    console.error('❌ ttyd WebSocket not available');
                    parent.postMessage({
                      type: 'ttyd-error',
                      error: 'WebSocket not connected'
                    }, '*');
                    return;
                  }
                  
                  try {
                    let message = '';
                    
                    switch (commandType) {
                      case 'text':
                        message = '0' + command + '\\r';
                        break;
                      case 'key':
                        if (command === 'Ctrl+C') {
                          message = '0\\x03';
                        } else if (command === 'Ctrl+L') {
                          message = '0\\x0c';
                        } else if (command === 'Ctrl+D') {
                          message = '0\\x04';
                        } else if (command === 'Enter') {
                          message = '0\\r';
                        } else if (command === 'ArrowUp') {
                          message = '0\\x1b[A';
                        } else if (command === 'ArrowDown') {
                          message = '0\\x1b[B';
                        } else if (command === 'ArrowLeft') {
                          message = '0\\x1b[D';
                        } else if (command === 'ArrowRight') {
                          message = '0\\x1b[C';
                        } else {
                          message = '0' + command;
                        }
                        break;
                      case 'paste':
                        message = '0' + command;
                        break;
                    }
                    
                    console.log('📤 Sending to ttyd:', { message, command, commandType });
                    ttydWebSocket.send(message);
                    
                    parent.postMessage({
                      type: 'ttyd-command-result',
                      success: true,
                      message: 'Command sent successfully'
                    }, '*');
                    
                  } catch (error) {
                    console.error('❌ Failed to send command:', error);
                    parent.postMessage({
                      type: 'ttyd-error',
                      error: error.message
                    }, '*');
                  }
                }
              });
              
              window.ttydPostMessageHandler = true;
              console.log('✅ ttyd PostMessage handler installed');
              
              // If WebSocket is already available, notify parent
              setTimeout(() => {
                if (ttydWebSocket && ttydWebSocket.readyState === 1) {
                  parent.postMessage({
                    type: 'ttyd-injector-ready'
                  }, '*');
                }
              }, 1000);
            })();
          `;
          
          // Check iframe accessibility first
          console.log('🔍 Iframe accessibility check:');
          console.log('- contentWindow:', !!this.iframe.contentWindow);
          console.log('- contentDocument:', !!this.iframe.contentDocument);
          console.log('- src:', this.iframe.src);
          console.log('- origin:', this.iframe.src ? new URL(this.iframe.src).origin : 'unknown');
          
          // Try multiple injection methods
          if (this.iframe.contentWindow) {
            // Method 1: Direct script execution
            try {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              (this.iframe.contentWindow as any).eval(script);
              console.log('✅ Script injected via eval');
            } catch (evalError) {
              console.log('⚠️ eval failed:', evalError);
              
              // Method 2: PostMessage script injection
              this.iframe.contentWindow.postMessage({
                type: 'inject-script',
                script: script
              }, '*');
              console.log('📤 Sent inject-script message');
            }
          }
          
          // Method 3: DOM script injection
          if (this.iframe.contentDocument) {
            try {
              const scriptEl = this.iframe.contentDocument.createElement('script');
              scriptEl.textContent = script;
              const target = this.iframe.contentDocument.head || this.iframe.contentDocument.body;
              if (target) {
                target.appendChild(scriptEl);
                console.log('✅ Script injected via DOM');
              } else {
                console.log('❌ No DOM target found');
              }
            } catch (domError) {
              console.log('❌ DOM injection failed:', domError);
            }
          } else {
            console.log('❌ No contentDocument access (likely CORS)');
          }
          
          // Method 4: Try URL-based injection
          try {
            const blob = new Blob([script], { type: 'application/javascript' });
            const url = URL.createObjectURL(blob);
            
            if (this.iframe.contentDocument) {
              const scriptEl = this.iframe.contentDocument.createElement('script');
              scriptEl.src = url;
              const target = this.iframe.contentDocument.head || this.iframe.contentDocument.body;
              if (target) {
                target.appendChild(scriptEl);
                console.log('✅ Script injected via blob URL');
                // Clean up URL after a delay
                setTimeout(() => URL.revokeObjectURL(url), 5000);
              }
            }
          } catch (blobError) {
            console.log('❌ Blob injection failed:', blobError);
          }
          
        } catch (error) {
          console.error('💥 Injection error:', error);
        }
        
        // Check if ready after delay
        setTimeout(() => {
          if (this.ready) {
            resolve(true);
          } else if (attempts < maxAttempts) {
            setTimeout(injectScript, 1000);
          } else {
            console.error('❌ Injection failed after', maxAttempts, 'attempts');
            resolve(false);
          }
        }, 500);
      };
      
      // Wait for iframe to be ready
      if (this.iframe.contentDocument?.readyState === 'complete') {
        injectScript();
      } else {
        this.iframe.addEventListener('load', injectScript, { once: true });
        // Also try after a delay in case load event already fired
        setTimeout(injectScript, 500);
      }
    });
  }

  /**
   * Send command via postMessage to the iframe
   */
  async sendCommand(type: 'text' | 'key' | 'paste', command: string): Promise<boolean> {
    if (!this.ready) {
      console.error('❌ Injector not ready');
      return false;
    }

    if (!this.iframe.contentWindow) {
      console.error('❌ No iframe contentWindow');
      return false;
    }

    try {
      console.log('📨 Sending command via postMessage:', { type, command });
      
      this.iframe.contentWindow.postMessage({
        type: 'send-terminal-command',
        commandType: type,
        command: command
      }, '*');
      
      return true;
    } catch (error) {
      console.error('❌ Failed to send postMessage:', error);
      return false;
    }
  }

  /**
   * Send text command
   */
  async sendText(text: string): Promise<boolean> {
    return this.sendCommand('text', text);
  }

  /**
   * Send key command
   */
  async sendKey(key: string): Promise<boolean> {
    return this.sendCommand('key', key);
  }

  /**
   * Paste text (without Enter)
   */
  async paste(text: string): Promise<boolean> {
    return this.sendCommand('paste', text);
  }

  /**
   * Common commands
   */
  async interrupt(): Promise<boolean> {
    return this.sendCommand('key', 'Ctrl+C');
  }

  async clear(): Promise<boolean> {
    return this.sendCommand('key', 'Ctrl+L');
  }

  async eof(): Promise<boolean> {
    return this.sendCommand('key', 'Ctrl+D');
  }

  async enter(): Promise<boolean> {
    return this.sendCommand('key', 'Enter');
  }

  isReady(): boolean {
    return this.ready;
  }

  disconnect(): void {
    if (this.messageListener) {
      window.removeEventListener('message', this.messageListener);
    }
    this.ready = false;
  }
}