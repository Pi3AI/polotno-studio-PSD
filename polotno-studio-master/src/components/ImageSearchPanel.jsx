import React from 'react';
import { PhotosPanel } from 'polotno/side-panel/photos-panel';

const ImageSearchPanel = ({ store, onClose }) => {

  return (
    <div className="image-search-panel">
      {/* 头部 */}
      <div className="image-panel-header">
        <h3>选择图片</h3>
        <button 
          className="panel-close-btn"
          onClick={onClose}
        >
          ✕
        </button>
      </div>

      {/* 使用 Polotno 内置的图片面板 */}
      <div className="images-container" style={{ height: 'calc(100% - 60px)', padding: '16px' }}>
        <PhotosPanel store={store} />
      </div>
    </div>
  );
};

export default ImageSearchPanel;