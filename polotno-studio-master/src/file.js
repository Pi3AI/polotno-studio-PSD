import { 
  parsePSDFile, 
  flattenLayers, 
  layerToPolotnoElement, 
  isPSDFile 
} from './psd-utils';

export const loadJSONFile = (file, store) => {
  var reader = new FileReader();
  reader.onloadend = function () {
    var text = reader.result;
    let json;
    try {
      json = JSON.parse(text);
    } catch (e) {
      alert('Can not load the project.');
    }

    if (json) {
      store.loadJSON(json);
    }
  };
  reader.onerror = function () {
    alert('Can not load Polotno project file.');
  };
  reader.readAsText(file);
};

export const loadImageFile = (file, store) => {
  var reader = new FileReader();
  reader.onloadend = function () {
    var url = reader.result;
    const img = new Image();
    img.src = url;
    img.onload = () => {
      const scale = Math.min(
        1,
        store.width / img.width,
        store.height / img.height
      );
      const type = file.type.indexOf('svg') > -1 ? 'svg' : 'image';
      store.activePage.addElement({
        type,
        width: img.width * scale,
        height: img.height * scale,
        src: url,
      });
    };
  };
  reader.onerror = function () {
    alert('Can not load image.');
  };
  reader.readAsDataURL(file);
};

// PSD 文件处理函数
export const loadPSDFile = async (file, store) => {
  try {
    console.log('开始加载 PSD 文件:', file.name, file.size, 'bytes');
    
    const psd = await parsePSDFile(file);
    console.log('PSD 解析完成:', psd);
    
    // 保存PSD预览图用于对比
    const previewUrl = getPSDPreview(psd);
    if (previewUrl) {
      // 将预览图保存到全局变量，供PSD对比工具使用
      window.lastPSDPreview = previewUrl;
      if (window.storePSDPreview) {
        window.storePSDPreview(previewUrl, file.name);
      }
      console.log('PSD预览图已保存，可用于对比工具');
    }
    
    // 设置画布尺寸
    if (psd.width && psd.height) {
      console.log('设置画布尺寸:', psd.width, 'x', psd.height);
      store.setSize(psd.width, psd.height);
    }
    
    // 提取并转换图层
    const layers = flattenLayers(psd.children || []);
    console.log('扁平化图层数量:', layers.length);
    
    let successCount = 0;
    let errorCount = 0;
    
    for (const layer of layers) {
      console.log('处理图层:', layer.name, layer);
      try {
        const element = await layerToPolotnoElement(layer);
        if (element) {
          store.activePage.addElement(element);
          successCount++;
          console.log('成功添加图层:', element.name);
        } else {
          console.log('跳过图层:', layer.name);
        }
      } catch (layerError) {
        console.error('图层处理失败:', layer.name, layerError);
        errorCount++;
      }
    }
    
    console.log('PSD 文件加载完成');
    
    if (successCount > 0) {
      alert(`成功导入 PSD 文件！\n导入图层: ${successCount}\n跳过图层: ${layers.length - successCount - errorCount}\n失败图层: ${errorCount}\n\n📌 为了更好的用户体验，所有图层透明度已设置为100%`);
    } else {
      alert('PSD 文件导入完成，但没有可用的图层内容');
    }
  } catch (error) {
    console.error('PSD 文件加载失败:', error);
    alert(`PSD 文件加载失败: ${error.message}\n\n请确保文件是有效的 PSD 格式，且不是过于复杂的文件。`);
  }
};

export const loadFile = (file, store) => {
  if (isPSDFile(file)) {
    loadPSDFile(file, store);
  } else if (file.type.indexOf('image') >= 0) {
    loadImageFile(file, store);
  } else {
    loadJSONFile(file, store);
  }
};
