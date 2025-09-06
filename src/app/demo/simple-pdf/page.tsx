/**
 * Demo page for testing the SimplePDFViewer component
 */

'use client';

import React, { useState } from 'react';
import SimplePDFViewer from '@/components/SimplePDFViewer';

export default function SimplePDFDemo() {
  const [showModal, setShowModal] = useState(false);
  
  // Sample PDF URL (you can replace this with any PDF URL)
  const samplePdfUrl = 'https://mozilla.github.io/pdf.js/web/compressed.tracemonkey-pldi-09.pdf';
  const documentName = 'Sample Document.pdf';

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            SimplePDFViewer Demo
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            This is the new, clean and simple PDF viewer that replaces the complex PDF editor. 
            Much easier to use with native browser PDF controls!
          </p>
          
          <div className="flex gap-4">
            <button
              onClick={() => setShowModal(true)}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              📄 Open PDF in Modal
            </button>
            
            <a
              href={samplePdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors font-medium"
            >
              🔗 Open PDF in New Tab
            </a>
          </div>
        </div>

        {/* Inline PDF Viewer */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
          <div className="p-4 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Inline PDF Viewer
            </h2>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              This shows how the PDF viewer looks when embedded in a page
            </p>
          </div>
          
          <div style={{ height: '800px' }}>
            <SimplePDFViewer
              pdfUrl={samplePdfUrl}
              documentName={documentName}
              onDownload={() => {
                console.log('Download clicked!');
                // Custom download logic here
              }}
            />
          </div>
        </div>
      </div>

  {/* Modal placeholder removed: SimplePDFViewer does not export a modal. */}
    </div>
  );
}
