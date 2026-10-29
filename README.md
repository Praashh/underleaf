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

- Node.js (v18+)
- Rust (stable toolchain)
- macOS: `brew install pkg-config icu4c`

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


