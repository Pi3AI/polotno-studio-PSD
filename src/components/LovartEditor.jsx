import React, { useState } from 'react';
import './LovartEditor.css';

const LovartEditor = () => {
  const [selectedTool, setSelectedTool] = useState('select');
  const [currentTemplate, setCurrentTemplate] = useState(0);
  const [zoom, setZoom] = useState(20);

  const templates = [
    {
      id: 1,
      title: 'Welcome to Lovart',
      subtitle: 'We bring creativity and smart editing together',
      image: '/template1.jpg',
      email: 'mary@gmail.com'
    },
    {
      id: 2,
      title: 'Modern Portfolio',
      subtitle: 'Showcase your work professionally',
      image: '/template2.jpg'
    },
    {
      id: 3,
      title: 'Creative Design',
      subtitle: 'Express your artistic vision',
      image: '/template3.jpg'
    }
  ];

  const leftTools = [
    { id: 'template', icon: '◈', label: '模板' },
    { id: 'upload', icon: '△', label: '上传' },
    { id: 'text', icon: 'T', label: '文字' },
    { id: 'elements', icon: '○', label: '元素' },
    { id: 'brand', icon: '◇', label: '品牌' },
    { id: 'resize', icon: '⊡', label: '调整大小' },
    { id: 'background', icon: '▦', label: '背景' },
    { id: 'draw', icon: '✏', label: '绘图' }
  ];

  const rightPanelItems = [
    { id: 'layer', label: '圖層', icon: '▦' },
    { id: 'text', label: '文本', icon: 'T' },
    { id: 'group', label: '群組', icon: '⊞' }
  ];

  return (
    <div className="Lovart-editor">
      {/* Top Navigation */}
      <div className="top-nav">
        <div className="nav-left">
          <div className="logo">
            <span className="logo-icon">⬢</span>
            <span className="logo-text">Lovart</span>
          </div>
          <div className="nav-menu">
            <button className="nav-btn">File</button>
            <button className="nav-btn">Edit</button>
            <button className="nav-btn">View</button>
            <input 
              type="text" 
              className="search-bar" 
              placeholder="Tell AI what to do..."
            />
          </div>
        </div>
        <div className="nav-right">
          <button className="share-btn">Share</button>
          <div className="user-avatar">
            <span>10</span>
          </div>
        </div>
      </div>

      <div className="main-content">
        {/* Left Toolbar */}
        <div className="left-toolbar">
          {leftTools.map(tool => (
            <div 
              key={tool.id}
              className={`tool-item ${selectedTool === tool.id ? 'active' : ''}`}
              onClick={() => setSelectedTool(tool.id)}
            >
              <div className="tool-icon">{tool.icon}</div>
              <div className="tool-label">{tool.label}</div>
            </div>
          ))}
        </div>

        {/* Canvas Area */}
        <div className="canvas-container">
          <div className="canvas-wrapper">
            <div className="canvas">
              <div className="template-showcase">
                <div className="template-card main-template">
                  <div className="avatar-section">
                    <div className="avatar-placeholder"></div>
                  </div>
                  <div className="content-section">
                    <div className="select-name">
                      <label>Select name</label>
                      <p>Add your name and contact details here. You can edit and format text with bottom toolbar editor</p>
                    </div>
                    <div className="type-role">
                      <label>Type and Role</label>
                      <p>Add your type and role here</p>
                      <div className="email-field">
                        <span className="email-label">✉ Email</span>
                        <span className="email-text">mary@gmail.com</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="secondary-templates">
                  <div className="template-card">
                    <h3>Welcome to Lovart.</h3>
                    <p>We bring creativity and smart editing together</p>
                    <div className="quote-section">Try it out!</div>
                  </div>
                  
                  <div className="template-card">
                    <h3>Type and Role</h3>
                    <p>Add more details about your work experience, key achievements and skills</p>
                    <button className="add-section-btn">＋ Add another text section</button>
                  </div>

                  <div className="template-card explore">
                    <h3>Explore More</h3>
                    <p>Discover additional features and templates to enhance your creative projects</p>
                    <div className="image-placeholder"></div>
                  </div>
                </div>
              </div>

              {/* Floating Action Button */}
              <button className="fab-button">買舒設定</button>
            </div>
          </div>

          {/* Bottom Controls */}
          <div className="bottom-controls">
            <div className="pagination">
              <button className="page-btn">◀</button>
              <span className="page-info">1/1</span>
              <button className="page-btn">▶</button>
            </div>
            <div className="zoom-control">
              <button className="zoom-btn" onClick={() => setZoom(Math.max(10, zoom - 10))}>－</button>
              <span className="zoom-value">{zoom}%</span>
              <button className="zoom-btn" onClick={() => setZoom(Math.min(200, zoom + 10))}>＋</button>
            </div>
            <button className="add-page-btn">＋ 20%</button>
          </div>
        </div>

        {/* Right Panel */}
        <div className="right-panel">
          <div className="panel-header">
            <div className="panel-tabs">
              {rightPanelItems.map(item => (
                <button key={item.id} className="panel-tab">
                  <span className="tab-icon">{item.icon}</span>
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          </div>
          
          <div className="panel-content">
            <div className="layer-list">
              <div className="layer-item">
                <span className="layer-icon">▦</span>
                <span className="layer-name">Layer</span>
              </div>
              <div className="layer-item">
                <span className="layer-icon">T</span>
                <span className="layer-name">Text</span>
              </div>
              <div className="layer-item">
                <span className="layer-icon">⊞</span>
                <span className="layer-name">Group</span>
              </div>
              <div className="layer-item">
                <span className="layer-icon">⊞</span>
                <span className="layer-name">Group</span>
              </div>
            </div>
            
            <div className="drag-upload-area">
              <div className="upload-content">
                <span className="upload-icon">📁</span>
                <p>Drag uploads here</p>
              </div>
            </div>
            
            <div className="more-options">
              <button className="more-btn">•••</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LovartEditor;