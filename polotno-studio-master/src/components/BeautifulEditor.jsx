import React, { useState, useEffect, useRef } from 'react';
import { observer } from 'mobx-react-lite';
import { PolotnoContainer, SidePanelWrap, WorkspaceWrap } from 'polotno';
import { Toolbar } from 'polotno/toolbar/toolbar';
import { ZoomButtons } from 'polotno/toolbar/zoom-buttons';
import { Workspace } from 'polotno/canvas/workspace';
import { SidePanel, DEFAULT_SECTIONS } from 'polotno/side-panel';
import { PagesTimeline } from 'polotno/pages-timeline';

// 导入美化样式
import '../styles/beauty-system.css';

// 智能浮动工具栏组件
const FloatingToolbar = ({ type, element, store, position }) => {
  const toolbarRef = useRef(null);
  const [toolbarPos, setToolbarPos] = useState({ x: 0, y: 0 });
  
  useEffect(() => {
    if (!element || !position) return;
    
    const updatePosition = () => {
      if (!toolbarRef.current) return;
      
      const toolbarWidth = toolbarRef.current.offsetWidth;
      const toolbarHeight = toolbarRef.current.offsetHeight;
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      
      // 计算工具栏位置（元素上方）
      let x = position.x + position.width / 2;
      let y = position.y - toolbarHeight - 20;
      
      // 防止超出视口
      if (x - toolbarWidth / 2 < 10) {
        x = toolbarWidth / 2 + 10;
      }
      if (x + toolbarWidth / 2 > viewportWidth - 10) {
        x = viewportWidth - toolbarWidth / 2 - 10;
      }
      if (y < 80) { // 顶部留空间给主工具栏
        y = position.y + position.height + 20; // 显示在下方
      }
      
      setToolbarPos({ x, y });
    };
    
    updatePosition();
    
    // 监听窗口调整
    window.addEventListener('resize', updatePosition);
    return () => window.removeEventListener('resize', updatePosition);
  }, [position]);
  
  // 元素操作函数
  const handleAlign = (direction) => {
    if (!element || !store.activePage) return;
    
    const page = store.activePage;
    const pageWidth = page.width;
    const pageHeight = page.height;
    const elementWidth = element.width * (element.scaleX || 1);
    const elementHeight = element.height * (element.scaleY || 1);
    
    const alignments = {
      'left': { x: 0 },
      'center-h': { x: (pageWidth - elementWidth) / 2 },
      'right': { x: pageWidth - elementWidth },
      'top': { y: 0 },
      'center-v': { y: (pageHeight - elementHeight) / 2 },
      'bottom': { y: pageHeight - elementHeight }
    };
    
    if (alignments[direction]) {
      element.set(alignments[direction]);
    }
  };
  
  const handleFlip = (axis) => {
    if (!element) return;
    
    if (axis === 'h') {
      element.set({ flipX: !element.flipX });
    } else {
      element.set({ flipY: !element.flipY });
    }
  };
  
  const handleLayer = (direction) => {
    if (!element || !store.activePage) return;
    
    const page = store.activePage;
    const index = page.children.indexOf(element);
    
    if (direction === 'up' && index < page.children.length - 1) {
      page.moveChild(element, index + 1);
    } else if (direction === 'down' && index > 0) {
      page.moveChild(element, index - 1);
    }
  };
  
  const handleLock = () => {
    if (!element) return;
    
    element.set({
      draggable: !element.draggable,
      selectable: !element.selectable
    });
  };
  
  const handleDuplicate = () => {
    if (!element || !store.activePage) return;
    store.activePage.clone(element.id);
  };
  
  const handleDelete = () => {
    if (!element || !store) return;
    store.deleteElements([element.id]);
  };
  
  const handleTextStyle = (property, value) => {
    if (!element || element.type !== 'text') return;
    element.set({ [property]: value });
  };
  
  const handleExport = async () => {
    const dataURL = await store.toDataURL();
    const link = document.createElement('a');
    link.href = dataURL;
    link.download = 'design.png';
    link.click();
  };
  
  // 渲染图片编辑工具栏
  if (type === 'image') {
    return (
      <div 
        ref={toolbarRef}
        className="floating-toolbar show"
        style={{
          left: `${toolbarPos.x}px`,
          top: `${toolbarPos.y}px`
        }}
      >
        <div className="floating-toolbar-group">
          <button className="floating-tool-btn" onClick={() => handleAlign('left')} title="左对齐">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="21" y1="21" x2="3" y2="21"/>
              <rect x="5" y="8" width="4" height="8"/>
              <rect x="13" y="3" width="6" height="13"/>
            </svg>
          </button>
          <button className="floating-tool-btn" onClick={() => handleAlign('center-h')} title="水平居中">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="21" x2="12" y2="3"/>
              <rect x="3" y="8" width="4" height="8"/>
              <rect x="17" y="3" width="4" height="13"/>
            </svg>
          </button>
          <button className="floating-tool-btn" onClick={() => handleAlign('right')} title="右对齐">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="21" y1="21" x2="21" y2="3"/>
              <rect x="15" y="8" width="4" height="8"/>
              <rect x="5" y="3" width="6" height="13"/>
            </svg>
          </button>
        </div>
        
        <div className="floating-toolbar-separator"/>
        
        <div className="floating-toolbar-group">
          <button className="floating-tool-btn" onClick={() => handleLayer('up')} title="上移一层">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="17 11 12 6 7 11"/>
              <polyline points="17 18 12 13 7 18"/>
            </svg>
          </button>
          <button className="floating-tool-btn" onClick={() => handleLayer('down')} title="下移一层">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="7 7 12 12 17 7"/>
              <polyline points="7 14 12 19 17 14"/>
            </svg>
          </button>
        </div>
        
        <div className="floating-toolbar-separator"/>
        
        <div className="floating-toolbar-group">
          <button className="floating-tool-btn" onClick={() => handleFlip('h')} title="水平翻转">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/>
              <line x1="12" y1="3" x2="12" y2="21"/>
            </svg>
          </button>
          <button className="floating-tool-btn" onClick={() => handleFlip('v')} title="垂直翻转">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/>
              <line x1="3" y1="12" x2="21" y2="12"/>
            </svg>
          </button>
          <button className="floating-tool-btn" title="裁剪">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6.13 1L6 16a2 2 0 0 0 2 2h15"/>
              <path d="M1 6.13L16 6a2 2 0 0 1 2 2v15"/>
            </svg>
          </button>
        </div>
        
        <div className="floating-toolbar-separator"/>
        
        <div className="floating-toolbar-group">
          <button className="floating-tool-btn" onClick={handleLock} title="锁定">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
          </button>
          <button className="floating-tool-btn" onClick={handleDuplicate} title="复制">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="9" y="9" width="13" height="13" rx="2"/>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
            </svg>
          </button>
          <button className="floating-tool-btn" onClick={handleDelete} title="删除">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="3 6 5 6 21 6"/>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/>
            </svg>
          </button>
        </div>
        
        <button className="floating-export-btn" onClick={handleExport}>
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="7 10 12 15 17 10"/>
            <line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          <span>Export</span>
        </button>
      </div>
    );
  }
  
  // 渲染文字编辑工具栏
  if (type === 'text') {
    return (
      <div 
        ref={toolbarRef}
        className="floating-toolbar show"
        style={{
          left: `${toolbarPos.x}px`,
          top: `${toolbarPos.y}px`
        }}
      >
        <div className="floating-toolbar-group">
          <select 
            className="floating-font-select"
            value={element.fontFamily || 'Arial'}
            onChange={(e) => handleTextStyle('fontFamily', e.target.value)}
          >
            <option value="Arial">Arial</option>
            <option value="Helvetica">Helvetica</option>
            <option value="Times New Roman">Times New Roman</option>
            <option value="Georgia">Georgia</option>
            <option value="Courier New">Courier New</option>
          </select>
        </div>
        
        <div className="floating-toolbar-group">
          <div className="floating-font-size-controls">
            <button 
              className="floating-font-size-btn"
              onClick={() => {
                const size = (element.fontSize || 16) - 2;
                handleTextStyle('fontSize', Math.max(8, size));
              }}
            >-</button>
            <input 
              type="number"
              className="floating-font-size-input"
              value={element.fontSize || 16}
              onChange={(e) => handleTextStyle('fontSize', parseInt(e.target.value) || 16)}
            />
            <button 
              className="floating-font-size-btn"
              onClick={() => {
                const size = (element.fontSize || 16) + 2;
                handleTextStyle('fontSize', Math.min(200, size));
              }}
            >+</button>
          </div>
        </div>
        
        <div className="floating-toolbar-group">
          <button 
            className={`floating-tool-btn floating-color-picker ${element.fill ? '' : ''}`}
            title="文字颜色"
          >
            <span style={{ fontWeight: 'bold', fontSize: '18px' }}>A</span>
            <span 
              className="floating-color-swatch" 
              style={{ background: element.fill || '#000000' }}
            />
          </button>
        </div>
        
        <div className="floating-toolbar-separator"/>
        
        <div className="floating-toolbar-group">
          <button 
            className={`floating-tool-btn ${element.fontWeight === 'bold' ? 'active' : ''}`}
            onClick={() => handleTextStyle('fontWeight', element.fontWeight === 'bold' ? 'normal' : 'bold')}
            title="加粗"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"/>
              <path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"/>
            </svg>
          </button>
          <button 
            className={`floating-tool-btn ${element.fontStyle === 'italic' ? 'active' : ''}`}
            onClick={() => handleTextStyle('fontStyle', element.fontStyle === 'italic' ? 'normal' : 'italic')}
            title="斜体"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="19" y1="4" x2="10" y2="4"/>
              <line x1="14" y1="20" x2="5" y2="20"/>
              <line x1="15" y1="4" x2="9" y2="20"/>
            </svg>
          </button>
          <button 
            className={`floating-tool-btn ${element.textDecoration === 'underline' ? 'active' : ''}`}
            onClick={() => handleTextStyle('textDecoration', element.textDecoration === 'underline' ? 'none' : 'underline')}
            title="下划线"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 3v7a6 6 0 0 0 6 6 6 6 0 0 0 6-6V3"/>
              <line x1="4" y1="21" x2="20" y2="21"/>
            </svg>
          </button>
          <button 
            className={`floating-tool-btn ${element.textDecoration === 'line-through' ? 'active' : ''}`}
            onClick={() => handleTextStyle('textDecoration', element.textDecoration === 'line-through' ? 'none' : 'line-through')}
            title="删除线"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M16 4H9a3 3 0 0 0-2.83 4"/>
              <path d="M14 12a4 4 0 0 1 0 8H6"/>
              <line x1="4" y1="12" x2="20" y2="12"/>
            </svg>
          </button>
        </div>
        
        <div className="floating-toolbar-separator"/>
        
        <div className="floating-toolbar-group">
          <button 
            className="floating-tool-btn"
            onClick={() => handleTextStyle('align', 'left')}
            title="左对齐"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="21" y1="10" x2="3" y2="10"/>
              <line x1="21" y1="6" x2="3" y2="6"/>
              <line x1="21" y1="14" x2="3" y2="14"/>
              <line x1="21" y1="18" x2="3" y2="18"/>
            </svg>
          </button>
          <button 
            className="floating-tool-btn"
            onClick={() => handleTextStyle('align', 'center')}
            title="居中对齐"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="21" y1="10" x2="3" y2="10"/>
              <line x1="17" y1="6" x2="7" y2="6"/>
              <line x1="21" y1="14" x2="3" y2="14"/>
              <line x1="17" y1="18" x2="7" y2="18"/>
            </svg>
          </button>
          <button 
            className="floating-tool-btn"
            onClick={() => handleTextStyle('align', 'right')}
            title="右对齐"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="21" y1="10" x2="3" y2="10"/>
              <line x1="21" y1="6" x2="7" y2="6"/>
              <line x1="21" y1="14" x2="3" y2="14"/>
              <line x1="21" y1="18" x2="7" y2="18"/>
            </svg>
          </button>
        </div>
      </div>
    );
  }
  
  return null;
};

// 美化的编辑器主组件
const BeautifulEditor = observer(({ store }) => {
  const [selectedElement, setSelectedElement] = useState(null);
  const [elementPosition, setElementPosition] = useState(null);
  const [toolbarType, setToolbarType] = useState(null);
  const [currentTool, setCurrentTool] = useState('select');
  const canvasRef = useRef(null);
  
  // 监听元素选择
  useEffect(() => {
    const updateSelection = () => {
      const selected = store.selectedElements[0];
      setSelectedElement(selected);
      
      if (selected) {
        // 获取元素在画布中的位置
        const canvas = document.querySelector('.polotno-canvas-container');
        if (canvas) {
          const rect = canvas.getBoundingClientRect();
          const zoom = store.zoom || 1;
          
          setElementPosition({
            x: rect.left + (selected.x * zoom),
            y: rect.top + (selected.y * zoom),
            width: selected.width * (selected.scaleX || 1) * zoom,
            height: selected.height * (selected.scaleY || 1) * zoom
          });
        }
        
        // 设置工具栏类型
        if (selected.type === 'text') {
          setToolbarType('text');
        } else if (selected.type === 'image') {
          setToolbarType('image');
        } else {
          setToolbarType('general');
        }
      } else {
        setToolbarType(null);
        setElementPosition(null);
      }
    };
    
    store.on('change', updateSelection);
    return () => store.off('change', updateSelection);
  }, [store]);
  
  // 工具切换
  const handleToolChange = (toolId) => {
    setCurrentTool(toolId);
    
    const sectionMap = {
      'text': 'text',
      'images': 'photos',
      'shapes': 'elements',
      'templates': 'templates',
      'background': 'background',
      'upload': 'upload'
    };
    
    const sectionName = sectionMap[toolId] || 'templates';
    
    if (store?.openSidePanel) {
      store.openSidePanel(sectionName);
    }
  };
  
  return (
    <div className="beautiful-editor">
      {/* 顶部主工具栏 */}
      <div className="top-toolbar">
        <div className="top-toolbar-left">
          <div className="brand-logo">
            <span>✨</span>
            <span>AI Design Studio</span>
          </div>
        </div>
        
        {/* <div className="top-toolbar-center">
          <button className="nav-btn">File</button>
          <button className="nav-btn">Edit</button>
          <button className="nav-btn">View</button>
          <button className="nav-btn">Insert</button>
          <button className="nav-btn">Format</button>
          <button className="nav-btn">Tools</button>
          <button className="nav-btn">Help</button>
        </div>
         */}
        <div className="top-toolbar-right">
          <button className="nav-btn">Share</button>
          <button className="nav-btn active">Export</button>
        </div>
      </div>
      
      {/* 左侧工具栏 - 极简设计 */}
      <div className="left-toolbar">
        <div className="left-toolbar-header">TOOLS</div>
        
        {/* 选择工具 */}
        <button
          className={`tool-btn ${currentTool === 'select' ? 'active' : ''}`}
          onClick={() => handleToolChange('select')}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z"/>
          </svg>
          <span className="tool-tooltip">Select</span>
        </button>
        
        {/* 文字工具 */}
        <button
          className={`tool-btn ${currentTool === 'text' ? 'active' : ''}`}
          onClick={() => handleToolChange('text')}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <polyline points="4 7 4 4 20 4 20 7"/>
            <line x1="9" y1="20" x2="15" y2="20"/>
            <line x1="12" y1="4" x2="12" y2="20"/>
          </svg>
          <span className="tool-tooltip">Text</span>
        </button>
        
        <div className="tool-divider"/>
        
        <div className="left-toolbar-header">ELEMENTS</div>
        
        {/* 形状工具 */}
        <button
          className={`tool-btn ${currentTool === 'shapes' ? 'active' : ''}`}
          onClick={() => handleToolChange('shapes')}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="3" y="3" width="18" height="18" rx="2"/>
          </svg>
          <span className="tool-tooltip">Shapes</span>
        </button>
        
        {/* 图片工具 */}
        <button
          className={`tool-btn ${currentTool === 'images' ? 'active' : ''}`}
          onClick={() => handleToolChange('images')}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
            <circle cx="8.5" cy="8.5" r="1.5"/>
            <polyline points="21 15 16 10 5 21"/>
          </svg>
          <span className="tool-tooltip">Images</span>
        </button>
        
        <div className="tool-divider"/>
        
        <div className="left-toolbar-header">DESIGN</div>
        
        {/* 模板工具 */}
        <button
          className={`tool-btn ${currentTool === 'templates' ? 'active' : ''}`}
          onClick={() => handleToolChange('templates')}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
            <line x1="12" y1="18" x2="12" y2="12"/>
            <line x1="9" y1="15" x2="15" y2="15"/>
          </svg>
          <span className="tool-tooltip">Templates</span>
        </button>
        
        {/* 背景工具 - 使用渐变图标 */}
        <button
          className={`tool-btn ${currentTool === 'background' ? 'active' : ''}`}
          onClick={() => handleToolChange('background')}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="3" y="3" width="18" height="18" rx="2"/>
            <path d="M3 9h18M3 15h18M9 3v18M15 3v18" strokeOpacity="0.3"/>
          </svg>
          <span className="tool-tooltip">Background</span>
        </button>
        
        {/* 上传按钮 - 放在底部 */}
        <div className="upload-btn-wrapper">
          <button
            className={`tool-btn ${currentTool === 'upload' ? 'active' : ''}`}
            onClick={() => handleToolChange('upload')}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="17 8 12 3 7 8"/>
              <line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
            <span className="tool-tooltip">Upload</span>
          </button>
        </div>
      </div>
      
      {/* 主画布区域 */}
      <div className="canvas-container" ref={canvasRef}>
        <div className="canvas-workspace">
          <PolotnoContainer className="polotno-app-container">
            <SidePanelWrap>
              <SidePanel store={store} sections={DEFAULT_SECTIONS} />
            </SidePanelWrap>
            
            <WorkspaceWrap>
              <Toolbar store={store} />
              <Workspace store={store} />
              <ZoomButtons store={store} />
              <PagesTimeline store={store} />
            </WorkspaceWrap>
          </PolotnoContainer>
        </div>
      </div>
      
      {/* 右侧图层面板 */}
      <div className="layers-panel">
        <div className="layers-header">
          <span className="layers-title">Layers</span>
          <div className="layers-actions">
            <button className="layer-action-btn" title="Add Layer">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="5" x2="12" y2="19"/>
                <line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
            </button>
            <button className="layer-action-btn" title="Delete Layer">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="3 6 5 6 21 6"/>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/>
              </svg>
            </button>
          </div>
        </div>
        
        <div className="layers-list smooth-scroll">
          {store.activePage && store.activePage.children.slice().reverse().map((element, index) => (
            <div 
              key={element.id}
              className={`layer-item ${selectedElement?.id === element.id ? 'selected' : ''}`}
              onClick={() => store.selectElements([element.id])}
            >
              <div className="layer-thumbnail">
                {element.type === 'text' ? '📝' : 
                 element.type === 'image' ? '🖼️' : 
                 element.type === 'svg' ? '⭐' : '⬛'}
              </div>
              <div className="layer-info">
                <div className="layer-name">
                  {element.type === 'text' ? 
                    (element.text?.substring(0, 20) || 'Text') : 
                    (element.name || `${element.type} ${store.activePage.children.length - index}`)}
                </div>
                <div className="layer-type">{element.type}</div>
              </div>
              <button 
                className="layer-visibility"
                onClick={(e) => {
                  e.stopPropagation();
                  element.set({ visible: !element.visible });
                }}
              >
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                  {element.visible !== false ? (
                    <>
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </>
                  ) : (
                    <>
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                      <line x1="1" y1="1" x2="23" y2="23"/>
                    </>
                  )}
                </svg>
              </button>
            </div>
          ))}
        </div>
      </div>
      
      {/* 智能浮动工具栏 */}
      {selectedElement && elementPosition && (
        <FloatingToolbar
          type={toolbarType}
          element={selectedElement}
          store={store}
          position={elementPosition}
        />
      )}
    </div>
  );
});

export default BeautifulEditor;