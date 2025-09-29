/**
 * 智能字体管理器 - 确保字体加载和渲染的一致性
 */
export class FontManager {
  constructor() {
    this.loadedFonts = new Set();
    this.fontPromises = new Map();
    this.fallbackMap = new Map();
    this.setupFontFallbacks();
  }

  /**
   * 设置字体回退映射
   */
  setupFontFallbacks() {
    const fallbacks = {
      // Adobe字体
      'Adobe Garamond Pro': 'Garamond, Times, serif',
      'Adobe Caslon Pro': 'Caslon, Times, serif',
      'Minion Pro': 'Minion, Times, serif',
      'Myriad Pro': 'Myriad, Arial, sans-serif',
      
      // 常见设计字体
      'Helvetica': 'Helvetica, Arial, sans-serif',
      'Helvetica Neue': 'Helvetica Neue, Helvetica, Arial, sans-serif',
      'Futura': 'Futura, Century Gothic, sans-serif',
      'Avenir': 'Avenir, Century Gothic, sans-serif',
      'Proxima Nova': 'Proxima Nova, Arial, sans-serif',
      
      // 中文字体
      '苹方': 'PingFang SC, Hiragino Sans GB, Microsoft YaHei, sans-serif',
      '微软雅黑': 'Microsoft YaHei, PingFang SC, Hiragino Sans GB, sans-serif',
      '思源黑体': 'Source Han Sans SC, Noto Sans CJK SC, sans-serif',
      
      // Windows系统字体
      'Segoe UI': 'Segoe UI, Tahoma, Geneva, sans-serif',
      'Calibri': 'Calibri, Candara, Segoe UI, sans-serif',
      'Consolas': 'Consolas, Monaco, Courier New, monospace',
      
      // macOS系统字体
      'San Francisco': '-apple-system, BlinkMacSystemFont, sans-serif',
      'SF Pro Display': '-apple-system, BlinkMacSystemFont, sans-serif',
      'Menlo': 'Menlo, Monaco, Consolas, monospace',
    };

    Object.entries(fallbacks).forEach(([font, fallback]) => {
      this.fallbackMap.set(font, fallback);
    });
  }

  /**
   * 加载字体并验证可用性
   */
  async loadFont(fontFamily, fontSize = 16) {
    const cacheKey = `${fontFamily}-${fontSize}`;
    
    if (this.loadedFonts.has(cacheKey)) {
      return true;
    }

    if (this.fontPromises.has(cacheKey)) {
      return this.fontPromises.get(cacheKey);
    }

    const promise = this._loadFontImpl(fontFamily, fontSize);
    this.fontPromises.set(cacheKey, promise);
    
    try {
      const result = await promise;
      if (result) {
        this.loadedFonts.add(cacheKey);
      }
      return result;
    } catch (error) {
      console.warn(`字体加载失败: ${fontFamily}`, error);
      return false;
    }
  }

  async _loadFontImpl(fontFamily, fontSize) {
    // 方法1: 使用FontFace API
    if (window.FontFace) {
      try {
        await document.fonts.ready;
        
        // 检查字体是否已经可用
        if (document.fonts.check(`${fontSize}px ${fontFamily}`)) {
          return true;
        }

        // 尝试从系统字体或Web字体加载
        const fontFace = new FontFace(fontFamily, `local("${fontFamily}")`);
        const loadedFont = await fontFace.load();
        document.fonts.add(loadedFont);
        
        return document.fonts.check(`${fontSize}px ${fontFamily}`);
      } catch (error) {
        console.warn(`FontFace API加载失败: ${fontFamily}`, error);
      }
    }

    // 方法2: 使用Canvas检测
    return this._detectFontWithCanvas(fontFamily, fontSize);
  }

  _detectFontWithCanvas(fontFamily, fontSize) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    // 测试文本
    const testText = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    
    // 使用默认字体绘制
    ctx.font = `${fontSize}px monospace`;
    const baselineWidth = ctx.measureText(testText).width;
    
    // 使用目标字体绘制
    ctx.font = `${fontSize}px "${fontFamily}", monospace`;
    const targetWidth = ctx.measureText(testText).width;
    
    // 如果宽度不同，说明字体已加载
    return Math.abs(baselineWidth - targetWidth) > 1;
  }

  /**
   * 获取最佳字体回退方案
   */
  getFontWithFallback(originalFont) {
    if (!originalFont) return 'Arial, sans-serif';

    const fallback = this.fallbackMap.get(originalFont);
    if (fallback) {
      return `"${originalFont}", ${fallback}`;
    }

    // 智能分析字体特征
    const lowerFont = originalFont.toLowerCase();
    
    if (lowerFont.includes('mono') || lowerFont.includes('code') || lowerFont.includes('consol')) {
      return `"${originalFont}", Consolas, Monaco, "Courier New", monospace`;
    }
    
    if (lowerFont.includes('serif') && !lowerFont.includes('sans')) {
      return `"${originalFont}", Times, "Times New Roman", Georgia, serif`;
    }
    
    if (lowerFont.includes('script') || lowerFont.includes('hand') || lowerFont.includes('brush')) {
      return `"${originalFont}", cursive`;
    }
    
    if (lowerFont.includes('display') || lowerFont.includes('title') || lowerFont.includes('decorative')) {
      return `"${originalFont}", fantasy`;
    }
    
    // 默认无衬线字体
    return `"${originalFont}", Arial, Helvetica, sans-serif`;
  }

  /**
   * 验证字体渲染效果
   */
  validateFontRendering(element, expectedMetrics) {
    if (!element || !expectedMetrics) return true;

    try {
      const computedStyle = window.getComputedStyle(element);
      const actualMetrics = {
        fontSize: parseFloat(computedStyle.fontSize),
        lineHeight: parseFloat(computedStyle.lineHeight),
        letterSpacing: parseFloat(computedStyle.letterSpacing) || 0,
      };

      // 允许1px的误差
      const tolerance = 1;
      
      const isValid = 
        Math.abs(actualMetrics.fontSize - expectedMetrics.fontSize) <= tolerance &&
        Math.abs(actualMetrics.lineHeight - expectedMetrics.lineHeight) <= tolerance &&
        Math.abs(actualMetrics.letterSpacing - expectedMetrics.letterSpacing) <= 0.1;

      if (!isValid) {
        console.warn('字体渲染验证失败:', {
          expected: expectedMetrics,
          actual: actualMetrics,
          element
        });
      }

      return isValid;
    } catch (error) {
      console.error('字体验证失败:', error);
      return false;
    }
  }

  /**
   * 预加载常用字体
   */
  async preloadCommonFonts() {
    const commonFonts = [
      'Arial', 'Helvetica', 'Times', 'Times New Roman', 'Courier', 'Courier New',
      'Georgia', 'Verdana', 'Tahoma', 'Trebuchet MS', 'Impact', 'Comic Sans MS',
      'Microsoft YaHei', 'PingFang SC', 'Hiragino Sans GB', 'Source Han Sans SC',
      'Noto Sans CJK SC', 'Segoe UI', 'SF Pro Display'
    ];

    const loadPromises = commonFonts.map(font => this.loadFont(font));
    const results = await Promise.allSettled(loadPromises);
    
    const successCount = results.filter(r => r.status === 'fulfilled' && r.value).length;
    console.log(`预加载字体完成: ${successCount}/${commonFonts.length}`);
    
    return successCount;
  }
}

// 全局字体管理器实例
export const fontManager = new FontManager();

// 初始化时预加载常用字体
if (typeof window !== 'undefined') {
  fontManager.preloadCommonFonts();
}