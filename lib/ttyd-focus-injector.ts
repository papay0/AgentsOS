/**
 * Focus-based ttyd Terminal Command Injector
 * 
 * This approach works by focusing the iframe and sending keyboard events
 * directly to it, without needing to access the iframe's content.
 */

export interface TerminalCommand {
  type: 'text' | 'key' | 'paste';
  command: string;
}

export class FocusTTYDInjector {
  private iframe: HTMLIFrameElement;
  private ready = false;

  constructor(iframe: HTMLIFrameElement) {
    this.iframe = iframe;
  }

  /**
   * Initialize the injector - always succeeds since we don't need iframe content access
   */
  async initialize(): Promise<boolean> {
    console.log('🎯 Initializing focus-based ttyd injector...');
    
    // Check if iframe exists and is loaded
    if (!this.iframe) {
      console.error('❌ No iframe provided');
      return false;
    }

    // Wait a bit for iframe to be ready
    await new Promise(resolve => setTimeout(resolve, 500));
    
    this.ready = true;
    console.log('✅ Focus-based injector ready');
    return true;
  }

  /**
   * Send command by focusing iframe and dispatching events
   */
  async sendCommand(type: 'text' | 'key' | 'paste', command: string): Promise<boolean> {
    if (!this.ready) {
      console.error('❌ Injector not ready');
      return false;
    }

    try {
      // Focus the iframe first
      console.log('🎯 Focusing iframe...');
      this.iframe.focus();
      
      // Give focus a moment to take effect
      await new Promise(resolve => setTimeout(resolve, 100));

      let success = false;

      switch (type) {
        case 'text':
          success = await this.sendTextToFocusedIframe(command);
          break;
        case 'key':
          success = await this.sendKeyToFocusedIframe(command);
          break;
        case 'paste':
          success = await this.sendPasteToFocusedIframe(command);
          break;
      }

      return success;

    } catch (error) {
      console.error('❌ Command send failed:', error);
      return false;
    }
  }

  private async sendTextToFocusedIframe(text: string): Promise<boolean> {
    try {
      console.log('⌨️ Sending text to focused iframe:', text);
      
      // Type each character
      for (const char of text) {
        await this.dispatchKeyboardEvent('keydown', char);
        await this.dispatchKeyboardEvent('keypress', char);
        await this.dispatchKeyboardEvent('keyup', char);
        
        // Small delay between characters
        await new Promise(resolve => setTimeout(resolve, 10));
      }

      // Send Enter to execute the command
      await this.sendKeyToFocusedIframe('Enter');

      console.log('✅ Text sent successfully');
      return true;

    } catch (error) {
      console.error('❌ Text send failed:', error);
      return false;
    }
  }

  private async sendKeyToFocusedIframe(key: string): Promise<boolean> {
    try {
      console.log('🔑 Sending key to focused iframe:', key);
      
      const keyEventInit = this.getKeyEventInit(key);
      
      await this.dispatchKeyboardEvent('keydown', key, keyEventInit);
      
      // For special keys, also send keyup
      if (key.startsWith('Ctrl+') || key.startsWith('Arrow') || ['Enter', 'Backspace', 'Tab', 'Escape'].includes(key)) {
        await new Promise(resolve => setTimeout(resolve, 50));
        await this.dispatchKeyboardEvent('keyup', key, keyEventInit);
      }

      console.log('✅ Key sent successfully');
      return true;

    } catch (error) {
      console.error('❌ Key send failed:', error);
      return false;
    }
  }

  private async sendPasteToFocusedIframe(text: string): Promise<boolean> {
    try {
      console.log('📋 Sending paste to focused iframe:', text);
      
      // Try clipboard API first
      if (navigator.clipboard) {
        try {
          await navigator.clipboard.writeText(text);
          // Send Ctrl+V
          await this.sendKeyToFocusedIframe('Ctrl+V');
          console.log('✅ Paste sent via clipboard API');
          return true;
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (_clipboardError) {
          console.log('⚠️ Clipboard API failed, falling back to text input');
        }
      }
      
      // Fallback to typing the text
      return await this.sendTextToFocusedIframe(text);

    } catch (error) {
      console.error('❌ Paste send failed:', error);
      return false;
    }
  }

  private getKeyEventInit(key: string): KeyboardEventInit {
    const baseInit: KeyboardEventInit = {
      bubbles: true,
      cancelable: true,
    };

    switch (key) {
      case 'Ctrl+C':
        return { ...baseInit, key: 'c', code: 'KeyC', ctrlKey: true, keyCode: 67, which: 67 };
      case 'Ctrl+L':
        return { ...baseInit, key: 'l', code: 'KeyL', ctrlKey: true, keyCode: 76, which: 76 };
      case 'Ctrl+D':
        return { ...baseInit, key: 'd', code: 'KeyD', ctrlKey: true, keyCode: 68, which: 68 };
      case 'Ctrl+V':
        return { ...baseInit, key: 'v', code: 'KeyV', ctrlKey: true, keyCode: 86, which: 86 };
      case 'Ctrl+Z':
        return { ...baseInit, key: 'z', code: 'KeyZ', ctrlKey: true, keyCode: 90, which: 90 };
      case 'Enter':
        return { ...baseInit, key: 'Enter', code: 'Enter', keyCode: 13, which: 13 };
      case 'ArrowUp':
        return { ...baseInit, key: 'ArrowUp', code: 'ArrowUp', keyCode: 38, which: 38 };
      case 'ArrowDown':
        return { ...baseInit, key: 'ArrowDown', code: 'ArrowDown', keyCode: 40, which: 40 };
      case 'ArrowLeft':
        return { ...baseInit, key: 'ArrowLeft', code: 'ArrowLeft', keyCode: 37, which: 37 };
      case 'ArrowRight':
        return { ...baseInit, key: 'ArrowRight', code: 'ArrowRight', keyCode: 39, which: 39 };
      case 'Backspace':
        return { ...baseInit, key: 'Backspace', code: 'Backspace', keyCode: 8, which: 8 };
      case 'Delete':
        return { ...baseInit, key: 'Delete', code: 'Delete', keyCode: 46, which: 46 };
      case 'Home':
        return { ...baseInit, key: 'Home', code: 'Home', keyCode: 36, which: 36 };
      case 'End':
        return { ...baseInit, key: 'End', code: 'End', keyCode: 35, which: 35 };
      case 'Tab':
        return { ...baseInit, key: 'Tab', code: 'Tab', keyCode: 9, which: 9 };
      case 'Escape':
        return { ...baseInit, key: 'Escape', code: 'Escape', keyCode: 27, which: 27 };
      default:
        // For regular characters
        const charCode = key.length === 1 ? key.charCodeAt(0) : 0;
        return { 
          ...baseInit, 
          key: key, 
          code: key.length === 1 ? `Key${key.toUpperCase()}` : key,
          keyCode: charCode,
          which: charCode
        };
    }
  }

  private async dispatchKeyboardEvent(
    eventType: 'keydown' | 'keypress' | 'keyup', 
    key: string, 
    eventInit?: KeyboardEventInit
  ): Promise<void> {
    try {
      const finalEventInit = eventInit || this.getKeyEventInit(key);
      
      const event = new KeyboardEvent(eventType, finalEventInit);
      
      // Try to dispatch to different targets
      const targets = [
        this.iframe,
        this.iframe.contentWindow,
        document.activeElement,
        document.body,
        document
      ].filter(Boolean);

      for (const target of targets) {
        try {
          target?.dispatchEvent?.(event);
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (_e) {
          // Silent fail for each target
        }
      }

    } catch (error) {
      console.log('⚠️ Event dispatch failed:', error);
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