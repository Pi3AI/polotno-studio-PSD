# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- **Start development server**: `npm start` (runs on port 3002 via Vite)
- **Build for production**: `npm run build`

## Project Architecture

This is a React-based design editor built on the Polotno SDK with specialized PSD import capabilities. The application follows a modular architecture with MobX state management and comprehensive PSD processing systems.

### Core Structure
- **Entry point**: `src/index.jsx` - Sets up the Polotno store, initializes project context, configures error boundaries, and establishes PSD precision rendering
- **Main app**: `src/App.jsx` - Configures the Polotno editor with custom sections and handles drag/drop
- **Store setup**: Uses Polotno's store with API key `nFA5H9elEytDyPyvKL7T` and development mode domain check bypass

### Custom Sections
The app extends the default Polotno sections with custom implementations in `src/sections/`:
- `my-designs-section.jsx` - User's saved designs management
- `stable-diffusion-section.jsx` - AI image generation integration
- `layers-section.jsx` - Advanced layer management
- `qr-section.jsx` - QR code generation
- `quotes-section.jsx` - Text quotes templates
- `icons-section.jsx` - Icon library
- `shapes-section.jsx` - Shape tools (replaces default elements)
- `video-section.jsx` - Video elements support
- `upload-section.jsx` - Enhanced file uploads with PSD support

### Topbar Components
Located in `src/topbar/`:
- `topbar.jsx` - Main toolbar container
- `file-menu.jsx` - File operations
- `download-button.jsx` - Export functionality
- `user-menu.jsx` - User account features
- `psd-export-button.jsx` - PSD export functionality
- `debug-button.jsx` - Development debugging tools
- `postprocess.jsx` - Post-processing effects
- `post-process-button.jsx` - Post-process UI component

### PSD Processing System
The application includes an advanced PSD import system with pixel-perfect accuracy:
- `src/psd-utils.js` - Core PSD processing utilities using ag-psd and psd.js libraries
- `src/utils/PrecisionRenderer.js` - Real-time DOM monitoring and style injection
- `src/utils/PolotnoTextRenderer.js` - Enhanced text rendering with subpixel accuracy
- `src/utils/PSDDebugger.js` - Debugging and comparison tools
- `src/utils/FontManager.js` - Font loading and verification
- `src/styles/psd-precision.css` - High-precision rendering styles

### Key Utilities
- `src/project.js` - MobX-based project state management with auto-save and cloud storage via Puter API
- `src/file.js` - File loading and handling with PSD processing
- `src/api.js` - API communication with Puter service and local storage fallback
- `src/storage.js` - Local storage utilities
- `src/psd-export.js` - PSD export functionality

### State Management
The application uses MobX for reactive state management, with the project module (`src/project.js`) handling:
- Auto-save functionality (5-second debounce)
- Cloud storage integration
- Local storage fallback
- Language detection and switching

### Internationalization
Multi-language support with translations in `src/translations/` for: English (`en.json`), French (`fr.json`), Indonesian (`id.json`), Russian (`ru.json`), Portuguese (Brazil) (`pt-br.json`), and Chinese (`zh-ch.json`).

### Build Configuration
- Uses Vite with React plugin (`@vitejs/plugin-react`)
- Includes Sentry for error tracking and monitoring
- Bundle analyzer for build optimization (`vite-bundle-analyzer`)
- Development server runs on port 3002
- Source maps enabled for production builds

### Development Mode
The app includes development-specific features:
- Domain check bypass for localhost
- Global store and project access via `window.store` and `window.project`
- Error boundary with cache clearing functionality
- Sentry integration for error tracking