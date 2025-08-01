'use client';

import React, { useRef, useState, useEffect } from 'react';
import { CommandPaletteWS } from '@/components/workspace/command-palette-ws';
import { CommandPaletteAPI } from '@/components/workspace/command-palette-api';
import { CommandPaletteInjector } from '@/components/workspace/command-palette-injector';
import { CommandPaletteDirect } from '@/components/workspace/command-palette-direct';
import { TerminalPane } from '@/components/workspace/terminal-pane';
import { testTTYDConnection } from '@/lib/ttyd-direct';
import { interceptWebSockets } from '@/lib/websocket-inspector';
import { debugWebSocketConnections } from '@/lib/debug-websockets';
import type { TerminalPane as TerminalPaneType } from '@/types/workspace';

export default function TestCommandsPage() {
  const terminalRef = useRef<HTMLIFrameElement>(null);
  const [showCommands, setShowCommands] = useState(true);
  const [terminalUrl, setTerminalUrl] = useState('https://9999-05563f33-97e3-4337-aeaa-889e4d88870b.proxy.daytona.work/');
  const [sandboxId, setSandboxId] = useState('05563f33-97e3-4337-aeaa-889e4d88870b');
  const [useAPI, setUseAPI] = useState(true);
  const [useInjector, setUseInjector] = useState(false);
  const [useDirect, setUseDirect] = useState(false);

  useEffect(() => {
    // Install WebSocket interceptor to see what the iframe is doing
    interceptWebSockets();
    // Enable WebSocket debugging
    debugWebSocketConnections();
  }, []);
  
  // Mock terminal data - update with your actual terminal URL
  const terminal: TerminalPaneType = {
    id: 'test-terminal',
    url: terminalUrl || 'https://9999-test.proxy.daytona.work/',
    title: 'Test Terminal'
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <div className="bg-white border-b border-gray-200 p-4">
        <h1 className="text-xl font-semibold">Terminal Command Palette Test</h1>
        <p className="text-sm text-gray-600 mt-1">
          Testing {useDirect ? 'Direct WebSocket' : useInjector ? 'Iframe Injector' : useAPI ? 'API-based' : 'WebSocket-based'} terminal control
        </p>
        
        <div className="mt-2 flex gap-2 items-center">
          <input
            type="text"
            placeholder="Enter sandbox ID (e.g., 05563f33-97e3-4337-aeaa-889e4d88870b)"
            value={sandboxId}
            onChange={(e) => setSandboxId(e.target.value)}
            className="flex-1 px-3 py-1 border border-gray-300 rounded text-sm"
          />
        </div>
        
        <div className="mt-2 flex gap-2 items-center">
          <input
            type="text"
            placeholder="Enter terminal URL (e.g., https://9999-xxx.proxy.daytona.work/)"
            value={terminalUrl}
            onChange={(e) => setTerminalUrl(e.target.value)}
            className="flex-1 px-3 py-1 border border-gray-300 rounded text-sm"
          />
        </div>
        
        <div className="mt-3 flex gap-2 items-center flex-wrap">
          <button
            className={`px-3 py-1 rounded text-sm font-medium ${
              useAPI && !useInjector && !useDirect
                ? 'bg-blue-600 text-white hover:bg-blue-700' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
            onClick={() => { setUseAPI(true); setUseInjector(false); setUseDirect(false); }}
          >
            API Mode
          </button>
          <button
            className={`px-3 py-1 rounded text-sm font-medium ${
              !useAPI && !useInjector && !useDirect
                ? 'bg-blue-600 text-white hover:bg-blue-700' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
            onClick={() => { setUseAPI(false); setUseInjector(false); setUseDirect(false); }}
          >
            WebSocket Mode
          </button>
          <button
            className={`px-3 py-1 rounded text-sm font-medium ${
              useInjector && !useDirect
                ? 'bg-green-600 text-white hover:bg-green-700' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
            onClick={() => { setUseInjector(true); setUseAPI(false); setUseDirect(false); }}
          >
            Injector Mode
          </button>
          <button
            className={`px-3 py-1 rounded text-sm font-medium ${
              useDirect
                ? 'bg-purple-600 text-white hover:bg-purple-700' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
            onClick={() => { setUseDirect(true); setUseAPI(false); setUseInjector(false); }}
          >
            Direct Mode
          </button>
          
          {!useAPI && (
            <>
              <button
                className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                onClick={() => terminalUrl && testTTYDConnection(terminalUrl)}
              >
                Test Direct
              </button>
              <button
                className="px-3 py-1 bg-purple-600 text-white rounded text-sm hover:bg-purple-700"
                onClick={() => {
                  console.log('🔄 Reloading iframe to see WebSocket traffic...');
                  if (terminalRef.current) {
                    terminalRef.current.src = terminalRef.current.src;
                  }
                }}
              >
                Reload Terminal
              </button>
              <button
                className="px-3 py-1 bg-orange-600 text-white rounded text-sm hover:bg-orange-700"
                onClick={() => {
                  console.log('🔍 Listing active WebSocket connections...');
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  (window as any).listActiveWebSockets?.();
                }}
              >
                Debug WebSockets
              </button>
            </>
          )}
          
          <button
            className="text-sm text-blue-600 hover:text-blue-800"
            onClick={() => setShowCommands(!showCommands)}
          >
            {showCommands ? 'Hide' : 'Show'} Command Palette
          </button>
        </div>
      </div>
      
      <div className="flex-1 p-4">
        <div className="max-w-4xl mx-auto flex flex-col gap-4">
          <div className="h-[400px] overflow-hidden">
            <TerminalPane
              ref={terminalRef}
              terminal={terminal}
              onRemove={() => console.log('Remove terminal')}
            />
          </div>
          
          {showCommands && (
            <div className="pb-8">
              {useDirect ? (
                <CommandPaletteDirect
                  terminalUrl={terminal.url}
                  className="bg-white rounded-lg shadow-lg"
                />
              ) : useInjector ? (
                <CommandPaletteInjector
                  terminalIframe={terminalRef.current}
                  className="bg-white rounded-lg shadow-lg"
                />
              ) : useAPI ? (
                <CommandPaletteAPI
                  sandboxId={sandboxId}
                  className="bg-white rounded-lg shadow-lg"
                />
              ) : (
                <CommandPaletteWS
                  terminalUrl={terminal.url}
                  className="bg-white rounded-lg shadow-lg"
                />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}