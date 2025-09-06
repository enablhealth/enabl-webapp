'use client';

import React, { useState, useEffect, useRef } from 'react';
import * as pdfjs from 'pdfjs-dist';
import { PDFDocument } from 'pdf-lib';
import { 
  ChevronLeft, 
  ChevronRight, 
  Download, 
  ZoomIn, 
  ZoomOut, 
  Save,
  Edit3,
  Eye,
  Type,
  Square,
  Minus,
  RotateCcw,
  RotateCw,
  Trash2
} from 'lucide-react';

// Configure PDF.js worker
if (typeof window !== 'undefined') {
  pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.js';
}

interface PDFViewerEditorProps {
  pdfUrl: string;
  documentName: string;
  onDownload?: () => void;
  onSave?: (pdfBytes: Uint8Array) => Promise<void>;
}

interface Annotation {
  id: string;
  type: 'text' | 'rectangle' | 'line';
  x: number;
  y: number;
  width?: number;
  height?: number;
  text?: string;
  color: string;
  page: number;
}

export default function PDFViewerEditor({ 
  pdfUrl, 
  documentName, 
  onDownload, 
  onSave 
}: PDFViewerEditorProps) {
  const [pdfDoc, setPdfDoc] = useState<pdfjs.PDFDocumentProxy | null>(null);
  const [pdfLibDoc, setPdfLibDoc] = useState<PDFDocument | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [zoom, setZoom] = useState(1.0);
  const [mode, setMode] = useState<'view' | 'edit'>('view');
  const [editTool, setEditTool] = useState<'text' | 'rectangle' | 'line'>('text');
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

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
      
      // Load with PDF.js for viewing
      const pdf = await pdfjs.getDocument(pdfUrl).promise;
      setPdfDoc(pdf);
      setTotalPages(pdf.numPages);
      setCurrentPage(1);
      
      // Load with pdf-lib for editing
      const response = await fetch(pdfUrl);
      const pdfBytes = await response.arrayBuffer();
      const pdfLibDocument = await PDFDocument.load(pdfBytes);
      setPdfLibDoc(pdfLibDocument);
      
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
      renderAnnotations();
    } catch (error) {
      console.error('Error rendering page:', error);
    }
  };

  const renderAnnotations = () => {
    if (!overlayRef.current || !canvasRef.current) return;

    const overlay = overlayRef.current;
    overlay.innerHTML = '';

    const pageAnnotations = annotations.filter(ann => ann.page === currentPage);
    
    pageAnnotations.forEach(annotation => {
      const element = document.createElement('div');
      element.style.position = 'absolute';
      element.style.left = `${annotation.x * zoom}px`;
      element.style.top = `${annotation.y * zoom}px`;
      element.style.color = annotation.color;
      element.style.fontSize = `${14 * zoom}px`;
      element.style.pointerEvents = mode === 'edit' ? 'auto' : 'none';
      element.style.cursor = mode === 'edit' ? 'pointer' : 'default';

      if (annotation.type === 'text') {
        element.textContent = annotation.text || 'Text';
        element.style.backgroundColor = 'rgba(255, 255, 0, 0.3)';
        element.style.padding = '2px 4px';
        element.style.borderRadius = '2px';
      } else if (annotation.type === 'rectangle') {
        element.style.width = `${(annotation.width || 100) * zoom}px`;
        element.style.height = `${(annotation.height || 50) * zoom}px`;
        element.style.border = `2px solid ${annotation.color}`;
        element.style.backgroundColor = 'transparent';
      } else if (annotation.type === 'line') {
        element.style.width = `${(annotation.width || 100) * zoom}px`;
        element.style.height = '2px';
        element.style.backgroundColor = annotation.color;
      }

      if (mode === 'edit') {
        element.onclick = () => deleteAnnotation(annotation.id);
        element.title = 'Click to delete';
      }

      overlay.appendChild(element);
    });
  };

  const handleCanvasClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (mode !== 'edit' || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = (event.clientX - rect.left) / zoom;
    const y = (event.clientY - rect.top) / zoom;

    const newAnnotation: Annotation = {
      id: Date.now().toString(),
      type: editTool,
      x,
      y,
      width: editTool !== 'text' ? 100 : undefined,
      height: editTool === 'rectangle' ? 50 : undefined,
      text: editTool === 'text' ? 'New text' : undefined,
      color: '#ff0000',
      page: currentPage,
    };

    setAnnotations(prev => [...prev, newAnnotation]);
  };

  const deleteAnnotation = (id: string) => {
    setAnnotations(prev => prev.filter(ann => ann.id !== id));
  };

  const handleSave = async () => {
    if (!pdfLibDoc || !onSave) return;

    try {
      setIsSaving(true);
      
      // Here you would apply annotations to the PDF
      // For now, we'll just save the original document
      const pdfBytes = await pdfLibDoc.save();
      await onSave(pdfBytes);
      setLastSaved(new Date());
      
    } catch (error) {
      console.error('Error saving PDF:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDownload = async () => {
    if (!pdfLibDoc) return;

    try {
      const pdfBytes = await pdfLibDoc.save();
      const blob = new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = documentName || 'document.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading PDF:', error);
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
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 truncate" title={documentName}>
            {documentName}
          </h3>
          <p className="text-sm text-gray-500 mt-1">{totalPages} pages</p>
        </div>

        {/* Mode Toggle */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex rounded-lg border border-gray-200 overflow-hidden">
            <button
              onClick={() => setMode('view')}
              className={`flex-1 flex items-center justify-center space-x-2 px-3 py-2 text-sm ${
                mode === 'view' 
                  ? 'bg-blue-100 text-blue-700 border-blue-200' 
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Eye className="w-4 h-4" />
              <span>View</span>
            </button>
            <button
              onClick={() => setMode('edit')}
              className={`flex-1 flex items-center justify-center space-x-2 px-3 py-2 text-sm ${
                mode === 'edit' 
                  ? 'bg-green-100 text-green-700 border-green-200' 
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Edit3 className="w-4 h-4" />
              <span>Edit</span>
            </button>
          </div>
        </div>

        {/* Edit Tools */}
        {mode === 'edit' && (
          <div className="p-4 border-b border-gray-200">
            <h4 className="text-sm font-medium text-gray-900 mb-3">Edit Tools</h4>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => setEditTool('text')}
                className={`p-2 rounded border ${
                  editTool === 'text' 
                    ? 'border-blue-500 bg-blue-50 text-blue-700' 
                    : 'border-gray-200 hover:bg-gray-50'
                }`}
                title="Add text"
              >
                <Type className="w-4 h-4 mx-auto" />
              </button>
              <button
                onClick={() => setEditTool('rectangle')}
                className={`p-2 rounded border ${
                  editTool === 'rectangle' 
                    ? 'border-blue-500 bg-blue-50 text-blue-700' 
                    : 'border-gray-200 hover:bg-gray-50'
                }`}
                title="Add rectangle"
              >
                <Square className="w-4 h-4 mx-auto" />
              </button>
              <button
                onClick={() => setEditTool('line')}
                className={`p-2 rounded border ${
                  editTool === 'line' 
                    ? 'border-blue-500 bg-blue-50 text-blue-700' 
                    : 'border-gray-200 hover:bg-gray-50'
                }`}
                title="Add line"
              >
                <Minus className="w-4 h-4 mx-auto" />
              </button>
            </div>
            
            {annotations.filter(ann => ann.page === currentPage).length > 0 && (
              <div className="mt-3">
                <button
                  onClick={() => setAnnotations(prev => prev.filter(ann => ann.page !== currentPage))}
                  className="w-full flex items-center justify-center space-x-2 px-3 py-2 text-sm text-red-600 border border-red-200 rounded hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Clear Page</span>
                </button>
              </div>
            )}
          </div>
        )}

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

          {/* Action Buttons */}
          <div className="space-y-2">
            {mode === 'edit' && onSave && (
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 transition-colors"
              >
                <Save className="w-4 h-4" />
                <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
              </button>
            )}
            
            <button
              onClick={handleDownload}
              className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Download</span>
            </button>
          </div>

          {lastSaved && (
            <p className="text-xs text-green-600 text-center">
              Saved at {lastSaved.toLocaleTimeString()}
            </p>
          )}
        </div>

        {/* Page List */}
        <div className="flex-1 overflow-y-auto p-2">
          <div className="space-y-2">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => {
              const pageAnnotationCount = annotations.filter(ann => ann.page === pageNum).length;
              return (
                <button
                  key={pageNum}
                  onClick={() => goToPage(pageNum)}
                  className={`w-full text-left px-3 py-2 rounded text-sm transition-colors ${
                    currentPage === pageNum
                      ? 'bg-blue-100 text-blue-700 border border-blue-200'
                      : 'hover:bg-gray-100 text-gray-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span>Page {pageNum}</span>
                    {pageAnnotationCount > 0 && (
                      <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full">
                        {pageAnnotationCount}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main PDF Viewer */}
      <div className="flex-1 overflow-auto p-4">
        <div className="flex justify-center">
          <div className="relative bg-white shadow-lg" ref={containerRef}>
            <canvas
              ref={canvasRef}
              className="border border-gray-300"
              style={{ 
                display: 'block',
                maxWidth: '100%',
                height: 'auto'
              }}
            />
            {mode === 'edit' && (
              <div
                ref={overlayRef}
                className="absolute inset-0 cursor-crosshair"
                onClick={handleCanvasClick}
                style={{ pointerEvents: 'auto' }}
              />
            )}
          </div>
        </div>
        
        {mode === 'edit' && (
          <div className="text-center mt-4 text-sm text-gray-600">
            Click on the PDF to add {editTool === 'text' ? 'text' : editTool === 'rectangle' ? 'a rectangle' : 'a line'}
          </div>
        )}
      </div>
    </div>
  );
}
