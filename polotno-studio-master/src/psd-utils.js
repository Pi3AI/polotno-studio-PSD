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
        const arrayBuffer = e.target.result;
        
        // 检查文件头
        const header = new Uint8Array(arrayBuffer.slice(0, 4));
        const signature = String.fromCharCode(...header);
        
        if (signature !== '8BPS') {
          throw new Error('无效的 PSD 文件格式');
        }
        
        // 尝试不同的解析选项以获取实际的图层数据
        const psd = readPsd(arrayBuffer, {
          skipLayerImageData: false,
          skipCompositeImageData: false,
          skipThumbnail: false,
          useImageData: false, // 改为false，让ag-psd使用canvas
          useRawThumbnail: true,
          throwForMissingFeatures: false,
          logMissingFeatures: true,
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
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  // 计算图层尺寸
  const width = Math.max(1, Math.floor((layer.right || 0) - (layer.left || 0)));
  const height = Math.max(1, Math.floor((layer.bottom || 0) - (layer.top || 0)));
  
  
  canvas.width = width;
  canvas.height = height;
  
  // ag-psd 在使用 useImageData: false 时会直接创建 HTMLCanvasElement
  if (layer.canvas) {
    if (layer.canvas instanceof HTMLCanvasElement) {
      // 检查canvas内容
      const canvasDataURL = layer.canvas.toDataURL();
      
      // 如果canvas不为空，则缩放到目标尺寸
      if (canvasDataURL.length > 1000) {
        ctx.drawImage(layer.canvas, 0, 0, width, height);
        return canvas;
      }
    }
    
    // 如果 canvas 是数据对象
    if (layer.canvas.data && layer.canvas.width && layer.canvas.height) {
      
      try {
        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');
        tempCanvas.width = layer.canvas.width;
        tempCanvas.height = layer.canvas.height;
        
        const imageData = tempCtx.createImageData(layer.canvas.width, layer.canvas.height);
        
        // 处理数据格式
        let sourceData;
        if (layer.canvas.data instanceof Uint8ClampedArray) {
          sourceData = layer.canvas.data;
        } else {
          sourceData = new Uint8ClampedArray(layer.canvas.data);
        }
        
        imageData.data.set(sourceData);
        tempCtx.putImageData(imageData, 0, 0);
        
        const tempDataURL = tempCanvas.toDataURL();
        
        // 将临时 canvas 绘制到目标 canvas 上
        ctx.drawImage(tempCanvas, 0, 0, width, height);
        return canvas;
      } catch (error) {
        console.error('Canvas 数据绘制失败:', error, layer.name);
      }
    }
  }
  
  // 检查 imageData
  if (layer.imageData && layer.imageData.data) {
    
    try {
      const tempCanvas = document.createElement('canvas');
      const tempCtx = tempCanvas.getContext('2d');
      tempCanvas.width = layer.imageData.width;
      tempCanvas.height = layer.imageData.height;
      
      const expectedLength = layer.imageData.width * layer.imageData.height * 4;
      
      if (layer.imageData.data.length !== expectedLength) {
        // 如果长度不匹配，可能需要调整
        const adjustedData = new Uint8ClampedArray(expectedLength);
        const copyLength = Math.min(layer.imageData.data.length, expectedLength);
        
        // 确保数据是正确的格式
        if (layer.imageData.data instanceof Uint8ClampedArray) {
          adjustedData.set(layer.imageData.data.subarray(0, copyLength));
        } else {
          adjustedData.set(new Uint8ClampedArray(layer.imageData.data.buffer || layer.imageData.data).subarray(0, copyLength));
        }
        
        const imageData = tempCtx.createImageData(layer.imageData.width, layer.imageData.height);
        imageData.data.set(adjustedData);
        tempCtx.putImageData(imageData, 0, 0);
      } else {
        const imageData = tempCtx.createImageData(layer.imageData.width, layer.imageData.height);
        
        // 确保数据格式正确
        let sourceData;
        if (layer.imageData.data instanceof Uint8ClampedArray) {
          sourceData = layer.imageData.data;
        } else if (layer.imageData.data.buffer) {
          sourceData = new Uint8ClampedArray(layer.imageData.data.buffer);
        } else {
          sourceData = new Uint8ClampedArray(layer.imageData.data);
        }
        
        
        // 检查是否需要处理预乘alpha或其他颜色格式问题
        const processedData = new Uint8ClampedArray(sourceData.length);
        for (let i = 0; i < sourceData.length; i += 4) {
          const r = sourceData[i];
          const g = sourceData[i + 1];
          const b = sourceData[i + 2];
          const a = sourceData[i + 3];
          
          // 直接复制，不进行预乘alpha处理
          processedData[i] = r;     // Red
          processedData[i + 1] = g; // Green
          processedData[i + 2] = b; // Blue
          processedData[i + 3] = a; // Alpha
        }
        
        imageData.data.set(processedData);
        tempCtx.putImageData(imageData, 0, 0);
        
      }
      
      const tempDataURL = tempCanvas.toDataURL();
      
      // 将临时 canvas 绘制到目标 canvas 上
      ctx.drawImage(tempCanvas, 0, 0, width, height);
      return canvas;
    } catch (error) {
      console.error('ImageData 绘制失败:', error, layer.name);
    }
  }
  
  // 如果都没有有效数据，创建一个带颜色的测试图层
  ctx.fillStyle = `rgba(${Math.random() * 255}, ${Math.random() * 255}, ${Math.random() * 255}, 0.5)`;
  ctx.fillRect(0, 0, width, height);
  ctx.strokeStyle = '#000000';
  ctx.strokeRect(0, 0, width, height);
  
  // 添加图层名称
  ctx.fillStyle = '#000000';
  ctx.font = '12px Arial';
  ctx.fillText(layer.name || 'Unnamed', 5, 15);
  
  return canvas;
};

/**
 * Canvas 转换为 DataURL
 * @param {HTMLCanvasElement} canvas - Canvas 元素
 * @param {string} format - 图片格式 (默认 'image/png')
 * @returns {string} DataURL
 */
export const canvasToDataURL = (canvas, format = 'image/png') => {
  try {
    const dataURL = canvas.toDataURL(format, 0.9); // 添加质量参数
    
    if (dataURL.length < 1000) {
      
      // 尝试创建一个简单的测试图像来验证canvas功能
      const testCanvas = document.createElement('canvas');
      testCanvas.width = canvas.width;
      testCanvas.height = canvas.height;
      const testCtx = testCanvas.getContext('2d');
      
      // 绘制一个简单的背景来测试
      testCtx.fillStyle = '#ff0000';
      testCtx.fillRect(0, 0, 50, 50);
      
      const testDataURL = testCanvas.toDataURL(format);
      
      return dataURL;
    }
    
    return dataURL;
  } catch (error) {
    console.error('Canvas 转换 DataURL 失败:', error);
    // 返回一个默认的透明图像
    const fallbackCanvas = document.createElement('canvas');
    fallbackCanvas.width = canvas.width;
    fallbackCanvas.height = canvas.height;
    return fallbackCanvas.toDataURL(format);
  }
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
      opacity: 1, // 强制设置为100%不透明
      visible: true, // 强制设置为可见
      blendMode: 'normal', // 使用正常混合模式
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
      
    } 
    // 处理图像图层 - 现在更宽容，即使没有明显的图像数据也尝试创建
    else {
      element.type = 'image';
      const canvas = layerToCanvas(layer);
      if (canvas) {
        element.src = canvasToDataURL(canvas);
      } else {
        console.warn('无法创建图层 Canvas，跳过图层:', layer.name);
        return null;
      }
    }
    
    return element;
  } catch (error) {
    console.error('图层转换失败:', error, {
      layerName: layer.name,
      layerKeys: Object.keys(layer)
    });
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
    console.log('getPSDPreview: 开始生成预览，PSD信息:', {
      width: psd.width,
      height: psd.height,
      hasCanvas: !!psd.canvas,
      canvasType: psd.canvas ? (psd.canvas instanceof HTMLCanvasElement ? 'HTMLCanvasElement' : 'Object') : 'none'
    });
    
    // 尝试使用合成图像
    if (psd.canvas) {
      if (psd.canvas instanceof HTMLCanvasElement) {
        console.log('getPSDPreview: 使用HTMLCanvasElement生成预览');
        const dataURL = canvasToDataURL(psd.canvas);
        console.log('getPSDPreview: HTMLCanvasElement预览生成完成，长度:', dataURL?.length);
        return dataURL;
      }
      
      if (psd.canvas.data && psd.canvas.width && psd.canvas.height) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        canvas.width = psd.canvas.width;
        canvas.height = psd.canvas.height;
        
        try {
          const imageData = ctx.createImageData(canvas.width, canvas.height);
          imageData.data.set(new Uint8ClampedArray(psd.canvas.data));
          ctx.putImageData(imageData, 0, 0);
          const dataURL = canvasToDataURL(canvas);
          return dataURL;
        } catch (error) {
          console.warn('Canvas 数据处理失败，使用占位符:', error);
        }
      }
    }
    
    // 如果没有合成图像，创建简单预览
    if (psd.width && psd.height) {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      // 创建缩略图尺寸
      const maxSize = 200;
      const scale = Math.min(maxSize / psd.width, maxSize / psd.height);
      
      canvas.width = Math.max(1, psd.width * scale);
      canvas.height = Math.max(1, psd.height * scale);
      
      // 绘制简单的占位符
      ctx.fillStyle = '#e8e8e8';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // 添加边框
      ctx.strokeStyle = '#ccc';
      ctx.lineWidth = 2;
      ctx.strokeRect(1, 1, canvas.width - 2, canvas.height - 2);
      
      // 添加PSD图标和信息
      ctx.fillStyle = '#666';
      ctx.font = 'bold 14px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('PSD', canvas.width / 2, canvas.height / 2 - 5);
      
      ctx.font = '10px Arial';
      ctx.fillText(`${psd.width}×${psd.height}`, canvas.width / 2, canvas.height / 2 + 10);
      
      const dataURL = canvasToDataURL(canvas);
      return dataURL;
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
    'application/octet-stream', // 很多时候PSD文件会被识别为这种类型
  ];
  
  const hasPSDMimeType = psdMimeTypes.includes(file.type);
  const hasPSDExtension = file.name.toLowerCase().endsWith('.psd');
  
  // 如果是 octet-stream，只有在文件扩展名是 .psd 时才认为是PSD文件
  const isPSDByMimeType = file.type === 'application/octet-stream' ? hasPSDExtension : hasPSDMimeType;
  
  const result = isPSDByMimeType || hasPSDExtension;
  
  console.log('PSD 文件检测:', {
    fileName: file.name,
    fileType: file.type,
    fileSize: file.size,
    hasPSDMimeType,
    hasPSDExtension,
    isPSDByMimeType,
    finalResult: result
  });
  
  return result;
};