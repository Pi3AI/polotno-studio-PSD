import React, { useEffect, useRef, useState } from 'react';

/**
 * 高精度文本渲染组件 - 使用Canvas确保像素级精确性
 */
export const PreciseTextRenderer = ({ 
  text, 
  fontSize, 
  fontFamily, 
  fill, 
  letterSpacing, 
  lineHeight,
  textAlign,
  width,
  height,
  psdReference = null // PSD原始数据用于对比
}) => {
  const canvasRef = useRef(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    renderText();
  }, [text, fontSize, fontFamily, fill, letterSpacing, lineHeight, textAlign]);

  const renderText = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    
    // 设置高DPI支持
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.scale(dpr, dpr);

    // 清除画布
    ctx.clearRect(0, 0, width, height);

    // 等待字体加载
    await ensureFontLoaded(fontFamily);

    // 设置文本样式 - 使用更精确的渲染选项
    ctx.font = `${fontSize}px ${fontFamily}`;
    ctx.fillStyle = fill;
    ctx.textBaseline = 'top';
    ctx.textAlign = textAlign || 'left';
    
    // 高质量文本渲染设置
    ctx.textRenderingOptimization = 'optimizeQuality';
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // 计算行高和字符间距
    const actualLineHeight = lineHeight * fontSize;
    const lines = text.split('\n');
    
    lines.forEach((line, lineIndex) => {
      if (letterSpacing && letterSpacing !== 0) {
        // 手动绘制字符以控制字符间距
        renderTextWithLetterSpacing(ctx, line, 0, lineIndex * actualLineHeight, letterSpacing);
      } else {
        ctx.fillText(line, 0, lineIndex * actualLineHeight);
      }
    });

    setIsLoaded(true);
  };

  const renderTextWithLetterSpacing = (ctx, text, x, y, spacing) => {
    let currentX = x;
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      ctx.fillText(char, currentX, y);
      const charWidth = ctx.measureText(char).width;
      currentX += charWidth + (spacing * fontSize); // 转换em到px
    }
  };

  const ensureFontLoaded = async (fontFamily) => {
    if (!fontFamily || fontFamily === 'Arial') return true;
    
    try {
      // 使用FontFace API检查字体是否可用
      await document.fonts.ready;
      const fontFace = new FontFace(fontFamily, `url()`);
      await fontFace.load();
      return true;
    } catch (error) {
      console.warn(`字体 ${fontFamily} 加载失败，使用回退字体`);
      return false;
    }
  };

  return (
    <div style={{ position: 'relative', width, height }}>
      <canvas
        ref={canvasRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          zIndex: 10,
          // 添加额外的渲染优化
          fontSmooth: 'always',
          WebkitFontSmoothing: 'antialiased',
          MozOsxFontSmoothing: 'grayscale',
        }}
      />
      
      {/* PSD参考对比层（可选） */}
      {psdReference && (
        <div 
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            opacity: 0.5,
            zIndex: 5,
            pointerEvents: 'none',
            mixBlendMode: 'difference' // 用于对比
          }}
        >
          <img src={psdReference} alt="PSD Reference" />
        </div>
      )}
    </div>
  );
};

export default PreciseTextRenderer;