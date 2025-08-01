/**
 * Clipboard-based ttyd Terminal Command Injector
 * 
 * This approach uses the clipboard API and user interaction to send commands
 * to the terminal, which is more reliable than keyboard event simulation.
 */

export interface TerminalCommand {
  type: 'text' | 'key' | 'paste';
  command: string;
}

export class ClipboardTTYDInjector {
  private iframe: HTMLIFrameElement;
  private ready = false;

  constructor(iframe: HTMLIFrameElement) {
    this.iframe = iframe;
  }

  /**
   * Initialize the injector
   */
  async initialize(): Promise<boolean> {
    console.log('📋 Initializing clipboard-based ttyd injector...');
    
    if (!this.iframe) {
      console.error('❌ No iframe provided');
      return false;
    }

    // Check if clipboard API is available
    if (!navigator.clipboard) {
      console.error('❌ Clipboard API not available');
      return false;
    }

    this.ready = true;
    console.log('✅ Clipboard-based injector ready');
    return true;
  }

  /**
   * Send command using clipboard and user interaction
   */
  async sendCommand(type: 'text' | 'key' | 'paste', command: string): Promise<boolean> {
    if (!this.ready) {
      console.error('❌ Injector not ready');
      return false;
    }

    try {
      let textToSend = '';
      
      switch (type) {
        case 'text':
          textToSend = command + '\n';
          break;
        case 'key':
          textToSend = this.getKeySequence(command);
          break;
        case 'paste':
          textToSend = command;
          break;
      }

      if (!textToSend) {
        console.error('❌ No text to send');
        return false;
      }

      // Use clipboard + focus + instructions
      return await this.sendViaClipboard(textToSend, command);

    } catch (error) {
      console.error('❌ Command send failed:', error);
      return false;
    }
  }

  private getKeySequence(key: string): string {
    switch (key) {
      case 'Ctrl+C':
        return '\x03'; // ASCII ETX (End of Text)
      case 'Ctrl+L':
        return '\x0C'; // ASCII FF (Form Feed) - clear screen
      case 'Ctrl+D':
        return '\x04'; // ASCII EOT (End of Transmission)
      case 'Enter':
        return '\n';
      case 'ArrowUp':
        return '\x1b[A'; // ANSI escape sequence
      case 'ArrowDown':
        return '\x1b[B';
      case 'ArrowLeft':
        return '\x1b[D';
      case 'ArrowRight':
        return '\x1b[C';
      case 'Home':
        return '\x1b[H';
      case 'End':
        return '\x1b[F';
      case 'Backspace':
        return '\x7F'; // ASCII DEL
      case 'Delete':
        return '\x1b[3~';
      case 'Tab':
        return '\t';
      case 'Escape':
        return '\x1b';
      default:
        return key;
    }
  }

  private async sendViaClipboard(text: string, originalCommand: string): Promise<boolean> {
    try {
      console.log('📋 Copying to clipboard:', { originalCommand, text });
      
      // Copy to clipboard
      await navigator.clipboard.writeText(text);
      
      // Focus the iframe
      this.iframe.focus();
      this.iframe.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      
      // Add visual feedback
      this.showInstruction(originalCommand);
      
      console.log('✅ Text copied to clipboard and iframe focused');
      return true;

    } catch (error) {
      console.error('❌ Clipboard operation failed:', error);
      return false;
    }
  }

  private showInstruction(command: string): void {
    // Create a temporary instruction overlay
    const instruction = document.createElement('div');
    instruction.innerHTML = `
      <div style="
        position: fixed;
        top: 20px;
        right: 20px;
        background: #1f2937;
        color: white;
        padding: 12px 16px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        z-index: 10000;
        font-family: monospace;
        font-size: 14px;
        max-width: 300px;
        animation: slideIn 0.3s ease-out;
      ">
        <div style="font-weight: bold; margin-bottom: 8px;">📋 Command copied!</div>
        <div style="opacity: 0.8; font-size: 12px; margin-bottom: 8px;">
          Click the terminal and paste with <strong>Ctrl+V</strong>
        </div>
        <div style="
          background: #374151;
          padding: 6px 8px;
          border-radius: 4px;
          font-family: 'Courier New', monospace;
          word-break: break-all;
        ">${command}</div>
      </div>
      <style>
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      </style>
    `;
    
    document.body.appendChild(instruction);
    
    // Remove after 4 seconds
    setTimeout(() => {
      if (instruction.parentNode) {
        instruction.remove();
      }
    }, 4000);
  }

  /**
   * Alternative approach: Show instructions for manual execution
   */
  async sendWithInstructions(type: 'text' | 'key' | 'paste', command: string): Promise<boolean> {
    try {
      let instruction = '';
      let textToCopy = '';

      switch (type) {
        case 'text':
          instruction = `Type this command in the terminal:`;
          textToCopy = command;
          break;
        case 'key':
          if (command === 'Ctrl+C') {
            instruction = 'Press Ctrl+C in the terminal to interrupt';
            textToCopy = '';
          } else if (command === 'Ctrl+L') {
            instruction = 'Press Ctrl+L in the terminal to clear screen';
            textToCopy = 'clear';
          } else {
            instruction = `Press ${command} in the terminal`;
            textToCopy = '';
          }
          break;
        case 'paste':
          instruction = 'Paste this content in the terminal:';
          textToCopy = command;
          break;
      }

      if (textToCopy) {
        await navigator.clipboard.writeText(textToCopy);
      }

      this.showDetailedInstruction(instruction, textToCopy, command);
      
      return true;

    } catch (error) {
      console.error('❌ Instruction display failed:', error);
      return false;
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private showDetailedInstruction(instruction: string, textToCopy: string, _originalCommand: string): void {
    const modal = document.createElement('div');
    modal.innerHTML = `
      <div style="
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0,0,0,0.5);
        z-index: 10000;
        display: flex;
        align-items: center;
        justify-content: center;
        font-family: system-ui, -apple-system, sans-serif;
      " onclick="this.remove()">
        <div style="
          background: white;
          padding: 24px;
          border-radius: 12px;
          box-shadow: 0 8px 32px rgba(0,0,0,0.3);
          max-width: 400px;
          width: 90%;
        " onclick="event.stopPropagation()">
          <div style="
            font-size: 18px;
            font-weight: 600;
            margin-bottom: 16px;
            color: #1f2937;
          ">
            🎯 Terminal Command
          </div>
          
          <div style="
            color: #6b7280;
            margin-bottom: 16px;
            line-height: 1.5;
          ">
            ${instruction}
          </div>
          
          ${textToCopy ? `
            <div style="
              background: #f3f4f6;
              border: 1px solid #d1d5db;
              border-radius: 6px;
              padding: 12px;
              font-family: 'Courier New', monospace;
              font-size: 14px;
              margin-bottom: 16px;
              word-break: break-all;
              color: #1f2937;
            ">
              ${textToCopy}
            </div>
            
            <div style="
              background: #dbeafe;
              border: 1px solid #93c5fd;
              border-radius: 6px;
              padding: 8px 12px;
              font-size: 12px;
              color: #1e40af;
              margin-bottom: 16px;
            ">
              📋 Copied to clipboard! Click the terminal and press <strong>Ctrl+V</strong> to paste.
            </div>
          ` : ''}
          
          <div style="text-align: right;">
            <button 
              onclick="this.parentElement.parentElement.parentElement.remove()"
              style="
                background: #3b82f6;
                color: white;
                border: none;
                padding: 8px 16px;
                border-radius: 6px;
                cursor: pointer;
                font-size: 14px;
              "
              onmouseover="this.style.background='#2563eb'"
              onmouseout="this.style.background='#3b82f6'"
            >
              Got it!
            </button>
          </div>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
  }

  /**
   * Common terminal commands
   */
  async interrupt(): Promise<boolean> {
    return this.sendWithInstructions('key', 'Ctrl+C');
  }

  async clear(): Promise<boolean> {
    return this.sendWithInstructions('key', 'Ctrl+L');
  }

  async eof(): Promise<boolean> {
    return this.sendWithInstructions('key', 'Ctrl+D');
  }

  async enter(): Promise<boolean> {
    return this.sendWithInstructions('key', 'Enter');
  }

  async sendText(text: string): Promise<boolean> {
    return this.sendWithInstructions('text', text);
  }

  async paste(text: string): Promise<boolean> {
    return this.sendWithInstructions('paste', text);
  }

  isReady(): boolean {
    return this.ready;
  }
}