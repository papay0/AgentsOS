'use client';

export class TTYDClient {
  private ws: WebSocket | null = null;
  private url: string;
  private onMessageCallback?: (data: string) => void;

  constructor(terminalUrl: string) {
    // Convert HTTP URL to WebSocket URL
    // From: https://9999-xxx.proxy.daytona.work/
    // To: wss://9999-xxx.proxy.daytona.work/ws
    this.url = terminalUrl
      .replace('http://', 'ws://')
      .replace('https://', 'wss://')
      .replace(/\/$/, '') + '/ws';
  }

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        console.log('Connecting to ttyd WebSocket:', this.url);
        // Connect with 'tty' subprotocol
        this.ws = new WebSocket(this.url, ['tty']);
        this.ws.binaryType = 'arraybuffer';
        
        this.ws.onopen = () => {
          console.log('TTYd WebSocket connected');
          
          // Send initial authentication and window size
          // IMPORTANT: JSON_DATA messages do NOT have an operation code prefix
          const authMessage = JSON.stringify({ 
            AuthToken: "",  // Empty string if no auth required
            columns: 80, 
            rows: 24 
          });
          console.log('Sending auth message:', authMessage);
          this.ws!.send(new TextEncoder().encode(authMessage));
          
          resolve();
        };
        
        this.ws.onerror = (error) => {
          console.error('TTYd WebSocket error:', error);
          reject(error);
        };
        
        this.ws.onmessage = (event) => {
          if (event.data instanceof ArrayBuffer) {
            const data = new Uint8Array(event.data);
            if (data.length === 0) return;
            
            const opCode = data[0];
            const payload = data.slice(1);
            
            console.log('Received message - opCode:', opCode, 'payload length:', payload.length);
            
            switch (opCode) {
              case 0x30: // '0' - OUTPUT (terminal output)
                const output = new TextDecoder().decode(payload);
                console.log('Terminal output:', JSON.stringify(output));
                this.onMessageCallback?.(output);
                break;
                
              case 0x31: // '1' - SET_WINDOW_TITLE
                const title = new TextDecoder().decode(payload);
                console.log('Window title:', title);
                break;
                
              case 0x32: // '2' - SET_PREFERENCES
                const prefs = new TextDecoder().decode(payload);
                console.log('Preferences:', prefs);
                break;
                
              default:
                console.warn('Unknown message type:', opCode);
                break;
            }
          }
        };
        
        this.ws.onclose = (event) => {
          console.log('TTYd WebSocket disconnected:', event.code, event.reason);
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  sendInput(text: string) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.error('WebSocket not connected');
      return;
    }

    // ttyd protocol: INPUT = '0' (0x30) + data as binary
    const inputBytes = new TextEncoder().encode(text);
    const payload = new Uint8Array(inputBytes.length + 1);
    payload[0] = 0x30; // '0' as byte (INPUT command) 
    payload.set(inputBytes, 1);
    
    console.log('Sending input to terminal:', { 
      originalText: text, 
      payloadBytes: Array.from(payload) 
    });
    this.ws.send(payload);
  }

  resize(columns: number, rows: number) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.error('WebSocket not connected');
      return;
    }

    // ttyd protocol: RESIZE_TERMINAL = '1' (0x31) + JSON data
    const resizeData = JSON.stringify({ columns, rows });
    const resizeBytes = new TextEncoder().encode(resizeData);
    const payload = new Uint8Array(resizeBytes.length + 1);
    payload[0] = 0x31; // '1' as byte (RESIZE_TERMINAL command)
    payload.set(resizeBytes, 1);
    
    console.log('Sending resize:', { columns, rows });
    this.ws.send(payload);
  }

  pause() {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.error('WebSocket not connected');
      return;
    }
    
    // PAUSE = '2' (0x32)
    this.ws.send(new Uint8Array([0x32]));
    console.log('Sent pause command');
  }

  resume() {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.error('WebSocket not connected');
      return;
    }
    
    // RESUME = '3' (0x33)  
    this.ws.send(new Uint8Array([0x33]));
    console.log('Sent resume command');
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  sendKey(key: string, ctrl = false, _alt = false, _shift = false) {
    let sequence = '';
    
    // Handle special keys with escape sequences
    const specialKeys: { [key: string]: string } = {
      'Enter': '\r',
      'Backspace': '\x7f',
      'Tab': '\t',
      'Escape': '\x1b',
      'ArrowUp': '\x1b[A',
      'ArrowDown': '\x1b[B',
      'ArrowRight': '\x1b[C',
      'ArrowLeft': '\x1b[D',
      'Home': '\x1b[H',
      'End': '\x1b[F',
      'Delete': '\x1b[3~',
    };

    if (ctrl && key.length === 1) {
      // Ctrl+key combinations
      const charCode = key.toUpperCase().charCodeAt(0) - 64;
      sequence = String.fromCharCode(charCode);
    } else if (specialKeys[key]) {
      sequence = specialKeys[key];
    } else {
      sequence = key;
    }

    this.sendInput(sequence);
  }

  onMessage(callback: (data: string) => void) {
    this.onMessageCallback = callback;
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }
}