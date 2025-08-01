/**
 * Direct ttyd Terminal Command Injector
 * 
 * This approach tries to connect directly to ttyd's WebSocket from the parent window
 * bypassing the need to inject scripts into the iframe
 */

export interface TerminalCommand {
  type: 'text' | 'key' | 'paste';
  command: string;
}

export class DirectTTYDInjector {
  private websocket: WebSocket | null = null;
  private ready = false;
  private terminalUrl: string;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 3;

  constructor(terminalUrl: string) {
    // Convert HTTP URL to WebSocket URL
    this.terminalUrl = this.convertToWebSocketUrl(terminalUrl);
  }

  private convertToWebSocketUrl(httpUrl: string): string {
    try {
      const url = new URL(httpUrl);
      // ttyd typically serves WebSocket on /ws endpoint
      const wsProtocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
      return `${wsProtocol}//${url.host}/ws`;
    } catch (error) {
      console.error('❌ Invalid terminal URL:', error);
      return '';
    }
  }

  /**
   * Initialize direct WebSocket connection to ttyd
   */
  async initialize(): Promise<boolean> {
    console.log('🔗 Initializing direct ttyd WebSocket connection...');
    console.log('📍 WebSocket URL:', this.terminalUrl);
    
    if (!this.terminalUrl) {
      console.error('❌ Invalid WebSocket URL');
      return false;
    }

    return new Promise((resolve) => {
      try {
        this.websocket = new WebSocket(this.terminalUrl);
        
        this.websocket.onopen = () => {
          console.log('✅ Direct ttyd WebSocket connected');
          this.ready = true;
          this.reconnectAttempts = 0;
          
          // Send initial authentication/setup if needed
          // ttyd might expect certain messages on connection
          resolve(true);
        };

        this.websocket.onmessage = (event) => {
          console.log('📥 ttyd message:', event.data);
        };

        this.websocket.onclose = (event) => {
          console.log(`🔌 ttyd WebSocket closed: ${event.code} - ${event.reason}`);
          this.ready = false;
          
          // Try to reconnect if it wasn't a manual close
          if (event.code !== 1000 && this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            console.log(`🔄 Reconnecting... attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);
            setTimeout(() => this.initialize(), 2000);
          }
        };

        this.websocket.onerror = (error) => {
          console.error('❌ ttyd WebSocket error:', error);
          resolve(false);
        };

        // Timeout if connection takes too long
        setTimeout(() => {
          if (!this.ready) {
            console.error('⏰ Direct WebSocket connection timeout');
            this.websocket?.close();
            resolve(false);
          }
        }, 10000);

      } catch (error) {
        console.error('❌ Failed to create WebSocket:', error);
        resolve(false);
      }
    });
  }

  /**
   * Send command via direct WebSocket connection
   */
  async sendCommand(type: 'text' | 'key' | 'paste', command: string): Promise<boolean> {
    if (!this.websocket || !this.ready || this.websocket.readyState !== WebSocket.OPEN) {
      console.error('❌ WebSocket not ready');
      return false;
    }

    try {
      let message = '';
      
      switch (type) {
        case 'text':
          message = '0' + command + '\r';
          break;
        case 'key':
          if (command === 'Ctrl+C') {
            message = '0\x03';
          } else if (command === 'Ctrl+L') {
            message = '0\x0c';
          } else if (command === 'Ctrl+D') {
            message = '0\x04';
          } else if (command === 'Enter') {
            message = '0\r';
          } else if (command === 'ArrowUp') {
            message = '0\x1b[A';
          } else if (command === 'ArrowDown') {
            message = '0\x1b[B';
          } else if (command === 'ArrowLeft') {
            message = '0\x1b[D';
          } else if (command === 'ArrowRight') {
            message = '0\x1b[C';
          } else if (command === 'Home') {
            message = '0\x1b[H';
          } else if (command === 'End') {
            message = '0\x1b[F';
          } else if (command === 'Backspace') {
            message = '0\x7f';
          } else if (command === 'Delete') {
            message = '0\x1b[3~';
          } else {
            message = '0' + command;
          }
          break;
        case 'paste':
          // Paste without Enter
          message = '0' + command;
          break;
      }
      
      console.log('📤 Sending direct to ttyd:', { message, command, type });
      this.websocket.send(message);
      
      return true;
    } catch (error) {
      console.error('❌ Failed to send command:', error);
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
    return this.ready && this.websocket?.readyState === WebSocket.OPEN;
  }

  disconnect(): void {
    if (this.websocket) {
      this.websocket.close(1000, 'Manual disconnect');
      this.websocket = null;
    }
    this.ready = false;
  }
}