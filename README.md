# Underleaf

A desktop LaTeX editor designed for resume and CV authoring, inspired by Overleaf. Runs entirely offline with an embedded TeX engine, and features an integrated multi-provider AI Copilot.

---

## Features

- **Embedded Tectonic Engine**: Native in-memory LaTeX-to-PDF compilation without requiring MacTeX or TeX Live.
- **AI Copilot & LaTeX Assistant**: Built-in support for terminal CLI agents (`claude`, `gemini`, `agy`, `opencode`, `codex`) and local/remote OpenAI-compatible endpoints (Ollama, LM Studio, OpenRouter, Groq).
  - One-click LaTeX compilation error diagnostics and auto-patching.
  - STAR/XYZ method resume bullet-point optimizer.
  - Interactive LaTeX chat with diff previews and one-click application to your document.
- **Split-View Interface**: CodeMirror 6 editor on the left and real-time live PDF preview on the right.
- **Dual Editor Modes**: Code mode with syntax highlighting and Visual mode with preamble management.
- **Formatting Toolbar**: Quick controls for bold, italics, lists, tables, links, and math symbols.
- **Built-in Templates**: Jake's Resume, Modern CV, Academic CV, John Doe Resume, and Blank project.
- **Local Filesystem Storage**: All projects saved locally under `~/underleaf/projects/`.
- **Native PDF Export**: Save publication-ready PDFs directly via system file dialogs.

---

## Tech Stack

- **Frontend**: React 19, TypeScript, Vite, CodeMirror 6, react-pdf, react-resizable-panels, react-markdown, Tailwind CSS v4, Zustand
- **Backend**: Tauri 2, Rust, Tectonic 0.17, Tokio, Reqwest

---

## Installation Guide

### Option 1: Pre-built Binaries (Recommended)

Download the latest release for your platform from the [GitHub Releases](https://github.com/Praashh/underleaf/releases) page.

#### macOS (.dmg)
1. Download `Underleaf_x.x.x_aarch64.dmg` (Apple Silicon M1/M2/M3/M4) or `Underleaf_x.x.x_x64.dmg` (Intel).
2. Open the `.dmg` file and drag **Underleaf.app** into your **Applications** folder.
3. **macOS Gatekeeper Note**: Because pre-release binaries may not be notarized with an Apple Developer certificate, macOS might show a warning on first launch (*"Underleaf cannot be opened because the developer cannot be verified"*).
   - **To open**: Right-click (or Control-click) `Underleaf.app` in Finder and select **Open**, then click **Open** in the dialog.
   - **Or via Terminal**:
     ```bash
     xattr -cr /Applications/Underleaf.app
     ```

#### Linux (.deb / AppImage)
- **Debian / Ubuntu (.deb)**:
  ```bash
  sudo dpkg -i Underleaf_x.x.x_amd64.deb
  sudo apt-get install -f # resolve any missing dependencies if needed
  ```
- **AppImage**:
  ```bash
  chmod +x Underleaf_x.x.x_amd64.AppImage
  ./Underleaf_x.x.x_amd64.AppImage
  ```

#### Windows (.msi / .exe)
1. Download `Underleaf_x.x.x_x64-setup.exe` or `.msi`.
2. Run the installer and follow the setup wizard.

---

### Option 2: Build From Source

#### 1. System Prerequisites

- **Node.js**: v20 or higher (`node -v`)
- **Rust Toolchain**: Stable release (`rustc --version`, `cargo --version`)

##### Platform-Specific Dependencies

- **macOS**:
  ```bash
  brew install pkg-config icu4c
  ```
  *Note on Apple Silicon*: Set the pkg-config path so cargo can locate `icu-uc`:
  ```bash
  export PKG_CONFIG_PATH="$(brew --prefix icu4c)/lib/pkgconfig:$PKG_CONFIG_PATH"
  ```

- **Linux (Ubuntu / Debian)**:
  ```bash
  sudo apt-get update
  sudo apt-get install -y libwebkit2gtk-4.1-dev libappindicator3-dev \
    librsvg2-dev patchelf libssl-dev pkg-config \
    libicu-dev libfontconfig1-dev libgraphite2-dev libharfbuzz-dev
  ```

- **Windows**:
  Requires `vcpkg` for Tectonic's C/C++ dependencies:
  ```bash
  vcpkg install --triplet x64-windows-static-md fontconfig freetype "harfbuzz[graphite2]" icu libpng graphite2
  set TECTONIC_DEP_BACKEND=vcpkg
  set VCPKG_ROOT=C:\vcpkg
  set VCPKGRS_TRIPLET=x64-windows-static-md
  ```

#### 2. Clone and Install Dependencies

```bash
git clone https://github.com/Praashh/underleaf.git
cd underleaf
npm install
```

#### 3. Development Mode

Run the desktop application with hot-reloading:

```bash
# macOS with Apple Silicon:
PKG_CONFIG_PATH="$(brew --prefix icu4c)/lib/pkgconfig:$PKG_CONFIG_PATH" npm run tauri dev

# Linux / Windows:
npm run tauri dev
```

#### 4. Production Build

Generate release bundles (`.dmg`, `.deb`, `.msi`):

```bash
npm run tauri build
```
Built binaries will be placed in `src-tauri/target/release/bundle/`.

---

## Configuring AI Providers

Underleaf features native integration with local CLI agents and HTTP endpoints. Click **AI Settings** in the dashboard or **AI Copilot $\rightarrow$ Settings** in the editor to configure:

### 1. Terminal CLI Agents (Zero API Keys Needed)
If you have already authenticated any of the following CLI tools in your terminal, Underleaf discovers and uses them automatically:
- **Anthropic Claude Code (`claude`)**: `npm install -g @anthropic-ai/claude-code`
- **Google Gemini CLI (`gemini`)**: `npm install -g @google/gemini-cli`
- **Google Antigravity CLI (`agy`)**: `agy`
- **OpenCode CLI (`opencode`)**: `opencode`
- **OpenAI Codex CLI (`codex`)**: `codex`

Underleaf automatically augments its PATH to search standard installation directories (`/opt/homebrew/bin`, `~/.local/bin`, `~/.opencode/bin`, etc.) even when launched as a GUI app from Finder or the Dock.

### 2. Local Offline Models (Ollama / LM Studio)
1. Select **OpenAI-Compatible** under Provider.
2. Set the Base URL (e.g. `http://localhost:11434/v1` for Ollama or `http://localhost:1234/v1` for LM Studio).
3. Specify your model (e.g. `llama3.2`, `deepseek-r1`, `mistral`).
4. Keep API Key blank for local instances.

---

## Important Notes

### First-Time LaTeX Compilation
Underleaf uses an embedded Tectonic engine so you don't need a multi-gigabyte MacTeX or TeX Live installation. On the **very first compilation**, Tectonic downloads the standard TeX package support bundle (~200MB) via HTTPS. An active internet connection is required only once for this initial download; all subsequent compilations run 100% offline and quickly.

---

## License

Underleaf is licensed under the MIT License.
