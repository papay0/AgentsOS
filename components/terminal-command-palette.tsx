'use client';

import React, { useState } from 'react';
import type { TTYDTerminalRef } from './ttyd-terminal';

interface TerminalCommandPaletteProps {
  /** Reference to the terminal instance */
  terminalRef: React.RefObject<TTYDTerminalRef | null>;
  /** Whether the terminal is connected */
  isConnected: boolean;
  /** Custom CSS classes */
  className?: string;
}

/**
 * TerminalCommandPalette - Mobile-friendly command palette for terminals
 * 
 * Provides an easy way to send commands and special keys to terminals,
 * especially useful on mobile devices where keyboard shortcuts aren't available.
 * Perfect for pasting API keys on mobile!
 */
export default function TerminalCommandPalette({
  terminalRef,
  isConnected,
  className = "bg-white border-t border-gray-200 p-4"
}: TerminalCommandPaletteProps) {
  const [customInput, setCustomInput] = useState('');

  const sendCustomCommand = (command: string, addEnter = true) => {
    if (terminalRef.current) {
      terminalRef.current.sendCommand(command, addEnter);
    }
  };

  const sendKeyCommand = (key: string) => {
    if (terminalRef.current) {
      terminalRef.current.sendKey(key);
    }
  };

  const handleInputSubmit = () => {
    if (customInput.trim()) {
      sendCustomCommand(customInput);
      setCustomInput('');
    }
  };

  const handlePaste = () => {
    if (customInput.trim()) {
      sendCustomCommand(customInput, false); // Paste without Enter
      setCustomInput('');
    }
  };

  return (
    <div className={className}>
      <div className="max-w-6xl mx-auto">
        <h3 className="text-sm font-medium mb-3">Mobile-Friendly Controls</h3>
        
        {/* Custom Command Input */}
        <div className="flex gap-2 mb-3">
          <input
            type="text"
            value={customInput}
            onChange={(e) => setCustomInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleInputSubmit();
              }
            }}
            placeholder="Type command or API key..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={!isConnected}
          />
          <button
            onClick={handleInputSubmit}
            disabled={!isConnected || !customInput.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:bg-gray-300 transition-colors"
          >
            Send
          </button>
          <button
            onClick={handlePaste}
            disabled={!isConnected || !customInput.trim()}
            className="px-4 py-2 bg-green-600 text-white rounded text-sm hover:bg-green-700 disabled:bg-gray-300 transition-colors"
            title="Paste without Enter (perfect for API keys)"
          >
            📋 Paste
          </button>
        </div>

        {/* Quick Action Buttons */}
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2">
          <button
            onClick={() => sendKeyCommand('Ctrl+C')}
            disabled={!isConnected}
            className="px-3 py-2 bg-red-600 text-white rounded text-sm hover:bg-red-700 disabled:bg-gray-300 transition-colors"
          >
            Ctrl+C
          </button>
          <button
            onClick={() => sendKeyCommand('Ctrl+L')}
            disabled={!isConnected}
            className="px-3 py-2 bg-gray-600 text-white rounded text-sm hover:bg-gray-700 disabled:bg-gray-300 transition-colors"
          >
            Clear
          </button>
          <button
            onClick={() => sendKeyCommand('Enter')}
            disabled={!isConnected}
            className="px-3 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:bg-gray-300 transition-colors"
          >
            Enter
          </button>
          <button
            onClick={() => sendKeyCommand('ArrowUp')}
            disabled={!isConnected}
            className="px-3 py-2 bg-gray-600 text-white rounded text-sm hover:bg-gray-700 disabled:bg-gray-300 transition-colors"
          >
            ↑
          </button>
          <button
            onClick={() => sendKeyCommand('ArrowDown')}
            disabled={!isConnected}
            className="px-3 py-2 bg-gray-600 text-white rounded text-sm hover:bg-gray-700 disabled:bg-gray-300 transition-colors"
          >
            ↓
          </button>
          <button
            onClick={() => sendCustomCommand('ls -la')}
            disabled={!isConnected}
            className="px-3 py-2 bg-purple-600 text-white rounded text-sm hover:bg-purple-700 disabled:bg-gray-300 transition-colors"
          >
            ls -la
          </button>
        </div>

        <div className="text-xs text-gray-500 mt-2">
          💡 Use <strong>Send</strong> to execute commands with Enter, or <strong>📋 Paste</strong> to input text without Enter (perfect for API keys on mobile!)
        </div>
      </div>
    </div>
  );
}