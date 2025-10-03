import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { observer } from 'mobx-react-lite';
import {
  Button,
  HTMLSelect,
  Slider,
  ProgressBar,
  Checkbox,
  Tooltip,
} from '@blueprintjs/core';
import JSZip from 'jszip';
import { downloadFile } from 'polotno/utils/download';
import * as unit from 'polotno/utils/unit';
import { jsonToPPTX } from 'polotno/utils/to-pptx';
import { getKey } from 'polotno/utils/validate-key';
import { exportToPSD, exportAllPagesToPSDZip } from '../psd-export';

// 保存视频的函数
const saveAsVideo = async ({ store, pixelRatio, fps, onProgress }) => {
  const json = store.toJSON();
  const req = await fetch(
    'https://api.polotno.dev/api/renders?KEY=' + getKey(),
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        design: json,
        pixelRatio,
        format: 'mp4',
      }),
    }
  );
  const job = await req.json();
  while (true) {
    const jobReq = await fetch(
      `https://api.polotno.dev/api/renders/${job.id}?KEY=` + getKey()
    );
    const jobData = await jobReq.json();
    if (jobData.status === 'done') {
      downloadFile(jobData.output, 'polotno.mp4');
      break;
    } else if (jobData.status === 'error') {
      throw new Error('Failed to render video');
    } else {
      onProgress(jobData.progress, jobData.status);
    }
    await new Promise((resolve) => setTimeout(resolve, 5000));
  }
};

// 保存矢量PDF的函数
const saveAsVectorPDF = async ({ store, pixelRatio, onProgress }) => {
  const json = store.toJSON();
  const req = await fetch(
    'https://api.polotno.dev/api/renders?KEY=' + getKey(),
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        design: json,
        pixelRatio,
        format: 'pdf',
        vector: true,
      }),
    }
  );

  const job = await req.json();

  while (true) {
    const jobReq = await fetch(
      `https://api.polotno.dev/api/renders/${job.id}?KEY=` + getKey()
    );
    const jobData = await jobReq.json();

    if (jobData.status === 'done') {
      downloadFile(jobData.output, 'polotno.pdf');
      break;
    } else if (jobData.status === 'error') {
      throw new Error('Failed to render PDF');
    } else {
      onProgress(jobData.progress, jobData.status);
    }

    await new Promise((resolve) => setTimeout(resolve, 5000));
  }
};

// 文件格式配置
const formatOptions = [
  {
    value: 'png',
    label: 'PNG Image',
    icon: '🖼️',
    description: 'High quality with transparency',
    color: '#4299e1',
    popular: true
  },
  {
    value: 'jpeg',
    label: 'JPEG Image',
    icon: '📷',
    description: 'Compressed for web use',
    color: '#48bb78'
  },
  {
    value: 'pdf',
    label: 'PDF Document',
    icon: '📄',
    description: 'Print-ready document',
    color: '#ed64a6',
    popular: true
  },
  {
    value: 'psd',
    label: 'PSD (Photoshop)',
    icon: '🎨',
    description: 'Editable layers for Photoshop',
    color: '#667eea',
    featured: true
  },
  {
    value: 'svg',
    label: 'SVG Vector',
    icon: '🔺',
    description: 'Scalable vector graphics',
    color: '#38b2ac'
  },
  {
    value: 'pptx',
    label: 'PowerPoint',
    icon: '📊',
    description: 'Presentation slides',
    color: '#f6ad55'
  },
  {
    value: 'html',
    label: 'HTML File',
    icon: '🌐',
    description: 'Web page format',
    color: '#9f7aea'
  },
  {
    value: 'json',
    label: 'JSON Data',
    icon: '📦',
    description: 'Save project for editing',
    color: '#718096'
  },
  {
    value: 'gif',
    label: 'GIF Animation',
    icon: '🎬',
    description: 'Animated image',
    color: '#ed8936'
  },
  {
    value: 'mp4',
    label: 'MP4 Video',
    icon: '🎥',
    description: 'High quality video (Beta)',
    color: '#e53e3e',
    beta: true
  }
];

export const EnhancedDownloadModal = observer(({ store, isOpen, onClose }) => {
  const [saving, setSaving] = useState(false);
  const [quality, setQuality] = useState(1);
  const [pageSizeModifier, setPageSizeModifier] = useState(1);
  const [fps, setFPS] = useState(10);
  const [type, setType] = useState('png');
  const [progress, setProgress] = useState(0);
  const [progressStatus, setProgressStatus] = useState('scheduled');
  const [vectorPDF, setVectorPDF] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState(formatOptions[0]);

  // 更新选中的格式
  useEffect(() => {
    const format = formatOptions.find(f => f.value === type) || formatOptions[0];
    setSelectedFormat(format);
  }, [type]);

  // 键盘快捷键
  useEffect(() => {
    const handleKeyPress = (event) => {
      if (event.key === 'Escape' && isOpen) {
        onClose();
      }
      if (event.key === 'Enter' && isOpen && !saving) {
        handleExport();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyPress);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyPress);
    };
  }, [isOpen, saving]);

  const getName = () => {
    const texts = [];
    store.pages.forEach((p) => {
      p.children.forEach((c) => {
        if (c.type === 'text') {
          texts.push(c.text);
        }
      });
    });
    const allWords = texts.join(' ').split(' ');
    const words = allWords.slice(0, 6);
    return words.join(' ').replace(/\s/g, '-').toLowerCase() || 'polotno-design';
  };

  const handleExport = async () => {
    setSaving(true);
    setProgress(0);
    
    try {
      if (type === 'pdf') {
        if (vectorPDF) {
          setProgressStatus('scheduled');
          await saveAsVectorPDF({
            store,
            pixelRatio: quality * Math.sqrt(300 / 72),
            onProgress: (progress, status) => {
              setProgress(progress);
              setProgressStatus(status);
            },
          });
          setProgressStatus('done');
          setProgress(0);
        } else {
          await store.saveAsPDF({
            fileName: getName() + '.pdf',
            dpi: store.dpi / pageSizeModifier,
            pixelRatio: quality * Math.sqrt(300 / 72),
          });
        }
      } else if (type === 'html') {
        await store.saveAsHTML({
          fileName: getName() + '.html',
        });
      } else if (type === 'svg') {
        await store.saveAsSVG({
          fileName: getName() + '.svg',
        });
      } else if (type === 'json') {
        const json = store.toJSON();
        const url =
          'data:text/json;base64,' +
          window.btoa(unescape(encodeURIComponent(JSON.stringify(json))));
        downloadFile(url, getName() + '.json');
      } else if (type === 'gif') {
        await store.saveAsGIF({
          fileName: getName() + '.gif',
          pixelRatio: quality,
          fps,
        });
      } else if (type === 'pptx') {
        await jsonToPPTX({ json: store.toJSON() });
      } else if (type === 'mp4') {
        setProgressStatus('scheduled');
        await saveAsVideo({
          store,
          pixelRatio: quality,
          onProgress: (progress, status) => {
            setProgress(progress);
            setProgressStatus(status);
          },
        });
        setProgressStatus('done');
        setProgress(0);
      } else if (type === 'psd') {
        if (store.pages.length > 1) {
          await exportAllPagesToPSDZip(store, getName());
        } else {
          await exportToPSD(store, getName() + '.psd');
        }
      } else {
        if (store.pages.length < 3) {
          store.pages.forEach((page, index) => {
            const indexString = store.pages.length > 1 ? '-' + (index + 1) : '';
            store.saveAsImage({
              pageId: page.id,
              pixelRatio: quality,
              mimeType: 'image/' + type,
              fileName: getName() + indexString + '.' + type,
            });
          });
        } else {
          const zip = new JSZip();
          for (const page of store.pages) {
            const index = store.pages.indexOf(page);
            const indexString = store.pages.length > 1 ? '-' + (index + 1) : '';

            const url = await store.toDataURL({
              pageId: page.id,
              pixelRatio: quality,
              mimeType: 'image/' + type,
            });
            const fileName = getName() + indexString + '.' + type;
            const base64Data = url.replace(
              /^data:image\/(png|jpeg);base64,/,
              ''
            );
            zip.file(fileName, base64Data, { base64: true });
          }

          const content = await zip.generateAsync({ type: 'base64' });
          const result = 'data:application/zip;base64,' + content;
          downloadFile(result, getName() + '.zip');
        }
      }

      // 下载完成后自动关闭模态框
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (e) {
      console.error('Export error:', e);
      alert('导出失败，请重试。错误：' + e.message);
    }
    setSaving(false);
  };

  const maxQuality = type === 'mp4' ? 1 : 300 / 72;

  if (!isOpen) return null;

  console.log('Enhanced Download Modal is rendering...', { isOpen });

  const modalContent = (
    <div className="enhanced-download-modal-overlay" onClick={onClose} style={{ zIndex: 50000 }}>
      <div className="enhanced-download-modal" onClick={(e) => e.stopPropagation()}>
        {/* 模态框头部 */}
        <div className="modal-header">
          <div className="header-content">
            <div className="header-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
            </div>
            <div className="header-text">
              <h2>导出您的设计</h2>
              <p>选择合适的格式并下载您的作品</p>
            </div>
          </div>
          <button className="close-button" onClick={onClose}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* 模态框内容 */}
        <div className="modal-body">
          {/* 格式选择网格 */}
          <div className="format-grid">
            <h3>选择文件格式</h3>
            <div className="format-cards">
              {formatOptions.map((format) => (
                <div
                  key={format.value}
                  className={`format-card ${type === format.value ? 'selected' : ''} ${format.featured ? 'featured' : ''}`}
                  onClick={() => {
                    setType(format.value);
                    setQuality(1);
                    if (format.value !== 'pdf') {
                      setVectorPDF(false);
                    }
                  }}
                  style={{ '--accent-color': format.color }}
                >
                  {format.featured && <div className="featured-badge">推荐</div>}
                  {format.popular && <div className="popular-badge">热门</div>}
                  {format.beta && <div className="beta-badge">Beta</div>}
                  
                  <div className="format-icon">{format.icon}</div>
                  <div className="format-info">
                    <div className="format-name">{format.label}</div>
                    <div className="format-description">{format.description}</div>
                  </div>
                  
                  <div className="format-selection">
                    <div className="radio-circle">
                      {type === format.value && <div className="radio-dot"></div>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 质量设置 */}
          {type !== 'json' &&
            type !== 'html' &&
            type !== 'svg' &&
            type !== 'pptx' &&
            type !== 'psd' && (
              <div className="settings-section">
                <h3>质量设置</h3>
                <div className="quality-panel">
                  <div className="quality-slider">
                    <label>图像质量</label>
                    <Slider
                      value={quality}
                      labelRenderer={false}
                      onChange={(quality) => setQuality(quality)}
                      stepSize={0.2}
                      min={0.2}
                      max={maxQuality}
                      showTrackFill={false}
                    />
                    <div className="quality-info">
                      {type === 'pdf' && (
                        <span>DPI: {Math.round(store.dpi * quality)}</span>
                      )}
                      {type !== 'pdf' && (
                        <span>
                          {Math.round(store.activePage.computedWidth * quality)} x{' '}
                          {Math.round(store.activePage.computedHeight * quality)} px
                        </span>
                      )}
                    </div>
                  </div>

                  {type === 'gif' && (
                    <div className="fps-slider">
                      <label>动画帧率 (FPS)</label>
                      <Slider
                        value={fps}
                        labelStepSize={5}
                        onChange={(fps) => setFPS(fps)}
                        stepSize={1}
                        min={5}
                        max={30}
                        showTrackFill={false}
                      />
                      <div className="fps-info">
                        <span>{fps} 帧/秒</span>
                      </div>
                    </div>
                  )}

                  {type === 'pdf' && (
                    <div className="page-size-slider">
                      <label>页面尺寸</label>
                      <Slider
                        value={pageSizeModifier}
                        labelRenderer={false}
                        onChange={(pageSizeModifier) => setPageSizeModifier(pageSizeModifier)}
                        stepSize={0.2}
                        min={0.2}
                        max={3}
                        showTrackFill={false}
                      />
                      <div className="size-info">
                        <span>
                          {unit.pxToUnitRounded({
                            px: store.width * pageSizeModifier,
                            dpi: store.dpi,
                            precious: 0,
                            unit: 'mm',
                          })}{' '}
                          x{' '}
                          {unit.pxToUnitRounded({
                            px: store.height * pageSizeModifier,
                            dpi: store.dpi,
                            precious: 0,
                            unit: 'mm',
                          })}{' '}
                          mm
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

          {/* 特殊格式信息 */}
          {(type === 'json' || type === 'psd') && (
            <div className="info-panel">
              <div className="info-icon">
                {type === 'json' ? '💾' : '🎨'}
              </div>
              <div className="info-content">
                {type === 'json' && (
                  <div>
                    <strong>项目保存</strong>
                    <p>JSON格式保存您的项目数据，可以通过"文件"→"打开"重新加载编辑。</p>
                  </div>
                )}
                {type === 'psd' && (
                  <div>
                    <strong>Photoshop兼容</strong>
                    <p>
                      PSD格式创建与Adobe Photoshop兼容的文件，保留图层结构。
                      {store.pages.length > 1 ? ' 多页面将导出为ZIP压缩包。' : ''}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* PDF选项 */}
          {type === 'pdf' && (
            <div className="options-section">
              <Checkbox
                checked={vectorPDF}
                label="矢量PDF (Beta)"
                onChange={(e) => setVectorPDF(e.target.checked)}
              />
            </div>
          )}

          {/* Beta功能进度 */}
          {(type === 'mp4' || type === 'pptx' || (type === 'pdf' && vectorPDF)) && (
            <div className="beta-section">
              <div className="beta-info">
                <strong>Beta功能</strong>
                <p>这是一个测试功能，欢迎反馈您的使用体验！</p>
              </div>
              {saving && (
                <div className="progress-container">
                  <ProgressBar value={Math.max(3, progress) / 100} />
                  <span className="progress-text">{progressStatus}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 模态框底部 */}
        <div className="modal-footer">
          <div className="footer-info">
            <div className="file-preview">
              <div className="preview-icon" style={{ backgroundColor: selectedFormat.color }}>
                {selectedFormat.icon}
              </div>
              <div className="preview-details">
                <span className="file-name">{getName()}.{type}</span>
                <span className="file-type">{selectedFormat.label}</span>
              </div>
            </div>
          </div>
          
          <div className="footer-actions">
            <Button
              large
              onClick={onClose}
              disabled={saving}
              className="cancel-button"
            >
              取消
            </Button>
            <Button
              large
              intent="primary"
              loading={saving}
              onClick={handleExport}
              className="download-button"
              disabled={saving}
            >
              {saving ? '正在导出...' : `下载 ${selectedFormat.label}`}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );

  // 使用Portal渲染到body，确保不被其他元素遮挡
  return createPortal(modalContent, document.body);
});