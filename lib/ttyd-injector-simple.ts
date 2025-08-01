/**
 * Simplified ttyd Terminal Command Injector
 * 
 * This is a simpler approach that uses browser DevTools-style injection
 * when iframe content access is blocked by CORS
 */

export interface TerminalCommand {
  type: 'text' | 'key' | 'paste';
  command: string;
}

export class SimpleTTYDInjector {
  private iframe: HTMLIFrameElement;
  private ready = false;

  constructor(iframe: HTMLIFrameElement) {
    this.iframe = iframe;
  }

  /**
   * Check if we can access iframe content
   */
  private canAccessIframeContent(): boolean {
    try {
      // Try to access iframe's document
      const doc = this.iframe.contentDocument;
      const win = this.iframe.contentWindow;
      return !!(doc && win);
    } catch (error) {
      console.log('🚫 Cannot access iframe content (CORS):', error);
      return false;
    }
  }

  /**
   * Initialize the injector
   */
  async initialize(): Promise<boolean> {
    console.log('🔍 Initializing simple ttyd injector...');
    
    // Check iframe access
    if (!this.canAccessIframeContent()) {
      console.log('❌ Cannot access iframe content due to CORS. Switching to manual instructions.');
      this.ready = false;
      return false;
    }

    console.log('✅ Can access iframe content');
    this.ready = true;
    return true;
  }

  /**
   * Send command using browser automation approach
   */
  async sendCommand(type: 'text' | 'key' | 'paste', command: string): Promise<boolean> {
    if (!this.ready) {
      console.error('❌ Injector not ready');
      return false;
    }

    try {
      const iframeWindow = this.iframe.contentWindow;
      if (!iframeWindow) {
        console.error('❌ No iframe window access');
        return false;
      }

      // Try to find the terminal input element or textarea
      const doc = this.iframe.contentDocument;
      if (!doc) {
        console.error('❌ No iframe document access');
        return false;
      }

      // Look for terminal-like elements
      const terminalElements = doc.querySelectorAll('textarea, input[type="text"], .terminal, .xterm, [contenteditable]');
      console.log('🔍 Found terminal elements:', terminalElements.length);

      if (terminalElements.length === 0) {
        console.log('⚠️ No terminal input elements found, trying to focus iframe');
        this.iframe.focus();
        iframeWindow.focus();
      }

      // Try to simulate keyboard events
      let success = false;

      switch (type) {
        case 'text':
          success = await this.simulateTextInput(command);
          break;
        case 'key':
          success = await this.simulateKeyPress(command);
          break;
        case 'paste':
          success = await this.simulatePaste(command);
          break;
      }

      return success;

    } catch (error) {
      console.error('❌ Command send failed:', error);
      return false;
    }
  }

  private async simulateTextInput(text: string): Promise<boolean> {
    try {
      const doc = this.iframe.contentDocument;
      if (!doc) return false;

      // Focus the iframe first
      this.iframe.focus();
      this.iframe.contentWindow?.focus();

      // Try typing character by character
      for (const char of text) {
        const keyEvent = new KeyboardEvent('keydown', {
          key: char,
          code: `Key${char.toUpperCase()}`,
          keyCode: char.charCodeAt(0),
          which: char.charCodeAt(0),
          bubbles: true,
          cancelable: true
        });

        doc.dispatchEvent(keyEvent);
        
        // Small delay between characters
        await new Promise(resolve => setTimeout(resolve, 10));
      }

      // Send Enter key
      const enterEvent = new KeyboardEvent('keydown', {
        key: 'Enter',
        code: 'Enter',
        keyCode: 13,
        which: 13,
        bubbles: true,
        cancelable: true
      });
      doc.dispatchEvent(enterEvent);

      console.log('✅ Text input simulated:', text);
      return true;

    } catch (error) {
      console.error('❌ Text simulation failed:', error);
      return false;
    }
  }

  private async simulateKeyPress(key: string): Promise<boolean> {
    try {
      const doc = this.iframe.contentDocument;
      if (!doc) return false;

      // Focus the iframe
      this.iframe.focus();
      this.iframe.contentWindow?.focus();

      let eventOptions: KeyboardEventInit = {
        bubbles: true,
        cancelable: true
      };

      // Map special keys
      switch (key) {
        case 'Ctrl+C':
          eventOptions = { ...eventOptions, key: 'c', code: 'KeyC', ctrlKey: true, keyCode: 67, which: 67 };
          break;
        case 'Ctrl+L':
          eventOptions = { ...eventOptions, key: 'l', code: 'KeyL', ctrlKey: true, keyCode: 76, which: 76 };
          break;
        case 'Ctrl+D':
          eventOptions = { ...eventOptions, key: 'd', code: 'KeyD', ctrlKey: true, keyCode: 68, which: 68 };
          break;
        case 'Enter':
          eventOptions = { ...eventOptions, key: 'Enter', code: 'Enter', keyCode: 13, which: 13 };
          break;
        case 'ArrowUp':
          eventOptions = { ...eventOptions, key: 'ArrowUp', code: 'ArrowUp', keyCode: 38, which: 38 };
          break;
        case 'ArrowDown':
          eventOptions = { ...eventOptions, key: 'ArrowDown', code: 'ArrowDown', keyCode: 40, which: 40 };
          break;
        case 'ArrowLeft':
          eventOptions = { ...eventOptions, key: 'ArrowLeft', code: 'ArrowLeft', keyCode: 37, which: 37 };
          break;
        case 'ArrowRight':
          eventOptions = { ...eventOptions, key: 'ArrowRight', code: 'ArrowRight', keyCode: 39, which: 39 };
          break;
        case 'Backspace':
          eventOptions = { ...eventOptions, key: 'Backspace', code: 'Backspace', keyCode: 8, which: 8 };
          break;
        default:
          eventOptions = { ...eventOptions, key: key, code: `Key${key.toUpperCase()}` };
      }

      // Send both keydown and keyup events
      const keyDownEvent = new KeyboardEvent('keydown', eventOptions);
      const keyUpEvent = new KeyboardEvent('keyup', eventOptions);

      doc.dispatchEvent(keyDownEvent);
      setTimeout(() => doc.dispatchEvent(keyUpEvent), 10);

      console.log('✅ Key press simulated:', key);
      return true;

    } catch (error) {
      console.error('❌ Key simulation failed:', error);
      return false;
    }
  }

  private async simulatePaste(text: string): Promise<boolean> {
    try {
      const doc = this.iframe.contentDocument;
      if (!doc) return false;

      // Focus the iframe
      this.iframe.focus();
      this.iframe.contentWindow?.focus();

      // Try to use clipboard API
      try {
        await navigator.clipboard.writeText(text);
        
        // Simulate Ctrl+V
        const pasteEvent = new KeyboardEvent('keydown', {
          key: 'v',
          code: 'KeyV',
          ctrlKey: true,
          keyCode: 86,
          which: 86,
          bubbles: true,
          cancelable: true
        });
        
        doc.dispatchEvent(pasteEvent);
        console.log('✅ Paste simulated via clipboard API');
        return true;
        
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (_clipboardError) {
        console.log('⚠️ Clipboard API failed, trying direct text input');
        return this.simulateTextInput(text);
      }

    } catch (error) {
      console.error('❌ Paste simulation failed:', error);
      return false;
    }
  }

  /**
   * Common terminal commands
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

  async sendText(text: string): Promise<boolean> {
    return this.sendCommand('text', text);
  }

  async paste(text: string): Promise<boolean> {
    return this.sendCommand('paste', text);
  }

  isReady(): boolean {
    return this.ready;
  }
}