'use client';

import React, { useState, useEffect } from 'react';
import { Globe, ExternalLink, Copy } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { useWorkspaceStore } from '../../stores/workspaceStore';
import { useIsMobile } from '@/hooks/use-mobile';

export function PortShortcutIcon() {
  const [isOpen, setIsOpen] = useState(false);
  const [portInput, setPortInput] = useState('3000');
  const [copied, setCopied] = useState(false);
  const sandboxId = useWorkspaceStore((state) => state.sandboxId);
  const isMobile = useIsMobile();

  // Generate the port URL using HTTP subdomain proxy
  // This solves iframe asset loading issues that path-based proxy can't handle
  // Using lvh.me for local testing - it always resolves to 127.0.0.1
  const httpProxyDomain = process.env.NEXT_PUBLIC_HTTP_PROXY_DOMAIN || 'agentspod.dev';
  
  // For local dev, use lvh.me which resolves *.lvh.me to 127.0.0.1
  // For production, use the configured HTTP proxy domain
  // let proxyDomain;
  // if (isDevelopment) {
  //   proxyDomain = 'lvh.me:3000';
  // } else {
  //   proxyDomain = httpProxyDomain;
  // }
  
  // Use subdomain format: {port}-{sandbox-id}.domain
  // This ensures browser resolves relative URLs correctly in iframes
  const portUrl = sandboxId ? `http://${portInput}-${sandboxId}.${httpProxyDomain}` : '';

  // Handle click outside to close popup
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      // Close if clicking outside the modal and not on the port icon
      if (!target.closest('.port-modal') && !target.closest('.port-icon')) {
        setIsOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  const handleOpenPort = () => {
    if (portUrl) {
      window.open(portUrl, '_blank', 'noopener,noreferrer');
      setIsOpen(false);
    }
  };

  const handleCopyUrl = async () => {
    if (portUrl) {
      await navigator.clipboard.writeText(portUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handlePortChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9]/g, ''); // Only allow numbers
    setPortInput(value);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleOpenPort();
    }
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="port-icon w-6 h-6 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center hover:bg-white/20 transition-colors"
        title="Open Port"
      >
        <Globe className="h-3 w-3 text-white" />
      </button>
      
      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/50 z-50"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Modal */}
          <div className={`port-modal fixed bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-50 ${
            isMobile 
              ? 'top-16 left-4 right-4 w-auto' 
              : 'top-16 right-4 w-80'
          }`}>
            <div className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  Open Port
                </h4>
              </div>
              
              {!sandboxId ? (
                <div className="text-xs text-red-600 bg-red-50 dark:bg-red-950 p-3 rounded">
                  No workspace sandbox available. Please create a workspace first.
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-medium text-gray-600 dark:text-gray-300 block mb-2">
                      Port Number
                    </label>
                    <input
                      type="text"
                      value={portInput}
                      onChange={handlePortChange}
                      onKeyDown={handleKeyDown}
                      placeholder="3000"
                      className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      autoFocus
                    />
                  </div>
                  
                  {portInput && (
                    <div>
                      <label className="text-xs font-medium text-gray-600 dark:text-gray-300 block mb-2">
                        URL Preview
                      </label>
                      <div className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-700 rounded border text-xs font-mono text-gray-700 dark:text-gray-300">
                        <span className="flex-1 truncate">{portUrl}</span>
                        <button
                          onClick={handleCopyUrl}
                          className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                          title="Copy URL"
                        >
                          <Copy className="h-3 w-3" />
                        </button>
                      </div>
                      {copied && (
                        <p className="text-xs text-green-600 mt-1">URL copied to clipboard!</p>
                      )}
                    </div>
                  )}
                  
                  <div className="flex gap-2">
                    <Button
                      onClick={handleOpenPort}
                      disabled={!portInput || !sandboxId}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                      size="sm"
                    >
                      <ExternalLink className="h-3 w-3 mr-2" />
                      Open Port
                    </Button>
                    <Button
                      onClick={() => setIsOpen(false)}
                      variant="outline"
                      size="sm"
                    >
                      Cancel
                    </Button>
                  </div>
                  
                  <div className="text-xs text-gray-500 space-y-1">
                    <p className="font-medium">Common ports:</p>
                    <div className="flex flex-wrap gap-1">
                      {['3000', '3001', '4000', '5000', '8000', '8080'].map((port) => (
                        <button
                          key={port}
                          onClick={() => setPortInput(port)}
                          className="px-2 py-1 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded text-xs transition-colors"
                        >
                          {port}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
}