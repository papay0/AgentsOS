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
  RefreshCw
} from 'lucide-react';

interface Command {
  id: string;
  label: string;
  icon?: React.ReactNode;
  action: () => void;
  category: 'navigation' | 'control' | 'edit' | 'action';
}

interface CommandPaletteProps {
  targetIframeRef: React.RefObject<HTMLIFrameElement | null>;
  className?: string;
}

export function CommandPalette({ targetIframeRef, className = '' }: CommandPaletteProps) {
  const [showPasteInput, setShowPasteInput] = useState(false);
  const [pasteValue, setPasteValue] = useState('');
  const pasteInputRef = useRef<HTMLInputElement>(null);

  const sendKeyEvent = useCallback((key: string, code: string, ctrlKey = false, shiftKey = false) => {
    if (!targetIframeRef.current) {
      console.warn('No iframe ref available');
      return;
    }

    console.log('Attempting to send key event:', { key, code, ctrlKey, shiftKey });
    console.log('Iframe element:', targetIframeRef.current);
    console.log('Iframe contentWindow:', targetIframeRef.current.contentWindow);
    console.log('Iframe src:', targetIframeRef.current.src);

    try {
      // Try multiple approaches
      
      // Approach 1: PostMessage to iframe
      targetIframeRef.current.contentWindow?.postMessage({
        type: 'keypress',
        key,
        code,
        ctrlKey,
        shiftKey
      }, '*');
      
      // Approach 2: Focus iframe and dispatch event
      targetIframeRef.current.focus();
      
      // Approach 3: Dispatch to iframe element itself
      const event = new KeyboardEvent('keydown', {
        key,
        code,
        keyCode: code.charCodeAt(0),
        which: code.charCodeAt(0),
        ctrlKey,
        shiftKey,
        bubbles: true,
        cancelable: true,
      });
      
      targetIframeRef.current.dispatchEvent(event);
      
      // Approach 4: Try contentWindow if available
      if (targetIframeRef.current.contentWindow) {
        targetIframeRef.current.contentWindow.dispatchEvent(event);
      }
      
      console.log(`Attempted to send key event: ${ctrlKey ? 'Ctrl+' : ''}${shiftKey ? 'Shift+' : ''}${key}`);
    } catch (error) {
      console.error('Failed to send key event:', error);
      alert(`Failed to send key: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }, [targetIframeRef]);

  const sendText = useCallback((text: string) => {
    if (!targetIframeRef.current?.contentWindow) {
      console.warn('No iframe window available');
      return;
    }

    // Send each character
    for (const char of text) {
      sendKeyEvent(char, char);
    }
  }, [targetIframeRef, sendKeyEvent]);

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

  // Key codes for special keys
  const KEY_CODES: { [key: string]: number } = {
    'Enter': 13,
    'Escape': 27,
    'Backspace': 8,
    'Tab': 9,
    'Delete': 46,
    'ArrowUp': 38,
    'ArrowDown': 40,
    'ArrowLeft': 37,
    'ArrowRight': 39,
    'Home': 36,
    'End': 35,
  };

  const sendKeyEventV2 = useCallback((key: string, keyCode?: number, ctrlKey = false, shiftKey = false) => {
    if (!targetIframeRef.current) {
      console.warn('No iframe ref available');
      return;
    }

    const actualKeyCode = keyCode || KEY_CODES[key] || key.charCodeAt(0);
    
    console.log('SendKeyEventV2:', { key, keyCode: actualKeyCode, ctrlKey, shiftKey });

    try {
      // Try sending a keyboard input event which might work better with ttyd
      const event = new KeyboardEvent('keypress', {
        key,
        keyCode: actualKeyCode,
        which: actualKeyCode,
        charCode: actualKeyCode,
        ctrlKey,
        shiftKey,
        bubbles: true,
        cancelable: true,
      });
      
      // Focus the iframe first
      targetIframeRef.current.focus();
      
      // Try dispatching to the iframe document
      if (targetIframeRef.current.contentDocument) {
        targetIframeRef.current.contentDocument.dispatchEvent(event);
      }
      
      // Also try the body
      if (targetIframeRef.current.contentDocument?.body) {
        targetIframeRef.current.contentDocument.body.dispatchEvent(event);
      }
      
    } catch (error) {
      console.error('Failed in sendKeyEventV2:', error);
    }
  }, [targetIframeRef]);

  const commands: Command[] = [
    // Navigation
    { id: 'up', label: '↑', icon: <ArrowUp className="w-4 h-4" />, action: () => sendKeyEventV2('ArrowUp'), category: 'navigation' },
    { id: 'down', label: '↓', icon: <ArrowDown className="w-4 h-4" />, action: () => sendKeyEventV2('ArrowDown'), category: 'navigation' },
    { id: 'left', label: '←', icon: <ArrowLeft className="w-4 h-4" />, action: () => sendKeyEventV2('ArrowLeft'), category: 'navigation' },
    { id: 'right', label: '→', icon: <ArrowRight className="w-4 h-4" />, action: () => sendKeyEventV2('ArrowRight'), category: 'navigation' },
    { id: 'home', label: 'Home', icon: <Home className="w-4 h-4" />, action: () => sendKeyEventV2('Home'), category: 'navigation' },
    { id: 'end', label: 'End', icon: <End className="w-4 h-4" />, action: () => sendKeyEventV2('End'), category: 'navigation' },
    
    // Control
    { id: 'ctrl-c', label: 'Ctrl+C', icon: <X className="w-4 h-4" />, action: () => sendKeyEventV2('c', 67, true), category: 'control' },
    { id: 'ctrl-d', label: 'Ctrl+D', action: () => sendKeyEventV2('d', 68, true), category: 'control' },
    { id: 'ctrl-l', label: 'Ctrl+L', icon: <RefreshCw className="w-4 h-4" />, action: () => sendKeyEventV2('l', 76, true), category: 'control' },
    
    // Edit
    { id: 'paste', label: 'Paste', icon: <Clipboard className="w-4 h-4" />, action: handlePaste, category: 'edit' },
    { id: 'backspace', label: '⌫', icon: <Delete className="w-4 h-4" />, action: () => sendKeyEventV2('Backspace'), category: 'edit' },
    { id: 'delete', label: 'Del', icon: <Trash2 className="w-4 h-4" />, action: () => sendKeyEventV2('Delete'), category: 'edit' },
    
    // Action
    { id: 'enter', label: 'Enter', icon: <CornerDownLeft className="w-4 h-4" />, action: () => sendKeyEventV2('Enter'), category: 'action' },
    { id: 'tab', label: 'Tab', action: () => sendKeyEventV2('Tab'), category: 'action' },
    { id: 'escape', label: 'Esc', action: () => sendKeyEventV2('Escape'), category: 'action' },
  ];

  return (
    <div className={`bg-white border-t border-gray-200 p-2 ${className}`}>
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
            disabled={!pasteValue}
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
              className="shrink-0 h-8 px-3 text-xs font-medium"
            >
              {cmd.icon || cmd.label}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}