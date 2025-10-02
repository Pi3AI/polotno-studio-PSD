import React, { useState } from 'react';
import '../styles/simple-sidebar.css';

const SimpleSidebar = ({ onToolChange }) => {
  const [activeTool, setActiveTool] = useState('select');
  
  const handleToolClick = (toolId) => {
    setActiveTool(toolId);
    if (onToolChange) {
      onToolChange(toolId);
    }
  };

  const tools = [
    {
      id: 'select',
      name: 'Select',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
      shortcut: 'V'
    },
    {
      id: 'text',
      name: 'Text',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path d="M4 7V4h16v3M9 20h6M12 4v16" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
      shortcut: 'T'
    },
    {
      id: 'shapes',
      name: 'Shapes',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <rect x="3" y="3" width="18" height="18" rx="3" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
      shortcut: 'S'
    },
    {
      id: 'images',
      name: 'Images',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <rect x="3" y="3" width="18" height="18" rx="3" strokeLinecap="round" strokeLinejoin="round"/>
          <circle cx="8.5" cy="8.5" r="2" fill="currentColor" opacity="0.6"/>
          <path d="M21 15l-5-5L5 21" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
      shortcut: 'I'
    },
    {
      id: 'upload',
      name: 'Upload',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
          <polyline points="7 10 12 5 17 10"/>
          <line x1="12" y1="5" x2="12" y2="15"/>
        </svg>
      ),
      shortcut: 'U'
    }
  ];
  
  return (
    <nav className="simple-sidebar" role="navigation" aria-label="Main tools">
      {tools.map((tool) => (
        <button
          key={tool.id}
          className={`simple-tool-btn ${activeTool === tool.id ? 'active' : ''}`}
          onClick={() => handleToolClick(tool.id)}
          aria-label={`${tool.name} tool`}
          aria-pressed={activeTool === tool.id}
          title={`${tool.name} (${tool.shortcut})`}
        >
          {tool.icon}
          <span className="tool-tooltip">
            {tool.name}
            <span className="tool-shortcut">{tool.shortcut}</span>
          </span>
        </button>
      ))}
    </nav>
  );
};

export default SimpleSidebar;