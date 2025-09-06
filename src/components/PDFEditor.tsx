/**
 * PDF Editor Component
 * 
 * Allows users to edit PDF documents with text annotations, form filling,
 * and basic modifications. Uses PDF-lib for client-side PDF manipulation.
 */

'use client';

import React, { useState, useRef, useEffect } from 'react';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import * as pdfjs from 'pdfjs-dist';
import { 
  Save, 
  Download, 
  Type, 
  MousePointer, 
  Undo, 
  Redo,
  ZoomIn,
  ZoomOut,
  RotateCw,
  X
} from 'lucide-react';

// Configure PDF.js worker - use local worker file
if (typeof window !== 'undefined') {
  pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.js';
}

export interface PDFEditAction {
  id: string;
  type: 'text' | 'annotation' | 'form-fill';
  x: number;
  y: number;
  page: number;
  content: string;
  fontSize: number;
  color: string;
  fontFamily?: string;
  fontWeight?: string;
  fontStyle?: string;
  textDecoration?: string;
  isSelected?: boolean;
}

interface PDFEditorProps {
  documentId: string;
  userId: string;
  pdfUrl: string;
  documentName: string;
  onSave?: (editedPdfBlob: Blob, actions: PDFEditAction[]) => Promise<void>;
  onClose?: () => void;
  isReadOnly?: boolean;
}

export default function PDFEditor({
  documentId,
  userId,
  pdfUrl,
  documentName,
  onSave,
  onClose,
  isReadOnly = false
}: PDFEditorProps) {
  const [pdfDoc, setPdfDoc] = useState<PDFDocument | null>(null);
  const [pdfJsDoc, setPdfJsDoc] = useState<pdfjs.PDFDocumentProxy | null>(null);
  const [editActions, setEditActions] = useState<PDFEditAction[]>([]);
  const [currentTool, setCurrentTool] = useState<'select' | 'text'>('select');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isRendering, setIsRendering] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  
  // Rich editing state
  const [selectedAction, setSelectedAction] = useState<string | null>(null);
  const [textColor, setTextColor] = useState('#000000');
  const [fontSize, setFontSize] = useState(14);
  const [fontFamily, setFontFamily] = useState('Arial');
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [viewMode, setViewMode] = useState<'single' | 'continuous'>('single');
  
  // Auto-save functionality
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  /**
   * Load PDF document from the signed URL
   */
  useEffect(() => {
    const loadPDF = async () => {
      try {
        setIsLoading(true);
        setError(null);

        console.log('🔄 Loading PDF from URL:', pdfUrl);

        // Fetch the PDF from the signed URL
        const response = await fetch(pdfUrl);
        if (!response.ok) {
          throw new Error(`Failed to load PDF: ${response.status} ${response.statusText}`);
        }

        const pdfBytes = await response.arrayBuffer();
        
        // Load with pdf-lib for editing
        const editDoc = await PDFDocument.load(pdfBytes);
        setPdfDoc(editDoc);

        // Load with PDF.js for rendering
        const loadingTask = pdfjs.getDocument({ data: pdfBytes });
        const renderDoc = await loadingTask.promise;
        setPdfJsDoc(renderDoc);
        
        setTotalPages(renderDoc.numPages);
        setCurrentPage(1); // Start with page 1 (1-based indexing)
        
        console.log('✅ PDF loaded successfully, pages:', renderDoc.numPages);

      } catch (err) {
        console.error('❌ Error loading PDF:', err);
        setError(err instanceof Error ? err.message : 'Failed to load PDF');
      } finally {
        setIsLoading(false);
      }
    };

    if (pdfUrl) {
      loadPDF();
    }
  }, [pdfUrl]);

  /**
   * Render PDF page to canvas using PDF.js
   */
  const renderPage = async (pageNumber: number) => {
    if (!pdfJsDoc || !canvasRef.current || isRendering) return;

    try {
      setIsRendering(true);
      console.log(`🖼️ Rendering page ${pageNumber}/${totalPages}`);
      
      const page = await pdfJsDoc.getPage(pageNumber);
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Calculate scale based on zoom
      const viewport = page.getViewport({ scale: zoom });
      
      // Set canvas size to match PDF page
      canvas.width = viewport.width;
      canvas.height = viewport.height;

      // Clear the canvas first
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Render the PDF page
      const renderContext = {
        canvasContext: ctx,
        viewport: viewport,
        canvas: canvas
      };

      await page.render(renderContext).promise;

      // Draw existing edit actions for this page on top of the PDF
      editActions
        .filter(action => action.page === pageNumber - 1) // Convert to 0-based for actions
        .forEach(action => {
          if (action.type === 'text') {
            // Set text properties
            ctx.fillStyle = action.color || '#000000';
            
            // Build font string with weight and style
            const weight = action.fontWeight || 'normal';
            const style = action.fontStyle || 'normal';
            const size = (action.fontSize || 14) * zoom;
            const family = action.fontFamily || 'Arial';
            ctx.font = `${style} ${weight} ${size}px ${family}`;
            
            // Draw text
            ctx.fillText(action.content, action.x * zoom, action.y * zoom);
            
            // Draw underline if specified
            if (action.textDecoration === 'underline') {
              const textMetrics = ctx.measureText(action.content);
              const underlineY = action.y * zoom + 2;
              ctx.beginPath();
              ctx.moveTo(action.x * zoom, underlineY);
              ctx.lineTo(action.x * zoom + textMetrics.width, underlineY);
              ctx.strokeStyle = action.color || '#000000';
              ctx.lineWidth = 1;
              ctx.stroke();
            }
            
            // Draw selection handles if this action is selected
            if (selectedAction === action.id) {
              const textMetrics = ctx.measureText(action.content);
              const textWidth = textMetrics.width;
              const textHeight = (action.fontSize || 14) * zoom;
              
              // Draw selection rectangle
              ctx.strokeStyle = '#007bff';
              ctx.lineWidth = 2;
              ctx.strokeRect(
                action.x * zoom - 2,
                action.y * zoom - textHeight,
                textWidth + 4,
                textHeight + 4
              );
              
              // Draw corner handles
              const handleSize = 6;
              ctx.fillStyle = '#007bff';
              // Top-left handle
              ctx.fillRect(action.x * zoom - 2 - handleSize/2, action.y * zoom - textHeight - handleSize/2, handleSize, handleSize);
              // Top-right handle
              ctx.fillRect(action.x * zoom + textWidth + 2 - handleSize/2, action.y * zoom - textHeight - handleSize/2, handleSize, handleSize);
              // Bottom-left handle
              ctx.fillRect(action.x * zoom - 2 - handleSize/2, action.y * zoom + 2 - handleSize/2, handleSize, handleSize);
              // Bottom-right handle
              ctx.fillRect(action.x * zoom + textWidth + 2 - handleSize/2, action.y * zoom + 2 - handleSize/2, handleSize, handleSize);
            }
          }
        });

      console.log(`✅ Page ${pageNumber} rendered successfully`);

    } catch (err) {
      console.error(`❌ Error rendering page ${pageNumber}:`, err);
    } finally {
      setIsRendering(false);
    }
  };

  /**
   * Render all pages for continuous view
   */
  const renderContinuousPages = async () => {
    if (!pdfJsDoc || !canvasRef.current || isRendering) return;

    try {
      setIsRendering(true);
      console.log(`🖼️ Rendering continuous view with ${totalPages} pages`);
      
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Calculate total height needed for all pages
      let totalHeight = 0;
      let maxWidth = 0;
      const pageDetails: Array<{width: number, height: number, offsetY: number}> = [];

      // First pass: calculate dimensions
      for (let i = 1; i <= totalPages; i++) {
        const page = await pdfJsDoc.getPage(i);
        const viewport = page.getViewport({ scale: zoom });
        
        pageDetails.push({
          width: viewport.width,
          height: viewport.height,
          offsetY: totalHeight
        });
        
        totalHeight += viewport.height + 10; // Add 10px gap between pages
        maxWidth = Math.max(maxWidth, viewport.width);
      }

      console.log(`📏 Continuous view dimensions: ${maxWidth}x${totalHeight}`);

      // Set canvas size to accommodate all pages
      canvas.width = maxWidth;
      canvas.height = totalHeight;
      canvas.style.width = `${maxWidth}px`;
      canvas.style.height = `${totalHeight}px`;

      // Clear the canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Second pass: render each page
      for (let i = 1; i <= totalPages; i++) {
        const page = await pdfJsDoc.getPage(i);
        const viewport = page.getViewport({ scale: zoom });
        const pageDetail = pageDetails[i - 1];
        
        // Create a temporary canvas for this page
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = viewport.width;
        tempCanvas.height = viewport.height;
        const tempCtx = tempCanvas.getContext('2d');
        if (!tempCtx) continue;

        // Render page to temporary canvas
        await page.render({
          canvasContext: tempCtx,
          viewport: viewport,
          canvas: tempCanvas
        }).promise;

        // Draw the page onto main canvas
        const xOffset = (maxWidth - viewport.width) / 2;
        ctx.drawImage(tempCanvas, xOffset, pageDetail.offsetY);

        // Draw edit actions for this page
        editActions
          .filter(action => action.page === i - 1) // Convert to 0-based for actions
          .forEach(action => {
            if (action.type === 'text') {
              // Set text properties
              ctx.fillStyle = action.color || '#000000';
              
              // Build font string with weight and style
              const weight = action.fontWeight || 'normal';
              const style = action.fontStyle || 'normal';
              const size = (action.fontSize || 14) * zoom;
              const family = action.fontFamily || 'Arial';
              ctx.font = `${style} ${weight} ${size}px ${family}`;
              
              // Draw text (adjust position for continuous view)
              const xPos = xOffset + action.x * zoom;
              const yPos = pageDetail.offsetY + action.y * zoom;
              ctx.fillText(action.content, xPos, yPos);
              
              // Draw underline if specified
              if (action.textDecoration === 'underline') {
                const textMetrics = ctx.measureText(action.content);
                const underlineY = yPos + 2;
                ctx.beginPath();
                ctx.moveTo(xPos, underlineY);
                ctx.lineTo(xPos + textMetrics.width, underlineY);
                ctx.strokeStyle = action.color || '#000000';
                ctx.lineWidth = 1;
                ctx.stroke();
              }
              
              // Draw selection handles if this action is selected
              if (selectedAction === action.id) {
                const textMetrics = ctx.measureText(action.content);
                const textWidth = textMetrics.width;
                const textHeight = (action.fontSize || 14) * zoom;
                
                // Draw selection rectangle
                ctx.strokeStyle = '#007bff';
                ctx.lineWidth = 2;
                ctx.strokeRect(
                  xPos - 2,
                  yPos - textHeight,
                  textWidth + 4,
                  textHeight + 4
                );
                
                // Draw corner handles
                const handleSize = 6;
                ctx.fillStyle = '#007bff';
                // Top-left handle
                ctx.fillRect(xPos - 2 - handleSize/2, yPos - textHeight - handleSize/2, handleSize, handleSize);
                // Top-right handle
                ctx.fillRect(xPos + textWidth + 2 - handleSize/2, yPos - textHeight - handleSize/2, handleSize, handleSize);
                // Bottom-left handle
                ctx.fillRect(xPos - 2 - handleSize/2, yPos + 2 - handleSize/2, handleSize, handleSize);
                // Bottom-right handle
                ctx.fillRect(xPos + textWidth + 2 - handleSize/2, yPos + 2 - handleSize/2, handleSize, handleSize);
              }
            }
          });

        // Draw page separator line
        if (i < totalPages) {
          ctx.strokeStyle = '#e5e7eb';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(0, pageDetail.offsetY + viewport.height + 5);
          ctx.lineTo(maxWidth, pageDetail.offsetY + viewport.height + 5);
          ctx.stroke();
        }

        console.log(`✅ Rendered page ${i}/${totalPages} at Y offset ${pageDetail.offsetY}`);
      }

      console.log(`✅ Continuous view rendered successfully - total height: ${totalHeight}px`);

    } catch (err) {
      console.error(`❌ Error rendering continuous view:`, err);
    } finally {
      setIsRendering(false);
    }
  };

  /**
   * Auto-render page when PDF loads or page/zoom changes
   */
  useEffect(() => {
    console.log(`🔄 Render effect triggered - viewMode: ${viewMode}, totalPages: ${totalPages}, currentPage: ${currentPage}`);
    
    if (pdfJsDoc && totalPages > 0) {
      if (viewMode === 'continuous') {
        console.log(`🔄 Triggering continuous view render`);
        renderContinuousPages();
      } else if (currentPage > 0) {
        console.log(`🔄 Triggering single page render for page ${currentPage}`);
        renderPage(currentPage);
      }
    }
  }, [pdfJsDoc, currentPage, zoom, editActions, selectedAction, viewMode, totalPages]);

    /**
   * Handle keyboard shortcuts
   */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Save shortcuts
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        if (editActions.length > 0) {
          if (e.shiftKey) {
            // Ctrl+Shift+S = Download
            console.log('💾 Keyboard shortcut: Download (Ctrl+Shift+S)');
            handleDownload();
          } else {
            // Ctrl+S = Save
            console.log('💾 Keyboard shortcut: Save (Ctrl+S)');
            handleSave();
          }
        }
      } else if (selectedAction && (e.key === 'Delete' || e.key === 'Backspace')) {
        e.preventDefault();
        deleteSelectedText();
      } else if (e.key === 'Escape') {
        setSelectedAction(null);
      } else if (viewMode === 'single') {
        // Page navigation with arrow keys
        if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
          e.preventDefault();
          if (currentPage > 1) {
            console.log(`⬅️ Arrow key: going to page ${currentPage - 1}`);
            goToPage(currentPage - 1);
          }
        } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
          e.preventDefault();
          if (currentPage < totalPages) {
            console.log(`➡️ Arrow key: going to page ${currentPage + 1}`);
            goToPage(currentPage + 1);
          }
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [selectedAction, viewMode, currentPage, totalPages]);

  /**
   * Auto-save functionality
   */
  useEffect(() => {
    if (!autoSaveEnabled || !onSave || editActions.length === 0 || isReadOnly || isSaving) {
      return;
    }

    // Clear any existing timeout
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    // Set new timeout for auto-save (30 seconds after last edit)
    autoSaveTimeoutRef.current = setTimeout(async () => {
      try {
        console.log('🔄 Auto-saving PDF...');
        setIsSaving(true);
        const editedPdfBlob = await applyEditsToPDF();
        await onSave(editedPdfBlob, editActions);
        setLastSaved(new Date());
        console.log('✅ Auto-save successful');
      } catch (err) {
        console.error('❌ Auto-save failed:', err);
        // Don't show error for auto-save failures to avoid disrupting user
      } finally {
        setIsSaving(false);
      }
    }, 30000); // 30 seconds

    // Cleanup
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [editActions, autoSaveEnabled, onSave, isReadOnly, isSaving]);

  /**
   * Handle canvas click for adding/selecting text
   */
  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (isReadOnly || !canvasRef.current || !pdfJsDoc) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const clickX = (event.clientX - rect.left) / zoom;
    const clickY = (event.clientY - rect.top) / zoom;

    let targetPage = currentPage;
    let x = clickX;
    let y = clickY;

    // For continuous view, calculate which page was clicked
    if (viewMode === 'continuous') {
      let currentY = 0;
      targetPage = 1;
      
      // Find which page the click is on
      for (let i = 1; i <= totalPages; i++) {
        // We need to get the page height - using a synchronous approach
        // This is an approximation - in a real implementation, you'd store page dimensions
        const estimatedPageHeight = 800 * zoom; // Approximate page height
        
        if (clickY <= currentY + estimatedPageHeight) {
          targetPage = i;
          y = clickY - currentY;
          // Adjust x for centered pages in continuous view
          const estimatedPageWidth = 600 * zoom;
          const canvasWidth = canvas.width;
          const pageOffsetX = (canvasWidth - estimatedPageWidth) / 2;
          x = clickX - pageOffsetX / zoom;
          break;
        }
        currentY += estimatedPageHeight;
      }
    }

    // Check if clicking on existing text for selection
    const clickedAction = editActions.find(action => {
      if (action.page !== targetPage - 1) return false;
      
      const textWidth = action.content.length * (action.fontSize || 14) * 0.6; // Approximate width
      const textHeight = action.fontSize || 14;
      
      return x >= action.x && x <= action.x + textWidth &&
             y >= action.y - textHeight && y <= action.y;
    });

    if (clickedAction) {
      // Select existing text
      setSelectedAction(clickedAction.id);
      setCurrentTool('select');
    } else if (currentTool === 'text') {
      // Add new text
      const text = prompt('Enter text to add:');
      if (!text) return;

      const newAction: PDFEditAction = {
        id: Date.now().toString(),
        type: 'text',
        x,
        y,
        page: targetPage - 1, // Convert to 0-based for storage
        content: text,
        fontSize: fontSize,
        color: textColor,
        fontFamily: fontFamily
      };

      setEditActions(prev => [...prev, newAction]);
      setSelectedAction(newAction.id);
      setCurrentTool('select');
    } else {
      // Deselect if clicking empty space
      setSelectedAction(null);
    }
  };

  /**
   * Handle mouse down for dragging
   */
  const handleMouseDown = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || !selectedAction) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = (event.clientX - rect.left) / zoom;
    const y = (event.clientY - rect.top) / zoom;

    const action = editActions.find(a => a.id === selectedAction);
    if (action) {
      setIsDragging(true);
      setDragOffset({
        x: x - action.x,
        y: y - action.y
      });
    }
  };

  /**
   * Handle mouse move for dragging
   */
  const handleMouseMove = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging || !selectedAction || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = (event.clientX - rect.left) / zoom;
    const y = (event.clientY - rect.top) / zoom;

    setEditActions(prev => prev.map(action => 
      action.id === selectedAction 
        ? { ...action, x: x - dragOffset.x, y: y - dragOffset.y }
        : action
    ));
  };

  /**
   * Handle mouse up to stop dragging
   */
  const handleMouseUp = () => {
    setIsDragging(false);
    setDragOffset({ x: 0, y: 0 });
  };

  /**
   * Handle mouse wheel for zooming
   */
  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = e.deltaY < 0 ? 0.1 : -0.1;
      const newZoom = Math.max(0.25, Math.min(3, zoom + delta));
      setZoom(newZoom);
    }
  };

  /**
   * Delete selected text
   */
  const deleteSelectedText = () => {
    if (selectedAction) {
      setEditActions(prev => prev.filter(action => action.id !== selectedAction));
      setSelectedAction(null);
    }
  };

  /**
   * Update selected text properties
   */
  const updateSelectedText = (property: string, value: any) => {
    if (selectedAction) {
      setEditActions(prev => prev.map(action => 
        action.id === selectedAction 
          ? { ...action, [property]: value }
          : action
      ));
    }
  };

  /**
   * Apply edits to PDF and generate new PDF blob
   */
  const applyEditsToPDF = async (): Promise<Blob> => {
    if (!pdfDoc) throw new Error('No PDF document loaded');

    // Create a copy of the PDF
    const pdfCopy = await PDFDocument.create();
    const pages = await pdfCopy.copyPages(pdfDoc, pdfDoc.getPageIndices());
    
    pages.forEach((page, index) => {
      pdfCopy.addPage(page);
      
      // Apply edits for this page
      const pageEdits = editActions.filter(action => action.page === index);
      
      pageEdits.forEach(edit => {
        if (edit.type === 'text') {
          // Add text to the page
          page.drawText(edit.content, {
            x: edit.x,
            y: page.getHeight() - edit.y, // PDF coordinates are bottom-up
            size: edit.fontSize,
            color: edit.color === 'black' ? rgb(0, 0, 0) : rgb(1, 0, 0)
          });
        }
      });
    });

    const pdfBytes = await pdfCopy.save();
    return new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' });
  };

  /**
  /**
   * Save edited PDF
   */
  const handleSave = async () => {
    if (!onSave || editActions.length === 0) return;

    try {
      setIsSaving(true);
      console.log('💾 Starting save process...');
      const editedPdfBlob = await applyEditsToPDF();
      await onSave(editedPdfBlob, editActions);
      setLastSaved(new Date());
      console.log('✅ PDF saved successfully');
      
      // Show success feedback
      setError(null);
    } catch (err) {
      console.error('❌ Error saving PDF:', err);
      setError(err instanceof Error ? err.message : 'Failed to save PDF');
    } finally {
      setIsSaving(false);
    }
  };

  /**
   * Download edited PDF
   */
  const handleDownload = async () => {
    try {
      setIsSaving(true);
      console.log('📥 Starting download process...');
      const editedPdfBlob = await applyEditsToPDF();
      
      // Create download link
      const url = URL.createObjectURL(editedPdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${documentName}_edited.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      console.log('✅ PDF downloaded successfully');
      setError(null);
    } catch (err) {
      console.error('❌ Error downloading PDF:', err);
      setError(err instanceof Error ? err.message : 'Failed to download PDF');
    } finally {
      setIsSaving(false);
    }
  };

  /**
   * Undo last action
   */
  const handleUndo = () => {
    if (editActions.length > 0) {
      setEditActions(prev => prev.slice(0, -1));
    }
  };

  /**
   * Navigate pages
   */
  /**
   * Navigate pages
   */
  const goToPage = (page: number) => {
    console.log(`📖 Attempting to go to page ${page} (current: ${currentPage}, total: ${totalPages})`);
    if (page >= 1 && page <= totalPages) {
      console.log(`✅ Going to page ${page}`);
      setCurrentPage(page);
    } else {
      console.log(`❌ Page ${page} is out of range (1-${totalPages})`);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p>Loading PDF editor...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center text-red-600">
          <p>Error: {error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900">
      {/* Toolbar */}
      <div className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-4">
          <h3 className="font-semibold text-gray-900 dark:text-white">
            Editing: {documentName}
          </h3>
          
          {!isReadOnly && (
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentTool('select')}
                className={`p-2 rounded ${currentTool === 'select' ? 'bg-blue-100 text-blue-600' : 'text-gray-600 hover:bg-gray-100'}`}
                title="Select Tool"
              >
                <MousePointer className="w-4 h-4" />
              </button>
              
              <button
                onClick={() => setCurrentTool('text')}
                className={`p-2 rounded ${currentTool === 'text' ? 'bg-blue-100 text-blue-600' : 'text-gray-600 hover:bg-gray-100'}`}
                title="Text Tool"
              >
                <Type className="w-4 h-4" />
              </button>
              
              <div className="w-px h-6 bg-gray-300 dark:bg-gray-600"></div>
              
              <button
                onClick={handleUndo}
                disabled={editActions.length === 0}
                className="p-2 rounded text-gray-600 hover:bg-gray-100 disabled:opacity-50"
                title="Undo"
              >
                <Undo className="w-4 h-4" />
              </button>
              
              <div className="w-px h-6 bg-gray-300 dark:bg-gray-600"></div>
              
              {/* Rich Text Controls */}
              <div className="flex items-center space-x-2">
                {/* Text Color */}
                <label className="flex items-center space-x-1">
                  <span className="text-sm text-gray-600">Color:</span>
                  <input
                    type="color"
                    value={textColor}
                    onChange={(e) => {
                      setTextColor(e.target.value);
                      updateSelectedText('color', e.target.value);
                    }}
                    className="w-6 h-6 rounded border border-gray-300"
                    title="Text Color"
                  />
                </label>
                
                {/* Font Size */}
                <label className="flex items-center space-x-1">
                  <span className="text-sm text-gray-600">Size:</span>
                  <select
                    value={fontSize}
                    onChange={(e) => {
                      const size = parseInt(e.target.value);
                      setFontSize(size);
                      updateSelectedText('fontSize', size);
                    }}
                    className="px-2 py-1 text-sm border border-gray-300 rounded"
                  >
                    <option value={8}>8px</option>
                    <option value={10}>10px</option>
                    <option value={12}>12px</option>
                    <option value={14}>14px</option>
                    <option value={16}>16px</option>
                    <option value={18}>18px</option>
                    <option value={20}>20px</option>
                    <option value={24}>24px</option>
                    <option value={32}>32px</option>
                  </select>
                </label>
                
                {/* Font Family */}
                <label className="flex items-center space-x-1">
                  <span className="text-sm text-gray-600">Font:</span>
                  <select
                    value={fontFamily}
                    onChange={(e) => {
                      setFontFamily(e.target.value);
                      updateSelectedText('fontFamily', e.target.value);
                    }}
                    className="px-2 py-1 text-sm border border-gray-300 rounded"
                  >
                    <option value="Arial">Arial</option>
                    <option value="Helvetica">Helvetica</option>
                    <option value="Times New Roman">Times</option>
                    <option value="Courier New">Courier</option>
                    <option value="Verdana">Verdana</option>
                  </select>
                </label>
                
                {/* Text Formatting Controls */}
                {selectedAction && (
                  <div className="flex items-center space-x-1 border-l border-gray-300 pl-2">
                    <span className="text-sm text-gray-600">Format:</span>
                    <button
                      onClick={() => updateSelectedText('fontWeight', 'bold')}
                      className="px-2 py-1 text-sm font-bold border border-gray-300 rounded hover:bg-gray-100"
                      title="Bold"
                    >
                      B
                    </button>
                    <button
                      onClick={() => updateSelectedText('fontStyle', 'italic')}
                      className="px-2 py-1 text-sm italic border border-gray-300 rounded hover:bg-gray-100"
                      title="Italic"
                    >
                      I
                    </button>
                    <button
                      onClick={() => updateSelectedText('textDecoration', 'underline')}
                      className="px-2 py-1 text-sm underline border border-gray-300 rounded hover:bg-gray-100"
                      title="Underline"
                    >
                      U
                    </button>
                  </div>
                )}
                
                {/* Delete Button */}
                {selectedAction && (
                  <button
                    onClick={deleteSelectedText}
                    className="p-2 rounded text-red-600 hover:bg-red-50"
                    title="Delete Selected Text"
                  >
                    🗑️
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center space-x-4">
          {/* Zoom Controls */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setZoom(prev => Math.max(0.5, prev - 0.25))}
              className="p-2 rounded text-gray-600 hover:bg-gray-100"
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            
            <span className="text-sm text-gray-600 min-w-[4rem] text-center">
              {Math.round(zoom * 100)}%
            </span>
            
            <button
              onClick={() => setZoom(prev => Math.min(3, prev + 0.25))}
              className="p-2 rounded text-gray-600 hover:bg-gray-100"
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
          </div>

          <div className="w-px h-6 bg-gray-300 dark:bg-gray-600"></div>

          {/* Page Navigation */}
          {viewMode === 'single' && (
            <div className="flex items-center space-x-2">
              <button
                onClick={() => {
                  console.log(`📖 Previous button clicked - current: ${currentPage}, target: ${currentPage - 1}`);
                  goToPage(currentPage - 1);
                }}
                disabled={currentPage <= 1}
                className="px-3 py-1 text-sm bg-gray-100 rounded disabled:opacity-50 hover:bg-gray-200 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              
              <span className="text-sm text-gray-600 min-w-[80px] text-center">
                {currentPage} of {totalPages}
              </span>
              
              <button
                onClick={() => {
                  console.log(`📖 Next button clicked - current: ${currentPage}, target: ${currentPage + 1}`);
                  goToPage(currentPage + 1);
                }}
                disabled={currentPage >= totalPages}
                className="px-3 py-1 text-sm bg-gray-100 rounded disabled:opacity-50 hover:bg-gray-200 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          )}

          <div className="w-px h-6 bg-gray-300 dark:bg-gray-600"></div>

          {/* View Mode Toggle */}
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">View:</span>
            <button
              onClick={() => {
                const newMode = viewMode === 'single' ? 'continuous' : 'single';
                console.log(`🔀 Switching view mode from ${viewMode} to ${newMode}`);
                setViewMode(newMode);
              }}
              className={`px-3 py-1 text-sm rounded ${
                viewMode === 'continuous' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              title={viewMode === 'single' ? 'Switch to continuous scrolling view' : 'Switch to single page view'}
            >
              {viewMode === 'single' ? '📄 Single' : '📜 Continuous'}
            </button>
            
            {/* Debug button */}
            <button
              onClick={() => {
                console.log(`🐛 Debug info:`, {
                  viewMode,
                  totalPages,
                  currentPage,
                  canvasSize: canvasRef.current ? { 
                    width: canvasRef.current.width, 
                    height: canvasRef.current.height,
                    styleWidth: canvasRef.current.style.width,
                    styleHeight: canvasRef.current.style.height
                  } : null,
                  containerSize: containerRef.current ? {
                    scrollHeight: containerRef.current.scrollHeight,
                    clientHeight: containerRef.current.clientHeight,
                    scrollTop: containerRef.current.scrollTop
                  } : null
                });
                if (viewMode === 'continuous' && pdfJsDoc) {
                  console.log(`🔄 Force re-rendering continuous view`);
                  renderContinuousPages();
                }
              }}
              className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded"
              title="Debug Info"
            >
              🐛
            </button>
            
            {/* Force Continuous Test Button */}
            <button
              onClick={() => {
                console.log(`🧪 FORCE CONTINUOUS MODE TEST`);
                setViewMode('continuous');
              }}
              className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded"
              title="Force Continuous Mode"
            >
              📜 Test
            </button>
            
            <div className="w-px h-4 bg-gray-300 mx-2"></div>
          </div>

          <div className="w-px h-6 bg-gray-300 dark:bg-gray-600"></div>

          {/* Action Buttons - Enhanced Save Section */}
          <div className="flex items-center space-x-2">
            <button
              onClick={handleDownload}
              disabled={isSaving}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 disabled:opacity-50 flex items-center space-x-2"
              title="Download PDF (Ctrl+Shift+S)"
            >
              <Download className="w-4 h-4" />
              <span>Download</span>
            </button>

            {!isReadOnly && (
              <>
                {editActions.length > 0 ? (
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={handleSave}
                      disabled={isSaving}
                      className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 flex items-center space-x-2 font-medium shadow-md"
                      title="Save Changes (Ctrl+S)"
                    >
                      <Save className="w-4 h-4" />
                      <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
                    </button>
                    <div className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded">
                      {editActions.length} edit{editActions.length !== 1 ? 's' : ''} • Ctrl+S to save
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-gray-500 bg-gray-50 px-3 py-2 rounded">
                    💡 Make edits to see save options
                  </div>
                )
                }
              </>
            )}

            {onClose && (
              <button
                onClick={onClose}
                className="p-2 rounded text-gray-600 hover:bg-gray-100"
                title="Close Editor"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Editor Content */}
      <div 
        className="flex-1 overflow-auto p-4" 
        ref={containerRef}
        style={{
          maxHeight: viewMode === 'continuous' ? '70vh' : 'auto',
          overflowY: viewMode === 'continuous' ? 'scroll' : 'auto'
        }}
      >
        <div className="flex justify-center">
          <div className="bg-white shadow-lg relative">
            {isRendering && (
              <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto mb-2"></div>
                  <div className="text-sm text-gray-600">Rendering page...</div>
                </div>
              </div>
            )}
            <canvas
              ref={canvasRef}
              onClick={handleCanvasClick}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onWheel={handleWheel}
              className="border border-gray-300 cursor-crosshair"
              style={{ 
                cursor: currentTool === 'text' ? 'crosshair' : 'default',
                display: 'block',
                maxWidth: '100%'
              }}
            />
          </div>
        </div>
      </div>

      {/* Status Bar */}
      <div className="p-2 bg-gray-100 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 text-sm text-gray-600 dark:text-gray-400">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <span>
              {isReadOnly ? 'Read-only mode' : 
               selectedAction ? 'Text selected - Use toolbar to format, drag to move, or press Delete to remove' :
               currentTool === 'text' ? 
                 (viewMode === 'continuous' ? 'Click anywhere to add text, scroll to navigate all pages' : 'Click to add text, use ←→ arrow keys or navigation buttons') : 
               (viewMode === 'single' ? 'Use ←→ arrow keys or Previous/Next buttons to navigate pages' : 'Scroll to navigate through all pages')}
            </span>
            {/* Auto-save status */}
            {!isReadOnly && editActions.length > 0 && (
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setAutoSaveEnabled(!autoSaveEnabled)}
                  className={`text-xs px-2 py-1 rounded ${
                    autoSaveEnabled 
                      ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                  title={autoSaveEnabled ? 'Auto-save enabled - click to disable' : 'Auto-save disabled - click to enable'}
                >
                  {autoSaveEnabled ? '🟢 Auto-save' : '⭕ Auto-save off'}
                </button>
                {lastSaved && (
                  <span className="text-xs text-gray-500">
                    Last saved: {lastSaved.toLocaleTimeString()}
                  </span>
                )}
              </div>
            )}
          </div>
          <div className="flex items-center space-x-4">
            {editActions.length > 0 && (
              <span className="flex items-center space-x-1">
                <span>{editActions.length} edit{editActions.length !== 1 ? 's' : ''} made</span>
                <span className="text-xs text-gray-400">• Ctrl+S to save</span>
              </span>
            )}
            <span>
              {viewMode === 'continuous' ? `${totalPages} pages` : `Page ${currentPage}/${totalPages}`}
            </span>
            <span>Zoom: {Math.round(zoom * 100)}%</span>
          </div>
        </div>
      </div>
    </div>
  );
}
