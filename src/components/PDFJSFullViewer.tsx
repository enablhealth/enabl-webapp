'use client';

import React from 'react';

interface PDFJSFullViewerProps {
  pdfUrl: string;
  documentName: string;
  onDownload?: () => void;
}

/**
 * PDFJSFullViewer
 * Embeds the official PDF.js viewer via CDN for a full toolbar + thumbnails experience.
 * It passes the file URL using the `?file=` query param and sets a friendly default view.
 */
export default function PDFJSFullViewer({ pdfUrl }: PDFJSFullViewerProps) {
  // Use the same pdfjs-dist version as in package.json to avoid mismatches
  const viewerSrc = `https://unpkg.com/pdfjs-dist@5.4.54/web/viewer.html?file=${encodeURIComponent(
    pdfUrl
  )}#zoom=page-width&pagemode=thumbs`;

  return (
    <iframe
      src={viewerSrc}
      title="PDF Viewer"
      className="w-full h-full border rounded"
      style={{ minHeight: '70vh' }}
    />
  );
}
