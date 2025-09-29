# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- **Start development server**: `npm start` (runs on port 3002 via Vite)
- **Build for production**: `npm run build`

## Project Architecture

This is a React-based design editor built on the Polotno SDK. The application follows a modular architecture:

### Core Structure
- **Entry point**: `polotno-studio-master/src/index.jsx` - Sets up the store, project context, and error boundaries
- **Main app**: `polotno-studio-master/src/App.jsx` - Configures the Polotno editor with custom sections and handles drag/drop
- **Store setup**: Uses Polotno's store with API key `nFA5H9elEytDyPyvKL7T` and development mode domain check bypass

### Custom Sections
The app extends the default Polotno sections with custom implementations in `polotno-studio-master/src/sections/`:
- `my-designs-section.jsx` - User's saved designs
- `stable-diffusion-section.jsx` - AI image generation
- `layers-section.jsx` - Layer management
- `qr-section.jsx` - QR code generation
- `quotes-section.jsx` - Text quotes
- `icons-section.jsx` - Icon library
- `shapes-section.jsx` - Shape tools (replaces default elements)
- `video-section.jsx` - Video elements
- `upload-section.jsx` - File uploads

### Topbar Components
Located in `polotno-studio-master/src/topbar/`:
- `topbar.jsx` - Main toolbar container
- `file-menu.jsx` - File operations
- `download-button.jsx` - Export functionality
- `user-menu.jsx` - User account features
- `psd-export-button.jsx` - PSD export functionality
- `debug-button.jsx` - Development debugging tools
- `postprocess.jsx` - Post-processing effects
- `post-process-button.jsx` - Post-process UI component

### Key Utilities
- `polotno-studio-master/src/project.js` - Project state management and persistence
- `polotno-studio-master/src/file.js` - File loading and handling
- `polotno-studio-master/src/api.js` - API communication
- `polotno-studio-master/src/storage.js` - Local storage utilities
- `polotno-studio-master/src/psd-export.js` - PSD export functionality
- `polotno-studio-master/src/psd-utils.js` - PSD processing utilities

### Internationalization
Multi-language support with translations in `polotno-studio-master/src/translations/` for: English (`en.json`), French (`fr.json`), Indonesian (`id.json`), Russian (`ru.json`), Portuguese (Brazil) (`pt-br.json`), and Chinese (`zh-ch.json`).

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