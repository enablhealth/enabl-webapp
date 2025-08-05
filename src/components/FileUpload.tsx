'use client';

import { useState, useRef, useCallback } from 'react';

/**
 * Supported file types for upload
 */
export type SupportedFileType = 
  | 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp'
  | 'application/pdf'
  | 'application/msword' | 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  | 'application/vnd.ms-excel' | 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  | 'text/plain' | 'text/csv'
  | 'application/json'
  | 'text/markdown';

/**
 * File upload interface
 */
export interface UploadedFile {
  id: string;
  file: File;
  name: string;
  size: number;
  type: string;
  url?: string;
  preview?: string;
  uploadProgress?: number;
  error?: string;
}

interface FileUploadProps {
  onFilesSelected: (files: UploadedFile[]) => void;
  maxFiles?: number;
  maxFileSize?: number; // in MB
  acceptedTypes?: SupportedFileType[];
  disabled?: boolean;
  className?: string;
}

const DEFAULT_ACCEPTED_TYPES: SupportedFileType[] = [
  'image/jpeg', 'image/png', 'image/gif', 'image/webp',
  'application/pdf',
  'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain', 'text/csv', 'application/json', 'text/markdown'
];

/**
 * FileUpload component for handling file uploads with drag-and-drop support
 * 
 * @param onFilesSelected - Callback function called when files are selected
 * @param maxFiles - Maximum number of files allowed (default: 5)
 * @param maxFileSize - Maximum file size in MB (default: 10)
 * @param acceptedTypes - Array of accepted file types
 * @param disabled - Whether the upload is disabled
 * @param className - Additional CSS classes
 */
export default function FileUpload({
  onFilesSelected,
  maxFiles = 5,
  maxFileSize = 10,
  acceptedTypes = DEFAULT_ACCEPTED_TYPES,
  disabled = false,
  className = ''
}: FileUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /**
   * Get file extension icon based on file type
   */
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

  /**
   * Format file size for display
   */
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  /**
   * Validate file type and size
   */
  const validateFile = (file: File): string | null => {
    if (!acceptedTypes.includes(file.type as SupportedFileType)) {
      return `File type ${file.type} is not supported`;
    }
    if (file.size > maxFileSize * 1024 * 1024) {
      return `File size must be less than ${maxFileSize}MB`;
    }
    return null;
  };

  /**
   * Create file preview for images
   */
  const createFilePreview = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.readAsDataURL(file);
      } else {
        resolve('');
      }
    });
  };

  /**
   * Process selected files
   */
  const processFiles = useCallback(async (fileList: FileList) => {
    if (disabled || isUploading) return;

    const files = Array.from(fileList);
    if (files.length > maxFiles) {
      alert(`You can only upload up to ${maxFiles} files at once`);
      return;
    }

    setIsUploading(true);

    const processedFiles: UploadedFile[] = [];

    for (const file of files) {
      const error = validateFile(file);
      const preview = await createFilePreview(file);
      
      processedFiles.push({
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        file,
        name: file.name,
        size: file.size,
        type: file.type,
        preview,
        error: error || undefined,
        uploadProgress: 0
      });
    }

    setIsUploading(false);
    onFilesSelected(processedFiles);
  }, [disabled, isUploading, maxFiles, onFilesSelected, acceptedTypes, maxFileSize]);

  /**
   * Handle file input change
   */
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      processFiles(e.target.files);
    }
  };

  /**
   * Handle drag over event
   */
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) {
      setIsDragOver(true);
    }
  };

  /**
   * Handle drag leave event
   */
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  /**
   * Handle drop event
   */
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    if (disabled || !e.dataTransfer.files) return;
    
    processFiles(e.dataTransfer.files);
  };

  /**
   * Open file picker
   */
  const openFilePicker = () => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const acceptString = acceptedTypes.join(',');

  return (
    <div className={className}>
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept={acceptString}
        onChange={handleFileInputChange}
        className="hidden"
        disabled={disabled}
      />

      {/* Drop zone */}
      <div
        onClick={openFilePicker}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          relative border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all duration-200
          ${isDragOver 
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-400' 
            : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 bg-gray-50 dark:bg-gray-700/50'
          }
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
          ${isUploading ? 'pointer-events-none' : ''}
        `}
      >
        {isUploading ? (
          <div className="flex flex-col items-center space-y-3">
            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-sm text-gray-600 dark:text-gray-300">Processing files...</p>
          </div>
        ) : (
          <>
            <div className="flex flex-col items-center space-y-3">
              <div className="text-4xl">📎</div>
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {isDragOver ? 'Drop files here' : 'Click to upload or drag and drop'}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Up to {maxFiles} files, max {maxFileSize}MB each
                </p>
              </div>
            </div>
            
            {/* Supported formats */}
            <div className="mt-4 text-xs text-gray-400 dark:text-gray-500">
              <p>Supported formats:</p>
              <p>Images (JPG, PNG, GIF, WebP), PDF, Word, Excel, Text, CSV, JSON, Markdown</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/**
 * File preview component for displaying uploaded files
 */
interface FilePreviewProps {
  file: UploadedFile;
  onRemove: (id: string) => void;
  className?: string;
}

export function FilePreview({ file, onRemove, className = '' }: FilePreviewProps) {
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

  return (
    <div className={`flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 ${className}`}>
      {/* File preview or icon */}
      <div className="flex-shrink-0">
        {file.preview ? (
          <img
            src={file.preview}
            alt={file.name}
            className="w-10 h-10 object-cover rounded"
          />
        ) : (
          <div className="w-10 h-10 flex items-center justify-center bg-gray-200 dark:bg-gray-600 rounded text-xl">
            {getFileIcon(file.type)}
          </div>
        )}
      </div>

      {/* File info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
          {file.name}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {formatFileSize(file.size)}
        </p>
        {file.error && (
          <p className="text-xs text-red-500 dark:text-red-400">
            {file.error}
          </p>
        )}
      </div>

      {/* Upload progress */}
      {file.uploadProgress !== undefined && file.uploadProgress < 100 && (
        <div className="flex-shrink-0 w-20">
          <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${file.uploadProgress}%` }}
            ></div>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-1">
            {file.uploadProgress}%
          </p>
        </div>
      )}

      {/* Remove button */}
      <button
        onClick={() => onRemove(file.id)}
        className="flex-shrink-0 p-1 text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
        title="Remove file"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}
