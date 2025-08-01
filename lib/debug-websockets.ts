/**
 * Debug WebSocket connections to understand what the terminal iframe is using
 */

export function debugWebSocketConnections() {
  console.log('🔍 Debugging WebSocket connections...');
  
  // Check if there are any active WebSocket connections
  let activeConnections: WebSocket[] = [];
  
  // Override WebSocket to track all connections
  window.WebSocket = class extends WebSocket {
    constructor(url: string | URL, protocols?: string | string[]) {
      super(url, protocols);
      
      console.log('🔗 New WebSocket connection detected:', {
        url: url.toString(),
        protocols,
        readyState: this.readyState
      });
      
      activeConnections.push(this);
      
      this.addEventListener('open', () => {
        console.log('✅ WebSocket OPENED:', url.toString());
      });
      
      this.addEventListener('close', () => {
        console.log('❌ WebSocket CLOSED:', url.toString());
        activeConnections = activeConnections.filter(ws => ws !== this);
      });
      
      this.addEventListener('message', (event) => {
        console.log('📥 WebSocket MESSAGE:', {
          url: url.toString(),
          data: event.data,
          type: typeof event.data,
          length: event.data?.length
        });
      });
      
      // Override send to log outgoing messages
      const originalSend = this.send.bind(this);
      this.send = function(data: string | ArrayBufferLike | Blob | ArrayBufferView) {
        console.log('📤 WebSocket SEND:', {
          url: url.toString(),
          data,
          type: typeof data
        });
        return originalSend(data);
      };
    }
  };
  
  // Function to list all active connections
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (window as any).listActiveWebSockets = () => {
    console.log('📊 Active WebSocket connections:', activeConnections.length);
    activeConnections.forEach((ws, index) => {
      console.log(`  ${index + 1}. URL: ${ws.url}, State: ${ws.readyState}`);
    });
    return activeConnections;
  };
  
  // Function to send test message to all connections
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (window as any).testAllWebSockets = (message: string = 'test') => {
    console.log('🧪 Testing all WebSocket connections with message:', message);
    activeConnections.forEach((ws, index) => {
      if (ws.readyState === WebSocket.OPEN) {
        console.log(`📤 Sending to connection ${index + 1}:`, ws.url);
        try {
          ws.send('0' + message); // ttyd protocol
        } catch (error) {
          console.error(`❌ Failed to send to connection ${index + 1}:`, error);
        }
      } else {
        console.log(`⚠️ Connection ${index + 1} not open:`, ws.readyState);
      }
    });
  };
  
  console.log('✅ WebSocket debugging enabled. Available functions:');
  console.log('  - listActiveWebSockets(): List all active connections');
  console.log('  - testAllWebSockets("your message"): Send test message to all connections');
}

// Make it available globally for console use
if (typeof window !== 'undefined') {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (window as any).debugWebSocketConnections = debugWebSocketConnections;
}