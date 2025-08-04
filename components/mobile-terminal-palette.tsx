'use client';

import React, { useState } from 'react';
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
  const [pasteText, setPasteText] = useState('');

  const sendKey = (key: string) => {
    if (terminalRef.current && isConnected) {
      terminalRef.current.sendKey(key);
    }
  };

  const sendCommand = (command: string, addEnter = false) => {
    if (terminalRef.current && isConnected) {
      terminalRef.current.sendCommand(command, addEnter);
    }
  };

  const handlePaste = async () => {
    try {
      // Try to read from clipboard
      const text = await navigator.clipboard.readText();
      if (text && terminalRef.current && isConnected) {
        terminalRef.current.sendCommand(text, false);
      }
    } catch (err) {
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
    <div className={`${className} bg-gray-800 border-t border-gray-700`}>
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