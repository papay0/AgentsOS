/**
 * Direct Keyboard Event ttyd Terminal Command Injector
 * 
 * This approach dispatches keyboard events directly to the iframe,
 * which should work on mobile devices including iOS.
 */

export interface TerminalCommand {
  type: 'text' | 'key' | 'paste';
  command: string;
}

export class KeyboardTTYDInjector {
  private iframe: HTMLIFrameElement;
  private ready = false;

  constructor(iframe: HTMLIFrameElement) {
    this.iframe = iframe;
  }

  /**
   * Initialize the injector
   */
  async initialize(): Promise<boolean> {
    console.log('⌨️ Initializing keyboard event injector...');
    
    if (!this.iframe) {
      console.error('❌ No iframe provided');
      return false;
    }

    this.ready = true;
    console.log('✅ Keyboard event injector ready');
    return true;
  }

  /**
   * Send command by dispatching keyboard events directly to iframe
   */
  async sendCommand(type: 'text' | 'key' | 'paste', command: string): Promise<boolean> {
    if (!this.ready) {
      console.error('❌ Injector not ready');
      return false;
    }

    try {
      // Focus the iframe first
      console.log('🎯 Focusing iframe for command:', command);
      this.iframe.focus();
      
      // Give focus a moment to take effect
      await new Promise(resolve => setTimeout(resolve, 50));

      let success = false;

      switch (type) {
        case 'text':
          success = await this.sendTextAsKeyEvents(command);
          break;
        case 'key':
          success = await this.sendKeyEvent(command);
          break;
        case 'paste':
          success = await this.sendTextAsKeyEvents(command);
          break;
      }

      console.log(success ? '✅ Command sent successfully' : '❌ Command failed');
      return success;

    } catch (error) {
      console.error('❌ Command send failed:', error);
      return false;
    }
  }

  private async sendKeyEvent(key: string): Promise<boolean> {
    try {
      console.log('🔑 Sending key event:', key);
      
      const eventOptions = this.getKeyEventOptions(key);
      if (!eventOptions) {
        console.error('❌ Unknown key:', key);
        return false;
      }

      // Create and dispatch keydown event
      const keydownEvent = new KeyboardEvent('keydown', {
        ...eventOptions,
        bubbles: true,
        cancelable: true
      });

      // Create and dispatch keyup event  
      const keyupEvent = new KeyboardEvent('keyup', {
        ...eventOptions,
        bubbles: true,
        cancelable: true
      });

      // Dispatch to iframe and its content window
      this.iframe.dispatchEvent(keydownEvent);
      
      // Try to dispatch to iframe's content window if accessible
      try {
        if (this.iframe.contentWindow) {
          this.iframe.contentWindow.dispatchEvent(keydownEvent);
          
          // Small delay between keydown and keyup
          await new Promise(resolve => setTimeout(resolve, 50));
          
          this.iframe.contentWindow.dispatchEvent(keyupEvent);
        }
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (_e) {
        console.log('⚠️ Could not dispatch to contentWindow (CORS), using iframe only');
      }
      
      // Dispatch keyup to iframe
      setTimeout(() => this.iframe.dispatchEvent(keyupEvent), 50);

      return true;

    } catch (error) {
      console.error('❌ Key event failed:', error);
      return false;
    }
  }

  private async sendTextAsKeyEvents(text: string): Promise<boolean> {
    try {
      console.log('📝 Sending text as key events:', text);
      
      // Send each character as a key event
      for (const char of text) {
        await this.sendCharacterEvent(char);
        // Small delay between characters
        await new Promise(resolve => setTimeout(resolve, 30));
      }

      // Send Enter to execute the command
      await new Promise(resolve => setTimeout(resolve, 100));
      await this.sendKeyEvent('Enter');

      return true;

    } catch (error) {
      console.error('❌ Text as key events failed:', error);
      return false;
    }
  }

  private async sendCharacterEvent(char: string): Promise<boolean> {
    try {
      const keyCode = char.charCodeAt(0);
      
      const eventOptions: KeyboardEventInit = {
        key: char,
        code: this.getKeyCode(char),
        keyCode: keyCode,
        which: keyCode,
        charCode: keyCode,
        bubbles: true,
        cancelable: true
      };

      // Send keydown, keypress, and keyup events for character
      const events = [
        new KeyboardEvent('keydown', eventOptions),
        new KeyboardEvent('keypress', eventOptions),
        new KeyboardEvent('keyup', eventOptions)
      ];

      for (const event of events) {
        this.iframe.dispatchEvent(event);
        
        // Try content window too
        try {
          if (this.iframe.contentWindow) {
            this.iframe.contentWindow.dispatchEvent(event);
          }
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (_e) {
          // Silent fail for CORS
        }
        
        // Small delay between events
        await new Promise(resolve => setTimeout(resolve, 10));
      }

      return true;

    } catch (error) {
      console.error('❌ Character event failed:', error);
      return false;
    }
  }

  private getKeyCode(char: string): string {
    if (char >= 'a' && char <= 'z') {
      return `Key${char.toUpperCase()}`;
    }
    if (char >= 'A' && char <= 'Z') {
      return `Key${char}`;
    }
    if (char >= '0' && char <= '9') {
      return `Digit${char}`;
    }
    
    const specialCodes: { [key: string]: string } = {
      ' ': 'Space',
      '.': 'Period',
      ',': 'Comma',
      '/': 'Slash',
      '\\': 'Backslash',
      '-': 'Minus',
      '=': 'Equal',
      '[': 'BracketLeft',
      ']': 'BracketRight',
      ';': 'Semicolon',
      "'": 'Quote',
      '`': 'Backquote'
    };
    
    return specialCodes[char] || 'Unknown';
  }

  private getKeyEventOptions(key: string): KeyboardEventInit | null {
    const baseOptions: KeyboardEventInit = {
      bubbles: true,
      cancelable: true
    };

    switch (key) {
      case 'Ctrl+C':
        return {
          ...baseOptions,
          key: 'c',
          code: 'KeyC',
          keyCode: 67,
          which: 67,
          ctrlKey: true
        };
        
      case 'Ctrl+L':
        return {
          ...baseOptions,
          key: 'l',
          code: 'KeyL',
          keyCode: 76,
          which: 76,
          ctrlKey: true
        };
        
      case 'Ctrl+D':
        return {
          ...baseOptions,
          key: 'd',
          code: 'KeyD',
          keyCode: 68,
          which: 68,
          ctrlKey: true
        };
        
      case 'Ctrl+V':
        return {
          ...baseOptions,
          key: 'v',
          code: 'KeyV',
          keyCode: 86,
          which: 86,
          ctrlKey: true
        };
        
      case 'Ctrl+Z':
        return {
          ...baseOptions,
          key: 'z',
          code: 'KeyZ',
          keyCode: 90,
          which: 90,
          ctrlKey: true
        };
        
      case 'Enter':
        return {
          ...baseOptions,
          key: 'Enter',
          code: 'Enter',
          keyCode: 13,
          which: 13
        };
        
      case 'ArrowUp':
        return {
          ...baseOptions,
          key: 'ArrowUp',
          code: 'ArrowUp',
          keyCode: 38,
          which: 38
        };
        
      case 'ArrowDown':
        return {
          ...baseOptions,
          key: 'ArrowDown',
          code: 'ArrowDown',
          keyCode: 40,
          which: 40
        };
        
      case 'ArrowLeft':
        return {
          ...baseOptions,
          key: 'ArrowLeft',
          code: 'ArrowLeft',
          keyCode: 37,
          which: 37
        };
        
      case 'ArrowRight':
        return {
          ...baseOptions,
          key: 'ArrowRight',
          code: 'ArrowRight',
          keyCode: 39,
          which: 39
        };
        
      case 'Backspace':
        return {
          ...baseOptions,
          key: 'Backspace',
          code: 'Backspace',
          keyCode: 8,
          which: 8
        };
        
      case 'Delete':
        return {
          ...baseOptions,
          key: 'Delete',
          code: 'Delete',
          keyCode: 46,
          which: 46
        };
        
      case 'Home':
        return {
          ...baseOptions,
          key: 'Home',
          code: 'Home',
          keyCode: 36,
          which: 36
        };
        
      case 'End':
        return {
          ...baseOptions,
          key: 'End',
          code: 'End',
          keyCode: 35,
          which: 35
        };
        
      case 'Tab':
        return {
          ...baseOptions,
          key: 'Tab',
          code: 'Tab',
          keyCode: 9,
          which: 9
        };
        
      case 'Escape':
        return {
          ...baseOptions,
          key: 'Escape',
          code: 'Escape',
          keyCode: 27,
          which: 27
        };
        
      default:
        console.warn('Unknown key:', key);
        return null;
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