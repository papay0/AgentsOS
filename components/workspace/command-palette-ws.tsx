'use client';

import React, { useCallback, useRef, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TTYDClient } from '@/lib/ttyd-client';
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
  Clipboard,
  Trash2,
  RefreshCw,
  Wifi,
  WifiOff
} from 'lucide-react';

interface Command {
  id: string;
  label: string;
  icon?: React.ReactNode;
  action: () => void;
  category: 'navigation' | 'control' | 'edit' | 'action';
}

interface CommandPaletteWSProps {
  terminalUrl: string;
  className?: string;
}

export function CommandPaletteWS({ terminalUrl, className = '' }: CommandPaletteWSProps) {
  const [showPasteInput, setShowPasteInput] = useState(false);
  const [pasteValue, setPasteValue] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const pasteInputRef = useRef<HTMLInputElement>(null);
  const clientRef = useRef<TTYDClient | null>(null);

  useEffect(() => {
    const client = new TTYDClient(terminalUrl);
    clientRef.current = client;

    // Listen for terminal output
    client.onMessage((data) => {
      console.log('Terminal output received:', data);
    });

    client.connect()
      .then(() => {
        setIsConnected(true);
        setConnectionError(null);
      })
      .catch((error) => {
        console.error('Failed to connect to terminal:', error);
        setConnectionError('Failed to connect to terminal');
        setIsConnected(false);
      });

    return () => {
      client.disconnect();
    };
  }, [terminalUrl]);

  const sendKey = useCallback((key: string, ctrl = false, alt = false, shift = false) => {
    if (!clientRef.current || !isConnected) {
      console.warn('Not connected to terminal');
      return;
    }

    clientRef.current.sendKey(key, ctrl, alt, shift);
  }, [isConnected]);

  const sendText = useCallback((text: string) => {
    if (!clientRef.current || !isConnected) {
      console.warn('Not connected to terminal');
      return;
    }

    clientRef.current.sendInput(text);
  }, [isConnected]);

  const handlePaste = useCallback(() => {
    setShowPasteInput(true);
    setTimeout(() => {
      pasteInputRef.current?.focus();
    }, 100);
  }, []);

  const handlePasteSubmit = useCallback(() => {
    if (pasteValue) {
      sendText(pasteValue);
      setPasteValue('');
      setShowPasteInput(false);
    }
  }, [pasteValue, sendText]);

  const commands: Command[] = [
    // Test commands
    { id: 'test-a', label: 'A', action: () => sendText('a'), category: 'action' },
    { id: 'test-hello', label: 'Hello', action: () => sendText('hello'), category: 'action' },
    { id: 'test-ls', label: 'ls', action: () => sendText('ls'), category: 'action' },
    
    // Navigation
    { id: 'up', label: '↑', icon: <ArrowUp className="w-4 h-4" />, action: () => sendKey('ArrowUp'), category: 'navigation' },
    { id: 'down', label: '↓', icon: <ArrowDown className="w-4 h-4" />, action: () => sendKey('ArrowDown'), category: 'navigation' },
    { id: 'left', label: '←', icon: <ArrowLeft className="w-4 h-4" />, action: () => sendKey('ArrowLeft'), category: 'navigation' },
    { id: 'right', label: '→', icon: <ArrowRight className="w-4 h-4" />, action: () => sendKey('ArrowRight'), category: 'navigation' },
    { id: 'home', label: 'Home', icon: <Home className="w-4 h-4" />, action: () => sendKey('Home'), category: 'navigation' },
    { id: 'end', label: 'End', icon: <End className="w-4 h-4" />, action: () => sendKey('End'), category: 'navigation' },
    
    // Control
    { id: 'ctrl-c', label: 'Ctrl+C', icon: <X className="w-4 h-4" />, action: () => sendKey('c', true), category: 'control' },
    { id: 'ctrl-d', label: 'Ctrl+D', action: () => sendKey('d', true), category: 'control' },
    { id: 'ctrl-l', label: 'Ctrl+L', icon: <RefreshCw className="w-4 h-4" />, action: () => sendKey('l', true), category: 'control' },
    
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
        <div className="flex items-center gap-2 text-xs text-gray-600">
          {isConnected ? (
            <>
              <Wifi className="w-3 h-3 text-green-600" />
              <span>Connected</span>
            </>
          ) : (
            <>
              <WifiOff className="w-3 h-3 text-red-600" />
              <span>{connectionError || 'Disconnected'}</span>
            </>
          )}
        </div>
      </div>
      
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
            />
            <Button
              size="sm"
              onClick={handlePasteSubmit}
              disabled={!pasteValue || !isConnected}
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
                disabled={!isConnected}
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