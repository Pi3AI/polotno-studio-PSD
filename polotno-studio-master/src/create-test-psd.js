import { writePsd } from 'ag-psd';

/**
 * 创建一个简单的测试 PSD 文件
 */
export const createTestPSD = () => {
  // 创建测试图层
  const testLayer = {
    name: 'Test Layer',
    left: 10,
    top: 10,
    right: 110,
    bottom: 60,
    opacity: 255,
    hidden: false,
    blendMode: 'normal',
  };

  // 创建图层的 Canvas
  const canvas = document.createElement('canvas');
  canvas.width = 100;
  canvas.height = 50;
  const ctx = canvas.getContext('2d');
  
  // 绘制测试内容
  ctx.fillStyle = '#ff0000';
  ctx.fillRect(0, 0, 100, 50);
  ctx.fillStyle = '#ffffff';
  ctx.font = '16px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('TEST', 50, 30);
  
  testLayer.canvas = canvas;

  // 创建 PSD 数据
  const psdData = {
    width: 400,
    height: 300,
    children: [testLayer]
  };

  // 生成 PSD 文件
  const psdBuffer = writePsd(psdData);
  
  // 创建下载链接
  const blob = new Blob([psdBuffer], { type: 'application/octet-stream' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = 'test.psd';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
  
  console.log('测试 PSD 文件已创建并下载');
};