'use client';

import React, { useState, useRef, KeyboardEvent } from 'react';
import type { TTYDTerminalRef } from './ttyd-terminal';

interface MobileTerminalPaletteProps {
  /** Reference to the terminal instance */
  terminalRef: React.RefObject<TTYDTerminalRef | null>;
  /** Whether the terminal is connected */
  isConnected: boolean;
  /** Custom CSS classes */
  className?: string;
}

interface ToolbarButton {
  id: string;
  label: string;
  action: () => void;
  bgColor?: string;
}

/**
 * MobileTerminalPalette - Thin keyboard toolbar for terminal commands
 * 
 * Matches iOS terminal apps with horizontal scrollable buttons above keyboard
 */
export default function MobileTerminalPalette({
  terminalRef,
  isConnected,
  className = ""
}: MobileTerminalPaletteProps) {
  const [commandText, setCommandText] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const sendKey = (key: string) => {
    if (terminalRef.current && isConnected) {
      terminalRef.current.sendKey(key);
    }
  };

  const sendCommand = () => {
    if (commandText.trim() && terminalRef.current && isConnected) {
      // Send the command without enter first
      terminalRef.current.sendCommand(commandText, false);
      // Then send Enter key separately
      terminalRef.current.sendKey('Enter');
      setCommandText('');
      // Keep focus on input for continuous typing
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendCommand();
    }
  };

  const handlePaste = async () => {
    try {
      // Try to read from clipboard
      const text = await navigator.clipboard.readText();
      if (text && terminalRef.current && isConnected) {
        terminalRef.current.sendCommand(text, false);
      }
    } catch {
      // Fallback: show prompt for manual paste
      const text = prompt('Paste text here:');
      if (text && terminalRef.current && isConnected) {
        terminalRef.current.sendCommand(text, false);
      }
    }
  };

  // Toolbar buttons matching terminal keyboard extensions
  const toolbarButtons: ToolbarButton[] = [
    { id: 'left', label: '←', action: () => sendKey('ArrowLeft') },
    { id: 'alt', label: 'alt', action: () => {}, bgColor: 'bg-gray-600' },
    { id: 'tab', label: 'tab', action: () => sendKey('\x09') },
    { id: 'ins', label: 'ins', action: () => sendKey('Insert'), bgColor: 'bg-gray-600' },
    { id: 'del', label: 'del', action: () => sendKey('\x7f') },
    { id: 'auto', label: 'auto', action: () => {}, bgColor: 'bg-gray-600' },
    { id: 'up', label: '↑', action: () => sendKey('ArrowUp') },
    { id: 'keyboard', label: '⌨', action: () => {}, bgColor: 'bg-gray-600' },
    { id: 'right', label: '→', action: () => sendKey('ArrowRight') },
    { id: 'down', label: '↓', action: () => sendKey('ArrowDown') },
    { id: 'ctrl-c', label: '^C', action: () => sendKey('Ctrl+C') },
    { id: 'paste', label: 'Paste', action: handlePaste },
    { id: 'enter', label: 'return', action: () => sendKey('Enter'), bgColor: 'bg-blue-600' },
  ];

  return (
    <div className={`mobile-terminal-palette ${className} bg-gray-800 border-t border-gray-700`}>
      {/* Command input field */}
      <div className="flex items-center gap-2 px-2 py-2 border-b border-gray-700">
        <input
          ref={inputRef}
          type="text"
          value={commandText}
          onChange={(e) => setCommandText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type command..."
          disabled={!isConnected}
          autoComplete="on"
          autoCorrect="on"
          autoCapitalize="off"
          spellCheck="true"
          className={`
            flex-1 px-3 py-2 bg-gray-700 text-white rounded-lg text-base
            placeholder-gray-400 outline-none focus:ring-2 focus:ring-blue-500
            disabled:opacity-50 disabled:cursor-not-allowed
          `}
          style={{ fontSize: '16px' }}
        />
        <button
          onClick={sendCommand}
          disabled={!isConnected || !commandText.trim()}
          className={`
            px-4 py-2 rounded-lg text-white text-sm font-medium
            transition-all duration-150 active:scale-95
            ${commandText.trim() && isConnected 
              ? 'bg-blue-600 hover:bg-blue-700' 
              : 'bg-gray-600 opacity-50 cursor-not-allowed'}
          `}
        >
          Send
        </button>
      </div>

      {/* Thin horizontal scrollable toolbar */}
      <div className="flex overflow-x-auto scrollbar-hide py-1.5 px-2 gap-1.5">
        {toolbarButtons.map((button) => (
          <button
            key={button.id}
            onClick={button.action}
            disabled={!isConnected}
            className={`
              flex-shrink-0 px-3 py-1.5 rounded-lg text-white text-sm font-medium
              transition-all duration-150 active:scale-95
              disabled:opacity-50 disabled:cursor-not-allowed
              ${button.bgColor || 'bg-gray-700 hover:bg-gray-600'}
            `}
          >
            {button.label}
          </button>
        ))}
      </div>

      <style jsx>{`
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
}