'use client';

/**
 * TTYd WebSocket Protocol Reference Implementation
 * 
 * This demonstrates the correct way to communicate with ttyd's WebSocket protocol.
 * Based on analysis of ttyd source code: https://github.com/tsl0922/ttyd
 */

export class TTYdProtocolExample {
  private ws: WebSocket | null = null;

  constructor(private terminalUrl: string) {}

  async connect(): Promise<void> {
    const wsUrl = this.terminalUrl
      .replace('http://', 'ws://')
      .replace('https://', 'wss://')
      .replace(/\/$/, '') + '/ws';

    console.log('🔌 Connecting to:', wsUrl);

    return new Promise((resolve, reject) => {
      // IMPORTANT: Use 'tty' subprotocol and arraybuffer binary type
      this.ws = new WebSocket(wsUrl, ['tty']);
      this.ws.binaryType = 'arraybuffer';

      this.ws.onopen = () => {
        console.log('✅ WebSocket connected');
        
        // Step 1: Send initial authentication and window size
        // CRITICAL: JSON_DATA messages do NOT have operation code prefix
        const authMessage = JSON.stringify({
          AuthToken: "",  // Empty if no auth required
          columns: 120,   // Terminal width
          rows: 30        // Terminal height
        });
        
        console.log('📤 Sending auth/init:', authMessage);
        this.ws!.send(new TextEncoder().encode(authMessage));
        
        resolve();
      };

      this.ws.onerror = (error) => {
        console.error('❌ WebSocket error:', error);
        reject(error);
      };

      this.ws.onmessage = (event) => {
        this.handleMessage(event);
      };

      this.ws.onclose = (event) => {
        console.log(`🔌 Connection closed: code=${event.code}, reason="${event.reason}"`);
      };
    });
  }

  private handleMessage(event: MessageEvent) {
    if (!(event.data instanceof ArrayBuffer)) {
      console.warn('⚠️ Received non-binary message:', event.data);
      return;
    }

    const data = new Uint8Array(event.data);
    if (data.length === 0) {
      console.warn('⚠️ Received empty message');
      return;
    }

    const opCode = data[0];
    const payload = data.slice(1);

    console.log(`📥 Received: opCode=0x${opCode.toString(16).padStart(2, '0')} (${String.fromCharCode(opCode)}) length=${payload.length}`);

    switch (opCode) {
      case 0x30: // '0' - OUTPUT (terminal output)
        const output = new TextDecoder().decode(payload);
        console.log('🖥️  Terminal output:', JSON.stringify(output.slice(0, 100) + (output.length > 100 ? '...' : '')));
        break;

      case 0x31: // '1' - SET_WINDOW_TITLE  
        const title = new TextDecoder().decode(payload);
        console.log('📋 Window title:', JSON.stringify(title));
        break;

      case 0x32: // '2' - SET_PREFERENCES
        const prefs = new TextDecoder().decode(payload);
        console.log('⚙️  Preferences:', JSON.stringify(prefs.slice(0, 200) + (prefs.length > 200 ? '...' : '')));
        break;

      default:
        console.warn(`⚠️ Unknown opCode: 0x${opCode.toString(16)} (${String.fromCharCode(opCode)})`);
        console.log('Raw payload:', Array.from(payload.slice(0, 50)).map(b => b.toString(16).padStart(2, '0')).join(' '));
    }
  }

  sendCommand(command: string) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.error('❌ WebSocket not connected');
      return;
    }

    // Add carriage return if not present
    const fullCommand = command.endsWith('\r') || command.endsWith('\n') ? command : command + '\r';
    
    // INPUT = '0' (0x30) + command bytes
    const commandBytes = new TextEncoder().encode(fullCommand);
    const payload = new Uint8Array(commandBytes.length + 1);
    payload[0] = 0x30; // '0' as byte
    payload.set(commandBytes, 1);

    console.log(`📤 Sending command: ${JSON.stringify(command)}`);
    console.log(`   Payload bytes: [${Array.from(payload.slice(0, 20)).map(b => `0x${b.toString(16).padStart(2, '0')}`).join(', ')}${payload.length > 20 ? '...' : ''}]`);
    
    this.ws.send(payload);
  }

  resize(columns: number, rows: number) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.error('❌ WebSocket not connected');
      return;
    }

    // RESIZE_TERMINAL = '1' (0x31) + JSON
    const resizeData = JSON.stringify({ columns, rows });
    const resizeBytes = new TextEncoder().encode(resizeData);
    const payload = new Uint8Array(resizeBytes.length + 1);
    payload[0] = 0x31; // '1' as byte
    payload.set(resizeBytes, 1);

    console.log(`📏 Resizing terminal: ${columns}x${rows}`);
    this.ws.send(payload);
  }

  pause() {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.error('❌ WebSocket not connected');
      return;
    }
    
    console.log('⏸️  Pausing terminal');
    this.ws.send(new Uint8Array([0x32])); // PAUSE = '2'
  }

  resume() {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.error('❌ WebSocket not connected');
      return;
    }
    
    console.log('▶️  Resuming terminal');
    this.ws.send(new Uint8Array([0x33])); // RESUME = '3'
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

// Usage example function
export async function testTTYdProtocol(terminalUrl: string) {
  const client = new TTYdProtocolExample(terminalUrl);
  
  try {
    await client.connect();
    console.log('🎉 Connected successfully!');

    // Wait a bit for initial messages
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Test sending commands
    console.log('\n🧪 Testing commands...');
    
    client.sendCommand('echo "Hello TTYd!"');
    await new Promise(resolve => setTimeout(resolve, 500));
    
    client.sendCommand('pwd');
    await new Promise(resolve => setTimeout(resolve, 500));
    
    client.sendCommand('ls -la');
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Test resize
    console.log('\n📏 Testing resize...');
    client.resize(100, 25);
    
    // Keep connection open for a bit to see responses
    await new Promise(resolve => setTimeout(resolve, 2000));
    
  } catch (error) {
    console.error('💥 Test failed:', error);
  } finally {
    client.disconnect();
    console.log('👋 Disconnected');
  }
}