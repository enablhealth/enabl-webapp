'use client';

import { useState, useEffect } from 'react';
import { DocumentRecord } from '@/services/documentStorage';
import SimplePDFViewer from './SimplePDFViewer';

interface DocumentViewerProps {
  document: DocumentRecord | null;
  isOpen: boolean;
  onClose: () => void;
}

/**
 * DocumentViewer - A lightbox-style viewer for documents
 * Supports PDF, images, text files, Word, Excel with fallback options
 */
export default function DocumentViewer({ document, isOpen, onClose }: DocumentViewerProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewerContent, setViewerContent] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !document) {
      setViewerContent(null);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    // Load document content based on type
    loadDocumentContent(document);
  }, [isOpen, document]);

  const loadDocumentContent = async (doc: DocumentRecord) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔍 Loading document content for:', doc.name, 'Type:', doc.type);
      
      // Use the secure document view API endpoint
      const viewUrl = `/api/documents/${doc.documentId}/view?userId=${encodeURIComponent(doc.userId)}&action=view`;
      
      console.log('📡 Fetching from:', viewUrl);
      
      const response = await fetch(viewUrl);
      
      if (!response.ok) {
        if (response.status === 404) {
          const errorData = await response.json();
          throw new Error(errorData.details || 'Document file not found in storage');
        }
        throw new Error(`Failed to load document: ${response.status} ${response.statusText}`);
      }
      
      const result = await response.json();
      
      if (!result.success || !result.signedUrl) {
        throw new Error(result.error || 'Failed to get document access');
      }
      
  console.log('✅ Received signed URL for document viewing');
      
      // Use the signed URL for viewing
      setViewerContent(result.signedUrl);
      setLoading(false);
      
    } catch (err) {
      console.error('❌ Error loading document:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to load document content';
      setError(errorMessage);
      setLoading(false);
      
      // If it's a storage error, show a helpful message
      if (errorMessage.includes('not found in storage')) {
        setError(`Document file not available: ${doc.name}\n\nThe document metadata exists but the actual file was not found in storage. This may occur if:\n• The file was never uploaded\n• The file was deleted from storage\n• There's a configuration issue\n\nPlease try re-uploading the document.`);
      }
    }
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return '🖼️';
    if (type === 'application/pdf') return '📄';
    if (type.includes('word') || type.includes('document')) return '📝';
    if (type.includes('excel') || type.includes('spreadsheet')) return '📊';
    if (type === 'text/plain') return '📄';
    if (type === 'text/csv') return '📊';
    if (type === 'application/json') return '⚙️';
    if (type === 'text/markdown') return '📝';
    return '📎';
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const handleDownload = async () => {
    if (!document) return;
    
    try {
      console.log('📥 Initiating secure download for:', document.name);
      
      // Use the secure download API endpoint
      const downloadUrl = `/api/documents/${document.documentId}/view?userId=${encodeURIComponent(document.userId)}&action=download`;
      
      // Open the download URL in a new window/tab
      window.open(downloadUrl, '_blank');
      
    } catch (error) {
      console.error('❌ Download failed:', error);
      // Fallback to the old method if API fails
      if (document.s3Url) {
        const link = window.document.createElement('a');
        link.href = document.s3Url;
        link.download = document.name || 'document';
        link.target = '_blank';
        window.document.body.appendChild(link);
        link.click();
        window.document.body.removeChild(link);
      }
    }
  };

  const renderDocumentContent = () => {
    if (!document || !viewerContent) return null;

    const docType = document.type;

    // Image viewer
    if (docType.startsWith('image/')) {
      return (
        <div className="flex items-center justify-center h-full">
          <img
            src={viewerContent}
            alt={document.name}
            className="max-w-full max-h-full object-contain rounded-lg"
            style={{ maxHeight: 'calc(90vh - 200px)' }}
          />
        </div>
      );
    }

    // PDF viewer
    if (docType === 'application/pdf') {
      return (
        <div className="h-full">
          <iframe
            src={viewerContent || ''}
            title={document.name}
            className="w-full h-full border-0 rounded-lg"
            style={{ minHeight: '70vh' }}
          />
        </div>
      );
    }

    // Text files
    if (docType === 'text/plain' || docType === 'text/csv' || docType === 'application/json') {
      return (
        <div className="h-full bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
          <div className="text-center text-gray-600 dark:text-gray-400">
            <div className="text-4xl mb-4">{getFileIcon(docType)}</div>
            <p className="mb-4">Text file preview not available in viewer</p>
            <button
              onClick={handleDownload}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Download to View
            </button>
          </div>
        </div>
      );
    }

    // Word/Excel files - Office documents
    if (docType.includes('word') || docType.includes('document') || 
        docType.includes('excel') || docType.includes('spreadsheet')) {
      return (
        <div className="h-full bg-gray-50 dark:bg-gray-800 rounded-lg p-8">
          <div className="text-center text-gray-600 dark:text-gray-400">
            <div className="text-6xl mb-6">{getFileIcon(docType)}</div>
            <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
              {docType.includes('word') || docType.includes('document') ? 'Word Document' : 'Excel Spreadsheet'}
            </h3>
            <p className="mb-6 text-lg">
              Office documents cannot be previewed directly in the browser
            </p>
            <div className="space-y-3">
              <button
                onClick={handleDownload}
                className="block w-full max-w-xs mx-auto bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                📥 Download Document
              </button>
              <button
                onClick={() => window.open(`https://office.com`, '_blank')}
                className="block w-full max-w-xs mx-auto bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors font-medium"
              >
                🌐 Open in Office Online
              </button>
            </div>
            <p className="text-sm mt-4 text-gray-500 dark:text-gray-400">
              You can also drag the downloaded file to Office Online or Google Docs
            </p>
          </div>
        </div>
      );
    }

    // Default fallback for unsupported types
    return (
      <div className="h-full bg-gray-50 dark:bg-gray-800 rounded-lg p-8">
        <div className="text-center text-gray-600 dark:text-gray-400">
          <div className="text-6xl mb-6">{getFileIcon(docType)}</div>
          <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
            Preview Not Available
          </h3>
          <p className="mb-6">
            This file type cannot be previewed in the browser
          </p>
          <button
            onClick={handleDownload}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            📥 Download File
          </button>
        </div>
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="bg-white dark:bg-gray-900 rounded-xl w-full max-w-6xl max-h-[95vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
          <div className="flex items-center space-x-3 min-w-0 flex-1">
            <div className="text-2xl">{document ? getFileIcon(document.type) : '📄'}</div>
            <div className="min-w-0 flex-1">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                {document?.name || 'Document'}
              </h2>
              <div className="flex items-center space-x-3 text-sm text-gray-500 dark:text-gray-400">
                <span>{document ? formatFileSize(document.size) : ''}</span>
                <span>•</span>
                <span>{document?.type || ''}</span>
                {document?.uploadDate && (
                  <>
                    <span>•</span>
                    <span>Uploaded {new Date(document.uploadDate).toLocaleDateString()}</span>
                  </>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {/* Download button */}
            <button
              onClick={handleDownload}
              className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              title="Download document"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </button>
            
            {/* Close button */}
            <button
              onClick={onClose}
              className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              title="Close viewer"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-600 dark:text-gray-400">Loading document...</p>
              </div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center text-red-600 dark:text-red-400">
                <div className="text-4xl mb-4">⚠️</div>
                <p className="text-lg font-medium mb-2">Error Loading Document</p>
                <p className="text-sm">{error}</p>
                <button
                  onClick={handleDownload}
                  className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Try Download Instead
                </button>
              </div>
            </div>
          ) : (
            <div className="p-4 h-full">
              {renderDocumentContent()}
            </div>
          )}
        </div>

        {/* Footer with keyboard shortcuts */}
        <div className="px-4 py-2 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
            <div className="flex items-center space-x-4">
              <span>💡 Press ESC to close</span>
              <span>📥 Click outside to close</span>
            </div>
            {document?.analysisResult && (
              <span className="text-green-600 dark:text-green-400">
                ✓ AI Analysis Available
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Keyboard event handler
export function useDocumentViewerKeyboard(onClose: () => void) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);
}
