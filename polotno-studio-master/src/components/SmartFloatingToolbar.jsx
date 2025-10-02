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
  const animationFrameRef = useRef(null);
  
  // 布局状态：根据可用空间自动切换
  const [layout, setLayout] = useState({
    side: 'top',          // top | bottom | left | right
    vertical: false,      // 垂直堆叠（用于左右侧显示）
    compact: false,       // 紧凑模式
    mini: false           // 迷你模式（更小按钮）
  });
  
  // 获取画布容器的可视区域矩形（兼容多种容器结构）
  const getCanvasRect = () => {
    const selectors = [
      '.polotno-workspace-container',
      '.konvajs-content',
      '.polotno-page-container',
      '.polotno-app-container',
      '.canvas-viewport',
      '.canvas-container'
    ];
    for (let i = 0; i < selectors.length; i++) {
      const el = document.querySelector(selectors[i]);
      if (el) {
        const rect = el.getBoundingClientRect();
        if (rect && rect.width > 0 && rect.height > 0) return rect;
      }
    }
    const fallback = document.querySelector('canvas');
    return fallback ? fallback.getBoundingClientRect() : null;
  };

  // 实时位置更新函数
  const updatePositionRealtime = (element) => {
    if (!element || !visible) return;

    const canvasRect = getCanvasRect();
    if (!canvasRect) return;
    const zoom = store.zoom || 1;

    // 计算元素在视口中的位置
    const elementX = canvasRect.left + (element.x * zoom);
    const elementY = canvasRect.top + (element.y * zoom);
    const elementWidth = element.width * (element.scaleX || 1) * zoom;
    const elementHeight = element.height * (element.scaleY || 1) * zoom;

    // 计算工具栏位置（快速版本，具备基本碰撞/尺寸自适应）
    const toolbarElement = toolbarRef.current;
    let baseWidth = toolbarElement ? toolbarElement.offsetWidth : 400;
    let baseHeight = toolbarElement ? toolbarElement.offsetHeight : 48;

    // 基于当前布局估算尺寸
    let currentLayout = { ...layout };
    let toolbarWidth = baseWidth;
    let toolbarHeight = baseHeight;
    if (currentLayout.compact) {
      toolbarWidth *= 0.85;
      toolbarHeight *= 0.85;
    }
    if (currentLayout.mini) {
      toolbarWidth *= 0.75;
      toolbarHeight *= 0.75;
    }
    if (currentLayout.vertical) {
      // 粗略估计竖排后高度变大、宽度变小
      const t = toolbarWidth;
      toolbarWidth = Math.max(200, Math.min(260, t * 0.55));
      toolbarHeight = Math.max(baseHeight, baseHeight * 1.8);
    }

    let toolbarX = elementX + elementWidth / 2;
    let toolbarY = elementY - 12;

    // 简单边界检测
    toolbarX = Math.max(toolbarWidth / 2 + 10,
      Math.min(window.innerWidth - toolbarWidth / 2 - 10, toolbarX)
    );

    if (toolbarY - toolbarHeight < 10) {
      toolbarY = elementY + elementHeight + 12;
      currentLayout.side = 'bottom';
    } else {
      currentLayout.side = 'top';
    }

    toolbarY = Math.max(toolbarHeight / 2 + 10,
      Math.min(window.innerHeight - toolbarHeight / 2 - 10, toolbarY)
    );

    // 决策：如果仍然接近元素边界，尝试左右侧并切换垂直/紧凑/迷你
    const margin = 8;
    const elementRect = {
      left: elementX,
      right: elementX + elementWidth,
      top: elementY,
      bottom: elementY + elementHeight
    };
    const toolbarRect = {
      left: toolbarX - toolbarWidth / 2,
      right: toolbarX + toolbarWidth / 2,
      top: toolbarY - toolbarHeight / 2,
      bottom: toolbarY + toolbarHeight / 2
    };

    const isIntersect = !(
      toolbarRect.right < elementRect.left - margin ||
      toolbarRect.left > elementRect.right + margin ||
      toolbarRect.bottom < elementRect.top - margin ||
      toolbarRect.top > elementRect.bottom + margin
    );

    if (isIntersect) {
      // 尝试放到左侧或右侧（竖向布局）
      const spaceLeft = elementRect.left - 10;
      const spaceRight = window.innerWidth - elementRect.right - 10;
      const preferRight = spaceRight >= spaceLeft;

      currentLayout.vertical = true;
      toolbarWidth = Math.max(200, Math.min(260, baseWidth * 0.55));
      toolbarHeight = Math.max(baseHeight * 1.6, baseHeight + 60);
      let xCandidate = preferRight ? elementRect.right + 12 + toolbarWidth / 2 : elementRect.left - 12 - toolbarWidth / 2;
      let yCandidate = elementRect.top + elementHeight / 2;

      // 如果空间不足，开启紧凑或迷你
      if (preferRight ? spaceRight < toolbarWidth + 12 : spaceLeft < toolbarWidth + 12) {
        currentLayout.compact = true;
        toolbarWidth *= 0.9;
        if ((preferRight ? spaceRight : spaceLeft) < toolbarWidth + 12) {
          currentLayout.mini = true;
          toolbarWidth *= 0.85;
        }
        xCandidate = preferRight ? elementRect.right + 12 + toolbarWidth / 2 : elementRect.left - 12 - toolbarWidth / 2;
      }

      toolbarX = Math.max(10 + toolbarWidth / 2, Math.min(window.innerWidth - 10 - toolbarWidth / 2, xCandidate));
      toolbarY = Math.max(10 + toolbarHeight / 2, Math.min(window.innerHeight - 10 - toolbarHeight / 2, yCandidate));
      currentLayout.side = preferRight ? 'right' : 'left';
    }

    setLayout(currentLayout);
    setPosition({ x: toolbarX, y: toolbarY });

    // 继续下一帧更新
    if (visible && selectedElement) {
      animationFrameRef.current = requestAnimationFrame(() =>
        updatePositionRealtime(selectedElement)
      );
    }
  };

  // 更新工具栏位置（带防抖）
  const updatePosition = (element) => {
    if (positionTimeoutRef.current) {
      clearTimeout(positionTimeoutRef.current);
    }

    positionTimeoutRef.current = setTimeout(() => {
      if (!element) return;
      const canvasRect = getCanvasRect();
      if (!canvasRect) return;
      const zoom = store.zoom || 1;

      // 计算元素在视口中的位置和大小
      const elementX = canvasRect.left + (element.x * zoom);
      const elementY = canvasRect.top + (element.y * zoom);
      const elementWidth = element.width * (element.scaleX || 1) * zoom;
      const elementHeight = element.height * (element.scaleY || 1) * zoom;

      // 获取工具栏的实际尺寸
      const toolbarElement = toolbarRef.current;
      const toolbarWidth = toolbarElement ? toolbarElement.offsetWidth : 400;
      const toolbarHeight = toolbarElement ? toolbarElement.offsetHeight : 48;

      // 智能位置计算 - 优先选择最佳位置
      const positions = [
        // 上方中央
        { x: elementX + elementWidth / 2, y: elementY - 12, priority: 1 },
        // 下方中央
        { x: elementX + elementWidth / 2, y: elementY + elementHeight + 12, priority: 2 },
        // 左侧中央（如果元素够宽）
        { x: elementX - 12, y: elementY + elementHeight / 2, priority: 3 },
        // 右侧中央（如果元素够宽）
        { x: elementX + elementWidth + 12, y: elementY + elementHeight / 2, priority: 4 },
        // 元素内部中央（最后选择）
        { x: elementX + elementWidth / 2, y: elementY + elementHeight / 2, priority: 5 }
      ];

      // 筛选出合适的位置（不超出屏幕边界）
      const validPositions = positions.filter(pos => {
        const adjustedX = pos.x - toolbarWidth / 2;
        const adjustedY = pos.y - toolbarHeight / 2;

        return adjustedX >= 10 &&
               adjustedX + toolbarWidth <= window.innerWidth - 10 &&
               adjustedY >= 10 &&
               adjustedY + toolbarHeight <= window.innerHeight - 10;
      });

      // 选择优先级最高的位置，如果都没有则选择最接近边界的位置
      let bestPosition;
      if (validPositions.length > 0) {
        bestPosition = validPositions.reduce((best, current) =>
          current.priority < best.priority ? current : best
        );
      } else {
        // 如果没有完全合适的位置，选择最不超出边界的位置
        bestPosition = positions.reduce((best, current) => {
          const currentOverflowX = Math.max(
            10 - (current.x - toolbarWidth / 2),
            (current.x + toolbarWidth / 2) - (window.innerWidth - 10),
            0
          );
          const currentOverflowY = Math.max(
            10 - (current.y - toolbarHeight / 2),
            (current.y + toolbarHeight / 2) - (window.innerHeight - 10),
            0
          );
          const currentScore = currentOverflowX + currentOverflowY;

          const bestOverflowX = Math.max(
            10 - (best.x - toolbarWidth / 2),
            (best.x + toolbarWidth / 2) - (window.innerWidth - 10),
            0
          );
          const bestOverflowY = Math.max(
            10 - (best.y - toolbarHeight / 2),
            (best.y + toolbarHeight / 2) - (window.innerHeight - 10),
            0
          );
          const bestScore = bestOverflowX + bestOverflowY;

          return currentScore < bestScore ? current : best;
        });
      }

      // 最终位置调整，确保不超过边界
      let toolbarX = Math.max(10 + toolbarWidth / 2,
        Math.min(window.innerWidth - 10 - toolbarWidth / 2, bestPosition.x)
      );
      let toolbarY = Math.max(10 + toolbarHeight / 2,
        Math.min(window.innerHeight - 10 - toolbarHeight / 2, bestPosition.y)
      );

      setPosition({ x: toolbarX, y: toolbarY });
    }, 16); // 使用16ms以获得更流畅的体验（约60fps）
  };

  // 监听元素选择变化和实时更新
  useEffect(() => {
    const updateToolbar = () => {
      const selected = store.selectedElements?.[0];

      if (selected) {
        setSelectedElement(selected);
        setToolbarType(selected.type);
        updatePosition(selected);
        setVisible(true);

        // 启动实时位置更新
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
        animationFrameRef.current = requestAnimationFrame(() =>
          updatePositionRealtime(selected)
        );
      } else {
        setVisible(false);
        setSelectedElement(null);
        setToolbarType(null);

        // 停止实时位置更新
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
          animationFrameRef.current = null;
        }
      }
    };

    // 实时监听元素变化和画布事件
    const handleElementChange = () => {
      if (selectedElement) {
        updatePosition(selectedElement);
      }
    };

    // 监听窗口大小变化
    const handleWindowResize = () => {
      if (selectedElement) {
        updatePosition(selectedElement);
      }
    };

    // 监听画布滚动
    const handleCanvasScroll = () => {
      if (selectedElement) {
        updatePosition(selectedElement);
      }
    };

    // 监听缩放变化
    const handleZoomChange = () => {
      if (selectedElement) {
        updatePosition(selectedElement);
      }
    };

    // 添加更多监听事件
    store.on('change', updateToolbar);
    store.on('change', handleElementChange); // 监听所有变化
    window.addEventListener('resize', handleWindowResize);
    window.addEventListener('scroll', handleCanvasScroll, true); // 捕获阶段以监听所有滚动

    // 监听Polotno特定的缩放变化事件
    if (store.onZoomChange) {
      store.onZoomChange(handleZoomChange);
    }
    
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

    // 添加所有事件监听器
    store.on('change', updateToolbar);
    store.on('change', handleElementChange);
    window.addEventListener('resize', handleWindowResize);
    window.addEventListener('scroll', handleCanvasScroll, true);

    if (store.onZoomChange) {
      store.onZoomChange(handleZoomChange);
    }

    document.addEventListener('mousedown', handleCanvasClick);

    return () => {
      // 清理所有事件监听器
      store.off('change', updateToolbar);
      store.off('change', handleElementChange);
      window.removeEventListener('resize', handleWindowResize);
      window.removeEventListener('scroll', handleCanvasScroll, true);

      if (store.offZoomChange) {
        store.offZoomChange(handleZoomChange);
      }

      document.removeEventListener('mousedown', handleCanvasClick);

      if (positionTimeoutRef.current) {
        clearTimeout(positionTimeoutRef.current);
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
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
    
    try {
      // 使用 Polotno 元素的正确移动方法
      if (direction === 'up') {
        selectedElement.moveUp();
      } else if (direction === 'down') {
        selectedElement.moveDown();
      } else if (direction === 'top') {
        selectedElement.moveToTop();
      } else if (direction === 'bottom') {
        selectedElement.moveToBottom();
      }
    } catch (error) {
      console.warn('图层移动失败:', error);
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
  
  // 类名组合
  const classes = [
    'smart-floating-toolbar',
    visible ? 'visible' : '',
    layout.compact ? 'compact' : '',
    layout.vertical ? 'vertical' : '',
    layout.mini ? 'mini' : ''
  ].filter(Boolean).join(' ');

  return (
    <div
      ref={toolbarRef}
      className={classes}
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