import React, { useState } from 'react';
import { observer } from 'mobx-react-lite';
import { Button } from '@blueprintjs/core';
import { EnhancedDownloadModal } from './EnhancedDownloadModal';
import '../styles/enhanced-download-modal.css';

export const EnhancedDownloadButton = observer(({ store }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <Button
        intent="primary"
        rightIcon="download"
        onClick={() => setIsModalOpen(true)}
        className="enhanced-download-trigger"
        large
      >
        导出
      </Button>
      
      <EnhancedDownloadModal
        store={store}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
});

// 增强下载按钮的样式
const enhancedButtonStyles = `
.enhanced-download-trigger {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
  border: none !important;
  border-radius: 12px !important;
  font-weight: 600 !important;
  color: white !important;
  height: 40px !important;
  padding: 0 20px !important;
  transition: all 0.2s ease !important;
  position: relative !important;
  overflow: hidden !important;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3) !important;
}

.enhanced-download-trigger::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, 
    transparent, 
    rgba(255, 255, 255, 0.2), 
    transparent);
  transition: left 0.4s;
}

.enhanced-download-trigger:hover {
  transform: translateY(-1px) !important;
  box-shadow: 0 8px 20px rgba(102, 126, 234, 0.4) !important;
  background: linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%) !important;
}

.enhanced-download-trigger:hover::before {
  left: 100%;
}

.enhanced-download-trigger:active {
  transform: translateY(0) !important;
}

.enhanced-download-trigger .bp5-icon {
  color: white !important;
}
`;

// 注入样式
if (typeof document !== 'undefined') {
  const styleElement = document.createElement('style');
  styleElement.textContent = enhancedButtonStyles;
  document.head.appendChild(styleElement);
}