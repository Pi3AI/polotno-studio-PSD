import React, { useState } from 'react';
import { observer } from 'mobx-react-lite';
import {
  Button,
  HTMLSelect,
  Slider,
  ProgressBar,
  Checkbox,
} from '@blueprintjs/core';
import JSZip from 'jszip';
import { downloadFile } from 'polotno/utils/download';
import * as unit from 'polotno/utils/unit';
import { t } from 'polotno/utils/l10n';
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

export const DownloadModal = observer(({ store, isOpen, onClose }) => {
  const [saving, setSaving] = useState(false);
  const [quality, setQuality] = useState(1);
  const [pageSizeModifier, setPageSizeModifier] = useState(1);
  const [fps, setFPS] = useState(10);
  const [type, setType] = useState('png');
  const [progress, setProgress] = useState(0);
  const [progressStatus, setProgressStatus] = useState('scheduled');
  const [vectorPDF, setVectorPDF] = useState(false);

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
    return words.join(' ').replace(/\s/g, '-').toLowerCase() || 'polotno';
  };

  const handleExport = async () => {
    setSaving(true);
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

        downloadFile(url, 'polotno.json');
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
      }, 1000);
    } catch (e) {
      setTimeout(() => {
        throw e;
      });
      alert('Something went wrong. Please try again.');
    }
    setSaving(false);
  };

  const isRasterFormat = type === 'jpeg' || type === 'png';
  const maxQuality = type === 'mp4' ? 1 : 300 / 72;

  if (!isOpen) return null;

  return (
    <div className="download-modal-overlay" onClick={onClose}>
      <div className="download-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="download-modal-header">
          <h2>Export Your Design</h2>
          <button className="modal-close-btn" onClick={onClose}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div className="download-modal-body">
          <div className="form-section">
            <label className="form-label">File Format</label>
            <HTMLSelect
              fill
              onChange={(e) => {
                setType(e.target.value);
                setQuality(1);
                if (e.target.value !== 'pdf') {
                  setVectorPDF(false);
                }
              }}
              value={type}
              className="format-select"
            >
              <option value="jpeg">JPEG Image</option>
              <option value="png">PNG Image</option>
              <option value="pdf">PDF Document</option>
              <option value="html">HTML File</option>
              <option value="svg">SVG Vector</option>
              <option value="pptx">PowerPoint</option>
              <option value="json">JSON Data</option>
              <option value="gif">GIF Animation</option>
              <option value="mp4">MP4 Video (Beta)</option>
              <option value="psd">PSD (Photoshop)</option>
            </HTMLSelect>
          </div>

          {type !== 'json' &&
            type !== 'html' &&
            type !== 'svg' &&
            type !== 'pptx' &&
            type !== 'psd' && (
              <div className="form-section">
                <label className="form-label">Quality Settings</label>
                <div className="quality-controls">
                  <Slider
                    value={quality}
                    labelRenderer={false}
                    onChange={(quality) => {
                      setQuality(quality);
                    }}
                    stepSize={0.2}
                    min={0.2}
                    max={maxQuality}
                    showTrackFill={false}
                  />
                  {type === 'pdf' && (
                    <div className="quality-info">
                      DPI: {Math.round(store.dpi * quality)}
                    </div>
                  )}
                  {type !== 'pdf' && (
                    <div className="quality-info">
                      {Math.round(store.activePage.computedWidth * quality)} x{' '}
                      {Math.round(store.activePage.computedHeight * quality)} px
                    </div>
                  )}
                  {type === 'gif' && (
                    <div className="fps-controls">
                      <label className="form-label">Animation Speed (FPS)</label>
                      <Slider
                        value={fps}
                        labelStepSize={5}
                        onChange={(fps) => {
                          setFPS(fps);
                        }}
                        stepSize={1}
                        min={5}
                        max={30}
                        showTrackFill={false}
                      />
                    </div>
                  )}
                </div>
                {type === 'pdf' && (
                  <div className="page-size-controls">
                    <label className="form-label">Page Size</label>
                    <Slider
                      value={pageSizeModifier}
                      labelRenderer={false}
                      onChange={(pageSizeModifier) => {
                        setPageSizeModifier(pageSizeModifier);
                      }}
                      stepSize={0.2}
                      min={0.2}
                      max={3}
                      showTrackFill={false}
                    />
                    <div className="size-info">
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
                    </div>
                  </div>
                )}
              </div>
            )}

          {type === 'json' && (
            <div className="info-section">
              <div className="info-text">
                JSON format is used for saving and loading projects. You can
                save your project to a file and load it later via "File" → "Open" menu.
              </div>
            </div>
          )}

          {type === 'psd' && (
            <div className="info-section">
              <div className="info-text">
                PSD format creates Adobe Photoshop compatible files with layers preserved. 
                {store.pages.length > 1 ? ' Multiple pages will be exported as a ZIP archive containing separate PSD files.' : ''}
              </div>
            </div>
          )}

          {type === 'pdf' && (
            <div className="checkbox-section">
              <Checkbox
                checked={vectorPDF}
                label="Vector PDF (Beta)"
                onChange={(e) => setVectorPDF(e.target.checked)}
              />
            </div>
          )}

          {(type === 'mp4' ||
            type === 'pptx' ||
            (type === 'pdf' && vectorPDF)) && (
            <div className="info-section">
              <div className="info-text">
                <strong>Beta feature.</strong>{' '}
                <a href="mailto:anton@polotno.com">
                  Let us know what you think!
                </a>
              </div>
              {saving && (
                <div className="progress-section">
                  <ProgressBar value={Math.max(3, progress) / 100} />
                </div>
              )}
            </div>
          )}
        </div>

        <div className="download-modal-footer">
          <Button
            large
            intent="primary"
            loading={saving}
            onClick={handleExport}
            className="download-btn"
          >
            Download {type.toUpperCase()}
          </Button>
        </div>
      </div>
    </div>
  );
});