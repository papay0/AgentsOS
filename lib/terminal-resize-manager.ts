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

  // Send multiple delayed resizes to catch when terminal is fully ready
  sendDelayedResizes() {
    // Multiple attempts with increasing delays
    setTimeout(() => this.sendResize(true), 500);  // 500ms
    setTimeout(() => this.sendResize(true), 800);  // 800ms  
    setTimeout(() => this.sendResize(true), 1200); // 1.2s
    setTimeout(() => this.sendResize(true), 2000); // 2s (final attempt)
  }

  // Send debounced resize for window/container changes
  private resizeTimer: NodeJS.Timeout | null = null;
  private periodicTimer: NodeJS.Timeout | null = null;
  private isConnected: boolean = false;
  
  setConnected(connected: boolean) {
    this.isConnected = connected;
    if (connected) {
      this.startPeriodicResize();
    } else {
      this.stopPeriodicResize();
    }
  }
  
  sendDebouncedResize(delay: number = 150) {
    if (this.resizeTimer) {
      clearTimeout(this.resizeTimer);
    }
    this.resizeTimer = setTimeout(() => {
      this.sendResize(true); // Force resize after debounce
      this.resizeTimer = null;
    }, delay);
  }

  // Step 5: Periodic safety refresh when terminal is focused
  private startPeriodicResize() {
    this.stopPeriodicResize();
    this.periodicTimer = setInterval(() => {
      if (document.hasFocus()) {
        this.sendResize(); // Non-forced, only if dimensions changed
      }
    }, 8000); // Every 8 seconds
  }

  private stopPeriodicResize() {
    if (this.periodicTimer) {
      clearInterval(this.periodicTimer);
      this.periodicTimer = null;
    }
  }

  cleanup() {
    if (this.resizeTimer) {
      clearTimeout(this.resizeTimer);
      this.resizeTimer = null;
    }
    this.stopPeriodicResize();
  }
}