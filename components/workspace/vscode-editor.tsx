'use client';

import React from 'react';

interface VSCodeEditorProps {
  url: string;
  className?: string;
}

export function VSCodeEditor({ url, className = '' }: VSCodeEditorProps) {
  return (
    <div className={`h-full bg-white border-r border-gray-300 ${className}`}>
      <iframe
        src={url}
        className="w-full h-full border-0"
        title="VSCode Editor"
        style={{ backgroundColor: '#1e1e1e' }}
      />
    </div>
  );
}