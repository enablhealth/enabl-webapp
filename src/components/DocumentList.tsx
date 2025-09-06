'use client';

import { useState, useEffect } from 'react';
import { DocumentRecord } from '@/services/documentStorage';
import DocumentViewer, { useDocumentViewerKeyboard } from './DocumentViewer';

interface DocumentListProps {
  userId: string;
  className?: string;
  showTitle?: boolean;
}

/**
 * DocumentList - Shows user's uploaded documents with click-to-view functionality
 */
export default function DocumentList({ userId, className = '', showTitle = true }: DocumentListProps) {
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDocument, setSelectedDocument] = useState<DocumentRecord | null>(null);
  const [viewerOpen, setViewerOpen] = useState(false);

  // Keyboard support for document viewer
  useDocumentViewerKeyboard(() => setViewerOpen(false));

  useEffect(() => {
    loadDocuments();
  }, [userId]);

  const loadDocuments = async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Call the backend API to get user documents
      const response = await fetch(`/api/documents?userId=${userId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to load documents');
      }

      const data = await response.json();
      setDocuments(data.documents || []);
    } catch (err) {
      console.error('Error loading documents:', err);
      setError('Failed to load documents. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDocumentClick = (document: DocumentRecord) => {
    setSelectedDocument(document);
    setViewerOpen(true);
  };

  const handleCloseViewer = () => {
    setViewerOpen(false);
    setSelectedDocument(null);
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

  const getCategoryColor = (category?: string) => {
    switch (category) {
      case 'medical': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'lab': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'prescription': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'insurance': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'other': return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  if (loading) {
    return (
      <div className={`${className}`}>
        {showTitle && (
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            📁 Your Documents
          </h3>
        )}
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="flex items-center space-x-3 p-4 bg-gray-100 dark:bg-gray-700 rounded-lg">
                <div className="w-10 h-10 bg-gray-200 dark:bg-gray-600 rounded"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-1/2"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`${className}`}>
        {showTitle && (
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            📁 Your Documents
          </h3>
        )}
        <div className="text-center py-8">
          <div className="text-4xl mb-4">⚠️</div>
          <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
          <button
            onClick={loadDocuments}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <div className={`${className}`}>
        {showTitle && (
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            📁 Your Documents
          </h3>
        )}
        <div className="text-center py-8 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div className="text-4xl mb-4">📂</div>
          <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No Documents Yet
          </h4>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Upload your first document to get started with AI analysis
          </p>
          <div className="flex flex-wrap justify-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <span>💊 Prescriptions</span>
            <span>🧪 Lab Results</span>
            <span>🏥 Medical Records</span>
            <span>📋 Insurance</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`${className}`}>
      {showTitle && (
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            📁 Your Documents ({documents.length})
          </h3>
          <button
            onClick={loadDocuments}
            className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
            title="Refresh documents"
          >
            🔄 Refresh
          </button>
        </div>
      )}

      <div className="space-y-3">
        {documents.map((document) => (
          <div
            key={document.documentId}
            onClick={() => handleDocumentClick(document)}
            className="flex items-center space-x-3 p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors group"
          >
            {/* File icon */}
            <div className="flex-shrink-0">
              <div className="w-10 h-10 flex items-center justify-center bg-gray-100 dark:bg-gray-600 rounded-lg text-xl group-hover:bg-gray-200 dark:group-hover:bg-gray-500 transition-colors">
                {getFileIcon(document.type)}
              </div>
            </div>

            {/* Document info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2">
                <h4 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {document.name}
                </h4>
                {document.analysisResult && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                    ✓ AI Analyzed
                  </span>
                )}
              </div>
              
              <div className="flex items-center space-x-3 mt-1">
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {formatFileSize(document.size)}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {new Date(document.uploadDate).toLocaleDateString()}
                </span>
                {document.analysisResult?.documentTypeDetection?.detectedType && (
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${getCategoryColor(document.analysisResult.documentTypeDetection.detectedType)}`}>
                    {document.analysisResult.documentTypeDetection.detectedType}
                  </span>
                )}
              </div>
            </div>

            {/* Click indicator */}
            <div className="flex-shrink-0 text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </div>
          </div>
        ))}
      </div>

      {/* Document Viewer Modal */}
      <DocumentViewer
        document={selectedDocument}
        isOpen={viewerOpen}
        onClose={handleCloseViewer}
      />
    </div>
  );
}
