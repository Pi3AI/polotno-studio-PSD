# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- **Start development server**: `npm start` - Runs on port 3002 via Vite
- **Build for production**: `npm run build` - Creates optimized production build with source maps

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
- `src/index.jsx` - Initializes Polotno store, sets up error boundaries, configures PSD precision rendering
- `src/App.jsx` - Main component that configures editor sections and handles drag/drop file uploads
- `index.html` - HTML entry with Vite injection points

#### Custom UI Components
- `src/components/ImprovedApp.jsx` - Alternative modern UI layout with AI assistant panel
- `src/components/AIAssistantPanel.jsx` - AI-powered design assistance interface
- `src/components/BottomToolbar.jsx` - Bottom toolbar for page management

#### Custom Sections (extending Polotno defaults)
All sections in `src/sections/`:
- `my-designs-section.jsx` - User's saved designs with cloud storage integration
- `upload-section.jsx` - Enhanced file upload supporting PSD/PDF/SVG/images
- `stable-diffusion-section.jsx` - AI image generation via Stable Diffusion
- `layers-section.jsx` - Advanced layer management interface
- `shapes-section.jsx` - Custom shapes (replaces default elements section)
- Additional: QR codes, quotes, icons, videos

#### PSD Processing Pipeline
Critical for maintaining pixel-perfect accuracy:
- `src/psd-utils.js` - Core PSD import/export with layer handling
- `src/utils/PrecisionRenderer.js` - Real-time DOM monitoring for accurate rendering
- `src/utils/PolotnoTextRenderer.js` - Subpixel text rendering accuracy
- `src/utils/PSDDebugger.js` - Visual debugging tools for PSD comparison
- `src/utils/FontManager.js` - Font loading and verification system
- `src/psd-export.js` - PSD export functionality

#### State & Storage Management
- `src/project.js` - MobX store managing project state, auto-save, cloud sync
- `src/api.js` - Puter API communication with fallback strategies
- `src/storage.js` - LocalStorage wrapper utilities
- `src/file.js` - File handling with format detection and PSD processing

#### Topbar Components
All in `src/topbar/`:
- `topbar.jsx` - Main toolbar container
- `file-menu.jsx` - File operations (new, open, save)
- `download-button.jsx` - Export to various formats
- `psd-export-button.jsx` - Specialized PSD export
- `user-menu.jsx` - User account and settings
- `debug-button.jsx` - Development tools (only in dev mode)

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
Translations in `src/translations/`:
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

The project uses stash for temporary changes storage. Check `git stash list` for saved work.

### Environment Notes

- Development server binds to port 3002
- Vite HMR (Hot Module Replacement) enabled for rapid development
- Source maps enabled in production builds for debugging
- Bundle analyzer available via vite-bundle-analyzer