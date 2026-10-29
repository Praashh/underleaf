import { create } from 'zustand';

export type CompileStatus = 'idle' | 'compiling' | 'success' | 'error';

interface EditorState {
  content: string;
  fileName: string;
  isDirty: boolean;
  compileStatus: CompileStatus;
  pdfData: string | null;
  compileErrors: string[];
  compileWarnings: string[];
  compileTime: number | null;
  autoCompile: boolean;
  fontSize: number;
  wordWrap: boolean;
  showLineNumbers: boolean;
  editorMode: 'code' | 'visual';

  setContent: (content: string) => void;
  setFileName: (name: string) => void;
  setIsDirty: (dirty: boolean) => void;
  setCompileStatus: (status: CompileStatus) => void;
  setPdfData: (data: string | null) => void;
  setCompileErrors: (errors: string[]) => void;
  setCompileWarnings: (warnings: string[]) => void;
  setCompileTime: (time: number | null) => void;
  setAutoCompile: (auto: boolean) => void;
  setFontSize: (size: number) => void;
  setWordWrap: (wrap: boolean) => void;
  setShowLineNumbers: (show: boolean) => void;
  setEditorMode: (mode: 'code' | 'visual') => void;
}

export const useEditorStore = create<EditorState>((set) => ({
  content: '',
  fileName: 'main.tex',
  isDirty: false,
  compileStatus: 'idle',
  pdfData: null,
  compileErrors: [],
  compileWarnings: [],
  compileTime: null,
  autoCompile: false,
  fontSize: 14,
  wordWrap: true,
  showLineNumbers: true,
  editorMode: 'code',

  setContent: (content) => set({ content, isDirty: true }),
  setFileName: (fileName) => set({ fileName }),
  setIsDirty: (isDirty) => set({ isDirty }),
  setCompileStatus: (compileStatus) => set({ compileStatus }),
  setPdfData: (pdfData) => set({ pdfData }),
  setCompileErrors: (compileErrors) => set({ compileErrors }),
  setCompileWarnings: (compileWarnings) => set({ compileWarnings }),
  setCompileTime: (compileTime) => set({ compileTime }),
  setAutoCompile: (autoCompile) => set({ autoCompile }),
  setFontSize: (fontSize) => set({ fontSize }),
  setWordWrap: (wordWrap) => set({ wordWrap }),
  setShowLineNumbers: (showLineNumbers) => set({ showLineNumbers }),
  setEditorMode: (editorMode) => set({ editorMode }),
}));
