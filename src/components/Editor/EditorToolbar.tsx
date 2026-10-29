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
import './EditorToolbar.css';

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
    className="toolbar-btn tooltip"
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
    <div className="editor-toolbar">
      {/* Overleaf [ Code ] [ Visual ] Tabs */}
      <div className="toolbar-mode-toggle">
        <button
          type="button"
          className={`mode-btn ${editorMode === 'code' ? 'active' : ''}`}
          onClick={() => setEditorMode('code')}
        >
          <Code size={13} style={{ marginRight: '4px', verticalAlign: '-2px' }} />
          Code
        </button>
        <button
          type="button"
          className={`mode-btn ${editorMode === 'visual' ? 'active' : ''}`}
          onClick={() => setEditorMode('visual')}
        >
          <Eye size={13} style={{ marginRight: '4px', verticalAlign: '-2px' }} />
          Visual
        </button>
      </div>

      <div className="toolbar-divider" />

      {/* History */}
      <div className="toolbar-group">
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

      <div className="toolbar-divider" />

      {/* Formatting Tools */}
      <div className="toolbar-group">
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

      <div className="toolbar-divider" />

      <div className="toolbar-group">
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

      <div className="toolbar-divider" />

      <div className="toolbar-group">
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

      <div className="toolbar-divider" />

      <div className="toolbar-group">
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

      <div className="toolbar-spacer" />

      {/* Mode / Editing indicator */}
      <div className="toolbar-editing-badge">
        <Edit2 size={12} />
        <span>Editing</span>
      </div>
    </div>
  );
};

export default EditorToolbar;
