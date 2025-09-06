'use client';

import { useState } from 'react';
import DocumentViewer from '@/components/DocumentViewer';
import { DocumentRecord } from '@/services/documentStorage';

// Mock document data for testing
const mockPDFDocument: DocumentRecord = {
  documentId: '1755756676378-r55wkfwd0zk',
  userId: 'test-user',
  name: '0_07-2025_prs_tibor-mechtl_432058178_Participant_Handbook.pdf',
  type: 'application/pdf',
  size: 1024576,
  uploadDate: new Date().toISOString(),
  s3Key: 'documents/1755756676378-r55wkfwd0zk.pdf',
  s3Url: '',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  analysisResult: {
    documentTypeDetection: {
      detectedType: 'PDF Document',
      confidence: 0.95,
      reasoning: 'File extension and MIME type indicate PDF format'
    },
    medicalRecordPercentage: 0.8,
    requiresSignature: false,
    fields: [],
    tags: ['test', 'pdf'],
    healthcareTags: ['test document'],
    editHistory: []
  }
};

export default function PDFEditorTestPage() {
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<DocumentRecord | null>(null);

  const openDocument = () => {
    setSelectedDocument(mockPDFDocument);
    setIsViewerOpen(true);
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
          PDF Editor Test Page
        </h1>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Test PDF Document</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Click the button below to open a test PDF document with the new editing functionality.
          </p>
          
          <button
            onClick={openDocument}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            📄 Open PDF with Editor
          </button>
          
          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
              Features to Test:
            </h3>
            <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
              <li>• PDF viewing with iframe</li>
              <li>• ✏️ Edit PDF button in the header</li>
              <li>• PDF editor with annotation tools</li>
              <li>• Text annotation functionality</li>
              <li>• Zoom controls (50% - 300%)</li>
              <li>• Page navigation</li>
              <li>• Save changes back to S3</li>
              <li>• Download edited PDF</li>
              <li>• Edit history tracking</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Document Viewer Modal */}
      <DocumentViewer
        document={selectedDocument}
        isOpen={isViewerOpen}
        onClose={() => {
          setIsViewerOpen(false);
          setSelectedDocument(null);
        }}
      />
    </div>
  );
}
