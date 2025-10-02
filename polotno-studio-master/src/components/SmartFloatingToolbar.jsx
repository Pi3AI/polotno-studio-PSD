import React, { useState, useEffect, useRef } from 'react';
import { observer } from 'mobx-react-lite';
import { reaction } from 'mobx';

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
    mini: false,          // 迷你模式（更小按钮）
    avoidOverlap: false,  // 特殊样式避免遮挡
    semiTransparent: false, // 半透明模式
    floatingOverlay: false  // 浮动覆盖模式
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

  // 实时位置更新函数 - 优化版本
  const updatePositionRealtime = (element) => {
    if (!element || !visible) return;

    const canvasRect = getCanvasRect();
    if (!canvasRect) return;
    const zoom = store.zoom || 1;

    // 精确计算元素在视口中的位置，考虑所有变换
    const elementX = canvasRect.left + (element.x * zoom);
    const elementY = canvasRect.top + (element.y * zoom);
    const elementWidth = element.width * (element.scaleX || 1) * zoom;
    const elementHeight = element.height * (element.scaleY || 1) * zoom;

    // 获取工具栏实际尺寸
    const toolbarElement = toolbarRef.current;
    let baseWidth = toolbarElement ? toolbarElement.offsetWidth : 400;
    let baseHeight = toolbarElement ? toolbarElement.offsetHeight : 48;

    // 智能位置决策算法
    const findBestPosition = () => {
      const margin = 12; // 安全距离
      const viewportMargin = 10; // 距离屏幕边缘的最小距离
      
      // 定义所有可能的位置方案，按优先级排序
      const positionCandidates = [
        {
          id: 'top-center',
          x: elementX + elementWidth / 2,
          y: elementY - margin - baseHeight / 2,
          side: 'top',
          vertical: false,
          priority: 1
        },
        {
          id: 'bottom-center', 
          x: elementX + elementWidth / 2,
          y: elementY + elementHeight + margin + baseHeight / 2,
          side: 'bottom',
          vertical: false,
          priority: 2
        },
        {
          id: 'right-center',
          x: elementX + elementWidth + margin + baseWidth / 2,
          y: elementY + elementHeight / 2,
          side: 'right',
          vertical: true,
          priority: 3
        },
        {
          id: 'left-center',
          x: elementX - margin - baseWidth / 2,
          y: elementY + elementHeight / 2,
          side: 'left',
          vertical: true,
          priority: 4
        },
        // 角落位置作为备选
        {
          id: 'top-right',
          x: elementX + elementWidth + margin,
          y: elementY - margin,
          side: 'top-right',
          vertical: false,
          priority: 5
        },
        {
          id: 'top-left',
          x: elementX - margin,
          y: elementY - margin,
          side: 'top-left', 
          vertical: false,
          priority: 6
        }
      ];

      // 评估每个位置的适用性
      const evaluatePosition = (pos) => {
        let score = 100 - pos.priority * 10; // 基础优先级分数
        
        // 检查是否与元素重叠
        const toolbarRect = {
          left: pos.x - baseWidth / 2,
          right: pos.x + baseWidth / 2,
          top: pos.y - baseHeight / 2,
          bottom: pos.y + baseHeight / 2
        };
        
        const elementRect = {
          left: elementX - margin,
          right: elementX + elementWidth + margin,
          top: elementY - margin,
          bottom: elementY + elementHeight + margin
        };
        
        // 检查重叠（越少重叠分数越高）
        const overlapX = Math.max(0, Math.min(toolbarRect.right, elementRect.right) - Math.max(toolbarRect.left, elementRect.left));
        const overlapY = Math.max(0, Math.min(toolbarRect.bottom, elementRect.bottom) - Math.max(toolbarRect.top, elementRect.top));
        const overlapArea = overlapX * overlapY;
        
        if (overlapArea > 0) {
          score -= (overlapArea / (baseWidth * baseHeight)) * 50; // 重叠面积越大扣分越多
        }
        
        // 检查是否超出视口边界
        const outOfBounds = Math.max(0, viewportMargin - pos.x + baseWidth / 2) +
                           Math.max(0, pos.x + baseWidth / 2 - (window.innerWidth - viewportMargin)) +
                           Math.max(0, viewportMargin - pos.y + baseHeight / 2) +
                           Math.max(0, pos.y + baseHeight / 2 - (window.innerHeight - viewportMargin));
        
        score -= outOfBounds * 2; // 超出边界扣分
        
        // 距离元素中心的距离（越近越好，但不能重叠）
        const centerX = elementX + elementWidth / 2;
        const centerY = elementY + elementHeight / 2;
        const distance = Math.sqrt(Math.pow(pos.x - centerX, 2) + Math.pow(pos.y - centerY, 2));
        score -= distance * 0.01; // 距离越远扣分越多（影响较小）
        
        return { ...pos, score, overlapArea };
      };

      // 评估所有位置并选择最佳
      const evaluatedPositions = positionCandidates.map(evaluatePosition);
      const bestPosition = evaluatedPositions.reduce((best, current) => 
        current.score > best.score ? current : best
      );

      return bestPosition;
    };

    // 找到最佳位置
    const bestPos = findBestPosition();
    
    // 应用位置约束，确保不超出视口
    let finalX = Math.max(baseWidth / 2 + 10, 
                         Math.min(window.innerWidth - baseWidth / 2 - 10, bestPos.x));
    let finalY = Math.max(baseHeight / 2 + 10,
                         Math.min(window.innerHeight - baseHeight / 2 - 10, bestPos.y));

    // 更新布局状态
    const newLayout = {
      side: bestPos.side,
      vertical: bestPos.vertical,
      compact: bestPos.overlapArea > 0, // 如果有重叠则启用紧凑模式
      mini: bestPos.score < 30, // 分数太低则启用迷你模式
      avoidOverlap: bestPos.score < 50, // 需要特殊样式避免遮挡
      semiTransparent: bestPos.overlapArea > (baseWidth * baseHeight * 0.1), // 重叠面积较大时使用半透明
      floatingOverlay: bestPos.overlapArea > 0 && bestPos.overlapArea < (baseWidth * baseHeight * 0.1) // 小范围重叠时使用浮动样式
    };

    setLayout(newLayout);
    setPosition({ x: finalX, y: finalY });

    // 继续下一帧更新（提高帧率限制避免性能问题）
    if (visible && selectedElement) {
      setTimeout(() => {
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
        animationFrameRef.current = requestAnimationFrame(() =>
          updatePositionRealtime(selectedElement)
        );
      }, 16); // 限制为60fps
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

  // 监听元素选择变化和实时更新 - 增强版本
  useEffect(() => {
    let lastUpdateTime = 0;
    const updateThrottle = 16; // 限制更新频率到60fps
    
    const updateToolbar = () => {
      const selected = store.selectedElements?.[0];

      if (selected) {
        setSelectedElement(selected);
        setToolbarType(selected.type);
        updatePosition(selected);
        setVisible(true);

        // 启动高性能实时位置更新
        const startRealtimeUpdate = () => {
          if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
          }
          
          const performUpdate = (timestamp) => {
            if (timestamp - lastUpdateTime >= updateThrottle) {
              updatePositionRealtime(selected);
              lastUpdateTime = timestamp;
            }
            
            if (visible && selectedElement) {
              animationFrameRef.current = requestAnimationFrame(performUpdate);
            }
          };
          
          animationFrameRef.current = requestAnimationFrame(performUpdate);
        };
        
        startRealtimeUpdate();
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

    // 高性能元素变化监听器
    const handleElementChange = () => {
      if (selectedElement) {
        const now = performance.now();
        if (now - lastUpdateTime >= updateThrottle) {
          updatePosition(selectedElement);
          lastUpdateTime = now;
        }
      }
    };

    // 防抖的窗口大小变化处理
    let resizeTimeout = null;
    const handleWindowResize = () => {
      if (resizeTimeout) clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        if (selectedElement) {
          updatePosition(selectedElement);
        }
      }, 100);
    };

    // 高频画布滚动处理
    let scrollTimeout = null;
    const handleCanvasScroll = () => {
      if (scrollTimeout) clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        if (selectedElement) {
          updatePosition(selectedElement);
        }
      }, 16);
    };

    // 缩放变化处理
    const handleZoomChange = () => {
      if (selectedElement) {
        updatePosition(selectedElement);
      }
    };

    // MobX store 变化监听
    const handleStoreChange = () => {
      updateToolbar();
      handleElementChange();
    };

    // 监听画布交互事件
    const handleCanvasInteraction = (e) => {
      if (toolbarRef.current && !toolbarRef.current.contains(e.target)) {
        const isCanvasClick = e.target.closest('.polotno-canvas-container') || 
                             e.target.closest('.konvajs-content') ||
                             e.target.closest('canvas');
        const isSidePanelClick = e.target.closest('.polotno-side-panel') ||
                                e.target.closest('.sidebar');

        if (isCanvasClick && !isSidePanelClick) {
          const clickedElement = e.target.closest('[data-element-id]');
          if (!clickedElement && e.target.tagName === 'CANVAS') {
            // 点击画布空白处取消选择
            setTimeout(() => store.selectElements([]), 0);
          }
        }
      }
    };

    // 监听元素拖拽和变换
    const handleElementTransform = () => {
      if (selectedElement) {
        updatePosition(selectedElement);
      }
    };

    // 使用MobX reaction监听store变化
    const reactionDisposer = reaction(
      () => {
        // 监听选中元素的变化
        const selected = store.selectedElements?.[0];
        return {
          selectedId: selected?.id,
          selectedType: selected?.type,
          x: selected?.x,
          y: selected?.y,
          width: selected?.width,
          height: selected?.height,
          scaleX: selected?.scaleX,
          scaleY: selected?.scaleY,
          zoom: store.zoom
        };
      },
      (current, previous) => {
        // 当监听的值发生变化时执行
        if (current.selectedId !== previous?.selectedId) {
          updateToolbar();
        } else if (current.selectedId && (
          current.x !== previous?.x ||
          current.y !== previous?.y ||
          current.width !== previous?.width ||
          current.height !== previous?.height ||
          current.scaleX !== previous?.scaleX ||
          current.scaleY !== previous?.scaleY ||
          current.zoom !== previous?.zoom
        )) {
          handleElementChange();
        }
      },
      { fireImmediately: true }
    );

    // 添加DOM事件监听器
    window.addEventListener('resize', handleWindowResize);
    window.addEventListener('scroll', handleCanvasScroll, { passive: true, capture: true });
    
    // 监听更多画布交互事件
    document.addEventListener('mousedown', handleCanvasInteraction);
    document.addEventListener('mousemove', handleElementTransform, { passive: true });
    document.addEventListener('mouseup', handleElementTransform, { passive: true });
    
    // 监听键盘操作（如方向键移动元素）
    document.addEventListener('keydown', handleElementTransform);

    // 监听Polotno特定事件
    if (store && typeof store.onZoomChange === 'function') {
      store.onZoomChange(handleZoomChange);
    }

    // 初始更新
    updateToolbar();

    return () => {
      // 清理MobX reaction
      if (reactionDisposer) {
        reactionDisposer();
      }
      
      // 清理DOM事件监听器
      window.removeEventListener('resize', handleWindowResize);
      window.removeEventListener('scroll', handleCanvasScroll);
      document.removeEventListener('mousedown', handleCanvasInteraction);
      document.removeEventListener('mousemove', handleElementTransform);
      document.removeEventListener('mouseup', handleElementTransform);
      document.removeEventListener('keydown', handleElementTransform);

      // 清理Polotno事件监听器
      if (store && typeof store.offZoomChange === 'function') {
        try {
          store.offZoomChange(handleZoomChange);
        } catch (error) {
          console.warn('Polotno事件监听器清理失败:', error);
        }
      }

      // 清理定时器和动画帧
      if (positionTimeoutRef.current) {
        clearTimeout(positionTimeoutRef.current);
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (resizeTimeout) {
        clearTimeout(resizeTimeout);
      }
      if (scrollTimeout) {
        clearTimeout(scrollTimeout);
      }
    };
  }, [store, selectedElement, visible]);
  
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
  
  // 类名组合 - 增强版本
  const classes = [
    'smart-floating-toolbar',
    visible ? 'visible' : '',
    layout.compact ? 'compact' : '',
    layout.vertical ? 'vertical' : '',
    layout.mini ? 'mini' : '',
    layout.avoidOverlap ? 'avoid-overlap' : '',
    layout.semiTransparent ? 'semi-transparent' : '',
    layout.floatingOverlay ? 'floating-overlay' : ''
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