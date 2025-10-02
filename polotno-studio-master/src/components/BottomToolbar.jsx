import React, { useState, useEffect } from 'react';
import { observer } from 'mobx-react-lite';

const BottomToolbar = observer(({ store }) => {
  const [zoom, setZoom] = useState(100);

  useEffect(() => {
    // 监听store的缩放变化
    if (store.scale) {
      setZoom(Math.round(store.scale * 100));
    }
  }, [store.scale]);

  const handleZoomIn = () => {
    const currentScale = store.scale || 1;
    const newScale = Math.min(currentScale + 0.25, 5);
    store.setScale(newScale);
  };

  const handleZoomOut = () => {
    const currentScale = store.scale || 1;
    const newScale = Math.max(currentScale - 0.25, 0.1);
    store.setScale(newScale);
  };

  const handleZoomReset = () => {
    store.setScale(1);
  };

  return (
    <div className="ai-studio-footer">
      <div className="ai-studio-footer-left">
        <button className="ai-studio-footer-button">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ marginRight: '4px' }}>
            <rect x="3" y="3" width="8" height="8" stroke="currentColor" strokeWidth="2"/>
            <rect x="3" y="13" width="8" height="8" stroke="currentColor" strokeWidth="2"/>
            <rect x="13" y="3" width="8" height="8" stroke="currentColor" strokeWidth="2"/>
            <rect x="13" y="13" width="8" height="8" stroke="currentColor" strokeWidth="2"/>
          </svg>
          图层
        </button>
        
        <button className="ai-studio-footer-button">
          <span style={{ 
            display: 'inline-block', 
            width: '16px', 
            height: '16px', 
            borderRadius: '50%', 
            background: 'linear-gradient(45deg, #FF6B6B, #4ECDC4)', 
            marginRight: '6px',
            verticalAlign: 'middle'
          }}></span>
          200
        </button>
        
        <button className="ai-studio-footer-button">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </button>
      </div>

      <div className="ai-studio-footer-right">
        <button 
          className="ai-studio-footer-button" 
          onClick={handleZoomReset}
          title="Reset zoom to 100%"
          style={{ cursor: 'pointer' }}
        >
          {zoom}%
        </button>
        
        <button className="ai-studio-footer-button" onClick={handleZoomOut}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </button>
        
        <button className="ai-studio-footer-button" onClick={handleZoomIn}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </button>
      </div>
    </div>
  );
});

export default BottomToolbar;