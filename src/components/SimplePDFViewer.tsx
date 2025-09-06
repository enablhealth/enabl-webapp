'use client';

import React, { useState, useEffect, useRef } from 'react';
import * as pdfjs from 'pdfjs-dist';
import { ChevronLeft, ChevronRight, Download, ZoomIn, ZoomOut } from 'lucide-react';

// Configure PDF.js worker
if (typeof window !== 'undefined') {
  pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.js';
}

interface SimplePDFViewerProps {
  pdfUrl: string;
  documentName: string;
  onDownload?: () => void;
}

export default function SimplePDFViewer({ pdfUrl, documentName, onDownload }: SimplePDFViewerProps) {
  const [pdfDoc, setPdfDoc] = useState<pdfjs.PDFDocumentProxy | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [zoom, setZoom] = useState(1.0);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    loadPDF();
  }, [pdfUrl]);

  useEffect(() => {
    if (pdfDoc && currentPage) {
      renderPage();
    }
  }, [pdfDoc, currentPage, zoom]);

  const loadPDF = async () => {
    try {
      setLoading(true);
      const pdf = await pdfjs.getDocument(pdfUrl).promise;
      setPdfDoc(pdf);
      setTotalPages(pdf.numPages);
      setCurrentPage(1);
    } catch (error) {
      console.error('Error loading PDF:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderPage = async () => {
    if (!pdfDoc || !canvasRef.current) return;

    try {
      const page = await pdfDoc.getPage(currentPage);
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      
      if (!context) return;

      const viewport = page.getViewport({ scale: zoom });
      canvas.height = viewport.height;
      canvas.width = viewport.width;

      const renderContext = {
        canvasContext: context,
        viewport: viewport,
        canvas: canvas,
      };

      await page.render(renderContext).promise;
    } catch (error) {
      console.error('Error rendering page:', error);
    }
  };

  const goToPage = (pageNum: number) => {
    if (pageNum >= 1 && pageNum <= totalPages) {
      setCurrentPage(pageNum);
    }
  };

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 0.25, 3));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 0.25, 0.5));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
          <p className="text-gray-600">Loading PDF...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex bg-gray-50">
      {/* Side Navigation Panel */}
      <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 truncate" title={documentName}>
            {documentName}
          </h3>
          <p className="text-sm text-gray-500 mt-1">{totalPages} pages</p>
        </div>

        {/* Controls */}
        <div className="p-4 border-b border-gray-200 space-y-3">
          {/* Page Navigation */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Page</span>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage <= 1}
                className="p-1 rounded hover:bg-gray-100 disabled:opacity-50"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm font-medium min-w-[60px] text-center">
                {currentPage} / {totalPages}
              </span>
              <button
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage >= totalPages}
                className="p-1 rounded hover:bg-gray-100 disabled:opacity-50"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Zoom Controls */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Zoom</span>
            <div className="flex items-center space-x-2">
              <button
                onClick={handleZoomOut}
                className="p-1 rounded hover:bg-gray-100"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <span className="text-sm font-medium min-w-[50px] text-center">
                {Math.round(zoom * 100)}%
              </span>
              <button
                onClick={handleZoomIn}
                className="p-1 rounded hover:bg-gray-100"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Download Button */}
          {onDownload && (
            <button
              onClick={onDownload}
              className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Download</span>
            </button>
          )}
        </div>

        {/* Page Thumbnails/List */}
        <div className="flex-1 overflow-y-auto p-2">
          <div className="space-y-2">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
              <button
                key={pageNum}
                onClick={() => goToPage(pageNum)}
                className={`w-full text-left px-3 py-2 rounded text-sm transition-colors ${
                  currentPage === pageNum
                    ? 'bg-blue-100 text-blue-700 border border-blue-200'
                    : 'hover:bg-gray-100 text-gray-700'
                }`}
              >
                Page {pageNum}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main PDF Viewer */}
      <div className="flex-1 overflow-auto p-4">
        <div className="flex justify-center">
          <div className="bg-white shadow-lg">
            <canvas
              ref={canvasRef}
              className="border border-gray-300"
              style={{ 
                display: 'block',
                maxWidth: '100%',
                height: 'auto'
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
