import { readPsd } from 'ag-psd';

/**
 * 解析 PSD 文件
 * @param {File} file - PSD 文件
 * @returns {Promise<Object>} 解析后的 PSD 数据
 */
export const parsePSDFile = async (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        console.log('开始解析 PSD 文件...');
        const arrayBuffer = e.target.result;
        
        // 检查文件头
        const header = new Uint8Array(arrayBuffer.slice(0, 4));
        const signature = String.fromCharCode(...header);
        console.log('PSD 文件签名:', signature);
        
        if (signature !== '8BPS') {
          throw new Error('无效的 PSD 文件格式');
        }
        
        const psd = readPsd(arrayBuffer, {
          skipLayerImageData: false,
          skipCompositeImageData: false,
          skipThumbnail: false,
          useImageData: true,
        });
        
        console.log('PSD 解析成功:', {
          width: psd.width,
          height: psd.height,
          layerCount: psd.children?.length || 0
        });
        
        resolve(psd);
      } catch (error) {
        console.error('PSD 解析详细错误:', error);
        reject(new Error(`PSD 解析失败: ${error.message}`));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('文件读取失败'));
    };
    
    reader.readAsArrayBuffer(file);
  });
};

/**
 * 从图层数据创建 Canvas
 * @param {Object} layer - PSD 图层
 * @returns {HTMLCanvasElement|null} Canvas 元素
 */
export const layerToCanvas = (layer) => {
  if (!layer.canvas && !layer.imageData) {
    console.warn('图层没有 canvas 或 imageData 数据:', layer);
    return null;
  }
  
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  // ag-psd 可能返回不同的数据格式
  let width, height, data;
  
  if (layer.canvas) {
    // 如果是 HTMLCanvasElement
    if (layer.canvas instanceof HTMLCanvasElement) {
      return layer.canvas;
    }
    // 如果是包含数据的对象
    width = layer.canvas.width;
    height = layer.canvas.height;
    data = layer.canvas.data;
  } else if (layer.imageData) {
    width = layer.imageData.width;
    height = layer.imageData.height;
    data = layer.imageData.data;
  }
  
  if (!width || !height || !data) {
    console.warn('图层数据不完整:', { width, height, hasData: !!data });
    return null;
  }
  
  canvas.width = width;
  canvas.height = height;
  
  try {
    // 创建 ImageData 并绘制到 canvas
    const imageData = ctx.createImageData(width, height);
    imageData.data.set(data);
    ctx.putImageData(imageData, 0, 0);
    
    return canvas;
  } catch (error) {
    console.error('Canvas 绘制失败:', error);
    return null;
  }
};

/**
 * Canvas 转换为 DataURL
 * @param {HTMLCanvasElement} canvas - Canvas 元素
 * @param {string} format - 图片格式 (默认 'image/png')
 * @returns {string} DataURL
 */
export const canvasToDataURL = (canvas, format = 'image/png') => {
  return canvas.toDataURL(format);
};

/**
 * 递归提取所有图层
 * @param {Array} layers - PSD 图层数组
 * @param {Array} result - 结果数组
 * @param {number} parentIndex - 父级索引
 * @returns {Array} 扁平化的图层数组
 */
export const flattenLayers = (layers = [], result = [], parentIndex = -1) => {
  layers.forEach((layer, index) => {
    const layerInfo = {
      ...layer,
      originalIndex: index,
      parentIndex,
      id: `layer_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`,
      visible: layer.hidden !== true,
      opacity: layer.opacity !== undefined ? layer.opacity / 255 : 1,
      blendMode: layer.blendMode || 'normal',
    };
    
    result.push(layerInfo);
    
    // 递归处理子图层
    if (layer.children && layer.children.length > 0) {
      flattenLayers(layer.children, result, result.length - 1);
    }
  });
  
  return result;
};

/**
 * 将 PSD 图层转换为 Polotno 元素数据
 * @param {Object} layer - PSD 图层
 * @returns {Object|null} Polotno 元素数据
 */
export const layerToPolotnoElement = async (layer) => {
  try {
    // 跳过隐藏图层
    if (layer.hidden) {
      console.log('跳过隐藏图层:', layer.name);
      return null;
    }
    
    console.log('处理图层:', {
      name: layer.name,
      type: layer.text ? 'text' : 'image',
      bounds: { left: layer.left, top: layer.top, right: layer.right, bottom: layer.bottom },
      hasCanvas: !!(layer.canvas || layer.imageData)
    });
    
    const width = Math.max(1, (layer.right || 0) - (layer.left || 0));
    const height = Math.max(1, (layer.bottom || 0) - (layer.top || 0));
    
    const element = {
      id: layer.id || `layer_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`,
      name: layer.name || 'Layer',
      x: layer.left || 0,
      y: layer.top || 0,
      width,
      height,
      rotation: 0,
      opacity: layer.opacity !== undefined ? layer.opacity / 255 : 1,
      visible: !layer.hidden,
      blendMode: mapBlendMode(layer.blendMode),
    };
    
    // 处理文本图层
    if (layer.text && layer.text.text) {
      element.type = 'text';
      element.text = layer.text.text || '';
      element.fontSize = layer.text.style?.fontSize || 16;
      element.fontFamily = layer.text.style?.fontName || 'Arial';
      element.fill = layer.text.style?.fillColor ? 
        rgbToHex(layer.text.style.fillColor) : '#000000';
      element.align = layer.text.style?.alignment || 'left';
      
      console.log('创建文本元素:', {
        text: element.text,
        fontSize: element.fontSize,
        fill: element.fill
      });
    } 
    // 处理图像图层
    else if (layer.canvas || layer.imageData) {
      element.type = 'image';
      const canvas = layerToCanvas(layer);
      if (canvas) {
        element.src = canvasToDataURL(canvas);
        console.log('创建图像元素，Canvas 尺寸:', canvas.width, 'x', canvas.height);
      } else {
        console.warn('无法创建图层 Canvas:', layer.name);
        return null;
      }
    } 
    // 空图层或其他类型
    else {
      console.warn('图层没有可用内容:', layer.name);
      return null;
    }
    
    return element;
  } catch (error) {
    console.error('图层转换失败:', error, layer);
    return null;
  }
};

/**
 * 映射混合模式
 * @param {string} psdBlendMode - PSD 混合模式
 * @returns {string} CSS 混合模式
 */
const mapBlendMode = (psdBlendMode) => {
  const blendModeMap = {
    'normal': 'normal',
    'multiply': 'multiply',
    'screen': 'screen',
    'overlay': 'overlay',
    'softLight': 'soft-light',
    'hardLight': 'hard-light',
    'colorDodge': 'color-dodge',
    'colorBurn': 'color-burn',
    'darken': 'darken',
    'lighten': 'lighten',
    'difference': 'difference',
    'exclusion': 'exclusion',
  };
  
  return blendModeMap[psdBlendMode] || 'normal';
};

/**
 * RGB 转 HEX
 * @param {Object} rgb - RGB 颜色对象
 * @returns {string} HEX 颜色字符串
 */
const rgbToHex = (rgb) => {
  const { r = 0, g = 0, b = 0 } = rgb;
  return `#${[r, g, b].map(x => {
    const hex = Math.round(x).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }).join('')}`;
};

/**
 * 获取 PSD 文件预览图
 * @param {Object} psd - 解析后的 PSD 数据
 * @returns {string|null} 预览图 DataURL
 */
export const getPSDPreview = (psd) => {
  try {
    // 尝试使用合成图像
    if (psd.canvas) {
      if (psd.canvas instanceof HTMLCanvasElement) {
        return canvasToDataURL(psd.canvas);
      }
      
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      canvas.width = psd.canvas.width || psd.width;
      canvas.height = psd.canvas.height || psd.height;
      
      if (psd.canvas.data) {
        const imageData = ctx.createImageData(canvas.width, canvas.height);
        imageData.data.set(psd.canvas.data);
        ctx.putImageData(imageData, 0, 0);
        return canvasToDataURL(canvas);
      }
    }
    
    // 如果没有合成图像，创建简单预览
    if (psd.width && psd.height) {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      // 创建缩略图尺寸
      const maxSize = 200;
      const scale = Math.min(maxSize / psd.width, maxSize / psd.height);
      
      canvas.width = psd.width * scale;
      canvas.height = psd.height * scale;
      
      // 绘制简单的占位符
      ctx.fillStyle = '#f0f0f0';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      ctx.fillStyle = '#666';
      ctx.font = '12px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('PSD', canvas.width / 2, canvas.height / 2);
      ctx.fillText(`${psd.width}×${psd.height}`, canvas.width / 2, canvas.height / 2 + 15);
      
      return canvasToDataURL(canvas);
    }
    
    return null;
  } catch (error) {
    console.error('生成 PSD 预览失败:', error);
    return null;
  }
};

/**
 * 验证文件是否为 PSD 格式
 * @param {File} file - 文件对象
 * @returns {boolean} 是否为 PSD 文件
 */
export const isPSDFile = (file) => {
  const psdMimeTypes = [
    'image/vnd.adobe.photoshop',
    'image/photoshop',
    'image/x-photoshop',
    'application/photoshop',
    'application/psd',
  ];
  
  const hasPSDMimeType = psdMimeTypes.includes(file.type);
  const hasPSDExtension = file.name.toLowerCase().endsWith('.psd');
  
  console.log('PSD 文件检测:', {
    fileName: file.name,
    fileType: file.type,
    hasPSDMimeType,
    hasPSDExtension,
    isPSD: hasPSDMimeType || hasPSDExtension
  });
  
  return hasPSDMimeType || hasPSDExtension;
};