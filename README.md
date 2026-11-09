# Underleaf

A desktop LaTeX editor designed for resume and CV authoring, inspired by Overleaf. Runs entirely offline with an embedded TeX engine.

## Features

- Embedded Tectonic engine for native in-memory LaTeX-to-PDF compilation without requiring MacTeX or TeX Live.
- Split-view interface with CodeMirror 6 editor and live PDF preview.
- Dual editor modes: Code mode with syntax highlighting and Visual mode with preamble management.
- Formatting toolbar for text styling, sections, lists, tables, and math symbols.
- Built-in resume templates (Jake's Resume, Modern CV, Academic CV, Blank).
- Local filesystem storage (`~/underleaf/projects/`).
- Native PDF export via file dialog.

## Tech Stack

- Frontend: React 19, TypeScript, Vite, CodeMirror 6, react-pdf
- Backend: Tauri 2, Rust, Tectonic 0.17, Tokio

## Prerequisites

- Node.js (v20+)
- Rust (stable toolchain)
- **macOS**: `brew install pkg-config icu4c`
- **Linux (Ubuntu/Debian)**:
  ```bash
  sudo apt-get install -y libwebkit2gtk-4.1-dev libappindicator3-dev \
    librsvg2-dev patchelf libssl-dev pkg-config \
    libicu-dev libfontconfig1-dev libgraphite2-dev libharfbuzz-dev
  ```

## Getting Started

### Install Dependencies

```bash
npm install
```

### Development

Run the Tauri application in development mode:

```bash
npm run tauri dev
```

### Build

Create a release bundle:

```bash
npm run tauri build
```

## Important Notes for Distribution

### First-Time Compilation
Underleaf uses an embedded Tectonic engine so users do not need MacTeX or TeX Live installed. On the **very first compilation**, Tectonic fetches the standard TeX support bundle (~200MB) via HTTPS. An active internet connection is required only for this initial setup; all subsequent compilations are fully offline and fast.

### macOS Gatekeeper (Unsigned Binaries)
If downloading an unsigned release binary on macOS, Gatekeeper may display a warning. To open:
- Right-click (or Control-click) `Underleaf.app` and choose **Open**.
- Or run in terminal: `xattr -cr /Applications/Underleaf.app`


