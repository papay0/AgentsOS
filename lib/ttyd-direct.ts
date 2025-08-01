'use client';

// Alternative approach - try to reverse engineer ttyd's protocol
export function testTTYDConnection(terminalUrl: string) {
  const wsUrl = terminalUrl
    .replace('http://', 'ws://')
    .replace('https://', 'wss://')
    .replace(/\/$/, '') + '/ws';
    
  console.log('Testing direct connection to:', wsUrl);
  
  const ws = new WebSocket(wsUrl);
  
  ws.onopen = () => {
    console.log('✅ WebSocket connected');
    
    // Wait a bit to see if ttyd sends any initial messages
    setTimeout(() => {
      console.log('No initial messages received. Trying different approaches...');
      
      // Method 1: Try without auth token
      console.log('1. Sending terminal resize without auth...');
      ws.send('1' + JSON.stringify({ columns: 80, rows: 24 }));
      
      setTimeout(() => {
        console.log('2. Sending simple input...');
        ws.send('0whoami\r');
        
        setTimeout(() => {
          // Method 2: Try binary format
          console.log('3. Trying binary format...');
          const binaryData = new Uint8Array([48, 108, 115, 13]); // '0ls\r' in binary
          ws.send(binaryData.buffer);
          
          setTimeout(() => {
            // Method 3: Try different op codes
            console.log('4. Trying different op codes...');
            ws.send('2ls\r'); // Try op code '2'
            
            setTimeout(() => {
              console.log('5. Trying raw text...');
              ws.send('ls\r'); // Try without op code
              
              setTimeout(() => {
                console.log('6. Final attempt with auth...');
                ws.send(JSON.stringify({ AuthToken: "" }));
                setTimeout(() => {
                  ws.send('0echo hello\r');
                }, 200);
              }, 500);
            }, 500);
          }, 500);
        }, 500);
      }, 500);
    }, 1000);
  };
  
  ws.onmessage = (event) => {
    console.log('📨 Received message:', {
      data: event.data,
      type: typeof event.data,
      length: event.data.length,
      firstChar: event.data.charCodeAt ? event.data.charCodeAt(0) : 'N/A',
      content: event.data.slice ? event.data.slice(0, 100) : event.data
    });
    
    // If it's terminal output, log it nicely
    if (typeof event.data === 'string' && event.data.length > 0) {
      const opCode = event.data.charCodeAt(0);
      const data = event.data.slice(1);
      
      if (opCode === 48) { // '0' - terminal output
        console.log('🖥️  Terminal output:', JSON.stringify(data));
      }
    }
  };
  
  ws.onerror = (error) => {
    console.error('❌ WebSocket error:', error);
  };
  
  ws.onclose = (event) => {
    console.log('🔌 WebSocket closed:', event.code, event.reason);
  };
  
  return ws;
}