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
import { PagesTimeline } from 'polotno/pages-timeline';

import { useProject } from '../project';
import { loadFile } from '../file';
import Topbar from '../topbar/topbar';

// 导入Lovart样式
import '../styles/Lovart-studio.css';

const LovartApp = observer(({ store }) => {
  const project = useProject();
  const [selectedTool, setSelectedTool] = useState('select');
  const [showSidePanel, setShowSidePanel] = useState(false);
  const [activeSectionIndex, setActiveSectionIndex] = useState(0);
  const [zoom, setZoom] = useState(100);
  const [currentPage, setCurrentPage] = useState(1);

  // 左侧工具栏配置 - 优化为6个核心工具
  const leftTools = [
    { id: 'select', icon: '+', label: '选择', sectionIndex: -1 },
    { id: 'shapes', icon: '□', label: '形状', sectionIndex: 3 },
    { id: 'text', icon: 'T', label: '文字', sectionIndex: 5 },
    { id: 'draw', icon: '✏', label: '绘图', sectionIndex: -1 },
    { id: 'image', icon: '🖼', label: '图片', sectionIndex: 2 },
    { id: 'upload', icon: '↑', label: '上传', sectionIndex: 0 }
  ];

  // 右侧面板标签
  const rightPanelTabs = [
    { id: 'layer', label: '圖層', icon: '▦' },
    { id: 'text', label: '文本', icon: 'T' },
    { id: 'group', label: '群組', icon: '⊞' }
  ];

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
  const handleToolSelect = (tool) => {
    setSelectedTool(tool.id);
    
    // 根据工具类型执行不同操作
    switch(tool.id) {
      case 'select':
        // 选择工具 - 关闭任何打开的面板
        store.activeTool = 'hand';
        break;
      case 'shapes':
        // 形状工具
        store.activeTool = 'shapes';
        break;
      case 'text':
        // 文字工具
        store.activeTool = 'text';
        break;
      case 'draw':
        // 绘图工具
        store.activeTool = 'draw';
        break;
      case 'image':
        // 图片工具 - 打开文件选择
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = (e) => {
          const file = e.target.files[0];
          if (file) loadFile(file, store);
        };
        input.click();
        break;
      case 'upload':
        // 上传工具
        const uploadInput = document.createElement('input');
        uploadInput.type = 'file';
        uploadInput.accept = '.json,.psd,.pdf,.svg,.jpg,.jpeg,.png';
        uploadInput.onchange = (e) => {
          const file = e.target.files[0];
          if (file) loadFile(file, store);
        };
        uploadInput.click();
        break;
    }
  };

  // 处理调整大小
  const handleResize = () => {
    const width = prompt('输入宽度 (px):', store.width);
    const height = prompt('输入高度 (px):', store.height);
    if (width && height) {
      store.setSize(parseInt(width), parseInt(height));
    }
  };

  // 处理缩放
  const handleZoomIn = () => {
    const newZoom = Math.min(200, zoom + 10);
    setZoom(newZoom);
    store.setZoomRatio(newZoom / 100);
  };

  const handleZoomOut = () => {
    const newZoom = Math.max(10, zoom - 10);
    setZoom(newZoom);
    store.setZoomRatio(newZoom / 100);
  };

  // 处理页面导航
  const handlePrevPage = () => {
    const pages = store.pages;
    const currentIndex = pages.findIndex(p => p.id === store.activePage?.id);
    if (currentIndex > 0) {
      store.selectPage(pages[currentIndex - 1].id);
      setCurrentPage(currentIndex);
    }
  };

  const handleNextPage = () => {
    const pages = store.pages;
    const currentIndex = pages.findIndex(p => p.id === store.activePage?.id);
    if (currentIndex < pages.length - 1) {
      store.selectPage(pages[currentIndex + 1].id);
      setCurrentPage(currentIndex + 2);
    }
  };

  useEffect(() => {
    // 初始化页面
    const pages = store.pages;
    const currentIndex = pages.findIndex(p => p.id === store.activePage?.id);
    setCurrentPage(currentIndex + 1);
  }, [store.activePage]);

  return (
    <div className="Lovart-editor" onDrop={handleDrop}>
      {/* 顶部导航栏 */}
      <div className="Lovart-top-nav">
        <div className="Lovart-nav-left">
          <div className="Lovart-logo">
            <span className="Lovart-logo-icon">L</span>
            <span className="Lovart-logo-text">Lovart</span>
          </div>
          <div className="Lovart-nav-menu">
            <button className="Lovart-nav-btn" onClick={() => {
              const input = document.createElement('input');
              input.type = 'file';
              input.accept = '.json,.psd,.pdf,.svg,.jpg,.jpeg,.png';
              input.onchange = (e) => {
                const file = e.target.files[0];
                if (file) loadFile(file, store);
              };
              input.click();
            }}>File</button>
            <button className="Lovart-nav-btn">Edit</button>
            <button className="Lovart-nav-btn">View</button>
            <input 
              type="text" 
              className="Lovart-search-bar" 
              placeholder="Tell AI what to do..."
            />
          </div>
        </div>
        <div className="Lovart-nav-right">
          <button className="Lovart-share-btn" onClick={() => {
            alert('分享功能开发中...');
          }}>Share</button>
          <div className="Lovart-user-avatar">
            <span>{project.name?.charAt(0) || 'U'}</span>
          </div>
        </div>
      </div>

      <div className="Lovart-main-content">
        {/* 悬浮圆形图标工具栏 */}
        <div className="Lovart-floating-toolbar">
          <div className="Lovart-toolbar-container">
            {leftTools.map(tool => (
              <button
                key={tool.id}
                className={`Lovart-tool-button ${selectedTool === tool.id ? 'active' : ''}`}
                onClick={() => handleToolSelect(tool)}
                title={tool.label}
              >
                <span className="Lovart-tool-icon">{tool.icon}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 中央画布区域 - 移除侧边面板，只保留画布 */}
        <div className="Lovart-canvas-container">

          {/* 画布 */}
          <div className="Lovart-canvas-wrapper">
            <div className="Lovart-toolbar-wrapper">
              <Toolbar store={store} />
            </div>
            <div className="Lovart-workspace">
              <Workspace store={store} />
              <div className="Lovart-zoom-buttons">
                <ZoomButtons store={store} />
              </div>
            </div>
          </div>

          {/* 底部控制栏 */}
          <div className="Lovart-bottom-controls">
            <div className="Lovart-pagination">
              <button className="Lovart-page-btn" onClick={handlePrevPage}>◀</button>
              <span className="Lovart-page-info">{currentPage} / {store.pages.length}</span>
              <button className="Lovart-page-btn" onClick={handleNextPage}>▶</button>
            </div>
            <div className="Lovart-zoom-control">
              <button className="Lovart-zoom-btn" onClick={handleZoomOut}>－</button>
              <span className="Lovart-zoom-value">{Math.round(zoom)}%</span>
              <button className="Lovart-zoom-btn" onClick={handleZoomIn}>＋</button>
            </div>
            <button className="Lovart-add-page-btn" onClick={() => {
              store.addPage();
            }}>＋ 添加页面</button>
          </div>
        </div>

        {/* 右侧面板 */}
        <div className="Lovart-right-panel">
          <div className="Lovart-panel-header">
            <div className="Lovart-panel-tabs">
              {rightPanelTabs.map(tab => (
                <button key={tab.id} className="Lovart-panel-tab">
                  <span className="Lovart-tab-icon">{tab.icon}</span>
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>
          </div>
          
          <div className="Lovart-panel-content">
            <div className="Lovart-layer-list">
              {store.activePage?.children.map((element, index) => (
                <div 
                  key={element.id} 
                  className="Lovart-layer-item"
                  onClick={() => store.selectElements([element.id])}
                >
                  <span className="Lovart-layer-icon">
                    {element.type === 'text' ? 'T' : element.type === 'group' ? '⊞' : '▦'}
                  </span>
                  <span className="Lovart-layer-name">
                    {element.name || element.type || `Layer ${index + 1}`}
                  </span>
                </div>
              ))}
            </div>
            
            <div className="Lovart-drag-upload-area" 
                 onDrop={handleDrop}
                 onDragOver={(e) => e.preventDefault()}>
              <div className="Lovart-upload-content">
                <span className="Lovart-upload-icon">📁</span>
                <p>Drag uploads here</p>
              </div>
            </div>
            
            <div className="Lovart-more-options">
              <button className="Lovart-more-btn">•••</button>
            </div>
          </div>
        </div>
      </div>

      {/* 加载指示器 */}
      {project.status === 'loading' && (
        <div className="Lovart-loading-overlay">
          <Spinner size={50} />
        </div>
      )}
    </div>
  );
});

export default LovartApp;