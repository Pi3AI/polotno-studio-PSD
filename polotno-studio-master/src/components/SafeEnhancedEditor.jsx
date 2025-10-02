import React, { useState, useEffect, useRef } from 'react';
import { observer } from 'mobx-react-lite';
import { PolotnoContainer, SidePanelWrap, WorkspaceWrap } from 'polotno';
import { Toolbar } from 'polotno/toolbar/toolbar';
import { ZoomButtons } from 'polotno/toolbar/zoom-buttons';
import { Workspace } from 'polotno/canvas/workspace';
import { SidePanel } from 'polotno/side-panel';
import { PagesTimeline } from 'polotno/pages-timeline';

// 错误边界组件
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Editor Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          flexDirection: 'column',
          gap: '20px'
        }}>
          <h1>出现了一些问题</h1>
          <p>编辑器遇到错误，请刷新页面重试</p>
          <button 
            onClick={() => window.location.reload()}
            style={{
              padding: '10px 20px',
              background: 'white',
              color: '#667eea',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: '600'
            }}
          >
            刷新页面
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

const SafeEnhancedEditor = observer(({ store }) => {
  const [selectedElement, setSelectedElement] = useState(null);
  const [activeToolbar, setActiveToolbar] = useState(null);
  const [showLayers, setShowLayers] = useState(true);
  const [currentTool, setCurrentTool] = useState('select');

  useEffect(() => {
    // 初始化时打开模板面板
    try {
      if (store && store.openSidePanel) {
        // 确保使用有效的section名称
        store.openSidePanel('templates');
      }
    } catch (err) {
      console.warn('无法打开初始面板:', err);
    }
  }, [store]);

  useEffect(() => {
    const handleSelection = () => {
      try {
        const selected = store.selectedElements[0];
        setSelectedElement(selected);
        
        if (selected) {
          if (selected.type === 'text') {
            setActiveToolbar('text');
          } else if (selected.type === 'image') {
            setActiveToolbar('image');
          } else {
            setActiveToolbar('general');
          }
        } else {
          setActiveToolbar(null);
        }
      } catch (err) {
        console.error('选择处理错误:', err);
      }
    };

    store.on('change', handleSelection);
    return () => store.off('change', handleSelection);
  }, [store]);

  // 安全的工具切换
  const handleToolChange = (toolId) => {
    setCurrentTool(toolId);
    
    try {
      const sectionMap = {
        'text': 'text',
        'images': 'photos',
        'shapes': 'elements',
        'templates': 'templates',
        'background': 'background',
        'upload': 'upload'
      };
      
      const sectionName = sectionMap[toolId] || 'templates';
      
      if (store && store.openSidePanel) {
        store.openSidePanel(sectionName);
      }
    } catch (err) {
      console.warn('切换工具面板失败:', err);
    }
  };

  // 安全的元素操作
  const handleElementOperation = (operation, ...args) => {
    if (!selectedElement) return;
    
    try {
      switch(operation) {
        case 'align': {
          const [direction] = args;
          const page = store.activePage;
          if (!page) return;
          
          const pageWidth = page.width;
          const pageHeight = page.height;
          const elementWidth = selectedElement.width * (selectedElement.scaleX || 1);
          const elementHeight = selectedElement.height * (selectedElement.scaleY || 1);
          
          const alignments = {
            'left': { x: 0 },
            'center-h': { x: (pageWidth - elementWidth) / 2 },
            'right': { x: pageWidth - elementWidth },
            'top': { y: 0 },
            'center-v': { y: (pageHeight - elementHeight) / 2 },
            'bottom': { y: pageHeight - elementHeight }
          };
          
          if (alignments[direction]) {
            selectedElement.set(alignments[direction]);
          }
          break;
        }
          
        case 'flip': {
          const [axis] = args;
          if (axis === 'h') {
            selectedElement.set({ flipX: !selectedElement.flipX });
          } else {
            selectedElement.set({ flipY: !selectedElement.flipY });
          }
          break;
        }
          
        case 'lock':
          selectedElement.set({
            draggable: !selectedElement.draggable,
            selectable: !selectedElement.selectable
          });
          break;
          
        case 'delete':
          store.deleteElements([selectedElement.id]);
          break;
          
        case 'duplicate':
          if (store.activePage) {
            store.activePage.clone(selectedElement.id);
          }
          break;
          
        case 'layer': {
          const [dir] = args;
          const layerPage = store.activePage;
          if (!layerPage) return;
          
          const index = layerPage.children.indexOf(selectedElement);
          if (dir === 'up' && index < layerPage.children.length - 1) {
            layerPage.moveChild(selectedElement, index + 1);
          } else if (dir === 'down' && index > 0) {
            layerPage.moveChild(selectedElement, index - 1);
          }
          break;
        }
      }
    } catch (err) {
      console.error('元素操作失败:', err);
    }
  };

  // 导出功能
  const handleExport = async () => {
    try {
      const dataURL = await store.toDataURL();
      const link = document.createElement('a');
      link.href = dataURL;
      link.download = 'design.png';
      link.click();
    } catch (err) {
      console.error('导出失败:', err);
      alert('导出失败，请重试');
    }
  };

  // 文字样式操作
  const handleTextStyle = (property, value) => {
    if (!selectedElement || selectedElement.type !== 'text') return;
    
    try {
      selectedElement.set({ [property]: value });
    } catch (err) {
      console.error('文字样式设置失败:', err);
    }
  };

  return (
    <ErrorBoundary>
      <div className="enhanced-editor">
        {/* 顶部工具栏 */}
        <div className="editor-header">
          <div className="header-left">
            <div className="logo">
              <span className="logo-icon">✨</span>
              <span className="logo-text">Design Studio</span>
            </div>
          </div>
          
          <div className="header-center">
            {/* 图片工具栏 */}
            {activeToolbar === 'image' && selectedElement && (
              <div className="context-toolbar image-toolbar">
                <div className="toolbar-group">
                  <button className="toolbar-btn" onClick={() => handleElementOperation('align', 'left')} title="左对齐">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <line x1="3" y1="3" x2="3" y2="21"/>
                      <rect x="7" y="8" width="10" height="8"/>
                    </svg>
                  </button>
                  <button className="toolbar-btn" onClick={() => handleElementOperation('align', 'center-h')} title="水平居中">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <line x1="12" y1="3" x2="12" y2="21"/>
                      <rect x="7" y="8" width="10" height="8"/>
                    </svg>
                  </button>
                  <button className="toolbar-btn" onClick={() => handleElementOperation('align', 'right')} title="右对齐">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <line x1="21" y1="3" x2="21" y2="21"/>
                      <rect x="7" y="8" width="10" height="8"/>
                    </svg>
                  </button>
                </div>
                
                <div className="toolbar-separator"></div>
                
                <div className="toolbar-group">
                  <button className="toolbar-btn" onClick={() => handleElementOperation('layer', 'up')} title="上移一层">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <polyline points="7 14 12 9 17 14"/>
                    </svg>
                  </button>
                  <button className="toolbar-btn" onClick={() => handleElementOperation('layer', 'down')} title="下移一层">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <polyline points="7 10 12 15 17 10"/>
                    </svg>
                  </button>
                </div>
                
                <div className="toolbar-separator"></div>
                
                <div className="toolbar-group">
                  <button className="toolbar-btn" onClick={() => handleElementOperation('flip', 'h')} title="水平翻转">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <polyline points="16 7 21 12 16 17"/>
                      <polyline points="8 7 3 12 8 17"/>
                    </svg>
                  </button>
                  <button className="toolbar-btn" onClick={() => handleElementOperation('flip', 'v')} title="垂直翻转">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <polyline points="7 16 12 21 17 16"/>
                      <polyline points="7 8 12 3 17 8"/>
                    </svg>
                  </button>
                </div>
                
                <div className="toolbar-separator"></div>
                
                <div className="toolbar-group">
                  <button className="toolbar-btn" onClick={() => handleElementOperation('lock')} title="锁定/解锁">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <rect x="3" y="11" width="18" height="11" rx="2"/>
                      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                    </svg>
                  </button>
                  <button className="toolbar-btn" onClick={() => handleElementOperation('duplicate')} title="复制">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <rect x="9" y="9" width="13" height="13" rx="2"/>
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                    </svg>
                  </button>
                  <button className="toolbar-btn danger" onClick={() => handleElementOperation('delete')} title="删除">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <polyline points="3 6 5 6 21 6"/>
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/>
                    </svg>
                  </button>
                </div>
              </div>
            )}
            
            {/* 文字工具栏 */}
            {activeToolbar === 'text' && selectedElement && (
              <div className="context-toolbar text-toolbar">
                <div className="toolbar-group">
                  <select 
                    className="font-select"
                    value={selectedElement.fontFamily || 'Arial'}
                    onChange={(e) => handleTextStyle('fontFamily', e.target.value)}
                  >
                    <option value="Arial">Arial</option>
                    <option value="Helvetica">Helvetica</option>
                    <option value="Times New Roman">Times New Roman</option>
                    <option value="Georgia">Georgia</option>
                  </select>
                </div>
                
                <div className="toolbar-group">
                  <div className="font-size-controls">
                    <button onClick={() => {
                      const size = (selectedElement.fontSize || 16) - 2;
                      handleTextStyle('fontSize', Math.max(8, size));
                    }}>-</button>
                    <input 
                      type="number"
                      value={selectedElement.fontSize || 16}
                      onChange={(e) => handleTextStyle('fontSize', parseInt(e.target.value) || 16)}
                    />
                    <button onClick={() => {
                      const size = (selectedElement.fontSize || 16) + 2;
                      handleTextStyle('fontSize', Math.min(200, size));
                    }}>+</button>
                  </div>
                </div>
                
                <div className="toolbar-separator"></div>
                
                <div className="toolbar-group style-group">
                  <button 
                    className={`toolbar-btn ${selectedElement.fontWeight === 'bold' ? 'active' : ''}`}
                    onClick={() => handleTextStyle('fontWeight', selectedElement.fontWeight === 'bold' ? 'normal' : 'bold')}
                    title="加粗"
                  >
                    <strong>B</strong>
                  </button>
                  <button 
                    className={`toolbar-btn ${selectedElement.fontStyle === 'italic' ? 'active' : ''}`}
                    onClick={() => handleTextStyle('fontStyle', selectedElement.fontStyle === 'italic' ? 'normal' : 'italic')}
                    title="斜体"
                  >
                    <em>I</em>
                  </button>
                  <button 
                    className={`toolbar-btn ${selectedElement.textDecoration === 'underline' ? 'active' : ''}`}
                    onClick={() => handleTextStyle('textDecoration', selectedElement.textDecoration === 'underline' ? 'none' : 'underline')}
                    title="下划线"
                  >
                    <u>U</u>
                  </button>
                </div>
                
                <div className="toolbar-separator"></div>
                
                <div className="toolbar-group">
                  <input 
                    type="color"
                    className="color-picker"
                    value={selectedElement.fill || '#000000'}
                    onChange={(e) => handleTextStyle('fill', e.target.value)}
                    title="文字颜色"
                  />
                </div>
              </div>
            )}
          </div>
          
          <div className="header-right">
            <button className="btn-export" onClick={handleExport}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              导出
            </button>
          </div>
        </div>

        {/* 主体内容 */}
        <div className="editor-body">
          {/* 左侧工具栏 */}
          <div className="left-toolbar">
            <button
              className={`tool-btn ${currentTool === 'select' ? 'active' : ''}`}
              onClick={() => handleToolChange('select')}
              title="选择"
            >
              <span className="tool-icon">↖</span>
            </button>
            <button
              className={`tool-btn ${currentTool === 'text' ? 'active' : ''}`}
              onClick={() => handleToolChange('text')}
              title="文字"
            >
              <span className="tool-icon">T</span>
            </button>
            <button
              className={`tool-btn ${currentTool === 'shapes' ? 'active' : ''}`}
              onClick={() => handleToolChange('shapes')}
              title="形状"
            >
              <span className="tool-icon">□</span>
            </button>
            <button
              className={`tool-btn ${currentTool === 'images' ? 'active' : ''}`}
              onClick={() => handleToolChange('images')}
              title="图片"
            >
              <span className="tool-icon">🖼</span>
            </button>
            <button
              className={`tool-btn ${currentTool === 'background' ? 'active' : ''}`}
              onClick={() => handleToolChange('background')}
              title="背景"
            >
              <span className="tool-icon">🎨</span>
            </button>
            <button
              className={`tool-btn ${currentTool === 'templates' ? 'active' : ''}`}
              onClick={() => handleToolChange('templates')}
              title="模板"
            >
              <span className="tool-icon">📋</span>
            </button>
            <button
              className={`tool-btn ${currentTool === 'upload' ? 'active' : ''}`}
              onClick={() => handleToolChange('upload')}
              title="上传"
            >
              <span className="tool-icon">⬆</span>
            </button>
          </div>

          {/* 主编辑区 */}
          <div className="editor-main">
            <PolotnoContainer className="polotno-app-container">
              <SidePanelWrap>
                <SidePanel store={store} />
              </SidePanelWrap>
              
              <WorkspaceWrap>
                <Toolbar store={store} />
                <Workspace store={store} />
                <ZoomButtons store={store} />
                <PagesTimeline store={store} />
              </WorkspaceWrap>
            </PolotnoContainer>
          </div>

          {/* 右侧图层面板 */}
          <div className={`right-panel ${showLayers ? 'open' : ''}`}>
            <div className="panel-header">
              <h3>图层</h3>
              <button 
                className="btn-toggle"
                onClick={() => setShowLayers(!showLayers)}
              >
                {showLayers ? '×' : '☰'}
              </button>
            </div>
            
            {showLayers && store.activePage && (
              <div className="layers-container">
                <div className="layers-list">
                  {store.activePage.children.slice().reverse().map((element, index) => (
                    <div 
                      key={element.id}
                      className={`layer-item ${selectedElement && selectedElement.id === element.id ? 'selected' : ''}`}
                      onClick={() => {
                        try {
                          store.selectElements([element.id]);
                        } catch (err) {
                          console.error('选择图层失败:', err);
                        }
                      }}
                    >
                      <div className="layer-thumbnail">
                        {element.type === 'text' ? 'T' : 
                         element.type === 'image' ? '🖼' : 
                         element.type === 'svg' ? '⭐' : '□'}
                      </div>
                      <div className="layer-info">
                        <div className="layer-name">
                          {element.type === 'text' ? 
                            (element.text && element.text.substring(0, 20) || '文本') : 
                            (element.name || `${element.type} ${store.activePage.children.length - index}`)}
                        </div>
                        <div className="layer-actions">
                          <button 
                            className="btn-visibility"
                            onClick={(e) => {
                              e.stopPropagation();
                              try {
                                element.set({ visible: !element.visible });
                              } catch (err) {
                                console.error('切换可见性失败:', err);
                              }
                            }}
                          >
                            {element.visible !== false ? '👁' : '👁‍🗨'}
                          </button>
                          <button 
                            className="btn-lock"
                            onClick={(e) => {
                              e.stopPropagation();
                              try {
                                element.set({ 
                                  draggable: element.draggable === false,
                                  selectable: element.selectable === false
                                });
                              } catch (err) {
                                console.error('切换锁定状态失败:', err);
                              }
                            }}
                          >
                            {element.draggable !== false ? '🔓' : '🔒'}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
});

export default SafeEnhancedEditor;