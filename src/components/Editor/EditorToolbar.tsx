import React from 'react';
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Link,
  Code,
  Heading1,
  Heading2,
  Table,
  Sigma,
  Undo2,
  Redo2,
  Edit2,
  Eye,
} from 'lucide-react';
import { useEditorStore } from '../../store/editorStore';

interface ToolbarButtonProps {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}

const ToolbarButton: React.FC<ToolbarButtonProps> = ({
  icon,
  label,
  onClick,
}) => (
  <button
    className="toolbar-btn"
    data-tooltip={label}
    onClick={onClick}
    aria-label={label}
    type="button"
  >
    {icon}
  </button>
);

interface EditorToolbarProps {
  onAction: (action: string) => void;
}

const EditorToolbar: React.FC<EditorToolbarProps> = ({ onAction }) => {
  const { editorMode, setEditorMode } = useEditorStore();

  return (
    <div className="flex items-center px-3 py-1.5 bg-bg-sidebar border-b border-border-subtle gap-1.5 min-h-[40px] overflow-x-auto select-none">
      {/* Overleaf [ Code ] [ Visual ] Tabs */}
      <div className="flex bg-bg-hover rounded-md p-0.5 gap-0.5">
        <button
          type="button"
          className={`inline-flex items-center py-1 px-2.5 border-none rounded text-[12px] font-medium cursor-pointer transition-all duration-150 ${
            editorMode === 'code'
              ? 'bg-white text-text-primary font-semibold shadow-sm'
              : 'bg-transparent text-text-muted hover:text-text-primary'
          }`}
          onClick={() => setEditorMode('code')}
        >
          <Code size={13} style={{ marginRight: '4px', verticalAlign: '-2px' }} />
          Code
        </button>
        <button
          type="button"
          className={`inline-flex items-center py-1 px-2.5 border-none rounded text-[12px] font-medium cursor-pointer transition-all duration-150 ${
            editorMode === 'visual'
              ? 'bg-white text-text-primary font-semibold shadow-sm'
              : 'bg-transparent text-text-muted hover:text-text-primary'
          }`}
          onClick={() => setEditorMode('visual')}
        >
          <Eye size={13} style={{ marginRight: '4px', verticalAlign: '-2px' }} />
          Visual
        </button>
      </div>

      <div className="w-px h-[18px] bg-bg-hover mx-1 shrink-0" />

      {/* History */}
      <div className="flex items-center gap-0.5">
        <ToolbarButton
          icon={<Undo2 size={14} />}
          label="Undo (Ctrl+Z)"
          onClick={() => onAction('undo')}
        />
        <ToolbarButton
          icon={<Redo2 size={14} />}
          label="Redo (Ctrl+Y)"
          onClick={() => onAction('redo')}
        />
      </div>

      <div className="w-px h-[18px] bg-bg-hover mx-1 shrink-0" />

      {/* Formatting Tools */}
      <div className="flex items-center gap-0.5">
        <ToolbarButton
          icon={<Bold size={14} />}
          label="Bold (\textbf{})"
          onClick={() => onAction('bold')}
        />
        <ToolbarButton
          icon={<Italic size={14} />}
          label="Italic (\textit{})"
          onClick={() => onAction('italic')}
        />
      </div>

      <div className="w-px h-[18px] bg-bg-hover mx-1 shrink-0" />

      <div className="flex items-center gap-0.5">
        <ToolbarButton
          icon={<Heading1 size={14} />}
          label="Section (\section{})"
          onClick={() => onAction('section')}
        />
        <ToolbarButton
          icon={<Heading2 size={14} />}
          label="Subsection (\subsection{})"
          onClick={() => onAction('subsection')}
        />
      </div>

      <div className="w-px h-[18px] bg-bg-hover mx-1 shrink-0" />

      <div className="flex items-center gap-0.5">
        <ToolbarButton
          icon={<List size={14} />}
          label="Bullet List (itemize)"
          onClick={() => onAction('itemize')}
        />
        <ToolbarButton
          icon={<ListOrdered size={14} />}
          label="Numbered List (enumerate)"
          onClick={() => onAction('enumerate')}
        />
        <ToolbarButton
          icon={<Link size={14} />}
          label="Insert Link (\href)"
          onClick={() => onAction('link')}
        />
      </div>

      <div className="w-px h-[18px] bg-bg-hover mx-1 shrink-0" />

      <div className="flex items-center gap-0.5">
        <ToolbarButton
          icon={<Sigma size={14} />}
          label="Math Formula ($...$)"
          onClick={() => onAction('math')}
        />
        <ToolbarButton
          icon={<Table size={14} />}
          label="Table (tabular)"
          onClick={() => onAction('table')}
        />
        <ToolbarButton
          icon={<Code size={14} />}
          label="Verbatim Code"
          onClick={() => onAction('verbatim')}
        />
      </div>

      <div className="flex-1" />

      {/* Mode / Editing indicator */}
      <div className="inline-flex items-center gap-[5px] py-[3px] px-2 bg-bg-subtle border border-border-subtle rounded-xl text-[11.5px] text-text-muted font-medium">
        <Edit2 size={12} />
        <span>Editing</span>
      </div>
    </div>
  );
};

export default EditorToolbar;
