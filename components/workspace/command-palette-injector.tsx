'use client';

import React, { useState, useEffect, useRef } from 'react';
import { PostMessageTTYDInjector } from '@/lib/ttyd-postmessage-injector';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Terminal, 
  Square, 
  RotateCcw, 
  Send, 
  ArrowUp, 
  ArrowDown, 
  ArrowLeft, 
  ArrowRight,
  Delete,
  Home
} from 'lucide-react';

interface CommandPaletteInjectorProps {
  terminalIframe: HTMLIFrameElement | null;
  className?: string;
}

interface QuickCommand {
  id: string;
  label: string;
  icon: React.ReactNode;
  type: 'key' | 'text';
  command: string;
  description: string;
  category: 'control' | 'navigation' | 'common';
}

const quickCommands: QuickCommand[] = [
  // Control commands
  {
    id: 'ctrl-c',
    label: 'Ctrl+C',
    icon: <Square className="w-4 h-4" />,
    type: 'key',
    command: 'Ctrl+C',
    description: 'Interrupt current command',
    category: 'control'
  },
  {
    id: 'ctrl-l',
    label: 'Clear',
    icon: <RotateCcw className="w-4 h-4" />,
    type: 'key',
    command: 'Ctrl+L',
    description: 'Clear terminal screen',
    category: 'control'
  },
  {
    id: 'ctrl-d',
    label: 'Ctrl+D',
    icon: <Terminal className="w-4 h-4" />,
    type: 'key',
    command: 'Ctrl+D',
    description: 'End of file / Exit',
    category: 'control'
  },
  {
    id: 'enter',
    label: 'Enter',
    icon: <Send className="w-4 h-4" />,
    type: 'key',
    command: 'Enter',
    description: 'Execute command',
    category: 'control'
  },
  
  // Navigation commands
  {
    id: 'arrow-up',
    label: '↑',
    icon: <ArrowUp className="w-4 h-4" />,
    type: 'key',
    command: 'ArrowUp',
    description: 'Previous command',
    category: 'navigation'
  },
  {
    id: 'arrow-down',
    label: '↓',
    icon: <ArrowDown className="w-4 h-4" />,
    type: 'key',
    command: 'ArrowDown',
    description: 'Next command',
    category: 'navigation'
  },
  {
    id: 'arrow-left',
    label: '←',
    icon: <ArrowLeft className="w-4 h-4" />,
    type: 'key',
    command: 'ArrowLeft',
    description: 'Move cursor left',
    category: 'navigation'
  },
  {
    id: 'arrow-right',
    label: '→',
    icon: <ArrowRight className="w-4 h-4" />,
    type: 'key',
    command: 'ArrowRight',
    description: 'Move cursor right',
    category: 'navigation'
  },
  {
    id: 'home',
    label: 'Home',
    icon: <Home className="w-4 h-4" />,
    type: 'key',
    command: 'Home',
    description: 'Move to line start',
    category: 'navigation'
  },
  {
    id: 'end',
    label: 'End',
    icon: <ArrowRight className="w-4 h-4" />,
    type: 'key',
    command: 'End',
    description: 'Move to line end',
    category: 'navigation'
  },
  {
    id: 'backspace',
    label: 'Back',
    icon: <Delete className="w-4 h-4" />,
    type: 'key',
    command: 'Backspace',
    description: 'Delete character',
    category: 'navigation'
  },
  
  // Common commands
  {
    id: 'ls',
    label: 'ls',
    icon: <Terminal className="w-4 h-4" />,
    type: 'text',
    command: 'ls -la',
    description: 'List files',
    category: 'common'
  },
  {
    id: 'pwd',
    label: 'pwd',
    icon: <Terminal className="w-4 h-4" />,
    type: 'text',
    command: 'pwd',
    description: 'Show current directory',
    category: 'common'
  },
  {
    id: 'cd-home',
    label: 'cd ~',
    icon: <Terminal className="w-4 h-4" />,
    type: 'text',
    command: 'cd ~',
    description: 'Go to home directory',
    category: 'common'
  }
];

export function CommandPaletteInjector({ terminalIframe, className = '' }: CommandPaletteInjectorProps) {
  const [injector, setInjector] = useState<PostMessageTTYDInjector | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [customCommand, setCustomCommand] = useState('');
  const [lastResult, setLastResult] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const initRef = useRef(false);

  // Initialize injector when iframe is available
  useEffect(() => {
    if (terminalIframe && !initRef.current) {
      initRef.current = true;
      console.log('📨 Initializing PostMessage TTYDInjector...');
      
      setIsLoading(true);
      
      const initializeInjector = async () => {
        try {
          const pmInjector = new PostMessageTTYDInjector(terminalIframe);
          setInjector(pmInjector);
          
          const success = await pmInjector.initialize();
          setIsReady(success);
          setLastResult(success ? 'PostMessage injector ready ✅' : 'Script injection failed ❌');
          
        } catch (error) {
          console.error('❌ PostMessage injector failed:', error);
          setLastResult('Initialization failed ❌');
          setIsReady(false);
        } finally {
          setIsLoading(false);
        }
      };
      
      // Small delay to ensure iframe is ready
      setTimeout(initializeInjector, 500);
    }
  }, [terminalIframe]);

  const handleQuickCommand = async (cmd: QuickCommand) => {
    if (!injector || !isReady) {
      setLastResult('❌ Injector not ready');
      return;
    }

    setIsLoading(true);
    try {
      const success = await injector.sendCommand(cmd.type, cmd.command);
      setLastResult(success ? `✅ ${cmd.label} sent` : `❌ ${cmd.label} failed`);
    } catch (error) {
      setLastResult(`❌ Error: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCustomCommand = async () => {
    if (!injector || !isReady || !customCommand.trim()) {
      setLastResult('❌ Injector not ready or empty command');
      return;
    }

    setIsLoading(true);
    try {
      const success = await injector.sendText(customCommand.trim());
      setLastResult(success ? `✅ "${customCommand}" executed` : `❌ "${customCommand}" failed`);
      setCustomCommand('');
    } catch (error) {
      setLastResult(`❌ Error: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasteCommand = async () => {
    if (!injector || !isReady || !customCommand.trim()) {
      setLastResult('❌ Injector not ready or empty command');
      return;
    }

    setIsLoading(true);
    try {
      const success = await injector.paste(customCommand.trim());
      setLastResult(success ? `✅ "${customCommand}" pasted` : `❌ "${customCommand}" paste failed`);
      setCustomCommand('');
    } catch (error) {
      setLastResult(`❌ Error: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleCustomCommand();
    }
  };

  const groupedCommands = quickCommands.reduce((acc, cmd) => {
    if (!acc[cmd.category]) acc[cmd.category] = [];
    acc[cmd.category].push(cmd);
    return acc;
  }, {} as Record<string, QuickCommand[]>);

  return (
    <Card className={`w-full ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Terminal className="w-5 h-5" />
            Terminal Control
          </CardTitle>
          <Badge 
            variant={isReady ? 'default' : 'secondary'}
            className={isReady ? 'bg-green-500' : 'bg-gray-500'}
          >
            {isLoading ? 'Loading...' : isReady ? 'Ready (postmessage)' : 'Not Ready'}
          </Badge>
        </div>
        
        {lastResult && (
          <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
            {lastResult}
          </div>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Custom Command Input */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Custom Command</label>
          <div className="flex gap-2">
            <Input
              value={customCommand}
              onChange={(e) => setCustomCommand(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type a command or API key..."
              disabled={!isReady || isLoading}
              className="flex-1"
            />
            <Button 
              onClick={handleCustomCommand}
              disabled={!isReady || isLoading || !customCommand.trim()}
              size="sm"
              title="Execute command"
            >
              <Send className="w-4 h-4" />
            </Button>
            <Button 
              onClick={handlePasteCommand}
              disabled={!isReady || isLoading || !customCommand.trim()}
              size="sm"
              variant="outline"
              title="Paste without Enter (for API keys)"
            >
              📋
            </Button>
          </div>
          <div className="text-xs text-gray-500">
            Use <strong>Send</strong> to execute commands, <strong>📋</strong> to paste API keys without Enter
          </div>
        </div>

        {/* Quick Commands */}
        {Object.entries(groupedCommands).map(([category, commands]) => (
          <div key={category} className="space-y-2">
            <h3 className="text-sm font-medium capitalize text-gray-700">
              {category} Commands
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {commands.map((cmd) => (
                <Button
                  key={cmd.id}
                  onClick={() => handleQuickCommand(cmd)}
                  disabled={!isReady || isLoading}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-1 text-xs h-8"
                  title={cmd.description}
                >
                  {cmd.icon}
                  <span className="truncate">{cmd.label}</span>
                </Button>
              ))}
            </div>
          </div>
        ))}

        {!isReady && !isLoading && (
          <div className="text-center text-gray-500 py-4">
            <Terminal className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Connect to a terminal to enable controls</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}