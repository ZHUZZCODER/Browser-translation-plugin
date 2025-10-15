# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Chrome browser extension called "Kimi翻译总结助手" (Kimi Translation & Summary Assistant) that provides intelligent translation and page summarization using the Kimi API. The extension operates through a sidebar interface and supports text selection translation and full page content summarization.

## Development Commands

### Loading the Extension
```bash
# Load extension in Chrome
# 1. Open chrome://extensions/
# 2. Enable "Developer mode"
# 3. Click "Load unpacked extension"
# 4. Select the project root directory
```

### Testing
- No automated test suite is configured
- Test manually by loading the extension and using translation/summarization features
- Test API connection through the options page

## Architecture

### Core Components

**Background Service Worker (`background.js`)**
- Central message router handling communication between content scripts, sidepanel, and options
- Manages KimiAPI instance and text selection state
- Handles sidepanel opening/closing
- Key message types: `translateText`, `summarizePage`, `textSelected`, `getSelectedText`, `testApiConnection`

**Content Script (`content.js`)**
- Injected into all web pages
- Detects text selection and sends to background worker
- Creates floating action button for quick access
- Supports keyboard shortcuts (Ctrl+Shift+T for translate, Ctrl+Shift+S for summarize)

**Sidepanel Interface (`sidepanel.js` + `sidepanel.html`)**
- Main user interface using Chrome's side panel API
- Manages translation and summarization operations
- Displays selected text and results
- Communicates with background worker via `chrome.runtime.sendMessage`

**API Integration (`kimi-api.js`)**
- Encapsulates all Kimi API interactions
- Uses `moonshot-v1-8k` model at `https://api.moonshot.cn/v1`
- Handles API key storage and validation
- Provides `translateText()` and `summarizeContent()` methods

**Settings Management (`options.js` + `options.html`)**
- Manages API key configuration and user preferences
- Handles Chrome extension options page
- Stores settings in `chrome.storage.sync`

### Communication Flow

1. User selects text → Content script detects → Background worker stores
2. User opens sidepanel → Sidepanel requests selected text from background
3. User clicks translate → Sidepanel sends to background → Background calls KimiAPI → Result returned to sidepanel
4. Page summarization follows similar pattern but extracts full page content

### Data Flow

- **Text Selection**: Content script → Background worker → Sidepanel
- **API Calls**: Sidepanel → Background worker → KimiAPI → External API
- **Settings**: Options page ↔ `chrome.storage.sync` ↔ Background worker

## Configuration

### Required Setup
1. **Kimi API Key**: Must be configured in options page before use
2. **Permissions**: Extension requires `activeTab`, `storage`, `sidePanel`, and `https://api.moonshot.cn/*`

### Icon Files
- Currently disabled in manifest.json to avoid loading errors
- When adding icons, create PNG files in `icons/` directory: 16x16, 32x32, 48x48, 128x128 pixels
- Restore icon configuration in manifest.json after adding files

### Language Support
Supports translation to: Chinese (zh), English (en), Japanese (ja), Korean (ko), French (fr), German (de), Spanish (es)

## File Structure Notes

- `manifest.json`: Chrome extension configuration (MV3)
- UI files: `popup.html`, `sidepanel.html`, `options.html` with corresponding CSS/JS
- `content.css`: Minimal styling for injected floating button
- No build process or bundling - direct file loading

## API Integration

The extension uses Kimi (Moonshot) API with specific prompt engineering:
- Translation prompts include target language and style preservation instructions
- Summarization prompts request structured, bullet-point format output
- Error handling includes API key validation and network error recovery