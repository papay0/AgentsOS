import { ITerminalAddon } from '@xterm/xterm';

// Simple ResizeManager with per-terminal debouncing
export class ResizeManager {
  private websocket: WebSocket | null = null;
  private fitAddon: ITerminalAddon & { fit: () => void; proposeDimensions: () => { cols: number; rows: number } | undefined } | null = null;
  private lastCols: number = 0;
  private lastRows: number = 0;
  private port: string = 'unknown';
  private resizeTimeout: NodeJS.Timeout | null = null;
  private readonly DEBOUNCE_MS = 1000; // 1 second debounce

  setWebSocket(ws: WebSocket | null) {
    this.websocket = ws;
  }

  setFitAddon(addon: ITerminalAddon & { fit: () => void; proposeDimensions: () => { cols: number; rows: number } | undefined } | null) {
    this.fitAddon = addon;
  }

  setPort(port: string) {
    this.port = port;
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

  /**
   * SINGLE RESIZE METHOD - This is the only method that actually sends resize to server
   * You should see ONLY ONE log from here per resize operation
   */
  private performResize() {
    console.log(`🔍 [${this.port}] performResize() called - checking conditions...`);
    
    if (!this.websocket || this.websocket.readyState !== WebSocket.OPEN) {
      console.log(`❌ [${this.port}] performResize FAILED: WebSocket not ready (${this.websocket ? this.websocket.readyState : 'null'})`);
      return;
    }
    console.log(`✅ [${this.port}] WebSocket is ready`);

    const dimensions = this.getDimensions();
    if (!dimensions) {
      console.log(`❌ [${this.port}] performResize FAILED: No dimensions from fitAddon`);
      return;
    }
    console.log(`✅ [${this.port}] Got dimensions: ${dimensions.cols}x${dimensions.rows}`);

    // RESIZE_TERMINAL = '1' (0x31) + JSON data as binary
    const resizeData = JSON.stringify({ columns: dimensions.cols, rows: dimensions.rows });
    const resizeBytes = new TextEncoder().encode(resizeData);
    const payload = new Uint8Array(resizeBytes.length + 1);
    payload[0] = 0x31; // '1' as byte
    payload.set(resizeBytes, 1);
    
    this.websocket.send(payload);
    this.lastCols = dimensions.cols;
    this.lastRows = dimensions.rows;
    
    // THE ONLY LOG YOU SHOULD SEE PER RESIZE
    console.log(`🎯 [${this.port}] TERMINAL RESIZED: ${dimensions.cols}x${dimensions.rows}`);
  }

  /**
   * SINGLE ENTRY POINT for all resize triggers
   * This method debounces all resize requests to prevent spam
   */
  triggerResize() {
    // Clear any pending resize
    if (this.resizeTimeout) {
      clearTimeout(this.resizeTimeout);
    }

    // Schedule new resize after debounce period
    this.resizeTimeout = setTimeout(() => {
      this.performResize();
      this.resizeTimeout = null;
    }, this.DEBOUNCE_MS);
  }

  // Convenience methods that all route through triggerResize
  sendInitialResize() {
    // For initial resize, perform immediately without debounce
    this.performResize();
  }

  sendFocusResize() {
    this.triggerResize();
  }

  sendWindowResize() {
    this.triggerResize();
  }

  sendDebouncedResize() {
    this.triggerResize();
  }

  sendDelayedResizes() {
    // For initial setup, send immediate resize
    setTimeout(() => this.performResize(), 500);
  }

  setConnected() {
    // No periodic resize needed - we resize on actual events
  }

  cleanup() {
    if (this.resizeTimeout) {
      clearTimeout(this.resizeTimeout);
      this.resizeTimeout = null;
    }
  }
}