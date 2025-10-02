import React, { useState } from 'react';
import { observer } from 'mobx-react-lite';

const AIAssistantPanel = observer(({ store }) => {
  const [inputValue, setInputValue] = useState('');
  
  // 模板数据
  const templates = [
    {
      id: 1,
      title: 'Wine List',
      description: 'Mimic this effect to create stunning wine menu designs',
      image: 'https://via.placeholder.com/400x180/f3f4f6/6b7280?text=Wine+List+Template'
    },
    {
      id: 2,
      title: 'Coffee Shop Branding',
      description: 'You are a brand designer creating materials for local coffee shops',
      image: 'https://via.placeholder.com/400x180/f3f4f6/6b7280?text=Coffee+Shop+Template'
    },
    {
      id: 3,
      title: 'Story Board',
      description: 'I NEED A STORY that captures the essence of your narrative',
      image: 'https://via.placeholder.com/400x180/f3f4f6/6b7280?text=Story+Board+Template'
    }
  ];

  const handleTemplateClick = (template) => {
    console.log('Template clicked:', template);
    // TODO: 实现模板应用逻辑
  };

  return (
    <div className="ai-studio-ai-panel">
      {/* AI Avatar */}
      <div className="ai-panel-avatar">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
          <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M2 17L12 22L22 17" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M2 12L12 17L22 12" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>

      {/* 欢迎文本 */}
      <div className="ai-panel-greeting">Hi there,</div>
      <div className="ai-panel-subtitle">What are we creating today?</div>

      {/* 输入框 */}
      <textarea
        className="ai-panel-input"
        placeholder="Start with an idea or task..."
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
      />

      {/* 快捷操作按钮 */}
      <div className="ai-panel-actions">
        <button className="ai-panel-action-button" title="Add Element">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </button>
        <button className="ai-panel-action-button" title="Web Search">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
            <path d="M2 12H22M12 2C14.5 2 16.7 4.5 16.7 8S14.5 14 12 14C9.5 14 7.3 11.5 7.3 8S9.5 2 12 2Z" stroke="currentColor" strokeWidth="2"/>
          </svg>
        </button>
        <button className="ai-panel-action-button" title="Color Palette">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M12 2C6.48 2 2 6.48 2 12S6.48 22 12 22C13.19 22 14 21.19 14 20C14 19.47 13.8 18.99 13.47 18.64C13.14 18.29 12.93 17.83 12.93 17.29C12.93 16.19 13.74 15.38 14.84 15.38H17C19.76 15.38 22 13.14 22 10.38C22 5.66 17.52 2 12 2Z" stroke="currentColor" strokeWidth="2"/>
            <circle cx="6.5" cy="11.5" r="1.5" fill="currentColor"/>
            <circle cx="9.5" cy="7.5" r="1.5" fill="currentColor"/>
            <circle cx="14.5" cy="7.5" r="1.5" fill="currentColor"/>
            <circle cx="17.5" cy="11.5" r="1.5" fill="currentColor"/>
          </svg>
        </button>
      </div>

      {/* 模板卡片列表 */}
      <div className="ai-panel-templates">
        {templates.map(template => (
          <div 
            key={template.id} 
            className="ai-panel-template"
            onClick={() => handleTemplateClick(template)}
          >
            <img 
              src={template.image} 
              alt={template.title}
              className="ai-panel-template-image"
            />
            <div className="ai-panel-template-content">
              <div className="ai-panel-template-title">{template.title}</div>
              <div className="ai-panel-template-description">{template.description}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});

export default AIAssistantPanel;