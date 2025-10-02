import React, { useState, useEffect, useRef } from 'react';
import { observer } from 'mobx-react-lite';
import { PolotnoContainer, SidePanelWrap, WorkspaceWrap } from 'polotno';
import { Toolbar } from 'polotno/toolbar/toolbar';
import { ZoomButtons } from 'polotno/toolbar/zoom-buttons';
import { Workspace } from 'polotno/canvas/workspace';
import { SidePanel, DEFAULT_SECTIONS } from 'polotno/side-panel';
import { PagesTimeline } from 'polotno/pages-timeline';

// 导入自定义sections
import { MyDesignsSection } from '../sections/my-designs-section';
import { UploadSection } from '../sections/upload-section';
import { ShapesSection } from '../sections/shapes-section';
import { IconsSection } from '../sections/icons-section';
import { QuotesSection } from '../sections/quotes-section';
import { QrSection } from '../sections/qr-section';
import { LayersSection } from '../sections/layers-section';
import { StableDiffusionSection } from '../sections/stable-diffusion-section';

// 左侧工具图标
const tools = [
  { id: 'select', icon: '↖', title: '选择工具' },
  { id: 'text', icon: 'T', title: '文字' },
  { id: 'shapes', icon: '□', title: '形状' },
  { id: 'images', icon: '🖼', title: '图片' },
  { id: 'draw', icon: '✏', title: '画笔' },
  { id: 'background', icon: '🎨', title: '背景' },
  { id: 'templates', icon: '📋', title: '模板' },
  { id: 'elements', icon: '⭐', title: '元素' },
  { id: 'upload', icon: '⬆', title: '上传' },
];

const EnhancedEditor = observer(({ store }) => {
  const [selectedElement, setSelectedElement] = useState(null);
  const [activeToolbar, setActiveToolbar] = useState(null);
  const [activeTool, setActiveTool] = useState('select');
  const [showLayers, setShowLayers] = useState(true);
  const [selectedSection, setSelectedSection] = useState('templates'); // 使用默认section而不是null
  const [customSections, setCustomSections] = useState([]);

  useEffect(() => {
    // 配置自定义sections
    const sections = [...DEFAULT_SECTIONS];
    sections.unshift(UploadSection);
    sections.unshift(MyDesignsSection);
    sections.splice(3, 1, ShapesSection);
    sections.splice(3, 0, IconsSection);
    sections.push(QuotesSection, QrSection, LayersSection, StableDiffusionSection);
    setCustomSections(sections);
    
    // 设置初始侧边栏
    setTimeout(() => {
      if (store && store.openSidePanel) {
        store.openSidePanel('templates');
      }
    }, 100);
  }, [store]);

  useEffect(() => {
    const handleSelection = () => {
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
    };

    store.on('change', handleSelection);
    return () => store.off('change', handleSelection);
  }, [store]);

  const handleToolClick = (toolId) => {
    setActiveTool(toolId);
    
    // 根据工具切换侧边栏section
    switch(toolId) {
      case 'text':
        setSelectedSection('text');
        store.openSidePanel('text');
        break;
      case 'shapes':
        setSelectedSection('shapes');
        store.openSidePanel('shapes');
        break;
      case 'images':
        setSelectedSection('photos');
        store.openSidePanel('photos');
        break;
      case 'upload':
        setSelectedSection('upload');
        store.openSidePanel('upload');
        break;
      case 'templates':
        setSelectedSection('templates');
        store.openSidePanel('templates');
        break;
      case 'background':
        setSelectedSection('background');
        store.openSidePanel('background');
        break;
      case 'elements':
        setSelectedSection('elements');
        store.openSidePanel('elements');
        break;
      default:
        setSelectedSection('templates');
        store.openSidePanel('templates');
    }
  };

  // 对齐功能
  const handleAlign = (type) => {
    if (!selectedElement) return;
    const page = store.activePage;
    const pageWidth = page?.width || 0;
    const pageHeight = page?.height || 0;
    const elementWidth = selectedElement.width * (selectedElement.scaleX || 1);
    const elementHeight = selectedElement.height * (selectedElement.scaleY || 1);

    switch(type) {
      case 'left':
        selectedElement.set({ x: 0 });
        break;
      case 'center-h':
        selectedElement.set({ x: (pageWidth - elementWidth) / 2 });
        break;
      case 'right':
        selectedElement.set({ x: pageWidth - elementWidth });
        break;
      case 'top':
        selectedElement.set({ y: 0 });
        break;
      case 'center-v':
        selectedElement.set({ y: (pageHeight - elementHeight) / 2 });
        break;
      case 'bottom':
        selectedElement.set({ y: pageHeight - elementHeight });
        break;
    }
  };

  // 图层操作
  const handleLayerMove = (direction) => {
    if (!selectedElement) return;
    const page = store.activePage;
    const index = page?.children.indexOf(selectedElement);
    
    if (direction === 'up' && index < page.children.length - 1) {
      page.moveChild(selectedElement, index + 1);
    } else if (direction === 'down' && index > 0) {
      page.moveChild(selectedElement, index - 1);
    } else if (direction === 'top') {
      page.moveChild(selectedElement, page.children.length - 1);
    } else if (direction === 'bottom') {
      page.moveChild(selectedElement, 0);
    }
  };

  // 翻转功能
  const handleFlip = (direction) => {
    if (!selectedElement) return;
    
    if (direction === 'horizontal') {
      selectedElement.set({ flipX: !selectedElement.flipX });
    } else {
      selectedElement.set({ flipY: !selectedElement.flipY });
    }
  };

  // 锁定/解锁
  const handleLock = () => {
    if (!selectedElement) return;
    selectedElement.set({ 
      draggable: !selectedElement.draggable,
      selectable: !selectedElement.selectable 
    });
  };

  // 删除元素
  const handleDelete = () => {
    if (!selectedElement) return;
    store.deleteElements([selectedElement.id]);
  };

  // 复制元素
  const handleDuplicate = () => {
    if (!selectedElement) return;
    store.activePage?.clone(selectedElement.id);
  };

  // 导出功能
  const handleExport = async () => {
    const dataURL = await store.toDataURL();
    const link = document.createElement('a');
    link.href = dataURL;
    link.download = 'design.png';
    link.click();
  };

  // 文字样式处理
  const handleTextStyle = (style) => {
    if (!selectedElement || selectedElement.type !== 'text') return;
    
    switch(style) {
      case 'bold':
        selectedElement.set({ fontWeight: selectedElement.fontWeight === 'bold' ? 'normal' : 'bold' });
        break;
      case 'italic':
        selectedElement.set({ fontStyle: selectedElement.fontStyle === 'italic' ? 'normal' : 'italic' });
        break;
      case 'underline':
        selectedElement.set({ textDecoration: selectedElement.textDecoration === 'underline' ? 'none' : 'underline' });
        break;
    }
  };

  const handleFontSizeChange = (delta) => {
    if (!selectedElement || selectedElement.type !== 'text') return;
    const currentSize = selectedElement.fontSize || 16;
    selectedElement.set({ fontSize: Math.max(8, Math.min(200, currentSize + delta)) });
  };

  const handleTextAlign = (align) => {
    if (!selectedElement || selectedElement.type !== 'text') return;
    selectedElement.set({ align });
  };

  return (
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
          {/* 选中图片时显示的工具栏 */}
          {activeToolbar === 'image' && (
            <div className="context-toolbar image-toolbar">
              <div className="toolbar-group">
                <button className="toolbar-btn" onClick={() => handleAlign('left')} title="左对齐">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <line x1="3" y1="21" x2="3" y2="3"/>
                    <rect x="7" y="8" width="10" height="8"/>
                  </svg>
                </button>
                <button className="toolbar-btn" onClick={() => handleAlign('center-h')} title="水平居中">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <line x1="12" y1="3" x2="12" y2="21"/>
                    <rect x="7" y="8" width="10" height="8"/>
                  </svg>
                </button>
                <button className="toolbar-btn" onClick={() => handleAlign('right')} title="右对齐">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <line x1="21" y1="21" x2="21" y2="3"/>
                    <rect x="7" y="8" width="10" height="8"/>
                  </svg>
                </button>
              </div>
              
              <div className="toolbar-separator"></div>
              
              <div className="toolbar-group">
                <button className="toolbar-btn" onClick={() => handleLayerMove('up')} title="上移一层">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <polyline points="7 14 12 9 17 14"/>
                  </svg>
                </button>
                <button className="toolbar-btn" onClick={() => handleLayerMove('down')} title="下移一层">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <polyline points="7 10 12 15 17 10"/>
                  </svg>
                </button>
                <button className="toolbar-btn" onClick={() => handleLayerMove('top')} title="置于顶层">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <polyline points="7 11 12 6 17 11"/>
                    <line x1="12" y1="6" x2="12" y2="18"/>
                  </svg>
                </button>
                <button className="toolbar-btn" onClick={() => handleLayerMove('bottom')} title="置于底层">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <polyline points="7 13 12 18 17 13"/>
                    <line x1="12" y1="6" x2="12" y2="18"/>
                  </svg>
                </button>
              </div>
              
              <div className="toolbar-separator"></div>
              
              <div className="toolbar-group">
                <button className="toolbar-btn" onClick={() => handleFlip('horizontal')} title="水平翻转">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <polyline points="16 7 21 12 16 17"/>
                    <polyline points="8 7 3 12 8 17"/>
                  </svg>
                </button>
                <button className="toolbar-btn" onClick={() => handleFlip('vertical')} title="垂直翻转">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <polyline points="7 16 12 21 17 16"/>
                    <polyline points="7 8 12 3 17 8"/>
                  </svg>
                </button>
              </div>
              
              <div className="toolbar-separator"></div>
              
              <div className="toolbar-group">
                <button className="toolbar-btn" onClick={handleLock} title="锁定/解锁">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <rect x="3" y="11" width="18" height="11" rx="2"/>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                </button>
                <button className="toolbar-btn" onClick={handleDuplicate} title="复制">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <rect x="9" y="9" width="13" height="13" rx="2"/>
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                  </svg>
                </button>
                <button className="toolbar-btn danger" onClick={handleDelete} title="删除">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <polyline points="3 6 5 6 21 6"/>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/>
                    <path d="M10 11v6"/>
                    <path d="M14 11v6"/>
                  </svg>
                </button>
              </div>
            </div>
          )}
          
          {/* 选中文字时显示的工具栏 */}
          {activeToolbar === 'text' && (
            <div className="context-toolbar text-toolbar">
              <div className="toolbar-group">
                <select className="font-select" 
                  value={selectedElement?.fontFamily || 'Arial'}
                  onChange={(e) => selectedElement?.set({ fontFamily: e.target.value })}>
                  <option value="Arial">Arial</option>
                  <option value="Helvetica">Helvetica</option>
                  <option value="Times New Roman">Times New Roman</option>
                  <option value="Georgia">Georgia</option>
                  <option value="Courier New">Courier New</option>
                  <option value="Verdana">Verdana</option>
                </select>
              </div>
              
              <div className="toolbar-group">
                <div className="font-size-controls">
                  <button onClick={() => handleFontSizeChange(-2)}>-</button>
                  <input type="number" 
                    value={selectedElement?.fontSize || 16}
                    onChange={(e) => selectedElement?.set({ fontSize: parseInt(e.target.value) || 16 })}
                  />
                  <button onClick={() => handleFontSizeChange(2)}>+</button>
                </div>
              </div>
              
              <div className="toolbar-separator"></div>
              
              <div className="toolbar-group style-group">
                <button 
                  className={`toolbar-btn ${selectedElement?.fontWeight === 'bold' ? 'active' : ''}`}
                  onClick={() => handleTextStyle('bold')} 
                  title="加粗">
                  <strong>B</strong>
                </button>
                <button 
                  className={`toolbar-btn ${selectedElement?.fontStyle === 'italic' ? 'active' : ''}`}
                  onClick={() => handleTextStyle('italic')} 
                  title="斜体">
                  <em>I</em>
                </button>
                <button 
                  className={`toolbar-btn ${selectedElement?.textDecoration === 'underline' ? 'active' : ''}`}
                  onClick={() => handleTextStyle('underline')} 
                  title="下划线">
                  <u>U</u>
                </button>
              </div>
              
              <div className="toolbar-separator"></div>
              
              <div className="toolbar-group">
                <button className="toolbar-btn" onClick={() => handleTextAlign('left')} title="左对齐">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <line x1="17" y1="10" x2="3" y2="10"/>
                    <line x1="21" y1="6" x2="3" y2="6"/>
                    <line x1="21" y1="14" x2="3" y2="14"/>
                    <line x1="17" y1="18" x2="3" y2="18"/>
                  </svg>
                </button>
                <button className="toolbar-btn" onClick={() => handleTextAlign('center')} title="居中">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <line x1="18" y1="10" x2="6" y2="10"/>
                    <line x1="21" y1="6" x2="3" y2="6"/>
                    <line x1="21" y1="14" x2="3" y2="14"/>
                    <line x1="18" y1="18" x2="6" y2="18"/>
                  </svg>
                </button>
                <button className="toolbar-btn" onClick={() => handleTextAlign('right')} title="右对齐">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <line x1="21" y1="10" x2="7" y2="10"/>
                    <line x1="21" y1="6" x2="3" y2="6"/>
                    <line x1="21" y1="14" x2="3" y2="14"/>
                    <line x1="21" y1="18" x2="7" y2="18"/>
                  </svg>
                </button>
              </div>
              
              <div className="toolbar-separator"></div>
              
              <div className="toolbar-group">
                <input 
                  type="color" 
                  className="color-picker"
                  value={selectedElement?.fill || '#000000'}
                  onChange={(e) => selectedElement?.set({ fill: e.target.value })}
                  title="文字颜色"
                />
              </div>
            </div>
          )}
        </div>
        
        <div className="header-right">
          <button className="btn-share">分享</button>
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
          {tools.map(tool => (
            <button
              key={tool.id}
              className={`tool-btn ${activeTool === tool.id ? 'active' : ''}`}
              onClick={() => handleToolClick(tool.id)}
              title={tool.title}
            >
              <span className="tool-icon">{tool.icon}</span>
            </button>
          ))}
        </div>

        {/* 主编辑区 */}
        <div className="editor-main">
          <PolotnoContainer className="polotno-app-container">
            <SidePanelWrap>
              <SidePanel 
                store={store} 
                sections={customSections}
              />
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
          
          {showLayers && (
            <div className="layers-container">
              <div className="layers-list">
                {store.activePage?.children.slice().reverse().map((element, index) => (
                  <div 
                    key={element.id}
                    className={`layer-item ${selectedElement?.id === element.id ? 'selected' : ''}`}
                    onClick={() => store.selectElements([element.id])}
                  >
                    <div className="layer-thumbnail">
                      {element.type === 'text' ? 'T' : 
                       element.type === 'image' ? '🖼' : 
                       element.type === 'svg' ? '⭐' : '□'}
                    </div>
                    <div className="layer-info">
                      <div className="layer-name">
                        {element.type === 'text' ? element.text?.substring(0, 20) : 
                         element.name || `${element.type} ${store.activePage.children.length - index}`}
                      </div>
                      <div className="layer-actions">
                        <button 
                          className="btn-visibility"
                          onClick={(e) => {
                            e.stopPropagation();
                            element.set({ visible: !element.visible });
                          }}
                        >
                          {element.visible !== false ? '👁' : '👁‍🗨'}
                        </button>
                        <button 
                          className="btn-lock"
                          onClick={(e) => {
                            e.stopPropagation();
                            element.set({ 
                              draggable: !element.draggable,
                              selectable: !element.selectable 
                            });
                          }}
                        >
                          {element.draggable !== false ? '🔓' : '🔒'}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="layers-footer">
                <button className="btn-add-layer">+ 添加图层</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

export default EnhancedEditor;