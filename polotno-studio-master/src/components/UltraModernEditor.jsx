import React, { useState, useEffect, useRef } from 'react';
import { observer } from 'mobx-react-lite';
import { PolotnoContainer, WorkspaceWrap } from 'polotno';
import { Toolbar } from 'polotno/toolbar/toolbar';
import { ZoomButtons } from 'polotno/toolbar/zoom-buttons';
import { Workspace } from 'polotno/canvas/workspace';
import { PagesTimeline } from 'polotno/pages-timeline';

// 导入智能浮动工具栏
import SmartFloatingToolbar from './SmartFloatingToolbar';
// 导入简化版侧边栏
import SimpleSidebar from './SimpleSidebar';

// 导入样式
import '../styles/ultra-modern.css';
import '../styles/smart-floating-toolbar.css';

// 移除旧的浮动工具栏，使用新的SmartFloatingToolbar
/*
const ContextToolbar = observer(({ element, store, position }) => {
  const [visible, setVisible] = useState(false);
  const toolbarRef = useRef(null);
  
  useEffect(() => {
    if (element) {
      setVisible(true);
    } else {
      setVisible(false);
    }
  }, [element]);
  
  if (!element) return null;
  
  const handleTextStyle = (property, value) => {
    if (element && element.type === 'text') {
      element.set({ [property]: value });
    }
  };
  
  const handleAlign = (direction) => {
    if (!element || !store.activePage) return;
    
    const page = store.activePage;
    const pageWidth = page.width;
    const elementWidth = element.width * (element.scaleX || 1);
    
    const alignments = {
      'left': { x: 0 },
      'center': { x: (pageWidth - elementWidth) / 2 },
      'right': { x: pageWidth - elementWidth }
    };
    
    if (alignments[direction]) {
      element.set(alignments[direction]);
    }
  };
  
  const handleDelete = () => {
    if (element && store) {
      store.deleteElements([element.id]);
    }
  };
  
  const handleDuplicate = () => {
    if (element && store.activePage) {
      store.activePage.clone(element.id);
    }
  };
  
  const style = position ? {
    left: `${position.x}px`,
    top: `${position.y - 60}px`,
    transform: 'translateX(-50%)'
  } : {};
  
  return (
    <div 
      ref={toolbarRef}
      className={`context-toolbar ${visible ? 'visible' : ''}`}
      style={style}
    >
      {element.type === 'text' ? (
        <>
          <button 
            className={`context-tool-btn ${element.fontWeight === 'bold' ? 'active' : ''}`}
            onClick={() => handleTextStyle('fontWeight', element.fontWeight === 'bold' ? 'normal' : 'bold')}
            title="Bold"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"/>
              <path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"/>
            </svg>
          </button>
          <button 
            className={`context-tool-btn ${element.fontStyle === 'italic' ? 'active' : ''}`}
            onClick={() => handleTextStyle('fontStyle', element.fontStyle === 'italic' ? 'normal' : 'italic')}
            title="Italic"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="19" y1="4" x2="10" y2="4"/>
              <line x1="14" y1="20" x2="5" y2="20"/>
              <line x1="15" y1="4" x2="9" y2="20"/>
            </svg>
          </button>
          <button 
            className={`context-tool-btn ${element.textDecoration === 'underline' ? 'active' : ''}`}
            onClick={() => handleTextStyle('textDecoration', element.textDecoration === 'underline' ? 'none' : 'underline')}
            title="Underline"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 3v7a6 6 0 0 0 6 6 6 6 0 0 0 6-6V3"/>
              <line x1="4" y1="21" x2="20" y2="21"/>
            </svg>
          </button>
          <div className="context-divider"/>
        </>
      ) : null}
      
      <button className="context-tool-btn" onClick={() => handleAlign('left')} title="Align Left">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="21" y1="10" x2="3" y2="10"/>
          <line x1="21" y1="6" x2="3" y2="6"/>
          <line x1="21" y1="14" x2="3" y2="14"/>
          <line x1="21" y1="18" x2="3" y2="18"/>
        </svg>
      </button>
      <button className="context-tool-btn" onClick={() => handleAlign('center')} title="Align Center">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="21" y1="10" x2="3" y2="10"/>
          <line x1="17" y1="6" x2="7" y2="6"/>
          <line x1="21" y1="14" x2="3" y2="14"/>
          <line x1="17" y1="18" x2="7" y2="18"/>
        </svg>
      </button>
      <button className="context-tool-btn" onClick={() => handleAlign('right')} title="Align Right">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="21" y1="10" x2="3" y2="10"/>
          <line x1="21" y1="6" x2="7" y2="6"/>
          <line x1="21" y1="14" x2="3" y2="14"/>
          <line x1="21" y1="18" x2="7" y2="18"/>
        </svg>
      </button>
      
      <div className="context-divider"/>
      
      <button className="context-tool-btn" onClick={handleDuplicate} title="Duplicate">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
        </svg>
      </button>
      <button className="context-tool-btn" onClick={handleDelete} title="Delete">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="3 6 5 6 21 6"/>
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
        </svg>
      </button>
    </div>
  );
});
*/

// 超现代编辑器主组件
const UltraModernEditor = observer(({ store }) => {
  const [selectedElement, setSelectedElement] = useState(null);
  const [elementPosition, setElementPosition] = useState(null);
  const [activePanel, setActivePanel] = useState('layers');
  const [zoomLevel, setZoomLevel] = useState(100);
  
  // 监听元素选择
  useEffect(() => {
    const updateSelection = () => {
      const selected = store.selectedElements[0];
      setSelectedElement(selected);
      
      if (selected) {
        // 获取元素位置
        const canvas = document.querySelector('.polotno-canvas-container');
        if (canvas) {
          const rect = canvas.getBoundingClientRect();
          const zoom = store.zoom || 1;
          
          setElementPosition({
            x: rect.left + (selected.x + selected.width / 2) * zoom,
            y: rect.top + selected.y * zoom,
            width: selected.width * (selected.scaleX || 1) * zoom,
            height: selected.height * (selected.scaleY || 1) * zoom
          });
        }
      } else {
        setElementPosition(null);
      }
    };
    
    // 使用 MobX autorun 或简单的定时检查来监听变化
    updateSelection();
    const interval = setInterval(updateSelection, 100);
    return () => clearInterval(interval);
  }, [store]);
  
  // 监听缩放变化
  useEffect(() => {
    const updateZoom = () => {
      setZoomLevel(Math.round(store.zoom * 100));
    };
    
    updateZoom();
    const interval = setInterval(updateZoom, 100);
    return () => clearInterval(interval);
  }, [store]);
  
  // 移除 handleToolChange - SimpleSidebar 现在直接操作 store
  
  // 导出功能
  const handleExport = async () => {
    try {
      const dataURL = await store.toDataURL();
      const link = document.createElement('a');
      link.href = dataURL;
      link.download = 'design.png';
      link.click();
    } catch (err) {
      console.error('Export failed:', err);
    }
  };
  
  // 缩放控制
  const handleZoom = (action) => {
    if (action === 'in') {
      store.setZoomRatio(Math.min(store.zoom * 1.2, 5));
    } else if (action === 'out') {
      store.setZoomRatio(Math.max(store.zoom / 1.2, 0.1));
    } else if (action === 'fit') {
      store.fitToScreen();
    }
  };
  
  return (
    <div className="ultra-modern-editor">
      {/* 简化的顶部栏 - 只保留品牌和导出按钮 */}
      <header className="ultra-header-minimal">
        <div className="header-brand">
          <div className="header-brand-icon">✨</div>
          <span>Ultra Design</span>
        </div>
        
        <div className="header-actions">
          <button className="btn-glass">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
              <polyline points="16 6 12 2 8 6"/>
              <line x1="12" y1="2" x2="12" y2="15"/>
            </svg>
            Share
          </button>
          <button className="btn-gradient" onClick={handleExport}>
            Export
          </button>
        </div>
      </header>
      
      {/* 简化的左侧导航栏 */}
      <SimpleSidebar store={store} />
      
      {/* 主画布区域 */}
      <main className="ultra-canvas">
        <div className="canvas-viewport">
          <PolotnoContainer className="polotno-app-container">
            <WorkspaceWrap>
              <Toolbar store={store} />
              <Workspace store={store} />
              <PagesTimeline store={store} />
            </WorkspaceWrap>
          </PolotnoContainer>
          
          {/* 画布控制栏 */}
          <div className="canvas-controls">
            <button className="canvas-control-btn" onClick={() => handleZoom('out')}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/>
                <line x1="21" y1="21" x2="16.65" y2="16.65"/>
                <line x1="8" y1="11" x2="14" y2="11"/>
              </svg>
            </button>
            <span className="zoom-indicator">{zoomLevel}%</span>
            <button className="canvas-control-btn" onClick={() => handleZoom('in')}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/>
                <line x1="21" y1="21" x2="16.65" y2="16.65"/>
                <line x1="11" y1="8" x2="11" y2="14"/>
                <line x1="8" y1="11" x2="14" y2="11"/>
              </svg>
            </button>
            <button className="canvas-control-btn" onClick={() => handleZoom('fit')}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/>
              </svg>
            </button>
          </div>
        </div>
      </main>
      
      {/* 右侧面板 */}
      <aside className="ultra-panel">
        <div className="panel-tabs">
          <button 
            className={`panel-tab ${activePanel === 'layers' ? 'active' : ''}`}
            onClick={() => setActivePanel('layers')}
          >
            Layers
          </button>
          <button 
            className={`panel-tab ${activePanel === 'properties' ? 'active' : ''}`}
            onClick={() => setActivePanel('properties')}
          >
            Properties
          </button>
          <button 
            className={`panel-tab ${activePanel === 'effects' ? 'active' : ''}`}
            onClick={() => setActivePanel('effects')}
          >
            Effects
          </button>
        </div>
        
        <div className="panel-content">
          {activePanel === 'layers' && store.activePage && (
            <div className="layer-list">
              {store.activePage.children.slice().reverse().map((element, index) => (
                <div 
                  key={element.id}
                  className={`layer-item ${selectedElement?.id === element.id ? 'selected' : ''}`}
                  onClick={() => store.selectElements([element.id])}
                >
                  <div className="layer-icon">
                    {element.type === 'text' ? '📝' : 
                     element.type === 'image' ? '🖼️' : 
                     element.type === 'svg' ? '⭐' : '⬛'}
                  </div>
                  <div className="layer-info">
                    <div className="layer-name">
                      {element.type === 'text' ? 
                        (element.text?.substring(0, 20) || 'Text Layer') : 
                        (element.name || `${element.type} ${store.activePage.children.length - index}`)}
                    </div>
                    <div className="layer-type">{element.type}</div>
                  </div>
                  <div className="layer-actions">
                    <button 
                      className="layer-action-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        element.set({ visible: !element.visible });
                      }}
                    >
                      {element.visible !== false ? '👁' : '🙈'}
                    </button>
                    <button 
                      className="layer-action-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        element.set({ 
                          draggable: element.draggable === false,
                          selectable: element.selectable === false
                        });
                      }}
                    >
                      {element.draggable !== false ? '🔓' : '🔒'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {activePanel === 'properties' && selectedElement && (
            <div className="properties-panel">
              <h3 style={{ color: 'var(--text-primary)', marginBottom: '16px' }}>Properties</h3>
              <div style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
                <p>Type: {selectedElement.type}</p>
                <p>Width: {Math.round(selectedElement.width)}px</p>
                <p>Height: {Math.round(selectedElement.height)}px</p>
                <p>X: {Math.round(selectedElement.x)}px</p>
                <p>Y: {Math.round(selectedElement.y)}px</p>
              </div>
            </div>
          )}
          
          {activePanel === 'effects' && (
            <div className="effects-panel">
              <h3 style={{ color: 'var(--text-primary)', marginBottom: '16px' }}>Effects</h3>
              <div style={{ color: 'var(--text-tertiary)', fontSize: '14px' }}>
                <p>Shadows, gradients, and filters coming soon...</p>
              </div>
            </div>
          )}
        </div>
      </aside>
      
      {/* 智能浮动工具栏 - 替代固定的顶部工具栏 */}
      <SmartFloatingToolbar store={store} />
    </div>
  );
});

export default UltraModernEditor;