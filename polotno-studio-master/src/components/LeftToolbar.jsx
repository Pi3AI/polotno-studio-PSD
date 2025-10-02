import React, { useState } from 'react';
import { observer } from 'mobx-react-lite';

const LeftToolbar = observer(({ store, onToolSelect }) => {
  const [activeTool, setActiveTool] = useState('select');

  const tools = [
    {
      id: 'select',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      ),
      title: 'Select / Add'
    },
    {
      id: 'shapes',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <rect x="4" y="4" width="16" height="16" rx="2" stroke="currentColor" strokeWidth="2"/>
        </svg>
      ),
      title: 'Shapes'
    },
    {
      id: 'text',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path d="M4 7V4H20V7M10 4V20M14 4V20M8 20H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
      title: 'Text'
    },
    {
      id: 'draw',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path d="M3 17L8 12L3 7L7 3L12 8L17 3L21 7L16 12L21 17L17 21L12 16L7 21L3 17Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
      title: 'Draw'
    },
    {
      id: 'image',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2"/>
          <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor"/>
          <path d="M21 15L16 10L5 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
      title: 'Image'
    }
  ];

  const handleToolClick = (toolId) => {
    setActiveTool(toolId);
    if (onToolSelect) {
      onToolSelect(toolId);
    }
  };

  return (
    <div className="ai-studio-toolbar">
      {tools.map(tool => (
        <button
          key={tool.id}
          className={`ai-studio-tool-button ${activeTool === tool.id ? 'active' : ''}`}
          onClick={() => handleToolClick(tool.id)}
          title={tool.title}
        >
          {tool.icon}
        </button>
      ))}
    </div>
  );
});

export default LeftToolbar;