/**
 * Polotno文本渲染器增强 - 确保PSD精确样式正确应用到Konva Canvas
 */

export class PolotnoTextRenderer {
  constructor(store) {
    this.store = store;
    this.originalRenderMethods = new Map();
    this.init();
  }

  init() {
    // 拦截并增强Polotno的文本渲染
    this.enhancePolotnoTextRendering();
    
    // 监听元素变化
    this.observeElementChanges();
  }

  enhancePolotnoTextRendering() {
    // 等待Polotno完全加载
    setTimeout(() => {
      this.interceptKonvaTextRendering();
      this.enhanceCanvasTextMetrics();
    }, 2000);
  }

  interceptKonvaTextRendering() {
    // 查找并增强所有Konva Text对象
    const checkAndEnhance = () => {
      const canvases = document.querySelectorAll('canvas');
      
      canvases.forEach(canvas => {
        if (canvas._stage && canvas._stage.children) {
          this.enhanceStageTexts(canvas._stage);
        }
      });
    };

    // 立即检查
    checkAndEnhance();
    
    // 定期检查新的text元素
    setInterval(checkAndEnhance, 3000);
  }

  enhanceStageTexts(stage) {
    stage.children.forEach(layer => {
      if (layer.children) {
        layer.children.forEach(shape => {
          if (shape.className === 'Text' && shape.attrs) {
            this.enhanceKonvaText(shape);
          }
        });
      }
    });
  }

  enhanceKonvaText(textShape) {
    // 查找对应的Polotno元素
    const elementId = textShape.id();
    const polotnoElement = this.findPolotnoElement(elementId);
    
    if (!polotnoElement || !polotnoElement.custom?.psdPrecision) {
      return;
    }

    console.log('增强Konva文本渲染:', elementId, polotnoElement);

    // 应用精确的字体设置
    this.applyPreciseTextSettings(textShape, polotnoElement);
    
    // 重写渲染方法以确保精确性
    this.overrideTextRenderMethod(textShape, polotnoElement);
  }

  applyPreciseTextSettings(textShape, polotnoElement) {
    const custom = polotnoElement.custom;
    
    // 应用原始PSD字体设置
    if (custom.originalFontName) {
      textShape.fontFamily(custom.originalFontName);
    }
    
    if (custom.originalFontSizePx || custom.originalFontSize) {
      const size = custom.originalFontSizePx || custom.originalFontSize;
      textShape.fontSize(size);
    }
    
    if (custom.preciseColor) {
      const { r, g, b } = custom.preciseColor;
      textShape.fill(`rgb(${r}, ${g}, ${b})`);
    }

    // 应用精确的度量设置
    if (custom.preciseMetrics) {
      if (custom.preciseMetrics.lineHeight !== undefined) {
        textShape.lineHeight(custom.preciseMetrics.lineHeight);
      }
      if (custom.preciseMetrics.letterSpacing !== undefined) {
        textShape.letterSpacing(custom.preciseMetrics.letterSpacing);
      }
    }

    // 启用高质量渲染
    textShape.perfectDrawEnabled(true);
    textShape.listening(true);
    
    // 强制重绘
    textShape.getLayer()?.batchDraw();
  }

  overrideTextRenderMethod(textShape, polotnoElement) {
    const textShapeId = textShape.id();
    
    // 避免重复重写
    if (this.originalRenderMethods.has(textShapeId)) {
      return;
    }

    // 保存原始渲染方法
    const originalSceneFunc = textShape.sceneFunc;
    this.originalRenderMethods.set(textShapeId, originalSceneFunc);

    // 重写场景渲染函数
    textShape.sceneFunc = (context, shape) => {
      // 应用高精度渲染设置
      this.applyHighPrecisionContextSettings(context, polotnoElement);
      
      // 调用原始渲染
      originalSceneFunc.call(textShape, context, shape);
      
      // 渲染后的精度优化
      this.postRenderOptimization(context, polotnoElement);
    };

    console.log('已重写文本渲染方法:', textShapeId);
  }

  applyHighPrecisionContextSettings(context, polotnoElement) {
    // 设置高质量文本渲染
    context.textBaseline = 'alphabetic';
    context.textAlign = 'start';
    
    // 启用亚像素渲染
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = 'high';
    
    // 应用精确字体设置
    if (polotnoElement.custom?.originalFontName && (polotnoElement.custom?.originalFontSizePx || polotnoElement.custom?.originalFontSize)) {
      const fontWeight = polotnoElement.fontWeight || 'normal';
      const fontStyle = polotnoElement.fontStyle || 'normal';
      const fontSize = polotnoElement.custom.originalFontSizePx || polotnoElement.custom.originalFontSize;
      const fontFamily = polotnoElement.custom.originalFontName;
      
      context.font = `${fontStyle} ${fontWeight} ${fontSize}px "${fontFamily}", Arial, sans-serif`;
    }

    // 应用精确颜色
    if (polotnoElement.custom?.preciseColor) {
      const { r, g, b } = polotnoElement.custom.preciseColor;
      context.fillStyle = `rgb(${r}, ${g}, ${b})`;
    }
  }

  postRenderOptimization(context, polotnoElement) {
    // 渲染后的精度优化 - 如有需要可以在此添加额外的渲染调整
    
    // 确保文本边界清晰
    context.imageSmoothingEnabled = false;
  }

  enhanceCanvasTextMetrics() {
    // 增强Canvas文本度量的精确性
    const originalMeasureText = CanvasRenderingContext2D.prototype.measureText;
    
    CanvasRenderingContext2D.prototype.measureText = function(text) {
      // 应用精确字体设置
      const result = originalMeasureText.call(this, text);
      
      // 在这里可以添加自定义的度量增强
      return result;
    };
  }

  observeElementChanges() {
    // 监听Polotno store变化
    if (this.store && this.store.on) {
      this.store.on('change', () => {
        setTimeout(() => {
          this.updateAllTextElements();
        }, 500);
      });
    }

    // 定期检查并更新
    setInterval(() => {
      this.updateAllTextElements();
    }, 5000);
  }

  updateAllTextElements() {
    const elements = this.store?.activePage?.children || [];
    
    elements.forEach(element => {
      if (element.type === 'text' && element.custom?.psdPrecision) {
        this.updateTextElement(element);
      }
    });
  }

  updateTextElement(element) {
    // 查找对应的Konva文本对象并更新
    const canvases = document.querySelectorAll('canvas');
    
    canvases.forEach(canvas => {
      if (canvas._stage) {
        const textShape = canvas._stage.findOne(`#${element.id}`);
        if (textShape && textShape.className === 'Text') {
          this.applyPreciseTextSettings(textShape, element);
        }
      }
    });
  }

  findPolotnoElement(elementId) {
    const elements = this.store?.activePage?.children || [];
    return elements.find(el => el.id === elementId);
  }

  // 强制刷新所有文本渲染
  forceRefreshAllTexts() {
    const canvases = document.querySelectorAll('canvas');
    
    canvases.forEach(canvas => {
      if (canvas._stage) {
        canvas._stage.batchDraw();
      }
    });
    
    console.log('已强制刷新所有文本渲染');
  }

  // 清理资源
  destroy() {
    // 恢复原始渲染方法
    this.originalRenderMethods.forEach((originalMethod, textShapeId) => {
      const canvases = document.querySelectorAll('canvas');
      canvases.forEach(canvas => {
        if (canvas._stage) {
          const textShape = canvas._stage.findOne(`#${textShapeId}`);
          if (textShape) {
            textShape.sceneFunc = originalMethod;
          }
        }
      });
    });
    
    this.originalRenderMethods.clear();
  }
}

// 全局实例
let globalTextRenderer = null;

export const initializePolotnoTextRenderer = (store) => {
  if (globalTextRenderer) {
    globalTextRenderer.destroy();
  }
  
  globalTextRenderer = new PolotnoTextRenderer(store);
  
  // 暴露到全局用于调试
  window.polotnoTextRenderer = globalTextRenderer;
  
  return globalTextRenderer;
};

export const getPolotnoTextRenderer = () => globalTextRenderer;