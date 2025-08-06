'use client';

import React from 'react';

interface VSCodeEditorProps {
  url: string;
  className?: string;
}

export function VSCodeEditor({ url, className = '' }: VSCodeEditorProps) {
  return (
    <iframe
      src={url}
      className={className}
      style={{ border: 'none' }}
      allow="clipboard-read; clipboard-write"
      title="VS Code Editor"
    />
  );
}