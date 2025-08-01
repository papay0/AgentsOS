/**
 * WebSocket-based ttyd Terminal Command Injector
 * 
 * Uses the existing TTYDClient to send input directly to the terminal's WebSocket
 * Perfect for mobile use cases like pasting API keys
 */

import { TTYDClient } from '@/lib/ttyd-client';

export interface TerminalCommand {
  type: 'text' | 'key' | 'paste';
  command: string;
}

export class WebSocketTTYDInjector {
  private client: TTYDClient;
  private terminalUrl: string;
  private ready = false;
  private connecting = false;

  constructor(terminalUrl: string) {
    this.terminalUrl = terminalUrl;
    this.client = new TTYDClient(terminalUrl);
  }

  /**
   * Initialize the injector by connecting to ttyd WebSocket
   */
  async initialize(): Promise<boolean> {
    console.log('🔌 Initializing WebSocket ttyd injector for:', this.terminalUrl);
    
    if (this.connecting) {
      console.log('⏳ Already connecting...');
      return false;
    }

    if (this.ready) {
      console.log('✅ Already connected');
      return true;
    }

    try {
      this.connecting = true;
      await this.client.connect();
      this.ready = true;
      console.log('✅ WebSocket ttyd injector ready');
      return true;
    } catch (error) {
      console.error('❌ Failed to connect to ttyd WebSocket:', error);
      this.ready = false;
      return false;
    } finally {
      this.connecting = false;
    }
  }

  /**
   * Send command directly to the terminal via WebSocket
   */
  async sendCommand(type: 'text' | 'key' | 'paste', command: string): Promise<boolean> {
    if (!this.ready || !this.client.isConnected()) {
      console.error('❌ WebSocket not connected');
      return false;
    }

    try {
      console.log(`📡 Sending ${type} command via WebSocket:`, command);

      switch (type) {
        case 'text':
          // Send text and press Enter
          this.client.sendInput(command);
          // Small delay before Enter
          setTimeout(() => this.client.sendKey('Enter'), 100);
          break;
          
        case 'key':
          await this.sendKeyCommand(command);
          break;
          
        case 'paste':
          // Just send the text without Enter (for pasting API keys, etc.)
          this.client.sendInput(command);
          break;
      }

      console.log('✅ Command sent via WebSocket');
      return true;

    } catch (error) {
      console.error('❌ Failed to send command via WebSocket:', error);
      return false;
    }
  }

  private async sendKeyCommand(key: string): Promise<void> {
    switch (key) {
      case 'Ctrl+C':
        this.client.sendKey('C', true);
        break;
      case 'Ctrl+L':
        this.client.sendKey('L', true);
        break;
      case 'Ctrl+D':
        this.client.sendKey('D', true);
        break;
      case 'Ctrl+Z':
        this.client.sendKey('Z', true);
        break;
      case 'Enter':
        this.client.sendKey('Enter');
        break;
      case 'ArrowUp':
        this.client.sendKey('ArrowUp');
        break;
      case 'ArrowDown':
        this.client.sendKey('ArrowDown');
        break;
      case 'ArrowLeft':
        this.client.sendKey('ArrowLeft');
        break;
      case 'ArrowRight':
        this.client.sendKey('ArrowRight');
        break;
      case 'Home':
        this.client.sendKey('Home');
        break;
      case 'End':
        this.client.sendKey('End');
        break;
      case 'Backspace':
        this.client.sendKey('Backspace');
        break;
      case 'Delete':
        this.client.sendKey('Delete');
        break;
      case 'Tab':
        this.client.sendKey('Tab');
        break;
      case 'Escape':
        this.client.sendKey('Escape');
        break;
      default:
        console.warn('Unknown key command:', key);
    }
  }

  /**
   * Send text input (perfect for pasting API keys)
   */
  async sendText(text: string): Promise<boolean> {
    return this.sendCommand('text', text);
  }

  /**
   * Paste text without pressing Enter (ideal for API keys)
   */
  async paste(text: string): Promise<boolean> {
    return this.sendCommand('paste', text);
  }

  /**
   * Send key press
   */
  async sendKey(key: string): Promise<boolean> {
    return this.sendCommand('key', key);
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

  /**
   * Get connection status
   */
  isReady(): boolean {
    return this.ready && this.client.isConnected();
  }

  /**
   * Disconnect from WebSocket
   */
  disconnect(): void {
    this.client.disconnect();
    this.ready = false;
  }

  /**
   * Listen to terminal output
   */
  onMessage(callback: (data: string) => void): void {
    this.client.onMessage(callback);
  }
}