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
 * Clean, dock-style interface for sending commands and keys to terminals.
 * Now controlled externally by parent component.
 */
export default function TerminalCommandPalette({
  terminalRef,
  isConnected,
  className = ""
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
    <div className={`${className} p-3`}>
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
          placeholder="Text to paste..."
          className="flex-1 px-3 py-2 bg-gray-50/80 backdrop-blur-sm border border-gray-200/50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 focus:bg-white transition-all duration-200"
          disabled={!isConnected}
        />
        <button
          onClick={handleInputSubmit}
          disabled={!isConnected || !customInput.trim()}
          className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl text-sm font-semibold hover:from-blue-600 hover:to-blue-700 disabled:from-gray-300 disabled:to-gray-400 transition-all duration-200 active:scale-95 shadow-lg shadow-blue-500/30"
        >
          Send
        </button>
        <button
          onClick={handlePaste}
          disabled={!isConnected || !customInput.trim()}
          className="px-3 py-2 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl text-sm font-semibold hover:from-emerald-600 hover:to-emerald-700 disabled:from-gray-300 disabled:to-gray-400 transition-all duration-200 active:scale-95 shadow-lg shadow-emerald-500/30"
          title="Paste without Enter"
        >
          📋
        </button>
      </div>

      {/* Quick Action Buttons - Compact Dock Style */}
      <div className="flex gap-2 justify-center">
        <button
          onClick={() => sendKeyCommand('Ctrl+C')}
          disabled={!isConnected}
          className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 text-white rounded-xl text-xs font-bold hover:from-red-600 hover:to-red-700 disabled:from-gray-300 disabled:to-gray-400 transition-all duration-200 active:scale-95 shadow-lg shadow-red-500/40 hover:shadow-xl hover:shadow-red-500/50"
        >
          Ctrl+C
        </button>
        <button
          onClick={() => sendKeyCommand('Ctrl+L')}
          disabled={!isConnected}
          className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-slate-500 to-slate-600 text-white rounded-xl text-xs font-bold hover:from-slate-600 hover:to-slate-700 disabled:from-gray-300 disabled:to-gray-400 transition-all duration-200 active:scale-95 shadow-lg shadow-slate-500/40 hover:shadow-xl hover:shadow-slate-500/50"
        >
          Clear
        </button>
        <button
          onClick={() => sendKeyCommand('Enter')}
          disabled={!isConnected}
          className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl text-xs font-bold hover:from-blue-600 hover:to-blue-700 disabled:from-gray-300 disabled:to-gray-400 transition-all duration-200 active:scale-95 shadow-lg shadow-blue-500/40 hover:shadow-xl hover:shadow-blue-500/50"
        >
          Enter
        </button>
        <button
          onClick={() => sendKeyCommand('ArrowUp')}
          disabled={!isConnected}
          className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-xl text-base font-bold hover:from-purple-600 hover:to-purple-700 disabled:from-gray-300 disabled:to-gray-400 transition-all duration-200 active:scale-95 shadow-lg shadow-purple-500/40 hover:shadow-xl hover:shadow-purple-500/50"
        >
          ↑
        </button>
        <button
          onClick={() => sendKeyCommand('ArrowDown')}
          disabled={!isConnected}
          className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-xl text-base font-bold hover:from-orange-600 hover:to-orange-700 disabled:from-gray-300 disabled:to-gray-400 transition-all duration-200 active:scale-95 shadow-lg shadow-orange-500/40 hover:shadow-xl hover:shadow-orange-500/50"
        >
          ↓
        </button>
      </div>
    </div>
  );
}