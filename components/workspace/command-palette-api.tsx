'use client';

import React, { useCallback, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  CornerDownLeft, 
  ArrowUp, 
  ArrowDown, 
  ArrowLeft, 
  ArrowRight,
  Home,
  MoveHorizontalIcon as End,
  Delete,
  X,
  Copy,
  Clipboard,
  Trash2,
  RefreshCw,
  Wifi,
  WifiOff,
  Loader2
} from 'lucide-react';

interface Command {
  id: string;
  label: string;
  icon?: React.ReactNode;
  action: () => void;
  category: 'navigation' | 'control' | 'edit' | 'action' | 'test';
}

interface CommandPaletteAPIProps {
  sandboxId: string;
  className?: string;
}

export function CommandPaletteAPI({ sandboxId, className = '' }: CommandPaletteAPIProps) {
  const [showPasteInput, setShowPasteInput] = useState(false);
  const [pasteValue, setPasteValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [lastResult, setLastResult] = useState<string>('');
  const pasteInputRef = useRef<HTMLInputElement>(null);

  const sendCommand = useCallback(async (command: string, type: 'text' | 'key' | 'paste', useWebSocket = false) => {
    if (isLoading) return;
    
    setIsLoading(true);
    setLastResult('');
    
    try {
      const endpoint = useWebSocket ? '/api/send-terminal-websocket' : '/api/send-terminal-command';
      console.log(`Sending command via ${useWebSocket ? 'WebSocket' : 'API'}:`, { command, type, sandboxId });
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sandboxId,
          command,
          type
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        console.log('✅ Command sent successfully:', result);
        setLastResult(`✅ ${result.message}`);
      } else {
        console.error('❌ Command failed:', result);
        setLastResult(`❌ ${result.message}`);
      }
    } catch (error) {
      console.error('❌ API error:', error);
      setLastResult(`❌ Network error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  }, [sandboxId, isLoading]);

  const sendText = useCallback((text: string) => {
    sendCommand(text, 'text');
  }, [sendCommand]);

  const sendKey = useCallback((key: string) => {
    sendCommand(key, 'key');
  }, [sendCommand]);

  const handlePaste = useCallback(() => {
    setShowPasteInput(true);
    setTimeout(() => {
      pasteInputRef.current?.focus();
    }, 100);
  }, []);

  const handlePasteSubmit = useCallback(() => {
    if (pasteValue) {
      sendCommand(pasteValue, 'paste');
      setPasteValue('');
      setShowPasteInput(false);
    }
  }, [pasteValue, sendCommand]);

  const commands: Command[] = [
    // Test commands
    { id: 'test-a', label: 'A', action: () => sendText('a'), category: 'test' },
    { id: 'test-hello', label: 'Hello', action: () => sendText('hello'), category: 'test' },
    { id: 'test-ls', label: 'ls', action: () => sendText('ls'), category: 'test' },
    { id: 'test-ws-ls', label: 'WS ls', action: () => sendCommand('ls', 'text', true), category: 'test' },
    { id: 'test-ws-hello', label: 'WS Hello', action: () => sendCommand('hello', 'text', true), category: 'test' },
    { id: 'debug-terminal', label: 'Debug', action: async () => {
      setIsLoading(true);
      try {
        const response = await fetch('/api/debug-terminal-endpoints', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sandboxId })
        });
        const result = await response.json();
        console.log('🔍 Terminal Debug Info:', result);
        setLastResult('Debug info logged to console');
      } catch (error) {
        console.error('Debug failed:', error);
        setLastResult('Debug failed');
      } finally {
        setIsLoading(false);
      }
    }, category: 'test' },
    
    // Navigation
    { id: 'up', label: '↑', icon: <ArrowUp className="w-4 h-4" />, action: () => sendKey('ArrowUp'), category: 'navigation' },
    { id: 'down', label: '↓', icon: <ArrowDown className="w-4 h-4" />, action: () => sendKey('ArrowDown'), category: 'navigation' },
    { id: 'left', label: '←', icon: <ArrowLeft className="w-4 h-4" />, action: () => sendKey('ArrowLeft'), category: 'navigation' },
    { id: 'right', label: '→', icon: <ArrowRight className="w-4 h-4" />, action: () => sendKey('ArrowRight'), category: 'navigation' },
    { id: 'home', label: 'Home', icon: <Home className="w-4 h-4" />, action: () => sendKey('Home'), category: 'navigation' },
    { id: 'end', label: 'End', icon: <End className="w-4 h-4" />, action: () => sendKey('End'), category: 'navigation' },
    
    // Control
    { id: 'ctrl-c', label: 'Ctrl+C', icon: <X className="w-4 h-4" />, action: () => sendKey('Ctrl+C'), category: 'control' },
    { id: 'ctrl-d', label: 'Ctrl+D', action: () => sendKey('Ctrl+D'), category: 'control' },
    { id: 'ctrl-l', label: 'Ctrl+L', icon: <RefreshCw className="w-4 h-4" />, action: () => sendKey('Ctrl+L'), category: 'control' },
    
    // Edit
    { id: 'paste', label: 'Paste', icon: <Clipboard className="w-4 h-4" />, action: handlePaste, category: 'edit' },
    { id: 'backspace', label: '⌫', icon: <Delete className="w-4 h-4" />, action: () => sendKey('Backspace'), category: 'edit' },
    { id: 'delete', label: 'Del', icon: <Trash2 className="w-4 h-4" />, action: () => sendKey('Delete'), category: 'edit' },
    
    // Action
    { id: 'enter', label: 'Enter', icon: <CornerDownLeft className="w-4 h-4" />, action: () => sendKey('Enter'), category: 'action' },
    { id: 'tab', label: 'Tab', action: () => sendKey('Tab'), category: 'action' },
    { id: 'escape', label: 'Esc', action: () => sendKey('Escape'), category: 'action' },
  ];

  return (
    <div className={`bg-white border-t border-gray-200 ${className}`}>
      <div className="px-2 py-1 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs">
          {isLoading ? (
            <>
              <Loader2 className="w-3 h-3 animate-spin text-blue-600" />
              <span className="text-blue-600">Sending...</span>
            </>
          ) : (
            <>
              <Wifi className="w-3 h-3 text-green-600" />
              <span className="text-gray-600">API Ready</span>
            </>
          )}
        </div>
        <div className="text-xs text-gray-500">Sandbox: {sandboxId.slice(0, 8)}...</div>
      </div>
      
      {lastResult && (
        <div className="px-2 py-1 bg-gray-50 border-b border-gray-100">
          <div className="text-xs text-gray-700">{lastResult}</div>
        </div>
      )}
      
      <div className="p-2">
        {showPasteInput ? (
          <div className="flex gap-2 items-center">
            <Input
              ref={pasteInputRef}
              type="text"
              placeholder="Paste text here..."
              value={pasteValue}
              onChange={(e) => setPasteValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handlePasteSubmit();
                } else if (e.key === 'Escape') {
                  setShowPasteInput(false);
                  setPasteValue('');
                }
              }}
              className="flex-1"
              disabled={isLoading}
            />
            <Button
              size="sm"
              onClick={handlePasteSubmit}
              disabled={!pasteValue || isLoading}
            >
              Send
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setShowPasteInput(false);
                setPasteValue('');
              }}
              disabled={isLoading}
            >
              Cancel
            </Button>
          </div>
        ) : (
          <div className="flex gap-1 overflow-x-auto pb-1">
            {commands.map((cmd) => (
              <Button
                key={cmd.id}
                size="sm"
                variant="outline"
                onClick={cmd.action}
                disabled={isLoading}
                className="shrink-0 h-8 px-3 text-xs font-medium"
              >
                {cmd.icon || cmd.label}
              </Button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}