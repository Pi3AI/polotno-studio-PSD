import React from 'react';
import { observer } from 'mobx-react-lite';
import { Button } from '@blueprintjs/core';
// 使用字串 IconName
import {
  ImagesGrid,
  UploadSection as DefaultUploadSection,
} from 'polotno/side-panel';
import { getImageSize, getCrop } from 'polotno/utils/image';
import { getVideoSize, getVideoPreview } from 'polotno/utils/video';
import { dataURLtoBlob } from '../blob';
import { 
  parsePSDFile, 
  flattenLayers, 
  layerToPolotnoElement, 
  getPSDPreview,
  isPSDFile 
} from '../psd-utils';

import { CloudWarning } from '../cloud-warning';

import { useProject } from '../project';
import { listAssets, uploadAsset, deleteAsset } from '../api';
import { createTestPSD } from '../create-test-psd';

function getType(file) {
  const { type, name } = file;
  
  if (isPSDFile(file)) {
    return 'psd';
  }
  if (type.indexOf('svg') >= 0) {
    return 'svg';
  }
  if (type.indexOf('image') >= 0) {
    return 'image';
  }
  if (type.indexOf('video') >= 0) {
    return 'video';
  }
  return 'image';
}

const getImageFilePreview = (file) => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const url = e.target.result;
      // now we need to render that image into smaller canvas and get data url
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = 200;
        canvas.height = (200 * img.height) / img.width;
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL());
      };
      img.src = url;
    };
    reader.readAsDataURL(file);
  });
};

export const UploadPanel = observer(({ store }) => {
  const [images, setImages] = React.useState([]);
  const [isUploading, setUploading] = React.useState(false);
  const [isLoading, setLoading] = React.useState(false);
  const project = useProject();

  const load = async () => {
    setLoading(true);
    try {
      const images = await listAssets();
      setImages(images);
    } catch (error) {
      console.error('加载资源列表失败:', error);
      // 即使失败也要显示现有的图片
    } finally {
      setLoading(false);
    }
  };

  const handleFileInput = async (e) => {
    const { target } = e;
    
    // 检查是否已经在上传中，如果是则直接返回
    if (isUploading) {
      console.log('已有文件在上传中，忽略新的上传请求');
      return;
    }
    
    setUploading(true);
    console.log('开始文件上传，文件数量:', target.files.length);
    
    try {
      for (const file of target.files) {
        console.log('处理文件:', file.name, '类型:', file.type);
        const type = getType(file);
        console.log('检测到文件类型:', type);
        let previewDataURL = '';
        let shouldImportPSD = false;
      
      if (type === 'psd') {
        try {
          console.log('开始解析 PSD 文件...');
          const psd = await parsePSDFile(file);
          console.log('PSD 解析成功，开始生成预览...');
          previewDataURL = getPSDPreview(psd);
          console.log('PSD 预览生成结果:', previewDataURL ? `长度${previewDataURL.length}` : '失败');
          
          // 如果无法生成预览，创建默认预览
          if (!previewDataURL) {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = 200;
            canvas.height = 150;
            
            // 绘制PSD占位符
            ctx.fillStyle = '#f0f0f0';
            ctx.fillRect(0, 0, 200, 150);
            ctx.strokeStyle = '#ccc';
            ctx.strokeRect(0, 0, 200, 150);
            
            ctx.fillStyle = '#666';
            ctx.font = 'bold 16px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('PSD FILE', 100, 75);
            
            ctx.font = '12px Arial';
            ctx.fillText(file.name, 100, 95);
            
            previewDataURL = canvas.toDataURL();
          }
          
          // 使用非阻塞的方式询问用户是否导入PSD图层
          // 先上传文件，然后再异步处理PSD导入
          setTimeout(() => {
            const message = `检测到 PSD 文件: ${file.name}\n尺寸: ${psd.width} × ${psd.height}\n图层数: ${psd.children?.length || 0}\n\n是否导入所有图层到画布？`;
            if (window.confirm(message)) {
              handlePSDImport(psd).catch(error => {
                console.error('PSD导入失败:', error);
                alert(`PSD导入失败: ${error.message}`);
              });
            }
          }, 100);
          
          // 继续处理，将PSD文件上传到资源库
        } catch (error) {
          console.error('PSD 处理失败:', error);
          
          // 即使PSD解析失败，也尝试创建基本预览并上传原文件
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          canvas.width = 200;
          canvas.height = 150;
          
          ctx.fillStyle = '#ffebee';
          ctx.fillRect(0, 0, 200, 150);
          ctx.strokeStyle = '#f44336';
          ctx.strokeRect(0, 0, 200, 150);
          
          ctx.fillStyle = '#d32f2f';
          ctx.font = 'bold 16px Arial';
          ctx.textAlign = 'center';
          ctx.fillText('PSD ERROR', 100, 75);
          
          ctx.font = '12px Arial';
          ctx.fillText('解析失败', 100, 95);
          
          previewDataURL = canvas.toDataURL();
          
          // 使用非阻塞的错误提示
          setTimeout(() => {
            alert(`PSD 文件处理失败: ${error.message}\n\n文件仍会上传到资源库，但无法导入图层`);
          }, 100);
          // 继续执行，不要跳过上传
        }
      } else if (type === 'video') {
        try {
          previewDataURL = await getVideoPreview(URL.createObjectURL(file));
        } catch (error) {
          console.error('视频预览生成失败:', error);
          previewDataURL = await getImageFilePreview(file); // 回退到图片预览
        }
      } else {
        previewDataURL = await getImageFilePreview(file);
      }
      
      // 确保有有效的预览图
      if (!previewDataURL) {
        console.error(`无法生成 ${file.name} 的预览图`);
        continue;
      }
      
      try {
        console.log('开始上传文件到资源库:', file.name);
        const preview = dataURLtoBlob(previewDataURL);
        console.log('预览图转换为 Blob 成功，大小:', preview.size);
        await uploadAsset({ file, preview, type });
        console.log('文件上传成功:', file.name);
      } catch (error) {
        console.error(`上传文件 ${file.name} 失败:`, error);
        // 使用非阻塞的错误提示
        setTimeout(() => {
          alert(`上传文件 ${file.name} 失败: ${error.message}`);
        }, 100);
        continue;
      }
    }
    } catch (globalError) {
      console.error('文件上传过程发生错误:', globalError);
      // 使用非阻塞的错误提示
      setTimeout(() => {
        alert(`文件上传失败: ${globalError.message}`);
      }, 100);
    } finally {
      // 确保始终重置上传状态
      try {
        await load();
      } catch (loadError) {
        console.error('重新加载资源列表失败:', loadError);
      }
      setUploading(false);
      // 重置文件输入
      if (target) {
        target.value = null;
      }
    }
  };

  const handlePSDImport = async (psd) => {
    try {
      
      // 设置画布尺寸
      if (psd.width && psd.height) {
        const maxSize = 5000; // 限制最大尺寸
        const width = Math.min(psd.width, maxSize);
        const height = Math.min(psd.height, maxSize);
        
        store.setSize(width, height);
      }
      
      // 提取并转换图层
      const layers = flattenLayers(psd.children || []);
      
      let successCount = 0;
      let errorCount = 0;
      
      for (let i = 0; i < layers.length; i++) {
        const layer = layers[i];
        try {
          const element = await layerToPolotnoElement(layer);
          if (element) {
            
            if (!store || !store.activePage) {
              errorCount++;
              continue;
            }
            
            store.activePage.addElement(element);
            successCount++;
          }
        } catch (error) {
          console.error(`图层处理失败: ${layer.name}`, error);
          errorCount++;
        }
      }
      
      
      const message = `PSD 导入完成!\n\n成功导入: ${successCount} 个图层\n${errorCount > 0 ? `失败: ${errorCount} 个图层\n` : ''}总图层数: ${layers.length}`;
      alert(message);
    } catch (error) {
      console.error('PSD 导入失败:', error);
      alert(`PSD 导入过程中发生错误: ${error.message}`);
    }
  };

  const handleDelete = async (image) => {
    if (window.confirm('Are you sure you want to delete the image?')) {
      setImages(images.filter((i) => i.id !== image.id));
      await deleteAsset({ id: image.id });
      await load();
    }
  };

  React.useEffect(() => {
    load();
  }, []);

  React.useEffect(() => {
    load();
  }, [project.cloudEnabled]);

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ marginBottom: '20px' }}>
        <label htmlFor="input-file">
          <Button
            icon="upload"
            style={{ width: '100%' }}
            onClick={() => {
              if (isUploading) {
                console.log('上传中，忽略点击');
                return;
              }
              const input = document.querySelector('#input-file');
              input?.click();
            }}
            loading={isUploading}
            disabled={isUploading}
            intent="primary"
          >
            {isUploading ? 'Uploading...' : 'Upload'}
          </Button>
          <input
            type="file"
            id="input-file"
            style={{ display: 'none' }}
            onChange={handleFileInput}
            multiple
            accept="image/*,.psd,application/photoshop,image/vnd.adobe.photoshop,application/octet-stream"
            disabled={isUploading}
          />
        </label>
        
        {/* Test PSD Button - only show in development */}
        {process.env.NODE_ENV === 'development' && (
          <Button
            icon="document"
            style={{ width: '100%', marginBottom: '10px' }}
            onClick={createTestPSD}
            intent="warning"
          >
            创建测试 PSD 文件
          </Button>
        )}
      </div>
      <CloudWarning />
      <ImagesGrid
        images={images}
        getPreview={(image) => image.preview}
        crossOrigin={undefined}
        isLoading={isLoading}
        getCredit={(image) => (
          <div>
            <Button
              icon="trash"
              onClick={(e) => {
                e.stopPropagation();
                handleDelete(image);
              }}
            ></Button>
          </div>
        )}
        onSelect={async (item, pos, element) => {
          const image = item.src;
          const type = item.type;

          const getSizeFunc = type === 'video' ? getVideoSize : getImageSize;

          let { width, height } = await getSizeFunc(image);

          if (
            element &&
            element.type === 'svg' &&
            element.contentEditable &&
            type === 'image'
          ) {
            element.set({ maskSrc: image });
            return;
          }

          if (
            element &&
            element.type === 'image' &&
            element.contentEditable &&
            type == 'image'
          ) {
            const crop = getCrop(element, {
              width,
              height,
            });
            element.set({ src: image, ...crop });
            return;
          }

          const scale = Math.min(store.width / width, store.height / height, 1);
          width = width * scale;
          height = height * scale;

          const x = (pos?.x || store.width / 2) - width / 2;
          const y = (pos?.y || store.height / 2) - height / 2;

          store.activePage?.addElement({
            type,
            src: image,
            x,
            y,
            width,
            height,
          });
        }}
      />
    </div>
  );
});

DefaultUploadSection.Panel = UploadPanel;

export const UploadSection = DefaultUploadSection;
