// Step 1: Basic ResizeManager - only handles initial connection resize
export class ResizeManager {
  private websocket: WebSocket | null = null;
  private fitAddon: any = null;

  setWebSocket(ws: WebSocket | null) {
    this.websocket = ws;
  }

  setFitAddon(addon: any) {
    this.fitAddon = addon;
  }

  // Send initial resize after connection - identical to working manual logic
  sendInitialResize() {
    if (!this.websocket || this.websocket.readyState !== WebSocket.OPEN || !this.fitAddon) {
      console.log('⏭️ Skipping initial resize - not ready');
      return;
    }

    const dimensions = this.fitAddon.proposeDimensions();
    if (!dimensions || dimensions.cols <= 0 || dimensions.rows <= 0) {
      console.log('⏭️ Skipping initial resize - invalid dimensions');
      return;
    }

    // RESIZE_TERMINAL = '1' (0x31) + JSON data as binary
    const resizeData = JSON.stringify({ columns: dimensions.cols, rows: dimensions.rows });
    const resizeBytes = new TextEncoder().encode(resizeData);
    const payload = new Uint8Array(resizeBytes.length + 1);
    payload[0] = 0x31; // '1' as byte
    payload.set(resizeBytes, 1);
    
    this.websocket.send(payload);
    console.log(`📐 ResizeManager: Initial resize to ${dimensions.cols}x${dimensions.rows}`);
  }
}