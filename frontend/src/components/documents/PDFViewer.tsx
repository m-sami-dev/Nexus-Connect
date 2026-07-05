import React, { useRef, useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Download } from 'lucide-react';

interface PDFViewerProps {
  documentUrl: string;
  fileName?: string;
}

/**
 * PDF Viewer Component using pdf.js
 * Displays PDF with page navigation and zoom controls
 * 
 * Install pdf.js: npm install pdfjs-dist
 * Then add to your component: <PDFViewer documentUrl={url} fileName={name} />
 */
export const PDFViewer: React.FC<PDFViewerProps> = ({ documentUrl, fileName = 'document.pdf' }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [numPages, setNumPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [zoom, setZoom] = useState(100);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const pdfDocRef = useRef<any>(null);

  // Initialize PDF.js
  useEffect(() => {
    // Note: You need to add this script to your HTML or import:
    // import * as pdfjsLib from 'pdfjs-dist';
    // For now, we'll load it dynamically
    if (typeof window !== 'undefined' && !(window as any).pdfjsWorker) {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
      script.onload = () => {
        loadPDF();
      };
      document.head.appendChild(script);
    } else {
      loadPDF();
    }
  }, [documentUrl]);

  const loadPDF = async () => {
    try {
      setLoading(true);
      
      // @ts-ignore
      if (!window.pdfjsLib) {
        setError('PDF.js library not loaded');
        return;
      }

      // @ts-ignore
      const pdfjsLib = window.pdfjsLib;
      pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

      const pdf = await pdfjsLib.getDocument(documentUrl).promise;
      pdfDocRef.current = pdf;
      setNumPages(pdf.numPages);
      setCurrentPage(1);
      setError(null);
      
      // Render first page
      renderPage(1, pdf);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load PDF');
      console.error('PDF loading error:', err);
    } finally {
      setLoading(false);
    }
  };

  const renderPage = async (pageNum: number, pdfDoc?: any) => {
    try {
      const pdf = pdfDoc || pdfDocRef.current;
      if (!pdf) return;

      const canvas = canvasRef.current;
      if (!canvas) return;

      const page = await pdf.getPage(pageNum);
      const viewport = page.getViewport({ scale: zoom / 100 });

      canvas.width = viewport.width;
      canvas.height = viewport.height;

      const context = canvas.getContext('2d');
      if (!context) return;

      const renderContext = {
        canvasContext: context,
        viewport: viewport,
      };

      await page.render(renderContext).promise;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to render page');
      console.error('Page rendering error:', err);
    }
  };

  const handlePreviousPage = async () => {
    if (currentPage > 1) {
      const newPage = currentPage - 1;
      setCurrentPage(newPage);
      await renderPage(newPage);
    }
  };

  const handleNextPage = async () => {
    if (currentPage < numPages) {
      const newPage = currentPage + 1;
      setCurrentPage(newPage);
      await renderPage(newPage);
    }
  };

  const handleZoomIn = async () => {
    const newZoom = Math.min(zoom + 25, 400);
    setZoom(newZoom);
    await renderPage(currentPage);
  };

  const handleZoomOut = async () => {
    const newZoom = Math.max(zoom - 25, 50);
    setZoom(newZoom);
    await renderPage(currentPage);
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = documentUrl;
    link.download = fileName;
    link.click();
  };

  const handleGoToPage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const pageNum = parseInt(e.target.value, 10);
    if (pageNum >= 1 && pageNum <= numPages) {
      setCurrentPage(pageNum);
      await renderPage(pageNum);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto bg-white rounded-lg shadow overflow-hidden">
      {/* Header */}
      <div className="bg-gray-100 border-b border-gray-300 px-6 py-4">
        <h3 className="text-lg font-semibold text-gray-800">{fileName}</h3>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border-b border-red-300 px-6 py-4">
          <p className="text-red-700 text-sm">
            <span className="font-semibold">Error:</span> {error}
          </p>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center h-96 bg-gray-50">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-300 border-t-blue-600 mb-4"></div>
            <p className="text-gray-600">Loading PDF...</p>
          </div>
        </div>
      )}

      {/* PDF Canvas */}
      {!loading && !error && (
        <>
          <div className="bg-gray-900 flex items-center justify-center overflow-auto" style={{ maxHeight: '70vh' }}>
            <canvas ref={canvasRef} className="max-w-full" />
          </div>

          {/* Controls */}
          <div className="bg-gray-100 border-t border-gray-300 px-6 py-4 flex flex-wrap items-center justify-between gap-4">
            {/* Page Navigation */}
            <div className="flex items-center gap-3">
              <button
                onClick={handlePreviousPage}
                disabled={currentPage <= 1}
                className="p-2 text-gray-600 hover:text-gray-900 disabled:text-gray-400 disabled:cursor-not-allowed rounded hover:bg-gray-200 transition-colors"
                title="Previous Page"
              >
                <ChevronLeft size={20} />
              </button>

              <div className="flex items-center gap-2">
                <input
                  type="number"
                  aria-label="Page number"
                  min="1"
                  max={numPages}
                  value={currentPage}
                  onChange={handleGoToPage}
                  className="w-12 px-2 py-1 border border-gray-300 rounded text-center text-sm focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-600">of {numPages}</span>
              </div>

              <button
                onClick={handleNextPage}
                disabled={currentPage >= numPages}
                className="p-2 text-gray-600 hover:text-gray-900 disabled:text-gray-400 disabled:cursor-not-allowed rounded hover:bg-gray-200 transition-colors"
                title="Next Page"
              >
                <ChevronRight size={20} />
              </button>
            </div>

            {/* Zoom Controls */}
            <div className="flex items-center gap-3">
              <button
                onClick={handleZoomOut}
                disabled={zoom <= 50}
                className="p-2 text-gray-600 hover:text-gray-900 disabled:text-gray-400 disabled:cursor-not-allowed rounded hover:bg-gray-200 transition-colors"
                title="Zoom Out"
              >
                <ZoomOut size={20} />
              </button>

              <span className="text-sm text-gray-600 min-w-fit">{zoom}%</span>

              <button
                onClick={handleZoomIn}
                disabled={zoom >= 400}
                className="p-2 text-gray-600 hover:text-gray-900 disabled:text-gray-400 disabled:cursor-not-allowed rounded hover:bg-gray-200 transition-colors"
                title="Zoom In"
              >
                <ZoomIn size={20} />
              </button>
            </div>

            {/* Download Button */}
            <button
              onClick={handleDownload}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded hover:bg-blue-700 transition-colors"
            >
              <Download size={18} />
              Download
            </button>
          </div>
        </>
      )}

      {/* Installation Instructions */}
      <div className="bg-blue-50 border-t border-blue-300 px-6 py-4 text-sm text-blue-700">
        <p className="font-semibold mb-2">📄 PDF Viewer Setup:</p>
        <p>
          This component requires pdf.js. It's loaded from CDN, but for production use:
          <br />
          <code className="bg-white px-2 py-1 rounded">npm install pdfjs-dist</code>
        </p>
      </div>
    </div>
  );
};

export default PDFViewer;
