import React, { useState, useEffect, useRef } from 'react';
import { observer } from 'mobx-react-lite';
import { PolotnoContainer, SidePanelWrap, WorkspaceWrap } from 'polotno';
import { Toolbar } from 'polotno/toolbar/toolbar';
import { ZoomButtons } from 'polotno/toolbar/zoom-buttons';
import { Workspace } from 'polotno/canvas/workspace';

const PerfectEditor = observer(({ store }) => {
  const [selectedElement, setSelectedElement] = useState(null);
  const [activeToolbar, setActiveToolbar] = useState(null);
  const containerRef = useRef(null);

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

  const handleAlignLeft = () => {
    if (selectedElement) {
      selectedElement.set({ x: 0 });
    }
  };

  const handleAlignCenter = () => {
    if (selectedElement) {
      const pageWidth = store.activePage?.width || 0;
      const elementWidth = selectedElement.width * (selectedElement.scaleX || 1);
      selectedElement.set({ x: (pageWidth - elementWidth) / 2 });
    }
  };

  const handleAlignRight = () => {
    if (selectedElement) {
      const pageWidth = store.activePage?.width || 0;
      const elementWidth = selectedElement.width * (selectedElement.scaleX || 1);
      selectedElement.set({ x: pageWidth - elementWidth });
    }
  };

  const handleMoveUp = () => {
    if (selectedElement) {
      const index = store.activePage?.children.indexOf(selectedElement);
      if (index > 0 && index < store.activePage.children.length - 1) {
        store.activePage.moveChild(selectedElement, index + 1);
      }
    }
  };

  const handleMoveDown = () => {
    if (selectedElement) {
      const index = store.activePage?.children.indexOf(selectedElement);
      if (index > 0) {
        store.activePage.moveChild(selectedElement, index - 1);
      }
    }
  };

  const handleFlipHorizontal = () => {
    if (selectedElement) {
      selectedElement.set({ flipX: !selectedElement.flipX });
    }
  };

  const handleFlipVertical = () => {
    if (selectedElement) {
      selectedElement.set({ flipY: !selectedElement.flipY });
    }
  };

  const handleLock = () => {
    if (selectedElement) {
      selectedElement.set({ 
        draggable: !selectedElement.draggable,
        selectable: !selectedElement.selectable 
      });
    }
  };

  const handleFontChange = (e) => {
    if (selectedElement && selectedElement.type === 'text') {
      selectedElement.set({ fontFamily: e.target.value });
    }
  };

  const handleFontSizeChange = (delta) => {
    if (selectedElement && selectedElement.type === 'text') {
      const currentSize = selectedElement.fontSize || 16;
      selectedElement.set({ fontSize: Math.max(8, currentSize + delta) });
    }
  };

  const handleBold = () => {
    if (selectedElement && selectedElement.type === 'text') {
      selectedElement.set({ fontWeight: selectedElement.fontWeight === 'bold' ? 'normal' : 'bold' });
    }
  };

  const handleItalic = () => {
    if (selectedElement && selectedElement.type === 'text') {
      selectedElement.set({ fontStyle: selectedElement.fontStyle === 'italic' ? 'normal' : 'italic' });
    }
  };

  const handleUnderline = () => {
    if (selectedElement && selectedElement.type === 'text') {
      selectedElement.set({ textDecoration: selectedElement.textDecoration === 'underline' ? 'none' : 'underline' });
    }
  };

  const handleTextAlign = (align) => {
    if (selectedElement && selectedElement.type === 'text') {
      selectedElement.set({ align });
    }
  };

  const handleColorChange = (color) => {
    if (selectedElement && selectedElement.type === 'text') {
      selectedElement.set({ fill: color });
    }
  };

  const handleExport = async () => {
    const dataURL = await store.toDataURL();
    const link = document.createElement('a');
    link.href = dataURL;
    link.download = 'design.png';
    link.click();
  };

  return (
    <div className="perfect-editor" ref={containerRef}>
      {/* 顶部图片编辑工具栏 - 选中图片时显示 */}
      {activeToolbar === 'image' && (
        <div className="editor-canvas-toolbar">
          <div className="toolbar-group">
            <button className="tool-btn" onClick={handleAlignLeft} title="对齐左边">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="21" y1="21" x2="3" y2="21"></line>
                <rect x="5" y="8" width="4" height="8"></rect>
                <rect x="13" y="3" width="6" height="13"></rect>
              </svg>
            </button>
            <button className="tool-btn" onClick={handleAlignCenter} title="水平居中">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="21" x2="12" y2="3"></line>
                <rect x="3" y="8" width="4" height="8"></rect>
                <rect x="17" y="3" width="4" height="13"></rect>
              </svg>
            </button>
            <button className="tool-btn" onClick={handleAlignRight} title="对齐右边">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="21" y1="21" x2="21" y2="3"></line>
                <rect x="15" y="8" width="4" height="8"></rect>
                <rect x="5" y="3" width="6" height="13"></rect>
              </svg>
            </button>
          </div>
          <div className="separator"></div>
          <div className="toolbar-group">
            <button className="tool-btn" onClick={handleMoveUp} title="上移一层">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="17 11 12 6 7 11"></polyline>
                <polyline points="17 18 12 13 7 18"></polyline>
              </svg>
            </button>
            <button className="tool-btn" onClick={handleMoveDown} title="下移一层">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="7 7 12 12 17 7"></polyline>
                <polyline points="7 14 12 19 17 14"></polyline>
              </svg>
            </button>
          </div>
          <div className="separator"></div>
          <div className="toolbar-group">
            <button className="tool-btn" onClick={handleFlipHorizontal} title="水平翻转">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"></path>
                <line x1="12" y1="3" x2="12" y2="21"></line>
                <polyline points="16 7 20 12 16 17"></polyline>
              </svg>
            </button>
            <button className="tool-btn" onClick={handleFlipVertical} title="垂直翻转">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"></path>
                <line x1="3" y1="12" x2="21" y2="12"></line>
                <polyline points="17 16 12 20 7 16"></polyline>
              </svg>
            </button>
            <button className="tool-btn" title="裁剪">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6.13 1L6 16a2 2 0 0 0 2 2h15"></path>
                <path d="M1 6.13L16 6a2 2 0 0 1 2 2v15"></path>
              </svg>
            </button>
          </div>
          <div className="separator"></div>
          <div className="toolbar-group">
            <button className="tool-btn" onClick={handleLock} title="锁定">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* 顶部文字编辑工具栏 - 选中文字时显示 */}
      {activeToolbar === 'text' && (
        <div className="editor-text-toolbar">
          <div className="toolbar-group">
            <select className="font-select" onChange={handleFontChange} 
              value={selectedElement?.fontFamily || 'Arial'}>
              <option value="Arial">Arial</option>
              <option value="Helvetica">Helvetica</option>
              <option value="Times New Roman">Times New Roman</option>
              <option value="Georgia">Georgia</option>
              <option value="Verdana">Verdana</option>
            </select>
          </div>

          <div className="toolbar-group">
            <div className="font-size-controls">
              <button className="font-size-btn" onClick={() => handleFontSizeChange(-2)}>-</button>
              <input type="number" className="font-size-input" 
                value={selectedElement?.fontSize || 16} 
                onChange={(e) => selectedElement?.set({ fontSize: parseInt(e.target.value) || 16 })} />
              <button className="font-size-btn" onClick={() => handleFontSizeChange(2)}>+</button>
            </div>
          </div>

          <div className="toolbar-group">
            <button className="tool-btn color-picker-btn" 
              onClick={() => {
                const input = document.createElement('input');
                input.type = 'color';
                input.value = selectedElement?.fill || '#000000';
                input.onchange = (e) => handleColorChange(e.target.value);
                input.click();
              }}>
              A
              <span className="color-swatch" style={{ backgroundColor: selectedElement?.fill || '#000000' }}></span>
            </button>
          </div>

          <div className="toolbar-group style-group">
            <button className={`tool-btn toggle-btn ${selectedElement?.fontWeight === 'bold' ? 'is-active' : ''}`} 
              onClick={handleBold} title="加粗">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"></path>
                <path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"></path>
              </svg>
            </button>
            <button className={`tool-btn toggle-btn ${selectedElement?.fontStyle === 'italic' ? 'is-active' : ''}`}
              onClick={handleItalic} title="斜体">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="19" y1="4" x2="10" y2="4"></line>
                <line x1="14" y1="20" x2="5" y2="20"></line>
                <line x1="15" y1="4" x2="9" y2="20"></line>
              </svg>
            </button>
            <button className={`tool-btn toggle-btn ${selectedElement?.textDecoration === 'underline' ? 'is-active' : ''}`}
              onClick={handleUnderline} title="下划线">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 3v7a6 6 0 0 0 6 6 6 6 0 0 0 6-6V3"></path>
                <line x1="4" y1="21" x2="20" y2="21"></line>
              </svg>
            </button>
          </div>
          
          <div className="separator"></div>
          
          <div className="toolbar-group">
            <button className="tool-btn" onClick={() => handleTextAlign('left')} title="左对齐">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="21" y1="10" x2="3" y2="10"></line>
                <line x1="21" y1="6" x2="3" y2="6"></line>
                <line x1="21" y1="14" x2="3" y2="14"></line>
                <line x1="21" y1="18" x2="3" y2="18"></line>
              </svg>
            </button>
            <button className="tool-btn" onClick={() => handleTextAlign('center')} title="居中对齐">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="21" y1="10" x2="3" y2="10"></line>
                <line x1="17" y1="6" x2="7" y2="6"></line>
                <line x1="21" y1="14" x2="3" y2="14"></line>
                <line x1="17" y1="18" x2="7" y2="18"></line>
              </svg>
            </button>
            <button className="tool-btn" onClick={() => handleTextAlign('right')} title="右对齐">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="21" y1="10" x2="3" y2="10"></line>
                <line x1="21" y1="6" x2="7" y2="6"></line>
                <line x1="21" y1="14" x2="3" y2="14"></line>
                <line x1="21" y1="18" x2="7" y2="18"></line>
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* 导出按钮 - 始终显示在右上角 */}
      <button className="export-button" onClick={handleExport}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
          <polyline points="7 10 12 15 17 10"></polyline>
          <line x1="12" y1="15" x2="12" y2="3"></line>
        </svg>
        <span>Export</span>
      </button>

      {/* 主编辑器容器 */}
      <div className="editor-container">
        <PolotnoContainer className="polotno-app-container">
          <SidePanelWrap>
            <div className="side-panel-container">
              {/* 左侧面板内容 */}
            </div>
          </SidePanelWrap>
          
          <WorkspaceWrap>
            <Toolbar store={store} />
            <Workspace store={store} />
            <ZoomButtons store={store} />
          </WorkspaceWrap>
        </PolotnoContainer>
      </div>
    </div>
  );
});

export default PerfectEditor;