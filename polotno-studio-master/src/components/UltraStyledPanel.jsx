import React, { useState, useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import { SidePanel, DEFAULT_SECTIONS } from 'polotno/side-panel';
import '../styles/ultra-styled-panel.css';

// 优化的侧边面板组件
const UltraStyledPanel = observer(({ store, currentSection }) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const [activeSection, setActiveSection] = useState(currentSection);
  
  // 监听section变化，添加动画效果
  useEffect(() => {
    if (currentSection !== activeSection) {
      setIsAnimating(true);
      setTimeout(() => {
        setActiveSection(currentSection);
        setIsAnimating(false);
      }, 150);
    }
  }, [currentSection, activeSection]);
  
  // 自定义sections配置
  const customSections = DEFAULT_SECTIONS.map(section => ({
    ...section,
    // 可以在这里自定义每个section的配置
  }));
  
  return (
    <div className={`ultra-styled-panel ${isAnimating ? 'animating' : ''}`}>
      {/* 面板头部 */}
      <div className="panel-header">
        <h3 className="panel-title">
          {activeSection === 'text' && '📝 文字工具'}
          {activeSection === 'photos' && '🖼️ 图片素材'}
          {activeSection === 'elements' && '⭐ 形状元素'}
          {activeSection === 'templates' && '📋 设计模板'}
          {activeSection === 'background' && '🎨 背景样式'}
          {activeSection === 'upload' && '📤 上传文件'}
          {activeSection === 'resize' && '📐 调整尺寸'}
          {activeSection === 'ai-images' && '🤖 AI生成'}
          {!activeSection && '🎯 选择工具'}
        </h3>
        <div className="panel-header-line"></div>
      </div>
      
      {/* Polotno 侧边面板内容 */}
      <div className="panel-content-wrapper">
        <SidePanel 
          store={store} 
          sections={customSections}
          defaultSection={activeSection}
        />
      </div>
      
      {/* 面板底部装饰 */}
      <div className="panel-footer">
        <div className="panel-footer-gradient"></div>
      </div>
    </div>
  );
});

export default UltraStyledPanel;