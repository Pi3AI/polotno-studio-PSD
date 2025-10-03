# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Important: Project Structure

The actual project code is located in the `polotno-studio-master/` subdirectory. All development commands should be run from that directory:

```bash
cd polotno-studio-master
npm start  # or other commands
```

## Development Commands

**Note**: All commands must be run from the `polotno-studio-master/` directory.

- **Start development server**: `npm start` (runs on port 3002 via Vite)
- **Build for production**: `npm run build` (creates optimized production build with source maps)
- **Analyze bundle size**: `npm run build` then open the generated bundle analyzer report (automatically opens in browser via vite-bundle-analyzer plugin)

## Project Architecture

This is a React-based design editor built on the Polotno SDK with advanced PSD import/export capabilities. The application uses MobX for state management and includes comprehensive PSD processing systems for pixel-perfect accuracy.

### Core Dependencies & Configuration

- **Polotno SDK**: Core design editor (v2.28.3) - API key: `nFA5H9elEytDyPyvKL7T`
- **PSD Libraries**: `ag-psd` (v28.3.1) and `psd.js` (v3.9.2) for PSD processing
- **State Management**: MobX with auto-save functionality (5-second debounce)
- **Build Tool**: Vite with React plugin, Sentry integration for error tracking
- **Storage**: Dual approach - Puter API for cloud storage, localStorage fallback

### Application Structure

#### Entry Points
- `polotno-studio-master/src/index.jsx` - Initializes Polotno store, sets up error boundaries, configures PSD precision rendering
- `polotno-studio-master/src/App.jsx` - Main component that configures editor sections and handles drag/drop file uploads
- `polotno-studio-master/index.html` - HTML entry with Vite injection points

#### Custom UI Components
The project includes multiple editor variations and specialized components:

**Editor Variants** (alternative app layouts):
- `polotno-studio-master/src/components/UltraModernEditor.jsx` - Ultra-modern UI with floating toolbar and enhanced sidebar
- `polotno-studio-master/src/components/BeautifulEditor.jsx` - Polished editor with refined aesthetics
- `polotno-studio-master/src/components/EnhancedEditor.jsx` - Enhanced version with additional features
- `polotno-studio-master/src/components/SafeEnhancedEditor.jsx` - Stable enhanced editor variant
- `polotno-studio-master/src/components/PerfectEditor.jsx` - Performance-optimized editor layout
- `polotno-studio-master/src/components/ImprovedApp.jsx` - Modern UI layout with AI assistant panel
- `polotno-studio-master/src/components/LovartApp.jsx` - Specialized variant for art-focused workflows

**Specialized Components**:
- `polotno-studio-master/src/components/AIAssistantPanel.jsx` - AI-powered design assistance interface
- `polotno-studio-master/src/components/ImageSearchPanel.jsx` - Image search and discovery panel
- `polotno-studio-master/src/components/SmartFloatingToolbar.jsx` - Context-aware floating toolbar with MobX integration
- `polotno-studio-master/src/components/SimpleSidebar.jsx` - Streamlined sidebar with core Polotno tools
- `polotno-studio-master/src/components/UltraSidebar.jsx` - Advanced sidebar with extended functionality
- `polotno-studio-master/src/components/LeftToolbar.jsx` - Left-positioned toolbar for alternative layouts
- `polotno-studio-master/src/components/BottomToolbar.jsx` - Bottom toolbar for page management
- `polotno-studio-master/src/components/TextPanel.jsx` - Dedicated text editing and formatting panel
- `polotno-studio-master/src/components/UltraStyledPanel.jsx` - Highly styled panel component
- `polotno-studio-master/src/components/PreciseTextRenderer.jsx` - High-precision text rendering component

#### Custom Sections (extending Polotno defaults)
All sections in `polotno-studio-master/src/sections/`:
- `my-designs-section.jsx` - User's saved designs with cloud storage integration
- `upload-section.jsx` - Enhanced file upload supporting PSD/PDF/SVG/images
- `stable-diffusion-section.jsx` - AI image generation via Stable Diffusion
- `layers-section.jsx` - Advanced layer management interface
- `shapes-section.jsx` - Custom shapes (replaces default elements section)
- `qr-section.jsx` - QR code generation and customization
- `quotes-section.jsx` - Text quotes templates and styling
- `icons-section.jsx` - Icon library and management
- `video-section.jsx` - Video elements support and integration

#### Topbar Components
All in `polotno-studio-master/src/topbar/`:
- `topbar.jsx` - Main toolbar container
- `file-menu.jsx` - File operations (new, open, save)
- `download-button.jsx` - Export to various formats
- `psd-export-button.jsx` - Specialized PSD export
- `user-menu.jsx` - User account and settings
- `debug-button.jsx` - Development tools (only in dev mode)
- `postprocess.jsx` - Post-processing effects system
- `post-process-button.jsx` - Post-process UI controls

#### PSD Processing Pipeline
Critical for maintaining pixel-perfect accuracy:
- `polotno-studio-master/src/psd-utils.js` - Core PSD import/export with layer handling
- `polotno-studio-master/src/utils/PrecisionRenderer.js` - Real-time DOM monitoring for accurate rendering
- `polotno-studio-master/src/utils/PolotnoTextRenderer.js` - Subpixel text rendering accuracy
- `polotno-studio-master/src/utils/PSDDebugger.js` - Visual debugging tools for PSD comparison
- `polotno-studio-master/src/utils/FontManager.js` - Font loading and verification system
- `polotno-studio-master/src/psd-export.js` - PSD export functionality

#### State & Storage Management
- `polotno-studio-master/src/project.js` - MobX store managing project state, auto-save, cloud sync
- `polotno-studio-master/src/api.js` - Puter API communication with fallback strategies
- `polotno-studio-master/src/storage.js` - LocalStorage wrapper utilities
- `polotno-studio-master/src/file.js` - File handling with format detection and PSD processing

### Key Technical Considerations

#### PSD Import/Export
- Uses dual library approach (ag-psd for import, psd.js for validation)
- Maintains layer structure, blending modes, and effects
- Special handling for text layers with font preservation
- Real-time precision rendering with DOM monitoring

#### Auto-save & Storage
- Auto-saves every 5 seconds after changes (debounced)
- Primary: Puter cloud storage (when authenticated)
- Fallback: Browser localStorage
- Project state includes design data, metadata, and user preferences

#### Multi-language Support
Translations in `polotno-studio-master/src/translations/`:
- English (en.json) - default
- French (fr.json)
- Indonesian (id.json)
- Russian (ru.json)
- Portuguese Brazil (pt-br.json)
- Chinese (zh-ch.json)

Language detection order: localStorage → browser settings → default (en)

#### Development Mode Features
When running locally:
- Domain check bypass for API key validation
- Global access: `window.store` and `window.project`
- Debug button in topbar
- Enhanced error boundaries with cache clearing
- Sentry error tracking (can be disabled in vite.config.js)

### Git Workflow

Current branch structure:
- `master` - Main development branch
- Remote: `origin` points to GitHub repository

**Current Status**: Multiple uncommitted changes including new download modal components and smart floating toolbar enhancements. Recent development focuses on MobX event handling improvements and ultra-modern UI design.

**Recent Commits**:
- 3a09a1b - Fixed MobX event listening errors in floating toolbar
- caab1ae - Enhanced smart floating toolbar with perfect following and occlusion avoidance
- a56dd78 - Fixed text panel height property type errors
- 1ebe394 - Enhanced SimpleSidebar with integrated Polotno SDK functionality

### Environment Notes

- Development server binds to port 3002 with external access enabled (`host: '0.0.0.0'`)
- Vite HMR (Hot Module Replacement) enabled for rapid development
- Source maps enabled in production builds for debugging
- Bundle analyzer available via vite-bundle-analyzer (automatically opens after build)
- Sentry integration configured for error tracking (org: 'polotno', project: 'polotno-studio')

### Development Workflow Notes

- All development commands must be run from the `polotno-studio-master/` subdirectory
- The project structure has two CLAUDE.md files - root level and project level
- Recent focus on smart floating toolbar system replacing fixed topbar elements
- MobX store integration with auto-save every 5 seconds and real-time UI updates