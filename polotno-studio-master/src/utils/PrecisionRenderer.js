/**
 * 精确渲染器 - 自动应用PSD精确样式到Polotno元素
 */

export class PrecisionRenderer {
  constructor(store) {
    this.store = store;
    this.observer = null;
    this.init();
  }

  init() {
    // 监听store变化，自动应用精确样式
    this.observeStoreChanges();
    
    // 监听DOM变化，确保样式正确应用
    this.observeDOMChanges();
  }

  observeStoreChanges() {
    // 监听页面和元素变化
    if (this.store.on) {
      this.store.on('change', () => {
        setTimeout(() => this.applyPrecisionStyles(), 100);
      });
    }

    // 使用更可靠的轮询方式检查元素变化
    this.pollForChanges();
  }

  observeDOMChanges() {
    // 使用MutationObserver监听DOM变化
    this.observer = new MutationObserver((mutations) => {
      let shouldUpdate = false;
      
      mutations.forEach((mutation) => {
        // 检查是否有新的Polotno元素被添加
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            if (node.classList?.contains('konvajs-content') || 
                node.querySelector?.('.konvajs-content')) {
              shouldUpdate = true;
            }
          }
        });
      });

      if (shouldUpdate) {
        setTimeout(() => this.applyPrecisionStyles(), 200);
      }
    });

    // 开始观察整个文档
    this.observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  applyPrecisionStyles() {
    if (!this.store.activePage) return;

    const elements = this.store.activePage.children;
    
    elements.forEach((element) => {
      this.applyElementPrecisionStyle(element);
    });
  }

  applyElementPrecisionStyle(element) {
    if (!element.custom?.psdPrecision) return;

    try {
      // 查找对应的DOM元素
      const domElement = this.findElementInDOM(element.id);
      
      if (domElement) {
        this.applyTextPrecisionStyles(domElement, element);
        this.applyColorPrecisionStyles(domElement, element);
        this.applyFontPrecisionStyles(domElement, element);
      }
    } catch (error) {
      console.warn('应用精确样式失败:', error, element.id);
    }
  }

  findElementInDOM(elementId) {
    // 查找Polotno工作区容器
    const workspaceContainer = document.querySelector('.polotno-workspace, .workspace-container, [data-polotno="workspace"]');
    if (!workspaceContainer) {
      return document.querySelector('.konvajs-content');
    }
    
    // 在Konva画布中查找对应的元素
    const canvases = workspaceContainer.querySelectorAll('canvas');
    
    for (const canvas of canvases) {
      if (canvas.getContext) {
        return canvas; // 返回画布元素
      }
    }
    
    return workspaceContainer;
  }

  applyTextPrecisionStyles(domElement, element) {
    if (element.type !== 'text') return;

    // 应用精确字体渲染CSS类
    const parentContainer = domElement.closest('.konvajs-content');
    if (parentContainer && !parentContainer.classList.contains('psd-precision-text')) {
      parentContainer.classList.add('psd-precision-text');
    }

    // 创建精确样式覆盖
    this.createPrecisionStyleOverride(element);
  }

  applyColorPrecisionStyles(domElement, element) {
    if (!element.custom?.preciseColor) return;

    const { r, g, b } = element.custom.preciseColor;
    
    // 创建精确颜色样式 - 使用更通用的选择器
    const styleId = `precision-color-${element.id}`;
    let styleElement = document.getElementById(styleId);
    
    if (!styleElement) {
      styleElement = document.createElement('style');
      styleElement.id = styleId;
      document.head.appendChild(styleElement);
    }

    // 应用更广泛的CSS选择器确保样式生效
    styleElement.textContent = `
      /* 精确颜色应用到所有可能的文本元素 */
      .konvajs-content,
      .konvajs-content *,
      canvas,
      .polotno-workspace text,
      .polotno-workspace tspan {
        color: rgb(${r}, ${g}, ${b}) !important;
        fill: rgb(${r}, ${g}, ${b}) !important;
      }
      
      /* 确保Polotno文本元素应用精确颜色 */
      .polotno-element-${element.id},
      [data-element-id="${element.id}"],
      [id="${element.id}"] {
        color: rgb(${r}, ${g}, ${b}) !important;
        fill: rgb(${r}, ${g}, ${b}) !important;
      }
    `;
  }

  applyFontPrecisionStyles(domElement, element) {
    if (!element.custom?.fontOptimized) return;

    const styleId = `precision-font-${element.id}`;
    let styleElement = document.getElementById(styleId);
    
    if (!styleElement) {
      styleElement = document.createElement('style');
      styleElement.id = styleId;
      document.head.appendChild(styleElement);
    }

    const fontFamily = element.fontFamily || 'Arial, sans-serif';
    const fontSize = element.fontSize || 16;

    styleElement.textContent = `
      .konvajs-content[data-element-id="${element.id}"] {
        font-family: ${fontFamily} !important;
        font-size: ${fontSize}px !important;
        -webkit-font-smoothing: antialiased !important;
        -moz-osx-font-smoothing: grayscale !important;
        text-rendering: optimizeLegibility !important;
        font-display: swap !important;
      }
    `;
  }

  createPrecisionStyleOverride(element) {
    const styleId = `precision-override-${element.id}`;
    let styleElement = document.getElementById(styleId);
    
    if (!styleElement) {
      styleElement = document.createElement('style');
      styleElement.id = styleId;
      document.head.appendChild(styleElement);
    }

    // 基于元素的原始PSD数据创建精确样式
    const originalFontSize = element.custom?.originalFontSize || element.fontSize;
    const originalFontName = element.custom?.originalFontName || element.fontFamily;
    const preciseColor = element.custom?.preciseColor;

    let css = `
      /* 全局精确渲染设置 */
      .konvajs-content,
      .konvajs-content canvas,
      .polotno-workspace {
        image-rendering: -webkit-optimize-contrast !important;
        image-rendering: crisp-edges !important;
        text-rendering: optimizeLegibility !important;
        -webkit-font-smoothing: antialiased !important;
        -moz-osx-font-smoothing: grayscale !important;
        font-feature-settings: "kern", "liga", "clig", "calt" !important;
      }
      
      /* PSD精确文本渲染类 */
      .psd-precision-text,
      .psd-precision-text *,
      .polotno-workspace text,
      .polotno-workspace tspan {
        text-rendering: optimizeLegibility !important;
        -webkit-font-smoothing: antialiased !important;
        -moz-osx-font-smoothing: grayscale !important;
        font-feature-settings: "kern", "liga", "clig", "calt" !important;
      }
    `;

    if (element.type === 'text') {
      // 创建多个选择器确保样式能够应用
      const selectors = [
        `.element-${element.id}`,
        `.polotno-element-${element.id}`,
        `[data-element-id="${element.id}"]`,
        `[id="${element.id}"]`,
        `.konvajs-content text[data-id="${element.id}"]`,
        `.polotno-workspace text[data-id="${element.id}"]`
      ];
      
      css += `
        /* 特定元素的精确样式 - 多选择器确保生效 */
        ${selectors.join(', ')} {
          font-size: ${originalFontSize}px !important;
          font-family: "${originalFontName}", Arial, sans-serif !important;
          letter-spacing: ${element.letterSpacing || 0}em !important;
          line-height: ${element.lineHeight || 1.2} !important;
          font-weight: ${element.fontWeight || 'normal'} !important;
          font-style: ${element.fontStyle || 'normal'} !important;
          text-decoration: ${element.textDecoration || 'none'} !important;
        }
      `;

      if (preciseColor) {
        css += `
          ${selectors.join(', ')} {
            color: rgb(${preciseColor.r}, ${preciseColor.g}, ${preciseColor.b}) !important;
            fill: rgb(${preciseColor.r}, ${preciseColor.g}, ${preciseColor.b}) !important;
          }
        `;
      }
    }

    styleElement.textContent = css;
  }

  // 轮询检查元素变化
  pollForChanges() {
    this.pollingInterval = setInterval(() => {
      if (this.store?.activePage?.children) {
        this.applyPrecisionStyles();
      }
    }, 2000); // 每2秒检查一次
  }

  // 强制重新渲染所有精确元素
  forceRerenderPrecisionElements() {
    const elements = this.store.activePage?.children || [];
    
    elements.forEach((element) => {
      if (element.custom?.psdPrecision) {
        // 触发重新渲染
        if (element.set) {
          element.set({ 
            custom: { 
              ...element.custom, 
              lastUpdate: Date.now() 
            } 
          });
        }
        
        // 强制重新创建样式
        this.applyElementPrecisionStyle(element);
      }
    });
  }

  // 清理资源
  destroy() {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }

    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }

    // 移除所有精确样式
    const precisionStyles = document.querySelectorAll('style[id^="precision-"]');
    precisionStyles.forEach(style => style.remove());
  }
}

// 全局精确渲染器实例
let globalPrecisionRenderer = null;

export const initializePrecisionRenderer = (store) => {
  if (globalPrecisionRenderer) {
    globalPrecisionRenderer.destroy();
  }
  
  globalPrecisionRenderer = new PrecisionRenderer(store);
  
  // 暴露到全局，方便调试
  window.precisionRenderer = globalPrecisionRenderer;
  
  return globalPrecisionRenderer;
};

export const getPrecisionRenderer = () => globalPrecisionRenderer;