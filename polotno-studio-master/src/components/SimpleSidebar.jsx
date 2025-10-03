import React, { useState, useEffect } from 'react';
import '../styles/simple-sidebar.css';
import '../styles/image-search-panel.css';
import '../styles/text-panel.css';
import { parsePSDFile, isPSDFile, layerToPolotnoElement, flattenLayers } from '../psd-utils';
import { svgToURL } from 'polotno/utils/svg';
import { TYPES, figureToSvg } from 'polotno/utils/figure-to-svg';
import ImageSearchPanel from './ImageSearchPanel';
import EnhancedTextPanel from './TextPanel';

// My Design Panel 组件 - 显示所有页面预览
const MyDesignPanel = ({ store, onClose }) => {
  const [selectedPageId, setSelectedPageId] = useState(null);
  
  if (!store || !store.pages) {
    return (
      <div style={{ padding: '20px', textAlign: 'center', color: 'var(--gray-600)' }}>
        <p>暂无页面数据</p>
      </div>
    );
  }
  
  const handlePageClick = (page) => {
    if (store.setActivePage) {
      store.setActivePage(page.id);
      setSelectedPageId(page.id);
      console.log('切换到页面:', page.id);
    }
  };
  
  const handleAddPage = () => {
    if (store.addPage) {
      const newPage = store.addPage();
      console.log('添加新页面:', newPage.id);
    }
  };
  
  const handleDeletePage = (pageId) => {
    if (store.pages.length > 1 && store.removePage) {
      store.removePage(pageId);
      console.log('删除页面:', pageId);
    } else {
      alert('至少保留一个页面');
    }
  };
  
  const generatePagePreview = async (page) => {
    try {
      if (page.toDataURL) {
        return await page.toDataURL({ width: 200, height: 150 });
      }
      return null;
    } catch (error) {
      console.error('生成页面预览失败:', error);
      return null;
    }
  };
  
  return (
    <div style={{ color: 'var(--gray-900)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h4 style={{ margin: '0', fontSize: '14px', fontWeight: '600' }}>
          我的设计 ({store.pages.length} 页)
        </h4>
        <button
          onClick={handleAddPage}
          style={{
            padding: '6px 12px',
            background: 'var(--sidebar-primary)',
            border: 'none',
            borderRadius: '6px',
            color: 'white',
            fontSize: '12px',
            cursor: 'pointer'
          }}
        >
          + 新增页面
        </button>
      </div>
      
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(2, 1fr)', 
        gap: '12px',
        maxHeight: '400px',
        overflowY: 'auto'
      }}>
        {store.pages.map((page, index) => {
          const isActive = store.activePage?.id === page.id;
          const isSelected = selectedPageId === page.id;
          
          return (
            <div
              key={page.id}
              style={{
                position: 'relative',
                border: `2px solid ${isActive ? 'var(--sidebar-primary)' : 'var(--gray-200)'}`,
                borderRadius: '8px',
                padding: '8px',
                cursor: 'pointer',
                background: isActive ? 'rgba(99, 102, 241, 0.05)' : 'var(--gray-50)',
                transition: 'all 0.2s ease'
              }}
              onClick={() => handlePageClick(page)}
              onMouseOver={(e) => {
                if (!isActive) {
                  e.target.style.borderColor = 'var(--sidebar-primary)';
                  e.target.style.background = 'rgba(99, 102, 241, 0.02)';
                }
              }}
              onMouseOut={(e) => {
                if (!isActive) {
                  e.target.style.borderColor = 'var(--gray-200)';
                  e.target.style.background = 'var(--gray-50)';
                }
              }}
            >
              {/* 页面预览区域 */}
              <div style={{
                width: '100%',
                height: '100px',
                background: 'white',
                borderRadius: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '8px',
                border: '1px solid var(--gray-200)',
                position: 'relative',
                overflow: 'hidden'
              }}>
                {/* 简化的页面内容预览 */}
                <div style={{
                  width: '80%',
                  height: '80%',
                  background: `linear-gradient(45deg, 
                    ${page.children?.length ? '#e3f2fd' : '#f5f5f5'} 25%, 
                    transparent 25%, 
                    transparent 75%, 
                    ${page.children?.length ? '#e3f2fd' : '#f5f5f5'} 75%), 
                    linear-gradient(45deg, 
                    ${page.children?.length ? '#e3f2fd' : '#f5f5f5'} 25%, 
                    transparent 25%, 
                    transparent 75%, 
                    ${page.children?.length ? '#e3f2fd' : '#f5f5f5'} 75%)`,
                  backgroundSize: '8px 8px',
                  backgroundPosition: '0 0, 4px 4px',
                  borderRadius: '2px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '10px',
                  color: 'var(--gray-600)'
                }}>
                  {page.children?.length ? 
                    `${page.children.length} 元素` : 
                    '空白页面'
                  }
                </div>
                
                {/* 活跃页面标识 */}
                {isActive && (
                  <div style={{
                    position: 'absolute',
                    top: '4px',
                    right: '4px',
                    width: '8px',
                    height: '8px',
                    background: 'var(--sidebar-primary)',
                    borderRadius: '50%'
                  }} />
                )}
              </div>
              
              {/* 页面信息 */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '12px', fontWeight: '500', color: 'var(--gray-900)' }}>
                    页面 {index + 1}
                  </div>
                  <div style={{ fontSize: '10px', color: 'var(--gray-600)' }}>
                    {page.width}×{page.height}
                  </div>
                </div>
                
                {/* 删除按钮 */}
                {store.pages.length > 1 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeletePage(page.id);
                    }}
                    style={{
                      padding: '2px 4px',
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--gray-400)',
                      fontSize: '12px',
                      cursor: 'pointer',
                      borderRadius: '2px'
                    }}
                    onMouseOver={(e) => {
                      e.target.style.background = 'rgba(239, 68, 68, 0.1)';
                      e.target.style.color = '#ef4444';
                    }}
                    onMouseOut={(e) => {
                      e.target.style.background = 'transparent';
                      e.target.style.color = 'var(--gray-400)';
                    }}
                  >
                    ×
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
      
      <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--gray-200)' }}>
        <div style={{ fontSize: '12px', color: 'var(--gray-600)', textAlign: 'center' }}>
          点击页面切换 | 当前页面: {store.activePage ? store.pages.findIndex(p => p.id === store.activePage.id) + 1 : 1}
        </div>
      </div>
    </div>
  );
};

// Resize Canvas Panel 组件
const ResizeCanvasPanel = ({ store, onResize, onClose }) => {
  const [width, setWidth] = useState(store?.activePage?.width || 800);
  const [height, setHeight] = useState(store?.activePage?.height || 600);
  const [aspectRatio, setAspectRatio] = useState(true);
  
  const originalRatio = (store?.activePage?.width || 800) / (store?.activePage?.height || 600);
  
  const handleWidthChange = (newWidth) => {
    setWidth(newWidth);
    if (aspectRatio) {
      setHeight(Math.round(newWidth / originalRatio));
    }
  };
  
  const handleHeightChange = (newHeight) => {
    setHeight(newHeight);
    if (aspectRatio) {
      setWidth(Math.round(newHeight * originalRatio));
    }
  };
  
  const presets = [
    { name: 'A4 横向', width: 842, height: 595 },
    { name: 'A4 纵向', width: 595, height: 842 },
    { name: '1920x1080', width: 1920, height: 1080 },
    { name: '1280x720', width: 1280, height: 720 },
    { name: 'Instagram 正方形', width: 1080, height: 1080 },
    { name: 'Instagram 故事', width: 1080, height: 1920 },
    { name: 'Facebook 封面', width: 1200, height: 630 },
    { name: 'Twitter 头图', width: 1500, height: 500 }
  ];
  
  return (
    <div style={{ color: 'var(--gray-900)' }}>
      <div style={{ marginBottom: '16px' }}>
        <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: '600' }}>当前尺寸</h4>
        <p style={{ margin: '0', fontSize: '13px', color: 'var(--gray-600)' }}>
          {store?.activePage?.width || 800} × {store?.activePage?.height || 600} 像素
        </p>
      </div>
      
      <div style={{ marginBottom: '16px' }}>
        <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: '600' }}>自定义尺寸</h4>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
          <input
            type="number"
            placeholder="宽度"
            value={width}
            onChange={(e) => handleWidthChange(parseInt(e.target.value) || 0)}
            style={{
              flex: 1,
              padding: '8px 12px',
              border: '1px solid var(--gray-200)',
              borderRadius: '6px',
              fontSize: '13px'
            }}
          />
          <span style={{ color: 'var(--gray-600)' }}>×</span>
          <input
            type="number"
            placeholder="高度"
            value={height}
            onChange={(e) => handleHeightChange(parseInt(e.target.value) || 0)}
            style={{
              flex: 1,
              padding: '8px 12px',
              border: '1px solid var(--gray-200)',
              borderRadius: '6px',
              fontSize: '13px'
            }}
          />
        </div>
        <label style={{ display: 'flex', alignItems: 'center', fontSize: '12px', color: 'var(--gray-600)' }}>
          <input
            type="checkbox"
            checked={aspectRatio}
            onChange={(e) => setAspectRatio(e.target.checked)}
            style={{ marginRight: '6px' }}
          />
          保持宽高比
        </label>
      </div>
      
      <div style={{ marginBottom: '20px' }}>
        <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: '600' }}>预设尺寸</h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '6px' }}>
          {presets.map((preset) => (
            <button
              key={preset.name}
              onClick={() => {
                setWidth(preset.width);
                setHeight(preset.height);
              }}
              style={{
                padding: '8px 10px',
                background: 'var(--gray-100)',
                border: '1px solid var(--gray-200)',
                borderRadius: '6px',
                fontSize: '11px',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseOver={(e) => {
                e.target.style.background = 'var(--gray-50)';
                e.target.style.borderColor = 'var(--sidebar-primary)';
              }}
              onMouseOut={(e) => {
                e.target.style.background = 'var(--gray-100)';
                e.target.style.borderColor = 'var(--gray-200)';
              }}
            >
              {preset.name}
              <br />
              <span style={{ color: 'var(--gray-600)' }}>
                {preset.width}×{preset.height}
              </span>
            </button>
          ))}
        </div>
      </div>
      
      <div style={{ display: 'flex', gap: '8px' }}>
        <button
          onClick={() => {
            onResize(width, height);
            onClose();
          }}
          style={{
            flex: 1,
            padding: '10px 16px',
            background: 'var(--sidebar-primary)',
            border: 'none',
            borderRadius: '6px',
            color: 'white',
            fontSize: '13px',
            fontWeight: '500',
            cursor: 'pointer'
          }}
        >
          应用更改
        </button>
        <button
          onClick={onClose}
          style={{
            flex: 1,
            padding: '10px 16px',
            background: 'var(--gray-100)',
            border: '1px solid var(--gray-200)',
            borderRadius: '6px',
            color: 'var(--gray-700)',
            fontSize: '13px',
            fontWeight: '500',
            cursor: 'pointer'
          }}
        >
          取消
        </button>
      </div>
    </div>
  );
};

const SimpleSidebar = ({ store }) => {
  const [activeTool, setActiveTool] = useState('select');
  const [showShapeMenu, setShowShapeMenu] = useState(false);
  const [showImageSearch, setShowImageSearch] = useState(false);
  const [showTextPanel, setShowTextPanel] = useState(false);
  const [showResizePanel, setShowResizePanel] = useState(false);
  const [showMyDesign, setShowMyDesign] = useState(false);
  
  // 键盘快捷键支持
  useEffect(() => {
    const handleKeyPress = (e) => {
      // 只在没有输入框聚焦时响应快捷键
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        return;
      }
      
      switch (e.key.toLowerCase()) {
        case 'v':
          e.preventDefault();
          handleToolClick('select');
          break;
        case 't':
          e.preventDefault();
          handleToolClick('text');
          break;
        case 's':
          e.preventDefault();
          handleToolClick('shapes');
          break;
        case 'i':
          e.preventDefault();
          handleToolClick('images');
          break;
        case 'u':
          e.preventDefault();
          handleToolClick('upload');
          break;
        case 'm':
          e.preventDefault();
          handleToolClick('my-design');
          break;
        case 'r':
          e.preventDefault();
          handleToolClick('resize');
          break;
      }
    };
    
    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, []);

  // 使用 Polotno SDK 的丰富形状库
  const shapeCategories = {
    basic: [
      { type: 'rect', name: '矩形', icon: '⬜', size: { width: 150, height: 100 } },
      { type: 'circle', name: '圆形', icon: '⭕', size: { width: 120, height: 120 } },
      { type: 'triangle', name: '三角形', icon: '🔺', size: { width: 120, height: 120 } },
      { type: 'rightTriangle', name: '直角三角形', icon: '📐', size: { width: 120, height: 120 } },
      { type: 'star', name: '五角星', icon: '⭐', size: { width: 120, height: 120 } },
      { type: 'diamond', name: '菱形', icon: '💎', size: { width: 120, height: 120 } },
      { type: 'pentagon', name: '五边形', icon: '⬟', size: { width: 120, height: 120 } },
      { type: 'hexagon', name: '六边形', icon: '⬢', size: { width: 120, height: 120 } }
    ],
    arrows: [
      { type: 'rightArrow', name: '右箭头', icon: '➡️', size: { width: 150, height: 80 } },
      { type: 'leftArrow', name: '左箭头', icon: '⬅️', size: { width: 150, height: 80 } },
      { type: 'upArrow', name: '上箭头', icon: '⬆️', size: { width: 80, height: 150 } },
      { type: 'downArrow', name: '下箭头', icon: '⬇️', size: { width: 80, height: 150 } }
    ],
    symbols: [
      { type: 'heart1', name: '心形', icon: '❤️', size: { width: 120, height: 120 } },
      { type: 'speechBubble', name: '对话框', icon: '💬', size: { width: 150, height: 100 } },
      { type: 'cross', name: '十字', icon: '✚', size: { width: 100, height: 100 } },
      { type: 'asterisk1', name: '星号', icon: '✳️', size: { width: 100, height: 100 } },
      { type: 'flower', name: '花朵', icon: '🌸', size: { width: 120, height: 120 } },
      { type: 'leaf', name: '叶子', icon: '🍃', size: { width: 100, height: 120 } },
      { type: 'butterfly', name: '蝴蝶', icon: '🦋', size: { width: 120, height: 100 } },
      { type: 'lightning1', name: '闪电', icon: '⚡', size: { width: 80, height: 150 } }
    ],
    objects: [
      { type: 'home', name: '房屋', icon: '🏠', size: { width: 120, height: 120 } },
      { type: 'home2', name: '小屋', icon: '🏡', size: { width: 120, height: 120 } },
      { type: 'door', name: '门', icon: '🚪', size: { width: 80, height: 120 } },
      { type: 'flag', name: '旗帜', icon: '🚩', size: { width: 120, height: 100 } },
      { type: 'bookmark', name: '书签', icon: '🔖', size: { width: 80, height: 120 } },
      { type: 'keyhole', name: '钥匙孔', icon: '🔓', size: { width: 80, height: 120 } },
      { type: 'hourglass', name: '沙漏', icon: '⏳', size: { width: 80, height: 120 } },
      { type: 'magnet', name: '磁铁', icon: '🧲', size: { width: 100, height: 120 } }
    ],
    creative: [
      { type: 'cloud', name: '云朵', icon: '☁️', size: { width: 150, height: 100 } },
      { type: 'rainbow', name: '彩虹', icon: '🌈', size: { width: 150, height: 100 } },
      { type: 'explosion', name: '爆炸', icon: '💥', size: { width: 120, height: 120 } },
      { type: 'softStar', name: '柔和星形', icon: '✨', size: { width: 120, height: 120 } },
      { type: 'softFlower', name: '柔和花朵', icon: '🌺', size: { width: 120, height: 120 } },
      { type: 'blob1', name: '流体形状1', icon: '🔵', size: { width: 120, height: 120 } },
      { type: 'blob10', name: '流体形状2', icon: '🟣', size: { width: 120, height: 120 } },
      { type: 'blob20', name: '流体形状3', icon: '🟢', size: { width: 120, height: 120 } }
    ]
  };

  // 当前选择的分类
  const [activeCategory, setActiveCategory] = useState('basic');
  
  // 获取当前分类的形状
  const getCurrentShapes = () => {
    return shapeCategories[activeCategory] || shapeCategories.basic;
  };

  // 创建形状函数 - 使用 Polotno SDK 的原生图形系统
  const createShape = (shapeData) => {
    if (!store || !store.activePage) return;
    
    try {
      // 使用 Polotno 的原生 figure 元素
      store.activePage.addElement({
        type: 'figure',
        subType: shapeData.type,
        x: 100,
        y: 100,
        width: shapeData.size.width,
        height: shapeData.size.height,
        fill: '#3B82F6', // 默认蓝色
        strokeEnabled: false
      });
      
      console.log(`Created shape: ${shapeData.name} (${shapeData.type})`);
    } catch (error) {
      console.error('Failed to create shape:', error);
      // 如果 figure 类型不支持，回退到 SVG 方案
      try {
        const figureElement = {
          width: shapeData.size.width,
          height: shapeData.size.height,
          cornerRadius: 0
        };
        
        const svgString = figureToSvg({
          ...figureElement,
          subType: shapeData.type,
          fill: '#3B82F6'
        });
        
        const dataUrl = svgToURL(svgString);
        store.activePage.addElement({
          type: 'svg',
          x: 100,
          y: 100,
          width: shapeData.size.width,
          height: shapeData.size.height,
          src: dataUrl
        });
        
        console.log(`Created shape via SVG fallback: ${shapeData.name}`);
      } catch (fallbackError) {
        console.error('SVG fallback also failed:', fallbackError);
      }
    }
    
    // 创建后关闭菜单
    setShowShapeMenu(false);
  };
  
  const handleToolClick = (toolId) => {
    setActiveTool(toolId);
    
    // 检查 store 是否可用
    if (!store) {
      console.warn('Polotno store is not available');
      return;
    }
    
    switch (toolId) {
      case 'select':
        // 选择工具 - 清除绘制模式
        if (store.setDrawingEnabled) {
          store.setDrawingEnabled(false);
        }
        
        // 清理绘图状态（如果有的话）
        break;
        
      case 'text':
        // 文字工具 - 显示文字面板
        setShowTextPanel(!showTextPanel);
        break;
        
      case 'shapes':
        // 显示形状选择菜单
        setShowShapeMenu(!showShapeMenu);
        break;
        
      case 'images':
        // 图片工具 - 显示图片搜索面板
        setShowImageSearch(!showImageSearch);
        break;
        
      case 'upload':
        // 上传工具 - 通用文件上传
        handleFileUpload();
        break;
        
      case 'my-design':
        // My Design工具 - 显示页面预览
        setShowMyDesign(!showMyDesign);
        break;
        
      case 'resize':
        // 显示画布调整面板
        setShowResizePanel(!showResizePanel);
        break;
        
      default:
        break;
    }
  };
  
  
  // 画布调整功能
  const handleCanvasResize = (newWidth, newHeight) => {
    if (!store || !store.activePage) return;
    
    store.activePage.set({
      width: parseInt(newWidth),
      height: parseInt(newHeight)
    });
    
    console.log(`画布调整为: ${newWidth}x${newHeight}`);
  };
  
  // 处理图片上传
  const handleImageUpload = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*,.psd,application/photoshop,image/vnd.adobe.photoshop';
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file || !store || !store.activePage) return;
      
      try {
        // 检查是否为 PSD 文件
        if (isPSDFile(file)) {
          console.log('图片工具：检测到 PSD 文件');
          // 使用通用文件上传处理 PSD
          await handlePSDFile(file);
        } else if (file.type.startsWith('image/')) {
          // 处理普通图片
          const reader = new FileReader();
          reader.onload = (event) => {
            store.activePage.addElement({
              type: 'image',
              src: event.target.result,
              x: 100,
              y: 100,
              width: 200,
              height: 200
            });
          };
          reader.readAsDataURL(file);
        } else {
          alert('请选择图片文件或 PSD 文件');
        }
      } catch (error) {
        console.error('图片上传失败:', error);
        alert('图片上传失败: ' + error.message);
      }
    };
    input.click();
  };
  
  // 处理 PSD 文件的通用函数
  const handlePSDFile = async (file) => {
    console.log('开始处理 PSD 文件:', file.name);
    
    try {
      // 显示处理开始的消息
      console.log(`正在解析 PSD 文件: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`);
      
      // 解析 PSD 文件
      const psdData = await parsePSDFile(file);
      console.log('PSD 解析完成:', {
        width: psdData.width,
        height: psdData.height,
        colorMode: psdData.colorMode,
        layers: psdData.layers?.length || 0,
        children: psdData.children?.length || 0,
        hasCanvas: !!psdData.canvas,
        hasComposite: !!psdData.composite
      });
      
      // 获取扁平化的图层 - 修复：使用 children 而不是 layers
      let layers = [];
      const layerSource = psdData.children || psdData.layers || [];
      
      if (layerSource.length > 0) {
        layers = flattenLayers(layerSource);
        console.log(`从 ${layerSource.length} 个原始图层中找到 ${layers.length} 个可处理的图层`);
        
        // 添加详细图层信息
        layerSource.forEach((layer, index) => {
          console.log(`图层 ${index + 1}:`, {
            name: layer.name || 'Unnamed',
            type: layer.type,
            visible: layer.visible !== false,
            hasCanvas: !!layer.canvas,
            hasText: !!layer.text,
            bounds: `${layer.left || 0},${layer.top || 0} - ${layer.right || 0},${layer.bottom || 0}`
          });
        });
      } else {
        console.log('PSD 中没有找到图层数据');
      }
      
      // 如果没有图层或图层为空，尝试使用合成图像
      if (layers.length === 0) {
        console.log('没有找到单独图层，尝试使用合成图像');
        
        // 尝试从 psdData 创建合成图像
        let compositeCanvas = null;
        
        if (psdData.canvas) {
          compositeCanvas = psdData.canvas;
          console.log('使用 psdData.canvas');
        } else if (psdData.composite) {
          compositeCanvas = psdData.composite;
          console.log('使用 psdData.composite');
        } else if (psdData.imageData) {
          // 如果有 imageData，创建 canvas
          console.log('从 imageData 创建 canvas');
          compositeCanvas = document.createElement('canvas');
          compositeCanvas.width = psdData.width;
          compositeCanvas.height = psdData.height;
          const ctx = compositeCanvas.getContext('2d');
          const imageData = ctx.createImageData(psdData.width, psdData.height);
          imageData.data.set(psdData.imageData);
          ctx.putImageData(imageData, 0, 0);
        }
        
        if (compositeCanvas) {
          // 创建一个虚拟图层来表示整个合成图像
          const compositeLayer = {
            name: file.name.replace('.psd', ''),
            canvas: compositeCanvas,
            left: 0,
            top: 0,
            right: psdData.width,
            bottom: psdData.height,
            width: psdData.width,
            height: psdData.height,
            visible: true,
            opacity: 1
          };
          
          layers = [compositeLayer];
          console.log('创建合成图像图层:', compositeLayer.name);
        } else {
          console.warn('无法创建合成图像，psdData 中没有可用的图像数据');
        }
      }
      
      if (layers.length === 0) {
        console.warn('PSD 文件中没有找到可导入的内容');
        alert('PSD 文件中没有找到可导入的内容，文件可能已损坏或为空');
        return;
      }
      
      // 添加每个图层到画布
      let successCount = 0;
      let offsetY = 50;
      
      console.log(`开始处理 ${layers.length} 个图层...`);
      
      for (let i = 0; i < layers.length; i++) {
        const layer = layers[i];
        console.log(`处理图层 ${i + 1}/${layers.length}: ${layer.name || 'Unnamed'}`);
        
        // 跳过隐藏的图层
        if (layer.hidden || layer.visible === false) {
          console.log(`跳过隐藏图层: ${layer.name}`);
          continue;
        }
        
        if (layer.canvas || layer.imageData || layer.composite || layer.text) {
          try {
            let element = null;
            
            // 尝试使用现有的转换函数 (注意这是async函数)
            try {
              element = await layerToPolotnoElement(layer, psdData);
              if (!element) {
                console.warn('layerToPolotnoElement 返回 null，使用备用方案');
              }
            } catch (conversionError) {
              console.warn('使用 layerToPolotnoElement 失败，尝试直接转换:', conversionError);
              element = null;
            }
            
            // 如果主方案失败或返回null，使用备用方案
            if (!element) {
              console.log(`使用备用方案创建元素: ${layer.name}`);
              
              // 尝试不同的数据源
              const canvas = layer.canvas || layer.composite;
              
              if (canvas) {
                const dataURL = canvas.toDataURL('image/png');
                const layerWidth = Math.abs((layer.right || layer.width || canvas.width) - (layer.left || 0));
                const layerHeight = Math.abs((layer.bottom || layer.height || canvas.height) - (layer.top || 0));
                
                element = {
                  type: 'image',
                  src: dataURL,
                  x: layer.left || 50,
                  y: layer.top || offsetY,
                  width: Math.min(layerWidth || 100, 800), // 限制最大宽度
                  height: Math.min(layerHeight || 100, 600), // 限制最大高度
                  name: layer.name || 'PSD Layer',
                  opacity: layer.opacity !== undefined ? layer.opacity / 255 : 1
                };
                console.log('备用方案创建图像元素成功:', {
                  name: element.name,
                  size: `${element.width}x${element.height}`,
                  position: `(${element.x}, ${element.y})`
                });
              } else if (layer.text && layer.text.text) {
                // 处理文本图层
                element = {
                  type: 'text',
                  text: layer.text.text,
                  x: layer.left || 50,
                  y: layer.top || offsetY,
                  width: Math.abs((layer.right || 200) - (layer.left || 0)),
                  height: Math.abs((layer.bottom || 50) - (layer.top || 0)),
                  fontSize: 24,
                  fontFamily: 'Arial',
                  fill: '#000000',
                  name: layer.name || 'Text Layer'
                };
                console.log('备用方案创建文本元素成功:', element.name);
              }
            }
            
            if (element) {
              // 验证元素属性完整性
              if (!element.type) {
                console.error('元素类型未定义，跳过此图层');
                continue;
              }
              
              // 确保必要的属性存在 - 保持原始位置
              element.x = element.x !== undefined ? element.x : (layer.left || 50);
              element.y = element.y !== undefined ? element.y : (layer.top || offsetY);
              element.width = element.width || 100;
              element.height = element.height || 100;
              
              // 如果位置信息缺失，则使用堆叠布局
              if (element.x === 50 && element.y === offsetY) {
                console.log(`图层 ${layer.name} 使用堆叠布局`);
              } else {
                console.log(`图层 ${layer.name} 保持原始位置: (${element.x}, ${element.y})`);
              }
              
              // 确保元素不会太大
              if (element.width > 800) {
                const ratio = element.height / element.width;
                element.width = 800;
                element.height = 800 * ratio;
              }
              if (element.height > 600) {
                const ratio = element.width / element.height;
                element.height = 600;
                element.width = 600 * ratio;
              }
              
              // 添加调试信息
              console.log('准备添加元素:', {
                type: element.type,
                width: element.width,
                height: element.height,
                x: element.x,
                y: element.y,
                hasSrc: !!element.src
              });
              
              try {
                store.activePage.addElement(element);
                
                // 只在使用堆叠布局时更新偏移量
                if (element.x === 50 && element.y === offsetY) {
                  offsetY += (element.height || 100) + 10;
                }
                
                successCount++;
                console.log(`✅ 成功导入图层: ${layer.name || 'Unnamed Layer'} (${element.width}x${element.height}) at (${element.x}, ${element.y})`);
              } catch (addError) {
                console.error('❌ 添加元素到画布失败:', addError);
                console.error('元素详情:', element);
              }
            }
          } catch (layerError) {
            console.warn('图层处理失败:', layer.name, layerError);
          }
        }
      }
      
      // 显示导入结果
      console.log(`PSD 文件导入完成: 成功导入 ${successCount}/${layers.length} 个图层`);
      
      if (successCount > 0) {
        // 可选：显示成功提示
        console.log(`✅ 成功导入 PSD 文件 "${file.name}"，共 ${successCount} 个图层`);
      } else {
        alert('PSD 文件导入失败，没有成功导入任何图层');
      }
      
    } catch (error) {
      console.error('PSD 处理失败:', error);
      throw error;
    }
  };
  
  // 处理文件上传
  const handleFileUpload = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*,application/pdf,.psd,application/photoshop,image/vnd.adobe.photoshop';
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file || !store || !store.activePage) return;
      
      try {
        // 检查是否为 PSD 文件
        if (isPSDFile(file)) {
          console.log('上传工具：检测到 PSD 文件');
          await handlePSDFile(file);
          
        } else if (file.type.startsWith('image/')) {
          // 处理普通图片文件
          const reader = new FileReader();
          reader.onload = (event) => {
            store.activePage.addElement({
              type: 'image',
              src: event.target.result,
              x: 50,
              y: 50,
              width: 300,
              height: 200
            });
          };
          reader.readAsDataURL(file);
          
        } else if (file.type === 'application/pdf') {
          // PDF 文件处理（基础支持）
          const reader = new FileReader();
          reader.onload = (event) => {
            console.log('PDF 文件上传，需要 PDF 处理库');
            // TODO: 添加 PDF 处理逻辑
          };
          reader.readAsDataURL(file);
          
        } else {
          console.warn('不支持的文件类型:', file.type);
          alert('不支持的文件类型，请上传 PSD、图片或 PDF 文件');
        }
        
      } catch (error) {
        console.error('文件处理失败:', error);
        alert('文件处理失败: ' + error.message);
      }
    };
    input.click();
  };

  // 工具配置
  const tools = [
    {
      id: 'my-design',
      name: 'My Design',
      description: 'View all pages preview',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <rect x="3" y="3" width="7" height="9" strokeLinecap="round" strokeLinejoin="round"/>
          <rect x="13" y="3" width="7" height="5" strokeLinecap="round" strokeLinejoin="round"/>
          <rect x="13" y="12" width="7" height="9" strokeLinecap="round" strokeLinejoin="round"/>
          <rect x="3" y="16" width="7" height="5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
      shortcut: 'M'
    },
    {
      id: 'select',
      name: 'Select',
      description: 'Select and move elements',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
      shortcut: 'V'
    },
    {
      id: 'text',
      name: 'Text',
      description: 'Multi-language text with fonts',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path d="M4 7V4h16v3M9 20h6M12 4v16" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
      shortcut: 'T'
    },
    {
      id: 'shapes',
      name: 'Shapes',
      description: 'Add basic shapes',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <rect x="3" y="3" width="18" height="18" rx="3" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
      shortcut: 'S'
    },
    {
      id: 'images',
      name: 'Images',
      description: 'Search Pexels for images',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <rect x="3" y="3" width="18" height="18" rx="3" strokeLinecap="round" strokeLinejoin="round"/>
          <circle cx="8.5" cy="8.5" r="2" fill="currentColor" opacity="0.6"/>
          <path d="M21 15l-5-5L5 21" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
      shortcut: 'I'
    },
    {
      id: 'upload',
      name: 'Upload',
      description: 'Upload files (images, PSD, PDF)',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
          <polyline points="7 10 12 5 17 10"/>
          <line x1="12" y1="5" x2="12" y2="15"/>
        </svg>
      ),
      shortcut: 'U'
    },
    {
      id: 'resize',
      name: 'Resize',
      description: 'Resize canvas dimensions',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path d="M16 3h5v5"/>
          <line x1="21" y1="3" x2="14" y2="10"/>
          <path d="M8 21H3v-5"/>
          <line x1="3" y1="21" x2="10" y2="14"/>
        </svg>
      ),
      shortcut: 'R'
    }
  ];
  
  return (
    <>
      <nav className="simple-sidebar" role="navigation" aria-label="Main tools">
        {tools.map((tool) => (
          <button
            key={tool.id}
            className={`simple-tool-btn ${activeTool === tool.id ? 'active' : ''} ${
              (tool.id === 'shapes' && showShapeMenu) || 
              (tool.id === 'images' && showImageSearch) ||
              (tool.id === 'text' && showTextPanel) ||
              (tool.id === 'resize' && showResizePanel) ||
              (tool.id === 'my-design' && showMyDesign) ? 'menu-open' : ''
            }`}
            onClick={() => handleToolClick(tool.id)}
            aria-label={`${tool.name} tool`}
            aria-pressed={activeTool === tool.id}
            title={`${tool.name} (${tool.shortcut})`}
          >
            {tool.icon}
            <span className="tool-tooltip">
              {tool.name}
              <span className="tool-shortcut">{tool.shortcut}</span>
            </span>
          </button>
        ))}
      </nav>
      
      {/* 形状选择菜单 */}
      {showShapeMenu && (
        <div className="shape-menu">
          <div className="shape-menu-header">
            <h3>选择形状</h3>
            <button 
              className="shape-menu-close"
              onClick={() => setShowShapeMenu(false)}
            >
              ✕
            </button>
          </div>
          
          {/* 分类标签 */}
          <div className="shape-categories">
            {Object.keys(shapeCategories).map((categoryKey) => (
              <button
                key={categoryKey}
                className={`category-tab ${activeCategory === categoryKey ? 'active' : ''}`}
                onClick={() => setActiveCategory(categoryKey)}
              >
                {categoryKey === 'basic' && '基础'}
                {categoryKey === 'arrows' && '箭头'}
                {categoryKey === 'symbols' && '符号'}
                {categoryKey === 'objects' && '物品'}
                {categoryKey === 'creative' && '创意'}
              </button>
            ))}
          </div>
          
          <div className="shape-grid">
            {getCurrentShapes().map((shape) => (
              <button
                key={shape.type}
                className="shape-item"
                onClick={() => createShape(shape)}
                title={shape.name}
              >
                <div className="shape-icon">{shape.icon}</div>
                <div className="shape-name">{shape.name}</div>
              </button>
            ))}
          </div>
        </div>
      )}
      
      {/* 图片搜索面板 */}
      {showImageSearch && (
        <ImageSearchPanel
          store={store}
          onClose={() => setShowImageSearch(false)}
        />
      )}

      {/* 文字面板 */}
      {showTextPanel && (
        <EnhancedTextPanel
          store={store}
          onClose={() => setShowTextPanel(false)}
        />
      )}

      {/* My Design 面板 */}
      {showMyDesign && (
        <div className="shape-menu">
          <div className="shape-menu-header">
            <h3>我的设计</h3>
            <button 
              className="shape-menu-close"
              onClick={() => setShowMyDesign(false)}
            >
              ✕
            </button>
          </div>
          
          <div style={{ padding: '20px' }}>
            <MyDesignPanel 
              store={store}
              onClose={() => setShowMyDesign(false)}
            />
          </div>
        </div>
      )}

      {/* Resize 面板 */}
      {showResizePanel && (
        <div className="shape-menu">
          <div className="shape-menu-header">
            <h3>调整画布尺寸</h3>
            <button 
              className="shape-menu-close"
              onClick={() => setShowResizePanel(false)}
            >
              ✕
            </button>
          </div>
          
          <div style={{ padding: '20px' }}>
            <ResizeCanvasPanel 
              store={store}
              onResize={handleCanvasResize}
              onClose={() => setShowResizePanel(false)}
            />
          </div>
        </div>
      )}

      {/* 背景遮罩 */}
      {(showShapeMenu || showImageSearch || showTextPanel || showResizePanel || showMyDesign) && (
        <div 
          className="shape-menu-overlay"
          onClick={() => {
            setShowShapeMenu(false);
            setShowImageSearch(false);
            setShowTextPanel(false);
            setShowResizePanel(false);
            setShowMyDesign(false);
          }}
        />
      )}
    </>
  );
};

export default SimpleSidebar;