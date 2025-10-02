import React, { useState, useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import { Spinner } from '@blueprintjs/core';
import { 
  PolotnoContainer, 
  SidePanelWrap, 
  WorkspaceWrap 
} from 'polotno';
import { Toolbar } from 'polotno/toolbar/toolbar';
import { ZoomButtons } from 'polotno/toolbar/zoom-buttons';
import { SidePanel, DEFAULT_SECTIONS } from 'polotno/side-panel';
import { Workspace } from 'polotno/canvas/workspace';

import { useProject } from '../project';
import { loadFile } from '../file';
import AIAssistantPanel from './AIAssistantPanel';
import BottomToolbar from './BottomToolbar';

// 导入样式
import '../styles/ai-studio.css';

const ImprovedApp = observer(({ store }) => {
  const project = useProject();
  const [activeSectionIndex, setActiveSectionIndex] = useState(0);
  const [showSidePanel, setShowSidePanel] = useState(false);

  // 工具映射到面板索引
  const toolToPanelMap = {
    'select': -1, // 关闭面板
    'shapes': 3,  // 形状面板
    'text': 4,    // 文字面板
    'image': 2,   // 图片面板
    'draw': 5,    // 绘图面板 (如果有)
  };

  // 处理文件拖放
  const handleDrop = (ev) => {
    ev.preventDefault();
    if (ev.dataTransfer.files.length !== ev.dataTransfer.items.length) {
      return;
    }
    for (let i = 0; i < ev.dataTransfer.files.length; i++) {
      loadFile(ev.dataTransfer.files[i], store);
    }
  };

  // 处理工具选择
  const handleToolSelect = (toolId) => {
    const panelIndex = toolToPanelMap[toolId];
    if (panelIndex === -1) {
      setShowSidePanel(false);
    } else if (panelIndex !== undefined) {
      setActiveSectionIndex(panelIndex);
      setShowSidePanel(true);
    }
  };

  // 自定义工具栏组件 - 独立的左侧工具栏
  const CustomLeftToolbar = () => {
    const [activeTool, setActiveTool] = useState('select');
    
    const tools = [
      {
        id: 'select',
        icon: (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
          </svg>
        ),
        title: '选择/添加工具'
      },
      {
        id: 'shapes',
        icon: (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <rect x="4" y="4" width="16" height="16" rx="2" stroke="currentColor" strokeWidth="2"/>
          </svg>
        ),
        title: '形状工具'
      },
      {
        id: 'text',
        icon: (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M4 7V4H20V7M10 4V20M14 4V20M8 20H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        ),
        title: '文本工具'
      },
      {
        id: 'draw',
        icon: (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M12 19L19 12L22 15L15 22L12 19Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M18 13L16.5 5.5L2 2L5.5 16.5L13 18L18 13Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        ),
        title: '画笔工具'
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
        title: '图片工具'
      }
    ];

    const handleClick = (toolId) => {
      setActiveTool(toolId);
      handleToolSelect(toolId);
    };

    return (
      <div className="ai-studio-toolbar">
        {tools.map(tool => (
          <button
            key={tool.id}
            className={`ai-studio-tool-button ${activeTool === tool.id ? 'active' : ''}`}
            onClick={() => handleClick(tool.id)}
            title={tool.title}
          >
            {tool.icon}
          </button>
        ))}
      </div>
    );
  };

  return (
    <div className="ai-studio-container" onDrop={handleDrop}>
      {/* 顶部导航栏 */}
      <div className="ai-studio-navbar">
        <div className="ai-studio-navbar-left">
          <div className="ai-studio-logo">AI</div>
          <input 
            className="ai-studio-project-name" 
            value={project.name || 'Untitled'}
            onChange={(e) => {
              project.name = e.target.value;
              project.requestSave();
            }}
            style={{
              border: 'none',
              background: 'transparent',
              outline: 'none',
              padding: '4px 8px',
              borderRadius: '4px',
              fontSize: '15px',
              fontWeight: '500'
            }}
          />
        </div>
        <div className="ai-studio-navbar-right">
          <button 
            className="ai-studio-nav-button" 
            title="New Project"
            onClick={() => {
              if (confirm('Create a new project? Current work will be saved.')) {
                store.clear();
                store.addPage();
              }
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
          <button className="ai-studio-nav-button" title="Collaborate">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M17 21V19C17 17.9391 16.5786 16.9217 15.8284 16.1716C15.0783 15.4214 14.0609 15 13 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M23 21V19C22.9993 18.1137 22.7044 17.2528 22.1614 16.5523C21.6184 15.8519 20.8581 15.3516 20 15.13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M16 3.13C16.8604 3.35031 17.623 3.85071 18.1676 4.55232C18.7122 5.25392 19.0078 6.11683 19.0078 7.005C19.0078 7.89318 18.7122 8.75608 18.1676 9.45769C17.623 10.1593 16.8604 10.6597 16 10.88" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <button className="ai-studio-nav-button" title="Share">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M4 12V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <polyline points="16 6 12 2 8 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <line x1="12" y1="2" x2="12" y2="15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <button 
            className="ai-studio-nav-button" 
            title="Download"
            onClick={() => {
              store.saveAsImage({
                pixelRatio: 2,
                fileName: project.name || 'design.png'
              });
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M21 15V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <polyline points="7 10 12 15 17 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <line x1="12" y1="15" x2="12" y2="3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <button className="ai-studio-nav-button" title="Settings">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M12 1V5M12 19V23M4.22 4.22L6.34 6.34M17.66 17.66L19.78 19.78M1 12H5M19 12H23M4.22 19.78L6.34 17.66M17.66 6.34L19.78 4.22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      </div>

      {/* 左侧工具栏 - 只显示一个 */}
      <CustomLeftToolbar />

      {/* 中央区域 - 画布和可选的侧边面板 */}
      <div className="ai-studio-canvas" style={{ 
        display: 'flex', 
        overflow: 'hidden',
        position: 'relative',
        background: '#ffffff'
      }}>
        {/* Polotno侧边面板 - 根据工具选择显示 */}
        {showSidePanel && (
          <div style={{ 
            width: '280px',
            background: '#fafafa',
            borderRight: '1px solid #e8e8e8',
            height: '100%',
            overflow: 'auto'
          }}>
            <SidePanel 
              store={store} 
              sections={DEFAULT_SECTIONS}
              defaultSection={DEFAULT_SECTIONS[activeSectionIndex]?.name}
            />
          </div>
        )}
        
        {/* 主画布区域 */}
        <div style={{ 
          flex: 1,
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          background: '#ffffff'
        }}>
          <Toolbar store={store} />
          <div style={{ flex: 1, position: 'relative' }}>
            <Workspace store={store} />
            <ZoomButtons store={store} />
          </div>
        </div>
      </div>

      {/* 右侧AI助手面板 */}
      <AIAssistantPanel store={store} />

      {/* 底部工具栏 */}
      <BottomToolbar store={store} />

      {/* 加载指示器 */}
      {project.status === 'loading' && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(0,0,0,0.3)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <Spinner size={50} />
        </div>
      )}
    </div>
  );
});

export default ImprovedApp;