/**
 * PSD调试器 - 提供详细的转换信息和调试功能
 */

export class PSDDebugger {
  constructor() {
    this.debugMode = localStorage.getItem('psd-debug-mode') === 'true' || false;
    this.conversionLog = [];
    this.init();
  }

  init() {
    // 创建调试面板
    this.createDebugPanel();
    
    // 监听调试模式切换
    window.addEventListener('keydown', (e) => {
      // Ctrl+Shift+D 切换调试模式
      if (e.ctrlKey && e.shiftKey && e.key === 'D') {
        e.preventDefault();
        this.toggleDebugMode();
      }
    });

    // 暴露调试方法到全局
    window.psdDebugger = this;
  }

  toggleDebugMode() {
    this.debugMode = !this.debugMode;
    localStorage.setItem('psd-debug-mode', this.debugMode.toString());
    
    this.updateDebugPanel();
    this.log(`调试模式 ${this.debugMode ? '开启' : '关闭'}`);
    
    if (this.debugMode) {
      console.log('%c🔍 PSD调试模式已开启', 'background: #4CAF50; color: white; padding: 5px;');
      console.log('可用的调试命令:');
      console.log('- window.psdDebugger.showConversionLog() - 显示转换日志');
      console.log('- window.psdDebugger.analyzeCurrentElements() - 分析当前元素');
      console.log('- window.psdDebugger.exportDebugData() - 导出调试数据');
    }
  }

  createDebugPanel() {
    if (document.getElementById('psd-debug-panel')) return;

    const panel = document.createElement('div');
    panel.id = 'psd-debug-panel';
    panel.style.cssText = `
      position: fixed;
      top: 10px;
      left: 10px;
      width: 350px;
      max-height: 400px;
      background: rgba(0, 0, 0, 0.9);
      color: white;
      padding: 15px;
      border-radius: 8px;
      font-family: 'Courier New', monospace;
      font-size: 12px;
      z-index: 10000;
      overflow-y: auto;
      display: none;
      border: 2px solid #4CAF50;
    `;

    panel.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
        <h3 style="margin: 0; color: #4CAF50;">🔍 PSD 调试器</h3>
        <button id="close-debug-panel" style="background: #f44336; color: white; border: none; padding: 5px 10px; border-radius: 3px; cursor: pointer;">×</button>
      </div>
      <div id="debug-content">
        <p>按 Ctrl+Shift+D 切换调试模式</p>
        <p>调试模式: <span id="debug-status">关闭</span></p>
      </div>
      <div id="debug-logs" style="max-height: 200px; overflow-y: auto; background: rgba(255,255,255,0.1); padding: 10px; margin-top: 10px; border-radius: 4px;"></div>
      <div style="margin-top: 10px;">
        <button id="clear-logs" style="background: #2196F3; color: white; border: none; padding: 5px 10px; border-radius: 3px; cursor: pointer; margin-right: 5px;">清空日志</button>
        <button id="export-debug" style="background: #FF9800; color: white; border: none; padding: 5px 10px; border-radius: 3px; cursor: pointer;">导出调试数据</button>
      </div>
    `;

    document.body.appendChild(panel);

    // 添加事件监听器
    document.getElementById('close-debug-panel').onclick = () => {
      panel.style.display = 'none';
    };

    document.getElementById('clear-logs').onclick = () => {
      this.clearLogs();
    };

    document.getElementById('export-debug').onclick = () => {
      this.exportDebugData();
    };

    this.debugPanel = panel;
    this.updateDebugPanel();
  }

  updateDebugPanel() {
    if (!this.debugPanel) return;

    const statusElement = document.getElementById('debug-status');
    if (statusElement) {
      statusElement.textContent = this.debugMode ? '开启' : '关闭';
      statusElement.style.color = this.debugMode ? '#4CAF50' : '#f44336';
    }

    this.debugPanel.style.display = this.debugMode ? 'block' : 'none';
  }

  log(message, data = null) {
    const timestamp = new Date().toLocaleTimeString();
    const logEntry = {
      timestamp,
      message,
      data: data ? JSON.parse(JSON.stringify(data)) : null
    };

    this.conversionLog.push(logEntry);

    if (this.debugMode) {
      console.log(`[PSD调试] ${message}`, data || '');
      this.updateDebugLogs();
    }

    // 限制日志数量
    if (this.conversionLog.length > 100) {
      this.conversionLog = this.conversionLog.slice(-50);
    }
  }

  updateDebugLogs() {
    const logsContainer = document.getElementById('debug-logs');
    if (!logsContainer) return;

    const recentLogs = this.conversionLog.slice(-20);
    logsContainer.innerHTML = recentLogs.map(entry => `
      <div style="margin-bottom: 5px; padding: 3px; border-left: 2px solid #4CAF50;">
        <span style="color: #888;">[${entry.timestamp}]</span> ${entry.message}
        ${entry.data ? `<pre style="margin: 2px 0; font-size: 10px; color: #ccc;">${JSON.stringify(entry.data, null, 2).slice(0, 200)}${JSON.stringify(entry.data, null, 2).length > 200 ? '...' : ''}</pre>` : ''}
      </div>
    `).join('');

    // 自动滚动到底部
    logsContainer.scrollTop = logsContainer.scrollHeight;
  }

  clearLogs() {
    this.conversionLog = [];
    this.updateDebugLogs();
    this.log('日志已清空');
  }

  // 详细记录PSD转换过程
  logConversion(stage, layerName, originalData, convertedData) {
    if (!this.debugMode) return;

    const conversionData = {
      stage,
      layerName,
      original: originalData,
      converted: convertedData,
      timestamp: Date.now()
    };

    this.log(`转换阶段: ${stage} - 图层: ${layerName}`, conversionData);
  }

  // 记录字体转换详情
  logFontConversion(layerName, originalFont, convertedFont, originalSize, convertedSize) {
    const fontData = {
      layerName,
      font: {
        original: originalFont,
        converted: convertedFont
      },
      size: {
        original: originalSize,
        converted: convertedSize
      }
    };

    this.log(`字体转换: ${layerName}`, fontData);
  }

  // 记录颜色转换详情
  logColorConversion(layerName, originalColor, convertedColor) {
    const colorData = {
      layerName,
      color: {
        original: originalColor,
        converted: convertedColor
      }
    };

    this.log(`颜色转换: ${layerName}`, colorData);
  }

  // 分析当前编辑器中的元素
  analyzeCurrentElements() {
    if (!window.store?.activePage) {
      this.log('错误: 无法访问当前页面');
      return;
    }

    const elements = window.store.activePage.children;
    const analysis = {
      totalElements: elements.length,
      textElements: 0,
      imageElements: 0,
      psdElements: 0,
      fontUsage: {},
      colorUsage: {},
      sizeDistribution: {}
    };

    elements.forEach(element => {
      if (element.type === 'text') {
        analysis.textElements++;
        
        // 字体使用统计
        const fontFamily = element.fontFamily || 'Unknown';
        analysis.fontUsage[fontFamily] = (analysis.fontUsage[fontFamily] || 0) + 1;
        
        // 颜色使用统计
        const color = element.fill || 'Unknown';
        analysis.colorUsage[color] = (analysis.colorUsage[color] || 0) + 1;
        
        // 尺寸分布
        const size = element.fontSize || 16;
        const sizeRange = `${Math.floor(size / 5) * 5}-${Math.floor(size / 5) * 5 + 4}px`;
        analysis.sizeDistribution[sizeRange] = (analysis.sizeDistribution[sizeRange] || 0) + 1;
      } else if (element.type === 'image') {
        analysis.imageElements++;
      }

      if (element.custom?.psdPrecision) {
        analysis.psdElements++;
      }
    });

    this.log('元素分析完成', analysis);
    console.table(analysis);
    
    return analysis;
  }

  // 显示转换日志
  showConversionLog() {
    console.group('🔍 PSD转换日志');
    this.conversionLog.forEach(entry => {
      console.log(`[${entry.timestamp}] ${entry.message}`, entry.data || '');
    });
    console.groupEnd();
    
    return this.conversionLog;
  }

  // 导出调试数据
  exportDebugData() {
    const debugData = {
      timestamp: new Date().toISOString(),
      debugMode: this.debugMode,
      conversionLog: this.conversionLog,
      currentAnalysis: this.analyzeCurrentElements(),
      browserInfo: {
        userAgent: navigator.userAgent,
        language: navigator.language,
        platform: navigator.platform
      }
    };

    const blob = new Blob([JSON.stringify(debugData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `psd-debug-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);

    this.log('调试数据已导出');
  }

  // 性能监控
  startPerformanceMonitor(operation) {
    const startTime = performance.now();
    
    return {
      end: () => {
        const endTime = performance.now();
        const duration = endTime - startTime;
        this.log(`性能监控: ${operation} 耗时 ${duration.toFixed(2)}ms`);
        return duration;
      }
    };
  }

  // 验证元素一致性
  validateElementConsistency(originalPSDLayer, polotnoElement) {
    const issues = [];

    if (originalPSDLayer.text && polotnoElement.type === 'text') {
      // 检查字体一致性
      const originalFont = originalPSDLayer.text.textStyleRange?.[0]?.textStyle?.fontName;
      const currentFont = polotnoElement.fontFamily;
      
      if (originalFont && !currentFont.includes(originalFont)) {
        issues.push(`字体不匹配: 原始(${originalFont}) vs 当前(${currentFont})`);
      }

      // 检查字号一致性
      const originalSize = originalPSDLayer.text.textStyleRange?.[0]?.textStyle?.fontSize;
      const currentSize = polotnoElement.fontSize;
      
      if (originalSize && Math.abs(originalSize - currentSize) > 2) {
        issues.push(`字号差异较大: 原始(${originalSize}) vs 当前(${currentSize})`);
      }

      // 检查颜色一致性
      const originalColor = originalPSDLayer.text.textStyleRange?.[0]?.textStyle?.fillColor;
      if (originalColor && polotnoElement.custom?.preciseColor) {
        const colorDiff = Math.abs(originalColor.r - polotnoElement.custom.preciseColor.r) +
                         Math.abs(originalColor.g - polotnoElement.custom.preciseColor.g) +
                         Math.abs(originalColor.b - polotnoElement.custom.preciseColor.b);
        
        if (colorDiff > 10) {
          issues.push(`颜色差异: RGB差值 ${colorDiff}`);
        }
      }
    }

    if (issues.length > 0) {
      this.log(`一致性问题 - ${polotnoElement.name}`, issues);
    }

    return issues;
  }
}

// 创建全局调试器实例
export const psdDebugger = new PSDDebugger();

// 将调试器集成到PSD utils中
export const withDebug = (func, name) => {
  return (...args) => {
    const monitor = psdDebugger.startPerformanceMonitor(name);
    try {
      const result = func(...args);
      monitor.end();
      return result;
    } catch (error) {
      monitor.end();
      psdDebugger.log(`错误: ${name}`, error.message);
      throw error;
    }
  };
};