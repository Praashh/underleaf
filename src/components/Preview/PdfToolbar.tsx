import React from 'react';
import { ZoomIn, ZoomOut, Maximize2, ChevronLeft, ChevronRight, Download } from 'lucide-react';
import { save } from '@tauri-apps/plugin-dialog';
import { useProjectStore } from '../../store/projectStore';
import { exportPdf } from '../../utils/tauri';

interface PdfToolbarProps {
  currentPage: number;
  numPages: number;
  scale: number;
  onPageChange: (page: number) => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onZoomFit: () => void;
}

const PdfToolbar: React.FC<PdfToolbarProps> = ({
  currentPage,
  numPages,
  scale,
  onPageChange,
  onZoomIn,
  onZoomOut,
  onZoomFit,
}) => {
  const { currentProject } = useProjectStore();

  const handleDownload = async () => {
    if (!currentProject) return;

    try {
      const filePath = await save({
        defaultPath: `${currentProject.name}.pdf`,
        filters: [{ name: 'PDF', extensions: ['pdf'] }],
      });

      if (filePath) {
        await exportPdf(currentProject.id, filePath);
      }
    } catch (err) {
      console.error('Export failed:', err);
    }
  };

  return (
    <div className="flex items-center justify-between px-3.5 py-1.5 bg-bg-sidebar border-b border-border-subtle min-h-[40px] select-none">
      <div className="flex items-center gap-1">
        <button
          className="toolbar-btn"
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage <= 1}
        >
          <ChevronLeft size={16} />
        </button>
        <span className="text-[12px] font-medium text-text-secondary min-w-[50px] text-center tabular-nums">
          {numPages > 0 ? `${currentPage} / ${numPages}` : '— / —'}
        </span>
        <button
          className="toolbar-btn"
          onClick={() => onPageChange(Math.min(numPages, currentPage + 1))}
          disabled={currentPage >= numPages}
        >
          <ChevronRight size={16} />
        </button>
      </div>

      <div className="flex items-center gap-1">
        <button className="toolbar-btn" onClick={onZoomOut}>
          <ZoomOut size={15} />
        </button>
        <span className="text-[12px] font-medium text-text-secondary min-w-[44px] text-center tabular-nums">
          {Math.round(scale * 100)}%
        </span>
        <button className="toolbar-btn" onClick={onZoomIn}>
          <ZoomIn size={15} />
        </button>
        <button className="toolbar-btn" onClick={onZoomFit}>
          <Maximize2 size={14} />
        </button>
      </div>

      <div className="flex items-center gap-1">
        <button
          className="toolbar-btn !text-text-brand !bg-brand-green-light !border-brand-green-border hover:!bg-brand-green/25 hover:!text-brand-green-dark"
          onClick={handleDownload}
          title="Download PDF"
        >
          <Download size={15} />
        </button>
      </div>
    </div>
  );
};

export default PdfToolbar;
