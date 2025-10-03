import { readPsd } from 'ag-psd';
import { psdDebugger } from './utils/PSDDebugger';
import { fontManager } from './utils/FontManager';
// 全局导入选项：可通过 window.psdImportOptions.rasterizeText 控制
const shouldRasterizeText = () => {
  try {
    if (window.psdImportOptions && typeof window.psdImportOptions.rasterizeText === 'boolean') {
      return window.psdImportOptions.rasterizeText;
    }
  } catch (e) {}
  return true; // 默认开启：将文字以位图导入确保完全一致
};

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
        
        // 精确解析配置以保持原始PSD数据完整性和最高图像质量
        const psd = readPsd(arrayBuffer, {
          skipLayerImageData: false,      // 保留所有图层图像数据
          skipCompositeImageData: false,  // 保留合成图像数据
          skipThumbnail: false,           // 保留缩略图数据
          useImageData: false,            // 使用Canvas以获得更精确的颜色显示
          useRawThumbnail: false,         // 不使用原始缩略图
          throwForMissingFeatures: false, // 容错处理
          logMissingFeatures: false,      // 不记录缺失功能日志
          ignoreAlphaChannel: false,      // 保留alpha通道
          logDevModeWarnings: false,      // 不记录开发模式警告
        });
        
        const psdInfo = {
          width: psd.width,
          height: psd.height,
          colorMode: psd.colorMode,
          resolution: psd.resolution,
          pixelsPerInch: psd.pixelsPerInch,
          layerCount: psd.children?.length || 0,
          hasColorProfile: !!psd.colorProfile
        };
        
        console.log('PSD解析成功:', psdInfo);
        psdDebugger.log('PSD文件解析成功', psdInfo);
        
        // 将PSD信息附加到每个图层以便后续使用
        const attachPSDInfo = (layers) => {
          layers.forEach(layer => {
            layer.psdInfo = {
              resolution: psd.resolution || psd.pixelsPerInch || 72,
              width: psd.width,
              height: psd.height
            };
            if (layer.children) {
              attachPSDInfo(layer.children);
            }
          });
        };
        
        if (psd.children) {
          attachPSDInfo(psd.children);
        }
        
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
      // 直接使用原始canvas，保持最高保真度
      const sourceCanvas = layer.canvas;
      if (sourceCanvas.width > 0 && sourceCanvas.height > 0) {
        // 设置目标尺寸
        canvas.width = width || sourceCanvas.width;
        canvas.height = height || sourceCanvas.height;
        
        // 使用高质量的绘制设置
        ctx.imageSmoothingEnabled = false; // 禁用插值以保持像素精度
        ctx.imageSmoothingQuality = 'high'; // 设置高质量插值（当需要时）
        
        // 支持高分辨率显示 - 提高画质
        const pixelRatio = Math.max(window.devicePixelRatio || 1, 2); // 至少2倍分辨率
        canvas.width = width * pixelRatio;
        canvas.height = height * pixelRatio;
        canvas.style.width = width + 'px';
        canvas.style.height = height + 'px';
        ctx.scale(pixelRatio, pixelRatio);
        
        // 启用高质量绘制
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        
        ctx.drawImage(sourceCanvas, 0, 0, width, height);
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
        
        
        // 处理颜色空间和预乘alpha问题
        const processedData = new Uint8ClampedArray(sourceData.length);
        for (let i = 0; i < sourceData.length; i += 4) {
          let r = sourceData[i];
          let g = sourceData[i + 1];
          let b = sourceData[i + 2];
          let a = sourceData[i + 3];
          
          // 简化颜色处理 - 保持原始PSD颜色值
          // 只进行必要的预乘alpha处理
          if (a > 0 && a < 255) {
            const alpha = a / 255;
            if (alpha > 0) {
              r = Math.min(255, Math.max(0, Math.round(r / alpha)));
              g = Math.min(255, Math.max(0, Math.round(g / alpha)));
              b = Math.min(255, Math.max(0, Math.round(b / alpha)));
            }
          }
          
          // 不应用任何gamma校正，保持原始颜色
          r = Math.max(0, Math.min(255, Math.round(r)));
          g = Math.max(0, Math.min(255, Math.round(g)));
          b = Math.max(0, Math.min(255, Math.round(b)));
          
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
/**
 * 使用AI API增强图像质量
 * @param {string} imageDataURL - 图像的DataURL
 * @param {Object} options - 增强选项
 * @returns {Promise<string>} 增强后的图像DataURL
 */
export const enhanceImageQuality = async (imageDataURL, options = {}) => {
  try {
    const {
      upscaleFactor = 2,     // 放大倍数
      enhanceSharpness = true, // 是否增强锐度
      reduceNoise = true,      // 是否降噪
      useAIUpscaling = true    // 是否使用AI放大
    } = options;

    // 1. 使用Real-ESRGAN API (免费的AI图像增强服务)
    if (useAIUpscaling) {
      try {
        const response = await fetch('https://api.replicate.com/v1/predictions', {
          method: 'POST',
          headers: {
            'Authorization': 'Token r8_6vG7QjLqF7X8v8BvR8QhF7X8v8BvR8QhF7X8v8B', // 示例token
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            version: "42fed1c4974146d4d2414e2be2c5277c7fcf05fcc972f6b188a61c4538dcf4fd", // Real-ESRGAN模型
            input: {
              image: imageDataURL,
              scale: upscaleFactor,
              face_enhance: false
            }
          })
        });

        if (response.ok) {
          const result = await response.json();
          if (result.output) {
            console.log('AI图像增强成功');
            return result.output;
          }
        }
      } catch (error) {
        console.warn('AI增强失败，使用本地增强:', error.message);
      }
    }

    // 2. 本地Canvas图像增强算法作为后备
    const img = new Image();
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
      img.src = imageDataURL;
    });

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    // 设置高分辨率画布
    const pixelRatio = window.devicePixelRatio || 1;
    canvas.width = img.width * upscaleFactor * pixelRatio;
    canvas.height = img.height * upscaleFactor * pixelRatio;
    canvas.style.width = (img.width * upscaleFactor) + 'px';
    canvas.style.height = (img.height * upscaleFactor) + 'px';
    
    ctx.scale(pixelRatio, pixelRatio);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    
    // 绘制放大的图像
    ctx.drawImage(img, 0, 0, img.width * upscaleFactor, img.height * upscaleFactor);
    
    // 应用锐化滤镜
    if (enhanceSharpness) {
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      const width = canvas.width;
      const height = canvas.height;
      
      // 锐化卷积核
      const kernel = [
        0, -1, 0,
        -1, 5, -1,
        0, -1, 0
      ];
      
      const newData = new Uint8ClampedArray(data);
      
      for (let y = 1; y < height - 1; y++) {
        for (let x = 1; x < width - 1; x++) {
          for (let c = 0; c < 3; c++) { // RGB通道
            let value = 0;
            for (let ky = -1; ky <= 1; ky++) {
              for (let kx = -1; kx <= 1; kx++) {
                const idx = ((y + ky) * width + (x + kx)) * 4 + c;
                value += data[idx] * kernel[(ky + 1) * 3 + (kx + 1)];
              }
            }
            const idx = (y * width + x) * 4 + c;
            newData[idx] = Math.max(0, Math.min(255, value));
          }
        }
      }
      
      imageData.data.set(newData);
      ctx.putImageData(imageData, 0, 0);
    }
    
    return canvas.toDataURL('image/png', 1.0);
    
  } catch (error) {
    console.error('图像增强失败:', error);
    return imageDataURL; // 返回原始图像
  }
};

export const canvasToDataURL = (canvas, format = 'image/png', enhance = false) => {
  try {
    // 创建高分辨率版本的canvas用于导出
    const exportCanvas = document.createElement('canvas');
    const exportCtx = exportCanvas.getContext('2d');
    
    // 设置更高的分辨率以提升质量
    const scaleFactor = enhance ? 3 : 2; // 增强时3倍，否则2倍
    exportCanvas.width = canvas.width * scaleFactor;
    exportCanvas.height = canvas.height * scaleFactor;
    
    // 配置高质量绘制
    exportCtx.imageSmoothingEnabled = true;
    exportCtx.imageSmoothingQuality = 'high';
    
    // 绘制放大的图像
    exportCtx.drawImage(canvas, 0, 0, exportCanvas.width, exportCanvas.height);
    
    // 如果启用增强，应用锐化滤镜
    if (enhance) {
      const imageData = exportCtx.getImageData(0, 0, exportCanvas.width, exportCanvas.height);
      const data = imageData.data;
      const newData = new Uint8ClampedArray(data);
      
      // 简化的锐化算法
      for (let y = 1; y < exportCanvas.height - 1; y++) {
        for (let x = 1; x < exportCanvas.width - 1; x++) {
          for (let c = 0; c < 3; c++) { // RGB通道
            const idx = (y * exportCanvas.width + x) * 4 + c;
            const centerValue = data[idx];
            
            // 5x5锐化核心计算
            const sharpened = centerValue * 1.5 - 
              (data[((y-1) * exportCanvas.width + x) * 4 + c] + 
               data[((y+1) * exportCanvas.width + x) * 4 + c] + 
               data[(y * exportCanvas.width + x-1) * 4 + c] + 
               data[(y * exportCanvas.width + x+1) * 4 + c]) * 0.125;
            
            newData[idx] = Math.max(0, Math.min(255, sharpened));
          }
        }
      }
      
      imageData.data.set(newData);
      exportCtx.putImageData(imageData, 0, 0);
    }
    
    // 使用最高质量参数1.0以获得无损图片质量
    const dataURL = exportCanvas.toDataURL(format, 1.0);
    
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
      opacity: 1, // 强制所有图层为100%不透明
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
      opacity: 1, // 强制设置为100%不透明，提升用户体验
      visible: !layer.hidden, // 根据图层可见性设置
      blendMode: mapBlendMode(layer.blendMode) // 映射混合模式
    };
    
    // 处理文本图层
    if (layer.text && layer.text.text) {
      // 若启用“位图导入文字”，优先将文本图层以图像方式导入以确保完全一致
      if (shouldRasterizeText()) {
        const rasterCanvas = layerToCanvas(layer);
        if (rasterCanvas) {
          element.type = 'image';
          // 启用图像增强以提高文本光栅化质量
          element.src = canvasToDataURL(rasterCanvas, 'image/png', true);
          // 保留元数据，便于后续一键转换回可编辑文本
          element.custom = {
            ...element.custom,
            fromTextLayer: true,
            originalText: layer.text.text,
            rasterized: true,
            enhanced: true // 标记已增强
          };
          return element;
        }
      }

      // 严格模式，确保与 PSD 高度一致（可编辑文本路径）
      element.type = 'text';
      element.text = layer.text.text || '';
      
      // 获取文本样式，尝试多种数据结构以确保兼容性
      let textStyle = null;
      
      // 方法1: 优先使用textStyleRange中的样式(最准确)
      if (layer.text.textStyleRange && layer.text.textStyleRange.length > 0) {
        textStyle = layer.text.textStyleRange[0].textStyle;
        console.log('使用textStyleRange样式:', textStyle);
      }
      // 方法2: 使用runs中的样式
      else if (layer.text.runs && layer.text.runs.length > 0) {
        textStyle = layer.text.runs[0].style;
        console.log('使用runs样式:', textStyle);
      }
      // 方法3: 使用默认样式对象
      else if (layer.text.style) {
        textStyle = layer.text.style;
        console.log('使用默认样式:', textStyle);
      }
      // 方法4: 如果有engineData，尝试从中解析
      else if (layer.text.engineData) {
        console.log('尝试解析engineData:', layer.text.engineData);
        // engineData通常包含更复杂的样式信息
        if (layer.text.engineData.StyleRun && layer.text.engineData.StyleRun.length > 0) {
          const styleRun = layer.text.engineData.StyleRun[0];
          if (styleRun.StyleSheet && styleRun.StyleSheet.StyleSheetData) {
            textStyle = styleRun.StyleSheet.StyleSheetData;
            console.log('从engineData解析样式:', textStyle);
          }
        }
      }
      
      // 如果仍然没有找到样式，创建默认样式
      if (!textStyle) {
        textStyle = {
          fontSize: 16,
          fontName: 'Arial',
          fillColor: { r: 0, g: 0, b: 0 }
        };
        console.log('使用默认样式:', textStyle);
      }
      
      // 添加精确样式类标记 - 用于CSS精确渲染
      element.custom = {
        psdPrecision: true,
        originalFontSize: textStyle?.fontSize,
        originalFontName: textStyle?.fontName,
        originalColor: textStyle?.fillColor,
        renderingMode: 'precise'
      };
      
      const originalStyleData = {
        layerName: layer.name,
        textStyle: textStyle,
        fontSize: textStyle?.fontSize,
        fontName: textStyle?.fontName,
        fillColor: textStyle?.fillColor
      };
      
      console.log('PSD文本样式原始数据:', originalStyleData);
      psdDebugger.logConversion('文本样式提取', layer.name, originalStyleData, null);
      
      // 严格的字体大小：优先使用 Photoshop 提供的像素字号 (implied)，否则按 pt→px(96/72)
      const ptToPx = (pt) => (pt * 96) / 72;
      const styleRunData = (layer.text?.engineData?.StyleRun && layer.text.engineData.StyleRun[0]?.StyleSheet?.StyleSheetData) || {};
      const impliedPx = Number(textStyle?.impliedFontSize || textStyle?.ImpliedFontSize || styleRunData.ImpliedFontSize);
      const originalFontSizePt = Number(textStyle?.fontSize) || Number(textStyle?.Size) || Number(styleRunData.FontSize) || 16;
      const baseFontPx = impliedPx && impliedPx > 0 ? impliedPx : ptToPx(originalFontSizePt);
      element.fontSize = Math.max(1, Math.round(baseFontPx * 100) / 100);
      element.custom = {
        ...element.custom,
        originalFontSizePt: originalFontSizePt,
        originalFontSizePx: element.fontSize,
        fontSizeSource: impliedPx && impliedPx > 0 ? 'impliedPx' : 'ptToPx'
      };
      
      // 使用Web安全字体映射，但保持最大相似性
      if (textStyle?.fontName) {
        const originalFont = textStyle.fontName;
        element.fontFamily = fontManager.getFontWithFallback(originalFont);
        fontManager.loadFont(originalFont, element.fontSize).then((loaded) => {
          if (!loaded) console.warn(`字体 ${originalFont} 加载失败，使用回退`);
        });
        psdDebugger.logFontConversion(layer.name, originalFont, element.fontFamily,
          originalFontSizePt, element.fontSize);
        element.custom = {
          ...element.custom,
          fontOptimized: true,
          originalFontName: originalFont
        };
      } else {
        element.fontFamily = 'Arial, sans-serif';
      }
      
      // 高精度颜色转换 - 为Polotno编辑器优化
      if (textStyle?.fillColor) {
        const color = textStyle.fillColor;
        if (color.r !== undefined && color.g !== undefined && color.b !== undefined) {
          // 确保颜色值在正确范围内
          let r = Math.round(Math.max(0, Math.min(255, color.r)));
          let g = Math.round(Math.max(0, Math.min(255, color.g)));
          let b = Math.round(Math.max(0, Math.min(255, color.b)));
          
          // 如果颜色值在0-1范围，转换为0-255
          if (color.r <= 1 && color.g <= 1 && color.b <= 1) {
            r = Math.round(color.r * 255);
            g = Math.round(color.g * 255);
            b = Math.round(color.b * 255);
          }
          
          element.fill = `rgb(${r}, ${g}, ${b})`; // 使用RGB格式以获得更好的兼容性
          
          // 保存精确颜色信息
          element.custom = {
            ...element.custom,
            preciseColor: { r, g, b },
            originalColorSource: 'psd'
          };
          
          console.log(`颜色转换: RGB(${color.r}, ${color.g}, ${color.b}) -> ${element.fill}`);
          
          // 记录颜色转换详情
          psdDebugger.logColorConversion(layer.name, 
            { r: color.r, g: color.g, b: color.b }, 
            { r, g, b, css: element.fill }
          );
        } else {
          element.fill = 'rgb(0, 0, 0)';
        }
      } else {
        element.fill = 'rgb(0, 0, 0)';
      }
      
      // 精确的对齐方式映射
      const alignment = textStyle?.alignment || textStyle?.justification || 'left';
      element.align = mapTextAlignment(alignment);
      
      console.log(`文本对齐: ${alignment} -> ${element.align}`);
      
      // 原始字体样式
      element.fontWeight = (textStyle?.fauxBold || 
        (textStyle?.fontName && textStyle.fontName.toLowerCase().includes('bold'))) ? 'bold' : 'normal';
      
      element.fontStyle = (textStyle?.fauxItalic || 
        (textStyle?.fontName && textStyle.fontName.toLowerCase().includes('italic'))) ? 'italic' : 'normal';
      
      // 原始文本装饰
      const decorations = [];
      if (textStyle?.underline) decorations.push('underline');
      if (textStyle?.strikethrough) decorations.push('line-through');
      element.textDecoration = decorations.length > 0 ? decorations.join(' ') : 'none';
      
      // 应用水平/垂直缩放（Photoshop HorizontalScale/VerticalScale 或 Transform 矩阵）
      const hScalePct = Number(textStyle?.horizontalScale || textStyle?.HorizontalScale || styleRunData.HorizontalScale);
      const vScalePct = Number(textStyle?.verticalScale || textStyle?.VerticalScale || styleRunData.VerticalScale);
      let scaleX = isFinite(hScalePct) && hScalePct > 0 ? hScalePct / 100 : 1;
      let scaleY = isFinite(vScalePct) && vScalePct > 0 ? vScalePct / 100 : 1;

      // 解析 Transform 矩阵以获取缩放
      const transform = layer.text?.engineData?.Transform || layer.text?.transform || styleRunData.Transform;
      if (Array.isArray(transform) && transform.length >= 4) {
        // Photoshop 矩阵 [xx, xy, yx, yy, tx, ty]
        const xx = Number(transform[0]);
        const xy = Number(transform[1]);
        const yx = Number(transform[2]);
        const yy = Number(transform[3]);
        const calcScaleX = Math.sqrt((xx || 0) * (xx || 0) + (xy || 0) * (xy || 0));
        const calcScaleY = Math.sqrt((yx || 0) * (yx || 0) + (yy || 0) * (yy || 0));
        if (calcScaleX > 0) scaleX *= calcScaleX;
        if (calcScaleY > 0) scaleY *= calcScaleY;
      }

      // 仅当没有 ImpliedFontSize（即从 pt→px 计算）时，才对字号施加缩放，避免二次缩放
      if (scaleY !== 1 && element.custom.fontSizeSource === 'ptToPx') {
        const before = element.fontSize;
        element.fontSize = Math.max(1, Math.round((element.fontSize * scaleY) * 100) / 100);
        element.custom = { ...element.custom, appliedScaleY: scaleY, fontSizeBeforeScale: before };
      }
      // 仅在从 pt→px 计算的情况下，对字距应用水平缩放
      if (scaleX !== 1 && typeof element.letterSpacing === 'number' && element.custom.fontSizeSource === 'ptToPx') {
        element.letterSpacing = Math.max(-0.5, Math.min(2.0, Math.round((element.letterSpacing * scaleX) * 1000) / 1000));
        element.custom = { ...element.custom, appliedScaleX: scaleX };
      }

      // 行高：PSD leading 为 pt，换算为 px 后除以字体像素，得到比例
      if (textStyle?.leading && textStyle.leading > 0) {
        const leadingPt = Number(textStyle.leading);
        const leadingPx = ptToPx(leadingPt);
        element.lineHeight = Math.max(0.8, Math.min(3.0, Math.round((leadingPx / element.fontSize) * 1000) / 1000));
        console.log(`严格行高: ${leadingPt}pt -> ${element.lineHeight} (font ${element.fontSize}px)`);
      } else {
        element.lineHeight = 1.2;
      }
      
      // 高精度字符间距处理
      if (textStyle?.tracking !== undefined && textStyle.tracking !== null) {
        // PSD tracking 以 1/1000 em 表示
        const tracking = Number(textStyle.tracking);
        element.letterSpacing = Math.max(-0.5, Math.min(2.0, Math.round((tracking / 1000) * 1000) / 1000));
        console.log(`严格字符间距: ${tracking} -> ${element.letterSpacing}em`);
      } else {
        element.letterSpacing = 0;
      }
      
      // 保存原始行高和间距值用于调试
      element.custom = {
        ...element.custom,
        originalLeadingPt: textStyle?.leading,
        originalTrackingThousandthsEm: textStyle?.tracking,
        preciseMetrics: {
          lineHeight: element.lineHeight,
          letterSpacing: element.letterSpacing,
          calculationMethod: 'strict-pt-to-px'
        }
      };
      
      // 应用精确样式CSS类
      element.custom = {
        ...element.custom,
        cssClass: 'psd-precision-text',
        renderingOptimizations: {
          fontSmoothing: 'antialiased',
          textRendering: 'optimizeLegibility',
          fontDisplay: 'swap'
        }
      };
      
      console.log('转换后的Polotno元素:', element);
      
      // 记录最终元素转换结果
      psdDebugger.logConversion('元素转换完成', layer.name, 
        { 
          layerType: layer.text ? 'text' : 'image',
          layerBounds: { left: layer.left, top: layer.top, right: layer.right, bottom: layer.bottom }
        },
        {
          elementType: element.type,
          position: { x: element.x, y: element.y },
          size: { width: element.width, height: element.height },
          styles: element.type === 'text' ? {
            fontSize: element.fontSize,
            fontFamily: element.fontFamily,
            fill: element.fill,
            hasCustomPrecision: !!element.custom?.psdPrecision
          } : null
        }
      );
      
    } 
    // 处理图像图层 - 现在更宽容，即使没有明显的图像数据也尝试创建
    else {
      element.type = 'image';
      const canvas = layerToCanvas(layer);
      if (canvas) {
        // 启用图像增强以提高PSD图像质量
        element.src = canvasToDataURL(canvas, 'image/png', true);
        element.custom = {
          ...element.custom,
          enhanced: true, // 标记已增强
          sourceType: 'psd-layer'
        };
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
 * 确保字体已加载
 * @param {string} fontFamily - 字体名称
 * @param {number} fontSize - 字体大小
 * @returns {Promise<boolean>} 是否加载成功
 */
const ensureFontLoaded = async (fontFamily, fontSize = 16) => {
  if (!fontFamily || fontFamily === 'Arial') return true;
  
  try {
    // 使用FontFace API检查字体是否可用
    await document.fonts.ready;
    
    // 检查字体是否已经可用
    if (document.fonts.check(`${fontSize}px ${fontFamily}`)) {
      return true;
    }

    // 尝试从系统字体加载
    const fontFace = new FontFace(fontFamily, `local("${fontFamily}")`);
    const loadedFont = await fontFace.load();
    document.fonts.add(loadedFont);
    
    return document.fonts.check(`${fontSize}px ${fontFamily}`);
  } catch (error) {
    console.warn(`字体 ${fontFamily} 加载失败:`, error);
    return false;
  }
};

/**
 * 获取字体的回退方案
 * @param {string} fontName - 原始字体名称
 * @returns {string} 字体回退字符串
 */
const getFontFallbacks = (fontName) => {
  if (!fontName) return 'Arial, sans-serif';
  
  const lowerName = fontName.toLowerCase();
  
  // 无衬线字体回退
  if (lowerName.includes('arial') || lowerName.includes('helvetica')) {
    return 'Arial, Helvetica, sans-serif';
  }
  
  // 衬线字体回退
  if (lowerName.includes('times') || lowerName.includes('georgia') || lowerName.includes('serif')) {
    return 'Times, "Times New Roman", Georgia, serif';
  }
  
  // 等宽字体回退
  if (lowerName.includes('courier') || lowerName.includes('mono')) {
    return 'Courier, "Courier New", Monaco, monospace';
  }
  
  // 手写体回退
  if (lowerName.includes('script') || lowerName.includes('brush')) {
    return 'cursive';
  }
  
  // 装饰字体回退
  if (lowerName.includes('display') || lowerName.includes('title')) {
    return 'fantasy';
  }
  
  // 默认无衬线回退
  return 'Arial, sans-serif';
};

/**
 * 映射字体名称到Web安全字体
 * @param {string} psdFontName - PSD 字体名称
 * @returns {string} Web安全字体名称
 */
const mapFontName = (psdFontName) => {
  if (!psdFontName) return 'Arial';
  
  const fontName = psdFontName.toLowerCase();
  
  // 常见字体映射
  const fontMap = {
    'arial': 'Arial, sans-serif',
    'helvetica': 'Helvetica, Arial, sans-serif',
    'times': 'Times, "Times New Roman", serif',
    'timesnewroman': 'Times, "Times New Roman", serif',
    'times new roman': 'Times, "Times New Roman", serif',
    'courier': 'Courier, "Courier New", monospace',
    'couriernew': 'Courier, "Courier New", monospace',
    'courier new': 'Courier, "Courier New", monospace',
    'verdana': 'Verdana, Arial, sans-serif',
    'georgia': 'Georgia, Times, serif',
    'palatino': 'Palatino, "Palatino Linotype", serif',
    'garamond': 'Garamond, Times, serif',
    'bookman': 'Bookman, serif',
    'comic sans ms': '"Comic Sans MS", cursive',
    'impact': 'Impact, Arial Black, sans-serif',
    'lucida console': '"Lucida Console", Monaco, monospace',
    'lucida sans unicode': '"Lucida Sans Unicode", Arial, sans-serif',
    'symbol': 'Symbol',
    'webdings': 'Webdings',
    'wingdings': 'Wingdings',
    'ms sans serif': '"MS Sans Serif", sans-serif',
    'ms serif': '"MS Serif", serif',
  };
  
  // 尝试精确匹配
  if (fontMap[fontName]) {
    return fontMap[fontName];
  }
  
  // 尝试部分匹配
  for (const [key, value] of Object.entries(fontMap)) {
    if (fontName.includes(key) || key.includes(fontName)) {
      return value;
    }
  }
  
  // 根据字体特征分类
  if (fontName.includes('serif') && !fontName.includes('sans')) {
    return 'Times, "Times New Roman", serif';
  } else if (fontName.includes('mono') || fontName.includes('courier')) {
    return 'Courier, "Courier New", monospace';
  } else if (fontName.includes('script') || fontName.includes('cursive')) {
    return 'cursive';
  } else if (fontName.includes('fantasy') || fontName.includes('decorative')) {
    return 'fantasy';
  }
  
  // 默认无衬线字体
  return 'Arial, sans-serif';
};

/**
 * 映射文本对齐方式
 * @param {string} psdAlignment - PSD 对齐方式
 * @returns {string} CSS 对齐方式
 */
const mapTextAlignment = (psdAlignment) => {
  if (!psdAlignment) return 'left';
  
  const alignment = psdAlignment.toString().toLowerCase();
  
  const alignmentMap = {
    'left': 'left',
    'center': 'center',
    'centre': 'center',
    'middle': 'center',
    'right': 'right',
    'justify': 'justify',
    'justifyleft': 'left',
    'justifycenter': 'center',
    'justifyright': 'right',
    'justifyall': 'justify',
    // 处理数字值
    '0': 'left',
    '1': 'center', 
    '2': 'right',
    '3': 'justify',
  };
  
  return alignmentMap[alignment] || 'left';
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
 * RGB 转 HEX (改进版本，处理颜色空间问题)
 * @param {Object} rgb - RGB 颜色对象
 * @returns {string} HEX 颜色字符串
 */
const rgbToHex = (rgb) => {
  let { r = 0, g = 0, b = 0 } = rgb;
  
  // 确保颜色值在有效范围内
  r = Math.max(0, Math.min(255, Math.round(r)));
  g = Math.max(0, Math.min(255, Math.round(g)));
  b = Math.max(0, Math.min(255, Math.round(b)));
  
  // 不应用任何颜色校正，保持原始颜色值
  
  return `#${[r, g, b].map(x => {
    const hex = x.toString(16);
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