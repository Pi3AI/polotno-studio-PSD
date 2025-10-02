import React from 'react';
import { observer } from 'mobx-react-lite';
import { Spinner } from '@blueprintjs/core';

import { PolotnoContainer, SidePanelWrap, WorkspaceWrap } from 'polotno';
import { Toolbar } from 'polotno/toolbar/toolbar';
import { ZoomButtons } from 'polotno/toolbar/zoom-buttons';
import { SidePanel, DEFAULT_SECTIONS } from 'polotno/side-panel';
import { Workspace } from 'polotno/canvas/workspace';
import { PagesTimeline } from 'polotno/pages-timeline';
import { setTranslations } from 'polotno/config';

// 导入新的UI组件
import ImprovedApp from './components/ImprovedApp';
import PerfectEditor from './components/PerfectEditor';
import EnhancedEditor from './components/EnhancedEditor';
import SafeEnhancedEditor from './components/SafeEnhancedEditor';
import BeautifulEditor from './components/BeautifulEditor';
import UltraModernEditor from './components/UltraModernEditor';

import { loadFile } from './file';

import { QrSection } from './sections/qr-section';
import { QuotesSection } from './sections/quotes-section';
import { IconsSection } from './sections/icons-section';
import { ShapesSection } from './sections/shapes-section';
import { StableDiffusionSection } from './sections/stable-diffusion-section';
import { MyDesignsSection } from './sections/my-designs-section';
import { LayersSection } from './sections/layers-section';
import { UploadSection } from './sections/upload-section';

import { useProject } from './project';

import fr from './translations/fr';
import en from './translations/en';
import id from './translations/id';
import ru from './translations/ru';
import ptBr from './translations/pt-br';
import zhCh from './translations/zh-ch';

import Topbar from './topbar/topbar';

// import '@blueprintjs/core/lib/css/blueprint.css';
// 导入新的AI Studio样式
import './styles/ai-studio.css';
import './styles/perfect-editor.css';
import './styles/enhanced-editor.css';

// load default translations
setTranslations(en);

// replace elements section with just shapes
DEFAULT_SECTIONS.splice(3, 1, ShapesSection);
// add icons
DEFAULT_SECTIONS.splice(3, 0, IconsSection);
// add two more sections
DEFAULT_SECTIONS.push(QuotesSection, QrSection);
DEFAULT_SECTIONS.unshift(UploadSection);
DEFAULT_SECTIONS.unshift(MyDesignsSection);
// add layers section
DEFAULT_SECTIONS.push(LayersSection);

DEFAULT_SECTIONS.push(StableDiffusionSection);
// DEFAULT_SECTIONS.push(VideosSection);

const isStandalone = () => {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone
  );
};

const getOffsetHeight = () => {
  let safeAreaInsetBottom = 0;

  if (isStandalone()) {
    // Try to get the safe area inset using env() variables
    const safeAreaInsetBottomString = getComputedStyle(
      document.documentElement
    ).getPropertyValue('env(safe-area-inset-bottom)');
    if (safeAreaInsetBottomString) {
      safeAreaInsetBottom = parseFloat(safeAreaInsetBottomString);
    }

    // Fallback values for specific devices if env() is not supported
    if (!safeAreaInsetBottom) {
      const userAgent = navigator.userAgent || navigator.vendor || window.opera;

      if (/iPhone|iPad|iPod/i.test(userAgent) && !window.MSStream) {
        // This is an approximation; you might need to adjust this value based on testing
        safeAreaInsetBottom = 20; // Example fallback value for iPhone
      }
    }
  }

  return window.innerHeight - safeAreaInsetBottom;
};

const useHeight = () => {
  const [height, setHeight] = React.useState(getOffsetHeight());
  React.useEffect(() => {
    window.addEventListener('resize', () => {
      setHeight(getOffsetHeight());
    });
  }, []);
  return height;
};

const App = observer(({ store }) => {
  const project = useProject();
  const height = useHeight();
  const [uiMode, setUiMode] = React.useState('ultra'); // 'ultra', 'beautiful', 'enhanced', 'perfect', 'improved', or 'classic'
  const [selectedTool, setSelectedTool] = React.useState('select');

  React.useEffect(() => {
    if (project.language.startsWith('fr')) {
      setTranslations(fr, { validate: true });
    } else if (project.language.startsWith('id')) {
      setTranslations(id, { validate: true });
    } else if (project.language.startsWith('ru')) {
      setTranslations(ru, { validate: true });
    } else if (project.language.startsWith('pt')) {
      setTranslations(ptBr, { validate: true });
    } else if (project.language.startsWith('zh')) {
      setTranslations(zhCh, { validate: true });
    } else {
      setTranslations(en, { validate: true });
    }
  }, [project.language]);

  React.useEffect(() => {
    project.firstLoad();
  }, []);

  const handleDrop = (ev) => {
    // Prevent default behavior (Prevent file from being opened)
    ev.preventDefault();

    // skip the case if we dropped DOM element from side panel
    // in that case Safari will have more data in "items"
    if (ev.dataTransfer.files.length !== ev.dataTransfer.items.length) {
      return;
    }
    // Use DataTransfer interface to access the file(s)
    for (let i = 0; i < ev.dataTransfer.files.length; i++) {
      loadFile(ev.dataTransfer.files[i], store);
    }
  };

  const handleToolSelect = (toolId) => {
    setSelectedTool(toolId);
    // TODO: 实现工具切换逻辑
  };

  // 使用超现代编辑器UI
  if (uiMode === 'ultra') {
    return <UltraModernEditor store={store} />;
  }

  // 使用美化编辑器UI
  if (uiMode === 'beautiful') {
    return <BeautifulEditor store={store} />;
  }

  // 使用增强编辑器UI
  if (uiMode === 'enhanced') {
    return <SafeEnhancedEditor store={store} />;
  }

  // 使用完美编辑器UI
  if (uiMode === 'perfect') {
    return <PerfectEditor store={store} />;
  }

  // 使用改进的新UI布局
  if (uiMode === 'improved') {
    return <ImprovedApp store={store} />;
  }

  // 保留原有UI布局作为备选
  return (
    <div
      style={{
        width: '100vw',
        height: height + 'px',
        display: 'flex',
        flexDirection: 'column',
      }}
      onDrop={handleDrop}
    >
      <div style={{ 
        position: 'absolute', 
        top: '10px', 
        right: '10px', 
        zIndex: 1000 
      }}>
        <select 
          onChange={(e) => setUiMode(e.target.value)}
          value={uiMode}
          style={{
            padding: '8px 16px',
            background: '#3B82F6',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          <option value="ultra">Ultra Modern 🌟</option>
          <option value="beautiful">Beautiful Studio ✨</option>
          <option value="enhanced">Enhanced Studio</option>
          <option value="perfect">Perfect Editor</option>
          <option value="improved">Improved UI</option>
          <option value="classic">Classic UI</option>
        </select>
      </div>
      <Topbar store={store} />
      <div style={{ height: 'calc(100% - 50px)' }}>
        <PolotnoContainer className="polotno-app-container">
          <SidePanelWrap>
            <SidePanel store={store} sections={DEFAULT_SECTIONS} />
          </SidePanelWrap>
          <WorkspaceWrap>
            <Toolbar store={store} />
            <Workspace store={store} />
            <ZoomButtons store={store} />
            <PagesTimeline store={store} />
          </WorkspaceWrap>
        </PolotnoContainer>
      </div>
      {project.status === 'loading' && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(0,0,0,0.5)',
            zIndex: 1000,
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              color: 'white',
            }}
          >
            <Spinner />
          </div>
        </div>
      )}
    </div>
  );
});

export default App;
