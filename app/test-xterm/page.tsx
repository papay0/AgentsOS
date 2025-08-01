'use client';

import React, { useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import type { XtermTerminalRef } from '@/components/xterm-terminal';

// Dynamically import xterm to avoid SSR issues
const XtermTerminal = dynamic(() => import('@/components/xterm-terminal'), { 
  ssr: false,
  loading: () => <div className="h-96 bg-black rounded-lg flex items-center justify-center text-white">Loading terminal...</div>
});

export default function TestXtermPage() {
  const terminalRef = useRef<XtermTerminalRef>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('Disconnected');
  const [customInput, setCustomInput] = useState('');
  
  // Your sandbox ID
  const sandboxId = '05563f33-97e3-4337-aeaa-889e4d88870b';
  const httpUrl = `https://9999-${sandboxId}.proxy.daytona.work/`;
  const [wsEndpoint, setWsEndpoint] = useState('/ws');
  const wsUrl = `wss://9999-${sandboxId}.proxy.daytona.work${wsEndpoint}`;

  // Test if HTTP endpoint is reachable
  const testHttpEndpoint = async () => {
    try {
      console.log('🔍 Testing HTTP endpoint:', httpUrl);
      const response = await fetch(httpUrl, { method: 'HEAD' });
      console.log('✅ HTTP endpoint status:', response.status);
      return response.ok;
    } catch (error) {
      console.error('❌ HTTP endpoint test failed:', error);
      return false;
    }
  };

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

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4">
        <h1 className="text-xl font-semibold">Direct xterm.js Terminal Test</h1>
        <p className="text-sm text-gray-600 mt-1">
          Direct WebSocket connection to ttyd - No iframe! 🎉
        </p>
        <div className="flex items-center gap-4 mt-2">
          <div className={`flex items-center gap-2 text-sm`}>
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
            <span>{connectionStatus}</span>
          </div>
          <div className="text-xs text-gray-500">
            WebSocket: {wsUrl}
          </div>
          <button
            onClick={testHttpEndpoint}
            className="text-xs text-blue-600 hover:text-blue-800 mr-2"
          >
            Test HTTP Endpoint
          </button>
          <button
            onClick={() => {
              if (terminalRef.current) {
                terminalRef.current.sendKey('Enter');
              }
            }}
            disabled={!isConnected}
            className="text-xs text-green-600 hover:text-green-800 disabled:text-gray-400 mr-2"
          >
            Send Enter
          </button>
          <button
            onClick={() => {
              if (terminalRef.current) {
                terminalRef.current.sendCommand('echo "Manual test command"', true);
              }
            }}
            disabled={!isConnected}
            className="text-xs text-blue-600 hover:text-blue-800 disabled:text-gray-400 mr-2"
          >
            Send Test Command
          </button>
          <a
            href={httpUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-purple-600 hover:text-purple-800 mr-2"
          >
            Open ttyd in Browser
          </a>
          <select
            value={wsEndpoint}
            onChange={(e) => setWsEndpoint(e.target.value)}
            className="text-xs border border-gray-300 rounded px-1 py-0.5"
          >
            <option value="/ws">/ws</option>
            <option value="/websocket">/websocket</option>
            <option value="/socket">/socket</option>
            <option value="/terminal">/terminal</option>
            <option value="">(no path)</option>
          </select>
          <span className="text-xs text-gray-500 ml-1">WS Path</span>
        </div>
      </div>

      {/* Terminal Container */}
      <div className="flex-1 p-4">
        <div className="max-w-6xl mx-auto">
          <div className="bg-black rounded-lg overflow-hidden shadow-lg">
            <XtermTerminal
              ref={terminalRef}
              wsUrl={wsUrl}
              onConnectionChange={setIsConnected}
              onStatusChange={setConnectionStatus}
            />
          </div>
        </div>
      </div>

      {/* Mobile-Friendly Command Palette */}
      <div className="bg-white border-t border-gray-200 p-4">
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
                  sendCustomCommand(customInput);
                  setCustomInput('');
                }
              }}
              placeholder="Type command or API key..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm"
              disabled={!isConnected}
            />
            <button
              onClick={() => {
                sendCustomCommand(customInput);
                setCustomInput('');
              }}
              disabled={!isConnected || !customInput}
              className="px-4 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:bg-gray-300"
            >
              Send
            </button>
            <button
              onClick={() => {
                sendCustomCommand(customInput, false); // Paste without Enter
                setCustomInput('');
              }}
              disabled={!isConnected || !customInput}
              className="px-4 py-2 bg-green-600 text-white rounded text-sm hover:bg-green-700 disabled:bg-gray-300"
              title="Paste without Enter (for API keys)"
            >
              📋 Paste
            </button>
          </div>

          {/* Quick Commands */}
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2">
            <button
              onClick={() => sendKeyCommand('Ctrl+C')}
              disabled={!isConnected}
              className="px-3 py-2 bg-red-600 text-white rounded text-sm hover:bg-red-700 disabled:bg-gray-300"
            >
              Ctrl+C
            </button>
            <button
              onClick={() => sendKeyCommand('Ctrl+L')}
              disabled={!isConnected}
              className="px-3 py-2 bg-gray-600 text-white rounded text-sm hover:bg-gray-700 disabled:bg-gray-300"
            >
              Clear
            </button>
            <button
              onClick={() => sendKeyCommand('Enter')}
              disabled={!isConnected}
              className="px-3 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:bg-gray-300"
            >
              Enter
            </button>
            <button
              onClick={() => sendKeyCommand('ArrowUp')}
              disabled={!isConnected}
              className="px-3 py-2 bg-gray-600 text-white rounded text-sm hover:bg-gray-700 disabled:bg-gray-300"
            >
              ↑
            </button>
            <button
              onClick={() => sendKeyCommand('ArrowDown')}
              disabled={!isConnected}
              className="px-3 py-2 bg-gray-600 text-white rounded text-sm hover:bg-gray-700 disabled:bg-gray-300"
            >
              ↓
            </button>
            <button
              onClick={() => sendCustomCommand('ls -la')}
              disabled={!isConnected}
              className="px-3 py-2 bg-purple-600 text-white rounded text-sm hover:bg-purple-700 disabled:bg-gray-300"
            >
              ls -la
            </button>
          </div>

          <div className="text-xs text-gray-500 mt-2">
            💡 Use <strong>Send</strong> to execute commands with Enter, or <strong>📋 Paste</strong> to input text without Enter (perfect for API keys on mobile!)
          </div>
        </div>
      </div>
    </div>
  );
}