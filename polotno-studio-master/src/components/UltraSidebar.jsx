import React, { useState, useRef, useEffect } from 'react';
import '../styles/ultra-sidebar.css';

const UltraSidebar = ({ store, currentTool, onToolChange }) => {
  const [activeTool, setActiveTool] = useState(currentTool || 'select');
  
  const handleToolClick = (toolId) => {
    setActiveTool(toolId);
    if (onToolChange) {
      onToolChange(toolId);
    }
    
    // 映射工具到 Polotno 面板
    const sectionMap = {
      'text': 'text',
      'resize': 'resize',
      'shapes': 'elements',
      'images': 'photos',
      'draw': 'draw',
      'background': 'background',
      'templates': 'templates',
      'upload': 'upload',
      'ai': 'ai-images'
    };
    
    const sectionName = sectionMap[toolId];
    if (sectionName && store?.openSidePanel) {
      store.openSidePanel(sectionName);
    }
  };
  
  // 创建水波纹效果
  const createRipple = (e) => {
    const button = e.currentTarget;
    const ripple = document.createElement('span');
    const rect = button.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = e.clientX - rect.left - size / 2;
    const y = e.clientY - rect.top - size / 2;
    
    ripple.style.width = ripple.style.height = size + 'px';
    ripple.style.left = x + 'px';
    ripple.style.top = y + 'px';
    ripple.classList.add('ripple');
    
    button.appendChild(ripple);
    
    setTimeout(() => {
      ripple.remove();
    }, 600);
  };
  
  return (
    <nav className="ultra-sidebar-container" role="navigation" aria-label="Main tools">
      
      {/* 文字工具 */}
      <button 
        className={`ultra-tool-btn ${activeTool === 'text' ? 'active' : ''}`}
        onClick={(e) => {
          createRipple(e);
          handleToolClick('text');
        }}
        aria-label="Text tool"
        aria-pressed={activeTool === 'text'}
        tabIndex={0}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
          <path d="M4 7V4h16v3M9 20h6M12 4v16" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <span className="ultra-tooltip">
          Text Tool
          <span className="ultra-tooltip-shortcut">T</span>
        </span>
      </button>
      
      {/* 调整尺寸工具 */}
      <button 
        className={`ultra-tool-btn ${activeTool === 'resize' ? 'active' : ''}`}
        onClick={(e) => {
          createRipple(e);
          handleToolClick('resize');
        }}
        aria-label="Resize tool"
        aria-pressed={activeTool === 'resize'}
        tabIndex={0}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
          <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" strokeLinecap="round" strokeLinejoin="round"/>
          <circle cx="15" cy="9" r="1.5" fill="currentColor"/>
          <circle cx="9" cy="15" r="1.5" fill="currentColor"/>
        </svg>
        <span className="ultra-tooltip">
          Resize Tool
          <span className="ultra-tooltip-shortcut">R</span>
        </span>
      </button>
      
      {/* 形状工具 */}
      <button 
        className={`ultra-tool-btn ${activeTool === 'shapes' ? 'active' : ''}`}
        onClick={(e) => {
          createRipple(e);
          handleToolClick('shapes');
        }}
        aria-label="Shapes tool"
        aria-pressed={activeTool === 'shapes'}
        tabIndex={0}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
          <rect x="3" y="3" width="18" height="18" rx="3" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M9 12h6M12 9v6" strokeWidth="1.5" opacity="0.4"/>
        </svg>
        <span className="ultra-tooltip">
          Shapes
          <span className="ultra-tooltip-shortcut">S</span>
        </span>
      </button>
      
      {/* 图库工具 */}
      <button 
        className={`ultra-tool-btn ${activeTool === 'images' ? 'active' : ''}`}
        onClick={(e) => {
          createRipple(e);
          handleToolClick('images');
        }}
        aria-label="Images tool"
        aria-pressed={activeTool === 'images'}
        tabIndex={0}
        data-badge="NEW"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
          <rect x="3" y="3" width="18" height="18" rx="3" strokeLinecap="round" strokeLinejoin="round"/>
          <circle cx="8.5" cy="8.5" r="2" fill="currentColor" opacity="0.6"/>
          <path d="M21 15l-5-5L5 21" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M14 12l3-3 4 4" strokeWidth="1.5" opacity="0.4" strokeLinecap="round"/>
        </svg>
        <span className="ultra-tooltip">
          Images
          <span className="ultra-tooltip-shortcut">I</span>
        </span>
      </button>
      
      {/* 分隔线 */}
      <div className="ultra-toolbar-divider"></div>
      
      {/* 绘制工具 */}
      <button 
        className={`ultra-tool-btn ${activeTool === 'draw' ? 'active' : ''}`}
        onClick={(e) => {
          createRipple(e);
          handleToolClick('draw');
        }}
        aria-label="Draw tool"
        aria-pressed={activeTool === 'draw'}
        tabIndex={0}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
          <path d="M12 19l7-7 3 3-7 7-3-3z" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M2 2l7.586 7.586" strokeLinecap="round"/>
          <circle cx="11" cy="11" r="2" fill="currentColor" opacity="0.4"/>
        </svg>
        <span className="ultra-tooltip">
          Draw Tool
          <span className="ultra-tooltip-shortcut">D</span>
        </span>
      </button>
      
      {/* 背景工具 */}
      <button 
        className={`ultra-tool-btn ${activeTool === 'background' ? 'active' : ''}`}
        onClick={(e) => {
          createRipple(e);
          handleToolClick('background');
        }}
        aria-label="Background tool"
        aria-pressed={activeTool === 'background'}
        tabIndex={0}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
          <rect x="3" y="3" width="18" height="18" rx="3" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M3 9h18M3 15h18M9 3v18M15 3v18" strokeWidth="1.5" opacity="0.3"/>
        </svg>
        <span className="ultra-tooltip">
          Background
          <span className="ultra-tooltip-shortcut">B</span>
        </span>
      </button>
      
      {/* 模板工具 */}
      <button 
        className={`ultra-tool-btn ${activeTool === 'templates' ? 'active' : ''}`}
        onClick={(e) => {
          createRipple(e);
          handleToolClick('templates');
        }}
        aria-label="Templates tool"
        aria-pressed={activeTool === 'templates'}
        tabIndex={0}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
          <rect x="3" y="3" width="7" height="7" strokeLinecap="round" strokeLinejoin="round"/>
          <rect x="14" y="3" width="7" height="7" strokeLinecap="round" strokeLinejoin="round"/>
          <rect x="14" y="14" width="7" height="7" strokeLinecap="round" strokeLinejoin="round"/>
          <rect x="3" y="14" width="7" height="7" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <span className="ultra-tooltip">
          Templates
          <span className="ultra-tooltip-shortcut">P</span>
        </span>
      </button>
      
      {/* AI 魔法工具 */}
      <button 
        className={`ultra-tool-btn ${activeTool === 'ai' ? 'active' : ''}`}
        onClick={(e) => {
          createRipple(e);
          handleToolClick('ai');
        }}
        aria-label="AI Magic tool"
        aria-pressed={activeTool === 'ai'}
        tabIndex={0}
        data-badge="AI"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" 
                strokeLinecap="round" strokeLinejoin="round"/>
          <circle cx="12" cy="12" r="3" fill="currentColor" opacity="0.4"/>
        </svg>
        <span className="ultra-tooltip">
          AI Magic
          <span className="ultra-tooltip-shortcut">M</span>
        </span>
      </button>
      
      {/* 分隔线 */}
      <div className="ultra-toolbar-divider"></div>
      
      {/* 添加按钮 - 特殊样式 */}
      <button 
        className="ultra-add-btn"
        onClick={(e) => {
          createRipple(e);
          handleToolClick('upload');
        }}
        aria-label="Add or upload"
        tabIndex={0}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
          <line x1="12" y1="5" x2="12" y2="19" strokeLinecap="round"/>
          <line x1="5" y1="12" x2="19" y2="12" strokeLinecap="round"/>
        </svg>
        <span className="ultra-tooltip">
          Add / Upload
          <span className="ultra-tooltip-shortcut">⌘N</span>
        </span>
      </button>
      
      {/* CSS 水波纹样式 */}
      <style>{`
        .ripple {
          position: absolute;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.6);
          transform: scale(0);
          animation: ripple-animation 0.6s ease-out;
          pointer-events: none;
        }
        
        @keyframes ripple-animation {
          to {
            transform: scale(4);
            opacity: 0;
          }
        }
      `}</style>
    </nav>
  );
};

export default UltraSidebar;