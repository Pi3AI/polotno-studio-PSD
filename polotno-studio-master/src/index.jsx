import React from 'react';
import ReactDOM from 'react-dom/client';

import { createStore } from 'polotno/model/store';
import { unstable_setAnimationsEnabled } from 'polotno/config';
import { createProject, ProjectContext } from './project';

import '@blueprintjs/core/lib/css/blueprint.css';
import './index.css';
import './styles/psd-precision.css';
import App from './App';
import './logger';
import { ErrorBoundary } from 'react-error-boundary';
import { initializePrecisionRenderer } from './utils/PrecisionRenderer';
import { psdDebugger } from './utils/PSDDebugger';
import { initializePolotnoTextRenderer } from './utils/PolotnoTextRenderer';

// if (window.location.host !== 'studio.polotno.com') {
//   console.log(
//     `%cWelcome to Polotno Studio! Thanks for your interest in the project!
// This repository has many customizations from the default version Polotno SDK.
// I don't recommend to use it as starting point.
// Instead, you can start from any official demos, e.g.: https://polotno.com/docs/full-canvas-editor
// or direct sandbox: https://codesandbox.io/s/github/polotno-project/polotno-site/tree/source/examples/polotno-demo?from-embed.
// But feel free to use this repository as a reference for your own project and to learn how to use Polotno SDK.`,
//     'background: rgba(54, 213, 67, 1); color: white; padding: 5px;'
//   );
// }

unstable_setAnimationsEnabled(true);

// 开发环境配置
const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

const store = createStore({ 
  key: 'nFA5H9elEytDyPyvKL7T',
  // 在开发环境中禁用域名验证
  ...(isDevelopment && { disableDomainCheck: true })
});
window.store = store;
store.addPage();

const project = createProject({ store });
window.project = project;

// 初始化完整的PSD精确系统
setTimeout(() => {
  // 1. 初始化精确渲染器
  const precisionRenderer = initializePrecisionRenderer(store);
  console.log('✅ 精确渲染器已初始化');
  
  // 2. 初始化Polotno文本渲染增强器
  const textRenderer = initializePolotnoTextRenderer(store);
  console.log('✅ Polotno文本渲染增强器已初始化');
  
  // 3. 调试器已在导入时自动初始化
  psdDebugger.log('PSD调试系统已启动');
  
  console.log('%c🎯 PSD超高精度导入系统已完全就绪', 'background: #4CAF50; color: white; padding: 8px; font-weight: bold;');
  console.log('%c📌 系统功能说明:', 'background: #2196F3; color: white; padding: 4px;');
  console.log('1. 🎨 自动应用精确样式到PSD导入元素');
  console.log('2. 🔧 深度集成Konva渲染引擎确保像素级精确');
  console.log('3. 🔍 按 Ctrl+Shift+D 开启详细调试模式');
  console.log('4. ⚡ 自动高精度字体大小、颜色、间距转换');
  console.log('%c准备导入PSD文件体验极致精确度！', 'background: #FF9800; color: white; padding: 4px;');
}, 1500);

const root = ReactDOM.createRoot(document.getElementById('root'));

function Fallback({ error, resetErrorBoundary }) {
  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <div style={{ textAlign: 'center', paddingTop: '40px' }}>
        <p>Something went wrong in the app.</p>
        <p>Try to reload the page.</p>
        <p>If it does not work, clear cache and reload.</p>
        <button
          onClick={async () => {
            await project.clear();
            window.location.reload();
          }}
        >
          Clear cache and reload
        </button>
      </div>
    </div>
  );
}

root.render(
  <ErrorBoundary
    FallbackComponent={Fallback}
    onReset={(details) => {
      // Reset the state of your app so the error doesn't happen again
    }}
    onError={(e) => {
      if (window.Sentry) {
        window.Sentry.captureException(e);
      }
    }}
  >
    <ProjectContext.Provider value={project}>
      <App store={store} />
    </ProjectContext.Provider>
  </ErrorBoundary>
);
