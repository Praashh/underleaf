import React from 'react';
import { ZoomIn, ZoomOut, Maximize2, ChevronLeft, ChevronRight, Download } from 'lucide-react';
import { save } from '@tauri-apps/plugin-dialog';
import { useProjectStore } from '../../store/projectStore';
import { exportPdf } from '../../utils/tauri';
import './PdfToolbar.css';

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
    <div className="pdf-toolbar">
      <div className="pdf-toolbar-left">
        <button
          className="toolbar-btn"
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage <= 1}
        >
          <ChevronLeft size={16} />
        </button>
        <span className="page-indicator">
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

      <div className="pdf-toolbar-center">
        <button className="toolbar-btn" onClick={onZoomOut}>
          <ZoomOut size={15} />
        </button>
        <span className="zoom-indicator">{Math.round(scale * 100)}%</span>
        <button className="toolbar-btn" onClick={onZoomIn}>
          <ZoomIn size={15} />
        </button>
        <button className="toolbar-btn" onClick={onZoomFit}>
          <Maximize2 size={14} />
        </button>
      </div>

      <div className="pdf-toolbar-right">
        <button
          className="toolbar-btn download-btn"
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
