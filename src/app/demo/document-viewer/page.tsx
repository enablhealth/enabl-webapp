'use client';

import { useState } from 'react';
import DocumentList from '@/components/DocumentList';
import DocumentViewer from '@/components/DocumentViewer';
import { DocumentRecord } from '@/services/documentStorage';

/**
 * Demo page to showcase the document viewer functionality
 */
export default function DocumentViewerDemo() {
  const [selectedDocument, setSelectedDocument] = useState<DocumentRecord | null>(null);
  const [viewerOpen, setViewerOpen] = useState(false);

  // Demo documents for testing
  const demoDocuments: DocumentRecord[] = [
    {
      userId: 'demo-user',
      documentId: 'demo-pdf',
      name: 'Sample Medical Report.pdf',
      size: 2048576, // 2MB
      type: 'application/pdf',
      uploadDate: new Date().toISOString(),
      s3Key: 'demo/sample-report.pdf',
      s3Url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', // Sample PDF
      analysisResult: {
        documentTypeDetection: {
          detectedType: 'medical',
          confidence: 0.95,
          reasoning: 'Contains medical terminology and lab values'
        },
        medicalRecordPercentage: 85,
        requiresSignature: false,
        fields: [
          { name: 'Patient Name', type: 'text', required: true, value: 'John Doe' },
          { name: 'Test Date', type: 'date', required: true, value: '2024-01-15' }
        ],
        tags: ['blood test', 'cholesterol', 'glucose'],
        healthcareTags: ['medical']
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      userId: 'demo-user',
      documentId: 'demo-image',
      name: 'X-Ray Scan.jpg',
      size: 1024000, // 1MB
      type: 'image/jpeg',
      uploadDate: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
      s3Key: 'demo/xray.jpg',
      s3Url: 'https://via.placeholder.com/800x600/e3e3e3/666666?text=X-Ray+Sample+Image',
      analysisResult: {
        documentTypeDetection: {
          detectedType: 'medical',
          confidence: 0.88,
          reasoning: 'Medical imaging file with X-ray characteristics'
        },
        medicalRecordPercentage: 90,
        requiresSignature: false,
        fields: [
          { name: 'Patient ID', type: 'text', required: true, value: 'P-12345' },
          { name: 'Scan Date', type: 'date', required: true, value: '2024-01-14' }
        ],
        tags: ['x-ray', 'imaging', 'diagnostic'],
        healthcareTags: ['medical']
      },
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      updatedAt: new Date(Date.now() - 86400000).toISOString()
    },
    {
      userId: 'demo-user',
      documentId: 'demo-prescription',
      name: 'Prescription - Dr. Smith.pdf',
      size: 512000, // 512KB
      type: 'application/pdf',
      uploadDate: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
      s3Key: 'demo/prescription.pdf',
      s3Url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
      analysisResult: {
        documentTypeDetection: {
          detectedType: 'prescription',
          confidence: 0.92,
          reasoning: 'Contains prescription format and medication details'
        },
        medicalRecordPercentage: 95,
        requiresSignature: true,
        fields: [
          { name: 'Prescriber', type: 'text', required: true, value: 'Dr. Smith' },
          { name: 'Medication', type: 'text', required: true, value: 'Sample Med' }
        ],
        tags: ['prescription', 'medication', 'dosage'],
        healthcareTags: ['prescription']
      },
      createdAt: new Date(Date.now() - 172800000).toISOString(),
      updatedAt: new Date(Date.now() - 172800000).toISOString()
    },
    {
      userId: 'demo-user',
      documentId: 'demo-word',
      name: 'Health Insurance Policy.docx',
      size: 3072000, // 3MB
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      uploadDate: new Date(Date.now() - 259200000).toISOString(), // 3 days ago
      s3Key: 'demo/insurance.docx',
      s3Url: '#', // Word documents need to be downloaded
      analysisResult: {
        documentTypeDetection: {
          detectedType: 'insurance',
          confidence: 0.85,
          reasoning: 'Insurance policy document with coverage details'
        },
        medicalRecordPercentage: 70,
        requiresSignature: false,
        fields: [
          { name: 'Policy Number', type: 'text', required: true, value: 'POL-123456' },
          { name: 'Coverage Type', type: 'text', required: true, value: 'Health Insurance' }
        ],
        tags: ['insurance', 'policy', 'coverage'],
        healthcareTags: ['insurance']
      },
      createdAt: new Date(Date.now() - 259200000).toISOString(),
      updatedAt: new Date(Date.now() - 259200000).toISOString()
    },
    {
      userId: 'demo-user',
      documentId: 'demo-excel',
      name: 'Lab Results Tracking.xlsx',
      size: 1536000, // 1.5MB
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      uploadDate: new Date(Date.now() - 345600000).toISOString(), // 4 days ago
      s3Key: 'demo/lab-tracking.xlsx',
      s3Url: '#', // Excel files need to be downloaded
      analysisResult: {
        documentTypeDetection: {
          detectedType: 'lab',
          confidence: 0.90,
          reasoning: 'Spreadsheet containing lab result tracking data'
        },
        medicalRecordPercentage: 80,
        requiresSignature: false,
        fields: [
          { name: 'Lab Name', type: 'text', required: true, value: 'City Lab' },
          { name: 'Test Count', type: 'number', required: false, value: '25' }
        ],
        tags: ['lab results', 'tracking', 'spreadsheet'],
        healthcareTags: ['lab']
      },
      createdAt: new Date(Date.now() - 345600000).toISOString(),
      updatedAt: new Date(Date.now() - 345600000).toISOString()
    }
  ];

  const handleDocumentClick = (document: DocumentRecord) => {
    setSelectedDocument(document);
    setViewerOpen(true);
  };

  const handleCloseViewer = () => {
    setViewerOpen(false);
    setSelectedDocument(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            📄 Document Viewer Demo
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-2">
            Click on any document below to preview it in the lightbox viewer
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Supports PDF, images, Word, Excel, and text files with smart fallbacks
          </p>
        </div>

        {/* Features */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 mb-8 border border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            ✨ Viewer Features
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <span className="text-green-600">✓</span>
                <span className="text-sm text-gray-700 dark:text-gray-300">PDF inline preview with controls</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-green-600">✓</span>
                <span className="text-sm text-gray-700 dark:text-gray-300">Image zoom and high-resolution display</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-green-600">✓</span>
                <span className="text-sm text-gray-700 dark:text-gray-300">Word/Excel download with Office Online links</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <span className="text-green-600">✓</span>
                <span className="text-sm text-gray-700 dark:text-gray-300">Text file smart handling</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-green-600">✓</span>
                <span className="text-sm text-gray-700 dark:text-gray-300">Keyboard shortcuts (ESC to close)</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-green-600">✓</span>
                <span className="text-sm text-gray-700 dark:text-gray-300">AI analysis integration display</span>
              </div>
            </div>
          </div>
        </div>

        {/* Demo Document List */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              📁 Demo Documents ({demoDocuments.length})
            </h2>
            <div className="space-y-3">
              {demoDocuments.map((document) => (
                <div
                  key={document.documentId}
                  onClick={() => handleDocumentClick(document)}
                  className="flex items-center space-x-3 p-4 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer transition-colors group"
                >
                  {/* File icon */}
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 flex items-center justify-center bg-white dark:bg-gray-600 rounded-lg text-2xl border border-gray-200 dark:border-gray-500 group-hover:bg-gray-50 dark:group-hover:bg-gray-500 transition-colors">
                      {document.type.startsWith('image/') ? '🖼️' :
                       document.type === 'application/pdf' ? '📄' :
                       document.type.includes('word') ? '📝' :
                       document.type.includes('excel') ? '📊' : '📎'}
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
                        {(document.size / 1024 / 1024).toFixed(1)} MB
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(document.uploadDate).toLocaleDateString()}
                      </span>
                      {document.analysisResult?.documentTypeDetection?.detectedType && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                          {document.analysisResult.documentTypeDetection.detectedType}
                        </span>
                      )}
                    </div>

                    {document.analysisResult?.documentTypeDetection?.reasoning && (
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 truncate">
                        {document.analysisResult.documentTypeDetection.reasoning}
                      </p>
                    )}
                  </div>

                  {/* Click to view indicator */}
                  <div className="flex-shrink-0 text-gray-400 dark:text-gray-500 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    <div className="flex items-center space-x-1 text-xs">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      <span className="hidden sm:inline">Click to view</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400">
          <p>💡 <strong>Try it:</strong> Click any document above to open the viewer</p>
          <p className="mt-1">📱 Works great on mobile and desktop</p>
        </div>
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
