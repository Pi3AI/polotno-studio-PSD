import React, { useState, useEffect, useRef } from 'react';
import { observer } from 'mobx-react-lite';

// 智能浮动工具栏组件
const SmartFloatingToolbar = observer(({ store }) => {
  const [visible, setVisible] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [toolbarType, setToolbarType] = useState(null);
  const [selectedElement, setSelectedElement] = useState(null);
  const toolbarRef = useRef(null);
  const positionTimeoutRef = useRef(null);
  
  // 监听元素选择变化
  useEffect(() => {
    const updateToolbar = () => {
      const selected = store.selectedElements[0];
      
      if (selected) {
        setSelectedElement(selected);
        setToolbarType(selected.type);
        updatePosition(selected);
        setVisible(true);
      } else {
        setVisible(false);
        setSelectedElement(null);
        setToolbarType(null);
      }
    };
    
    // 更新工具栏位置（带防抖）
    const updatePosition = (element) => {
      if (positionTimeoutRef.current) {
        clearTimeout(positionTimeoutRef.current);
      }
      
      positionTimeoutRef.current = setTimeout(() => {
        const canvas = document.querySelector('.polotno-canvas-container');
        if (!canvas || !element) return;
        
        const canvasRect = canvas.getBoundingClientRect();
        const zoom = store.zoom || 1;
        
        // 计算元素在视口中的位置
        const elementX = canvasRect.left + (element.x * zoom);
        const elementY = canvasRect.top + (element.y * zoom);
        const elementWidth = element.width * (element.scaleX || 1) * zoom;
        const elementHeight = element.height * (element.scaleY || 1) * zoom;
        
        // 计算工具栏位置（默认在元素上方）
        let toolbarX = elementX + elementWidth / 2;
        let toolbarY = elementY - 12; // 上方12px
        
        // 边界检测
        const toolbarWidth = 400; // 估计工具栏宽度
        const toolbarHeight = 48; // 工具栏高度
        
        // 水平边界检测
        if (toolbarX - toolbarWidth / 2 < 10) {
          toolbarX = toolbarWidth / 2 + 10;
        } else if (toolbarX + toolbarWidth / 2 > window.innerWidth - 10) {
          toolbarX = window.innerWidth - toolbarWidth / 2 - 10;
        }
        
        // 垂直边界检测（如果上方空间不足，显示在下方）
        if (toolbarY - toolbarHeight < 10) {
          toolbarY = elementY + elementHeight + 12; // 下方12px
        }
        
        setPosition({ x: toolbarX, y: toolbarY });
      }, 50); // 50ms 防抖
    };
    
    // 监听画布点击（取消选择）
    const handleCanvasClick = (e) => {
      if (toolbarRef.current && !toolbarRef.current.contains(e.target)) {
        const isCanvasClick = e.target.closest('.polotno-canvas-container');
        const isSidePanelClick = e.target.closest('.polotno-side-panel');
        
        if (isCanvasClick && !isSidePanelClick) {
          // 点击画布空白处
          const clickedElement = e.target.closest('[data-element-id]');
          if (!clickedElement) {
            store.selectElements([]);
          }
        }
      }
    };
    
    store.on('change', updateToolbar);
    document.addEventListener('mousedown', handleCanvasClick);
    
    return () => {
      store.off('change', updateToolbar);
      document.removeEventListener('mousedown', handleCanvasClick);
      if (positionTimeoutRef.current) {
        clearTimeout(positionTimeoutRef.current);
      }
    };
  }, [store]);
  
  // 工具栏操作函数
  const handleUndo = () => store.history.undo();
  const handleRedo = () => store.history.redo();
  
  const handleFlip = (axis) => {
    if (!selectedElement) return;
    if (axis === 'horizontal') {
      selectedElement.set({ flipX: !selectedElement.flipX });
    } else {
      selectedElement.set({ flipY: !selectedElement.flipY });
    }
  };
  
  const handleAlign = (alignment) => {
    if (!selectedElement || !store.activePage) return;
    
    const page = store.activePage;
    const pageWidth = page.width;
    const pageHeight = page.height;
    const elementWidth = selectedElement.width * (selectedElement.scaleX || 1);
    const elementHeight = selectedElement.height * (selectedElement.scaleY || 1);
    
    switch (alignment) {
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
  
  const handleLock = () => {
    if (!selectedElement) return;
    selectedElement.set({
      draggable: !selectedElement.draggable,
      selectable: !selectedElement.selectable
    });
  };
  
  const handleDuplicate = () => {
    if (!selectedElement || !store.activePage) return;
    store.activePage.clone(selectedElement.id);
  };
  
  const handleDelete = () => {
    if (!selectedElement) return;
    store.deleteElements([selectedElement.id]);
  };
  
  const handleLayer = (direction) => {
    if (!selectedElement || !store.activePage) return;
    
    const page = store.activePage;
    const index = page.children.indexOf(selectedElement);
    
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
  
  const handleTextStyle = (property, value) => {
    if (!selectedElement || selectedElement.type !== 'text') return;
    selectedElement.set({ [property]: value });
  };
  
  const handleColorChange = (color) => {
    if (!selectedElement) return;
    
    if (selectedElement.type === 'text') {
      selectedElement.set({ fill: color });
    } else {
      selectedElement.set({ fill: color });
    }
  };
  
  // 渲染文字工具栏
  const renderTextToolbar = () => (
    <>
      {/* 撤销/重做 */}
      <div className="toolbar-group">
        <button className="toolbar-btn" onClick={handleUndo} title="撤销">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 7v6h6"/>
            <path d="M21 17a9 9 0 00-9-9 9 9 0 00-6 2.3L3 13"/>
          </svg>
        </button>
        <button className="toolbar-btn" onClick={handleRedo} title="重做">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 7v6h-6"/>
            <path d="M3 17a9 9 0 019-9 9 9 0 016 2.3L21 13"/>
          </svg>
        </button>
      </div>
      
      <div className="toolbar-divider"/>
      
      {/* 文字样式 */}
      <div className="toolbar-group">
        <button 
          className={`toolbar-btn ${selectedElement?.fontWeight === 'bold' ? 'active' : ''}`}
          onClick={() => handleTextStyle('fontWeight', selectedElement?.fontWeight === 'bold' ? 'normal' : 'bold')}
          title="加粗"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"/>
            <path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"/>
          </svg>
        </button>
        <button 
          className={`toolbar-btn ${selectedElement?.fontStyle === 'italic' ? 'active' : ''}`}
          onClick={() => handleTextStyle('fontStyle', selectedElement?.fontStyle === 'italic' ? 'normal' : 'italic')}
          title="斜体"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="19" y1="4" x2="10" y2="4"/>
            <line x1="14" y1="20" x2="5" y2="20"/>
            <line x1="15" y1="4" x2="9" y2="20"/>
          </svg>
        </button>
        <button 
          className={`toolbar-btn ${selectedElement?.textDecoration === 'underline' ? 'active' : ''}`}
          onClick={() => handleTextStyle('textDecoration', selectedElement?.textDecoration === 'underline' ? 'none' : 'underline')}
          title="下划线"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M6 3v7a6 6 0 0 0 6 6 6 6 0 0 0 6-6V3"/>
            <line x1="4" y1="21" x2="20" y2="21"/>
          </svg>
        </button>
      </div>
      
      <div className="toolbar-divider"/>
      
      {/* 翻转 */}
      <div className="toolbar-group">
        <button className="toolbar-btn" onClick={() => handleFlip('horizontal')} title="水平翻转">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="16 3 21 8 16 13"/>
            <polyline points="8 3 3 8 8 13"/>
            <path d="M21 8H3"/>
          </svg>
        </button>
        <button className="toolbar-btn" onClick={() => handleFlip('vertical')} title="垂直翻转">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="3 8 8 3 13 8"/>
            <polyline points="3 16 8 21 13 16"/>
            <path d="M8 3v18"/>
          </svg>
        </button>
      </div>
      
      <div className="toolbar-divider"/>
      
      {/* 特效和颜色 */}
      <div className="toolbar-group">
        <button className="toolbar-btn" title="文字特效">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
          </svg>
          <span className="toolbar-label">特效</span>
        </button>
        
        <div className="color-picker-wrapper">
          <input 
            type="color" 
            className="color-picker"
            value={selectedElement?.fill || '#000000'}
            onChange={(e) => handleColorChange(e.target.value)}
            title="文字颜色"
          />
          <span className="toolbar-label">颜色</span>
        </div>
        
        <button className="toolbar-btn" title="动画效果">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M5 12h14"/>
            <path d="M12 5v14"/>
            <circle cx="12" cy="12" r="3"/>
          </svg>
          <span className="toolbar-label">动画</span>
        </button>
      </div>
    </>
  );
  
  // 渲染图片工具栏
  const renderImageToolbar = () => (
    <>
      {/* 对齐工具 */}
      <div className="toolbar-group">
        <button className="toolbar-btn" onClick={() => handleAlign('left')} title="左对齐">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="3" y1="12" x2="3" y2="6"/>
            <line x1="3" y1="18" x2="3" y2="12"/>
            <rect x="7" y="8" width="10" height="8"/>
          </svg>
        </button>
        <button className="toolbar-btn" onClick={() => handleAlign('center-h')} title="水平居中">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="3" x2="12" y2="21"/>
            <rect x="7" y="8" width="10" height="8"/>
          </svg>
        </button>
        <button className="toolbar-btn" onClick={() => handleAlign('right')} title="右对齐">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="21" y1="12" x2="21" y2="6"/>
            <line x1="21" y1="18" x2="21" y2="12"/>
            <rect x="7" y="8" width="10" height="8"/>
          </svg>
        </button>
      </div>
      
      <div className="toolbar-divider"/>
      
      {/* 位置调整 */}
      <div className="toolbar-group">
        <button className="toolbar-btn" onClick={() => handleAlign('top')} title="顶部对齐">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="6" y1="3" x2="18" y2="3"/>
            <rect x="8" y="7" width="8" height="10"/>
          </svg>
        </button>
        <button className="toolbar-btn" onClick={() => handleAlign('center-v')} title="垂直居中">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="3" y1="12" x2="21" y2="12"/>
            <rect x="8" y="7" width="8" height="10"/>
          </svg>
        </button>
        <button className="toolbar-btn" onClick={() => handleAlign('bottom')} title="底部对齐">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="6" y1="21" x2="18" y2="21"/>
            <rect x="8" y="7" width="8" height="10"/>
          </svg>
        </button>
      </div>
      
      <div className="toolbar-divider"/>
      
      {/* 锁定和复制 */}
      <div className="toolbar-group">
        <button 
          className={`toolbar-btn ${selectedElement?.draggable === false ? 'active' : ''}`}
          onClick={handleLock} 
          title="锁定/解锁"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            {selectedElement?.draggable === false ? (
              <>
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </>
            ) : (
              <>
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                <line x1="12" y1="1" x2="12" y2="7" strokeDasharray="2 2"/>
              </>
            )}
          </svg>
        </button>
        <button className="toolbar-btn" onClick={handleDuplicate} title="复制">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
          </svg>
        </button>
      </div>
      
      <div className="toolbar-divider"/>
      
      {/* 图层顺序 */}
      <div className="toolbar-group">
        <button className="toolbar-btn" onClick={() => handleLayer('up')} title="上移一层">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="18 15 12 9 6 15"/>
          </svg>
        </button>
        <button className="toolbar-btn" onClick={() => handleLayer('down')} title="下移一层">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </button>
        <button className="toolbar-btn" onClick={() => handleLayer('top')} title="置于顶层">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="18 15 12 9 6 15"/>
            <line x1="6" y1="3" x2="18" y2="3"/>
          </svg>
        </button>
        <button className="toolbar-btn" onClick={() => handleLayer('bottom')} title="置于底层">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="6 9 12 15 18 9"/>
            <line x1="6" y1="21" x2="18" y2="21"/>
          </svg>
        </button>
      </div>
      
      <div className="toolbar-divider"/>
      
      {/* 删除 */}
      <button className="toolbar-btn toolbar-btn-danger" onClick={handleDelete} title="删除">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="3 6 5 6 21 6"/>
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
        </svg>
      </button>
    </>
  );
  
  // 渲染形状工具栏（与图片类似）
  const renderShapeToolbar = () => renderImageToolbar();
  
  // 根据类型渲染工具栏内容
  const renderToolbarContent = () => {
    switch (toolbarType) {
      case 'text':
        return renderTextToolbar();
      case 'image':
        return renderImageToolbar();
      case 'svg':
      case 'shape':
        return renderShapeToolbar();
      default:
        return renderImageToolbar(); // 默认使用图片工具栏
    }
  };
  
  return (
    <div
      ref={toolbarRef}
      className={`smart-floating-toolbar ${visible ? 'visible' : ''}`}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        transform: 'translateX(-50%)',
      }}
    >
      {selectedElement && renderToolbarContent()}
    </div>
  );
});

export default SmartFloatingToolbar;