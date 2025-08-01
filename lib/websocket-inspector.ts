'use client';

// Intercept WebSocket connections to see what the terminal iframe is actually sending
export function interceptWebSockets() {
  if (typeof window === 'undefined') return;
  
  window.WebSocket = class extends WebSocket {
    constructor(url: string | URL, protocols?: string | string[]) {
      console.log('🔍 WebSocket intercepted:', url, protocols);
      super(url, protocols);
      
      const originalSend = this.send;
      this.send = function(data: string | ArrayBufferLike | Blob | ArrayBufferView) {
        console.log('📤 WebSocket SEND:', {
          url,
          data,
          type: typeof data,
          isArrayBuffer: data instanceof ArrayBuffer,
          isString: typeof data === 'string',
          content: typeof data === 'string' ? data : 'Binary data'
        });
        
        if (typeof data === 'string' && data.length < 100) {
          console.log('📤 String data bytes:', Array.from(data).map(c => c.charCodeAt(0)));
        }
        
        return originalSend.call(this, data);
      };
      
      this.addEventListener('message', (event) => {
        console.log('📥 WebSocket RECEIVE:', {
          url,
          data: event.data,
          type: typeof event.data,
          content: typeof event.data === 'string' ? event.data.slice(0, 100) : 'Binary data'
        });
        
        if (typeof event.data === 'string' && event.data.length > 0) {
          const firstByte = event.data.charCodeAt(0);
          console.log('📥 First byte:', firstByte, String.fromCharCode(firstByte));
        }
      });
      
      this.addEventListener('open', () => {
        console.log('🔗 WebSocket OPEN:', url);
      });
      
      this.addEventListener('close', (event) => {
        console.log('🔌 WebSocket CLOSE:', url, event.code, event.reason);
      });
      
      this.addEventListener('error', (event) => {
        console.log('❌ WebSocket ERROR:', url, event);
      });
    }
  };
  
  console.log('🕵️ WebSocket interceptor installed');
}

export function restoreWebSockets() {
  // Note: This is a simplified restore - in practice you'd need to store the original
  console.log('🔄 WebSocket interceptor would be restored here');
}