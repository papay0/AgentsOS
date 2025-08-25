// Step 2: ResizeManager with initial resize + focus resize
export class ResizeManager {
  private websocket: WebSocket | null = null;
  private fitAddon: any = null;
  private lastCols: number = 0;
  private lastRows: number = 0;

  setWebSocket(ws: WebSocket | null) {
    this.websocket = ws;
  }

  setFitAddon(addon: any) {
    this.fitAddon = addon;
  }

  private getDimensions(): { cols: number; rows: number } | null {
    if (!this.fitAddon) return null;
    const dimensions = this.fitAddon.proposeDimensions();
    if (!dimensions || dimensions.cols <= 0 || dimensions.rows <= 0) return null;
    return dimensions;
  }

  private hasChanged(cols: number, rows: number): boolean {
    return cols !== this.lastCols || rows !== this.lastRows;
  }

  private sendResize(force: boolean = false) {
    if (!this.websocket || this.websocket.readyState !== WebSocket.OPEN) {
      console.log('⏭️ Skipping resize - not connected');
      return;
    }

    const dimensions = this.getDimensions();
    if (!dimensions) {
      console.log('⏭️ Skipping resize - no valid dimensions');
      return;
    }

    if (!force && !this.hasChanged(dimensions.cols, dimensions.rows)) {
      console.log(`⏭️ Skipping resize - dimensions unchanged (${dimensions.cols}x${dimensions.rows})`);
      return;
    }

    // RESIZE_TERMINAL = '1' (0x31) + JSON data as binary
    const resizeData = JSON.stringify({ columns: dimensions.cols, rows: dimensions.rows });
    const resizeBytes = new TextEncoder().encode(resizeData);
    const payload = new Uint8Array(resizeBytes.length + 1);
    payload[0] = 0x31; // '1' as byte
    payload.set(resizeBytes, 1);
    
    this.websocket.send(payload);
    this.lastCols = dimensions.cols;
    this.lastRows = dimensions.rows;
    
    console.log(`📐 ResizeManager: Terminal resized to ${dimensions.cols}x${dimensions.rows}`);
  }

  // Send initial resize after connection - identical to working manual logic
  sendInitialResize() {
    this.sendResize(true); // Force initial resize
  }

  // Send resize on focus - ensures perfect layout when user interacts
  sendFocusResize() {
    this.sendResize(true); // Force resize on focus
  }
}