import { writePsd } from 'ag-psd';
import JSZip from 'jszip';

/**
 * 将 Polotno 元素转换为 PSD 图层数据
 * @param {Object} element - Polotno 元素
 * @returns {Promise<Object>} PSD 图层数据
 */
const polotnoElementToPSDLayer = async (element) => {
  const width = Math.round(element.width || 100);
  const height = Math.round(element.height || 100);
  const left = Math.round(element.x || 0);
  const top = Math.round(element.y || 0);
  
  const layer = {
    name: element.name || `${element.type}_${element.id}`,
    left,
    top,
    right: left + width,
    bottom: top + height,
    opacity: Math.round((element.opacity || 1) * 255),
    hidden: !element.visible,
    blendMode: mapPolotnoBlendMode(element.blendMode || 'normal'),
  };

  // 创建图层画布
  let canvas = null;
  
  // 处理文本图层
  if (element.type === 'text') {
    canvas = await renderTextToCanvas(element, width, height);
    // 对于文本图层，仍然保留文本信息
    layer.text = {
      text: element.text || '',
      style: {
        fontSize: element.fontSize || 16,
        fontName: element.fontFamily || 'Arial',
        fillColor: hexToRgb(element.fill || '#000000'),
        alignment: mapTextAlignment(element.align || 'left'),
      }
    };
  } 
  // 处理图像图层
  else if (element.type === 'image' && element.src) {
    try {
      canvas = await loadImageToCanvas(element);
    } catch (error) {
      console.warn('图像处理失败:', error);
      canvas = createEmptyCanvas(width, height);
    }
  }
  // 处理其他类型的图层
  else {
    try {
      canvas = await renderElementToCanvas(element);
    } catch (error) {
      console.warn('元素渲染失败:', error);
      canvas = createEmptyCanvas(width, height);
    }
  }

  // 设置图层画布
  if (canvas) {
    layer.canvas = canvas;
  }

  return layer;
};

/**
 * 加载图像到 Canvas
 * @param {Object} element - 图像元素
 * @returns {Promise<HTMLCanvasElement>} Canvas 元素
 */
const loadImageToCanvas = (element) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      canvas.width = element.width || img.width;
      canvas.height = element.height || img.height;
      
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas);
    };
    
    img.onerror = reject;
    img.src = element.src;
  });
};

/**
 * 渲染元素到 Canvas
 * @param {Object} element - Polotno 元素
 * @returns {Promise<HTMLCanvasElement>} Canvas 元素
 */
const renderElementToCanvas = async (element) => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  canvas.width = element.width || 100;
  canvas.height = element.height || 100;
  
  // 设置基本样式
  ctx.globalAlpha = element.opacity || 1;
  
  // 根据元素类型渲染
  switch (element.type) {
    case 'rectangle':
      ctx.fillStyle = element.fill || '#000000';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      if (element.stroke) {
        ctx.strokeStyle = element.stroke;
        ctx.lineWidth = element.strokeWidth || 1;
        ctx.strokeRect(0, 0, canvas.width, canvas.height);
      }
      break;
      
    case 'circle':
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const radius = Math.min(canvas.width, canvas.height) / 2;
      
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
      ctx.fillStyle = element.fill || '#000000';
      ctx.fill();
      
      if (element.stroke) {
        ctx.strokeStyle = element.stroke;
        ctx.lineWidth = element.strokeWidth || 1;
        ctx.stroke();
      }
      break;
      
    default:
      // 默认渲染为矩形
      ctx.fillStyle = element.fill || '#cccccc';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
  
  return canvas;
};

/**
 * 创建空白 Canvas
 * @param {number} width - 宽度
 * @param {number} height - 高度
 * @returns {HTMLCanvasElement} 空白 Canvas
 */
const createEmptyCanvas = (width, height) => {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  return canvas;
};

/**
 * 渲染文本到 Canvas
 * @param {Object} element - 文本元素
 * @param {number} width - Canvas 宽度
 * @param {number} height - Canvas 高度
 * @returns {HTMLCanvasElement} 渲染后的 Canvas
 */
const renderTextToCanvas = async (element, width, height) => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  canvas.width = width;
  canvas.height = height;
  
  // 设置文本样式
  const fontSize = element.fontSize || 16;
  const fontFamily = element.fontFamily || 'Arial';
  const fill = element.fill || '#000000';
  const text = element.text || '';
  
  ctx.font = `${fontSize}px ${fontFamily}`;
  ctx.fillStyle = fill;
  ctx.textAlign = element.align || 'left';
  ctx.textBaseline = 'top';
  
  // 简单的文本渲染
  const lines = text.split('\n');
  const lineHeight = fontSize * 1.2;
  
  lines.forEach((line, index) => {
    let x = 0;
    if (element.align === 'center') {
      x = width / 2;
    } else if (element.align === 'right') {
      x = width;
    }
    
    const y = index * lineHeight;
    ctx.fillText(line, x, y);
  });
  
  return canvas;
};

/**
 * 映射 Polotno 混合模式到 PSD 混合模式
 * @param {string} polotnoBlendMode - Polotno 混合模式
 * @returns {string} PSD 混合模式
 */
const mapPolotnoBlendMode = (polotnoBlendMode) => {
  const blendModeMap = {
    'normal': 'normal',
    'multiply': 'multiply',
    'screen': 'screen',
    'overlay': 'overlay',
    'soft-light': 'softLight',
    'hard-light': 'hardLight',
    'color-dodge': 'colorDodge',
    'color-burn': 'colorBurn',
    'darken': 'darken',
    'lighten': 'lighten',
    'difference': 'difference',
    'exclusion': 'exclusion',
  };
  
  return blendModeMap[polotnoBlendMode] || 'normal';
};

/**
 * 映射文本对齐方式
 * @param {string} align - Polotno 对齐方式
 * @returns {string} PSD 对齐方式
 */
const mapTextAlignment = (align) => {
  const alignmentMap = {
    'left': 'left',
    'center': 'center',
    'right': 'right',
    'justify': 'justify',
  };
  
  return alignmentMap[align] || 'left';
};

/**
 * HEX 转 RGB
 * @param {string} hex - HEX 颜色字符串
 * @returns {Object} RGB 颜色对象
 */
const hexToRgb = (hex) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : { r: 0, g: 0, b: 0 };
};

/**
 * 导出 Polotno Store 为 PSD 文件
 * @param {Object} store - Polotno Store
 * @param {string} filename - 文件名
 * @returns {Promise<void>}
 */
export const exportToPSD = async (store, filename = 'design.psd') => {
  try {
    const activePage = store.activePage;
    if (!activePage || !activePage.children || activePage.children.length === 0) {
      throw new Error('画布中没有可导出的内容');
    }

    // 创建 PSD 数据结构
    const psdData = {
      width: store.width,
      height: store.height,
      children: []
    };

    // 转换所有元素为 PSD 图层
    console.log('开始转换图层...');
    for (const element of activePage.children) {
      try {
        const layer = await polotnoElementToPSDLayer(element);
        if (layer) {
          psdData.children.push(layer);
        }
      } catch (error) {
        console.warn(`图层 ${element.id} 转换失败:`, error);
      }
    }

    console.log(`成功转换 ${psdData.children.length} 个图层`);

    // 生成 PSD 文件
    console.log('正在生成 PSD 文件...');
    const psdBuffer = writePsd(psdData);
    
    // 创建下载链接
    const blob = new Blob([psdBuffer], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = filename.endsWith('.psd') ? filename : `${filename}.psd`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
    
    console.log('PSD 文件导出完成');
    return true;
  } catch (error) {
    console.error('PSD 导出失败:', error);
    throw error;
  }
};

/**
 * 批量导出所有页面为 PSD 文件包
 * @param {Object} store - Polotno Store
 * @param {string} filename - 文件名前缀
 * @returns {Promise<void>}
 */
export const exportAllPagesToPSDZip = async (store, filename = 'design_pages') => {
  try {
    const zip = new JSZip();
    
    for (let i = 0; i < store.pages.length; i++) {
      const page = store.pages[i];
      const originalActivePage = store.activePage;
      
      // 临时切换到当前页面
      store.setActivePage(page);
      
      try {
        // 生成 PSD 数据
        const psdData = {
          width: store.width,
          height: store.height,
          children: []
        };

        // 转换图层
        for (const element of page.children) {
          try {
            const layer = await polotnoElementToPSDLayer(element);
            if (layer) {
              psdData.children.push(layer);
            }
          } catch (error) {
            console.warn(`页面 ${i + 1} 图层转换失败:`, error);
          }
        }

        // 生成 PSD 文件
        const psdBuffer = writePsd(psdData);
        zip.file(`${filename}_page_${i + 1}.psd`, psdBuffer);
        
      } catch (error) {
        console.warn(`页面 ${i + 1} 导出失败:`, error);
      }
      
      // 恢复原始活动页面
      store.setActivePage(originalActivePage);
    }
    
    // 生成 ZIP 文件
    const zipBlob = await zip.generateAsync({ type: 'blob' });
    
    // 创建下载链接
    const url = URL.createObjectURL(zipBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}.zip`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
    
    console.log('所有页面 PSD 文件导出完成');
    return true;
  } catch (error) {
    console.error('PSD 批量导出失败:', error);
    throw error;
  }
};