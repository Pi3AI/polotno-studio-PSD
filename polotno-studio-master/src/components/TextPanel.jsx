import React, { useState, useEffect } from 'react';
import { TextPanel as PolotnoTextPanel, setFontUploadFunc } from 'polotno/side-panel/text-panel';
import { addGlobalFont, getFontsList, injectCustomFont } from 'polotno/utils/fonts';
import { Button, FileInput } from '@blueprintjs/core';

const EnhancedTextPanel = ({ store, onClose }) => {
  const [selectedLanguage, setSelectedLanguage] = useState('zh-cn');
  const [uploadedFonts, setUploadedFonts] = useState([]);
  
  // 预定义的多语言字体集合
  const languageFonts = {
    'zh-cn': {
      name: '简体中文',
      icon: '🇨🇳',
      fonts: [
        'Noto Sans SC',
        'Source Han Sans SC',
        'PingFang SC',
        'Microsoft YaHei',
        'SimHei',
        'SimSun',
        'KaiTi',
        'FangSong'
      ]
    },
    'zh-tw': {
      name: '繁體中文',
      icon: '🇹🇼',
      fonts: [
        'Noto Sans TC',
        'Source Han Sans TC',
        'PingFang TC',
        'Microsoft JhengHei',
        'PMingLiU',
        'MingLiU',
        'DFKai-SB',
        'BiauKai'
      ]
    },
    'en': {
      name: 'English',
      icon: '🇺🇸',
      fonts: [
        'Arial',
        'Helvetica',
        'Times New Roman',
        'Georgia',
        'Verdana',
        'Roboto',
        'Open Sans',
        'Lato',
        'Montserrat',
        'Source Sans Pro',
        'Poppins',
        'Inter'
      ]
    },
    'ja': {
      name: '日本語',
      icon: '🇯🇵',
      fonts: [
        'Noto Sans JP',
        'Source Han Sans JP',
        'Hiragino Sans',
        'Yu Gothic',
        'Meiryo',
        'MS Gothic',
        'MS Mincho'
      ]
    },
    'ko': {
      name: '한국어',
      icon: '🇰🇷',
      fonts: [
        'Noto Sans KR',
        'Source Han Sans KR',
        'Malgun Gothic',
        'Batang',
        'Dotum',
        'Gulim'
      ]
    }
  };

  // 初始化字体上传功能
  useEffect(() => {
    // 设置字体上传处理函数
    setFontUploadFunc(async (file) => {
      try {
        // 创建文件URL
        const fontUrl = URL.createObjectURL(file);
        
        // 获取字体名称（去掉扩展名）
        const fontName = file.name.replace(/\.(ttf|otf|woff|woff2)$/i, '');
        
        // 创建字体对象
        const fontObject = {
          fontFamily: fontName,
          url: fontUrl,
          styles: [{
            src: fontUrl,
            fontStyle: 'normal',
            fontWeight: 'normal'
          }]
        };
        
        // 注入自定义字体
        injectCustomFont(fontObject);
        addGlobalFont(fontObject);
        
        // 更新上传字体列表
        setUploadedFonts(prev => [...prev, fontObject]);
        
        console.log(`Font uploaded successfully: ${fontName}`);
        return fontUrl;
      } catch (error) {
        console.error('Font upload failed:', error);
        throw error;
      }
    });
  }, []);

  // 加载语言字体
  const loadLanguageFonts = (langCode) => {
    const langFonts = languageFonts[langCode];
    if (!langFonts) return;

    // 为每个字体创建字体对象并加载
    langFonts.fonts.forEach(fontFamily => {
      const fontObject = {
        fontFamily,
        // 对于系统字体，不需要URL
        styles: [{
          fontStyle: 'normal',
          fontWeight: 'normal'
        }]
      };
      
      try {
        addGlobalFont(fontObject);
      } catch (error) {
        console.warn(`Failed to add font: ${fontFamily}`, error);
      }
    });
  };

  // 处理语言切换
  const handleLanguageChange = (langCode) => {
    setSelectedLanguage(langCode);
    loadLanguageFonts(langCode);
  };

  // 添加默认文本
  const addText = (text = '点击编辑文字') => {
    if (!store || !store.activePage) return;
    
    const langFonts = languageFonts[selectedLanguage];
    const defaultFont = langFonts ? langFonts.fonts[0] : 'Arial';
    
    store.activePage.addElement({
      type: 'text',
      text: text,
      x: 100,
      y: 100,
      width: 300,
      height: 50, // 修复：使用数字而不是'auto'
      fontSize: 32,
      fontFamily: defaultFont,
      fill: '#000000',
      fontWeight: 'normal',
      fontStyle: 'normal',
      textAlign: 'left'
    });
  };

  // 处理字体文件上传
  const handleFontUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // 检查文件类型
    const validTypes = ['font/ttf', 'font/otf', 'font/woff', 'font/woff2', 'application/font-woff', 'application/x-font-woff'];
    const isValidFont = validTypes.includes(file.type) || /\.(ttf|otf|woff|woff2)$/i.test(file.name);
    
    if (!isValidFont) {
      alert('请选择有效的字体文件 (.ttf, .otf, .woff, .woff2)');
      return;
    }

    // 触发Polotno的字体上传
    if (window.polotnoFontUpload) {
      window.polotnoFontUpload(file);
    }
  };

  return (
    <div className="enhanced-text-panel">
      {/* 头部 */}
      <div className="text-panel-header">
        <h3>文字工具</h3>
        <button 
          className="panel-close-btn"
          onClick={onClose}
        >
          ✕
        </button>
      </div>

      {/* 语言选择 */}
      <div className="language-selector">
        <h4>选择语言</h4>
        <div className="language-grid">
          {Object.entries(languageFonts).map(([langCode, langInfo]) => (
            <button
              key={langCode}
              className={`language-btn ${selectedLanguage === langCode ? 'active' : ''}`}
              onClick={() => handleLanguageChange(langCode)}
            >
              <span className="language-icon">{langInfo.icon}</span>
              <span className="language-name">{langInfo.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 快速添加文本 */}
      <div className="quick-text-section">
        <h4>快速添加</h4>
        <div className="quick-text-buttons">
          <Button
            icon="add"
            onClick={() => addText()}
            className="add-text-btn"
          >
            添加文本
          </Button>
          <Button
            icon="header"
            onClick={() => addText('标题文字')}
            className="add-title-btn"
          >
            添加标题
          </Button>
        </div>
      </div>

      {/* 字体上传 */}
      <div className="font-upload-section">
        <h4>上传字体</h4>
        <FileInput
          text="选择字体文件..."
          onInputChange={handleFontUpload}
          accept=".ttf,.otf,.woff,.woff2"
          className="font-upload-input"
        />
        <p className="upload-hint">
          支持 TTF, OTF, WOFF, WOFF2 格式
        </p>
      </div>

      {/* Polotno内置文字面板 */}
      <div className="polotno-text-panel">
        <PolotnoTextPanel store={store} />
      </div>

      {/* 已上传字体列表 */}
      {uploadedFonts.length > 0 && (
        <div className="uploaded-fonts">
          <h4>已上传字体</h4>
          <div className="font-list">
            {uploadedFonts.map((font, index) => (
              <div key={index} className="font-item">
                <span className="font-name">{font.fontFamily}</span>
                <button
                  className="use-font-btn"
                  onClick={() => {
                    if (!store || !store.activePage) return;
                    store.activePage.addElement({
                      type: 'text',
                      text: '示例文字',
                      x: 100,
                      y: 100,
                      width: 200,
                      height: 40,
                      fontSize: 24,
                      fontFamily: font.fontFamily,
                      fill: '#000000'
                    });
                  }}
                  style={{ fontFamily: font.fontFamily }}
                >
                  预览
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedTextPanel;