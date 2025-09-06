/**
 * Enhanced File Upload Component with S3 Integration
 * 
 * Provides drag-and-drop file upload with direct S3 upload capability
 * Features: progress tracking, file validation, preview generation, S3 storage
 */

import React, { useState, useRef, useCallback } from 'react';
import { s3UploadService } from '../services/s3UploadService';

// Extended interface for S3 uploaded files
export interface S3UploadedFile {
  id: string;
  file: File;
  name: string;
  size: number;
  type: string;
  preview?: string;
  error?: string;
  uploadProgress: number;
  s3Url?: string;
  isUploading?: boolean;
  isCompleted?: boolean;
}

export type SupportedFileType = 
  | 'image/jpeg' 
  | 'image/png' 
  | 'image/gif' 
  | 'image/webp'
  | 'application/pdf'
  | 'application/msword'
  | 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  | 'text/plain'
  | 'text/csv'
  | 'application/json'
  | 'text/markdown';

const DEFAULT_ACCEPTED_TYPES: SupportedFileType[] = [
  'image/jpeg',
  'image/png', 
  'image/gif',
  'image/webp',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
  'text/csv',
  'application/json',
  'text/markdown'
];

interface S3FileUploadProps {
  onFilesUploaded: (files: S3UploadedFile[]) => void;
  onUploadProgress?: (files: S3UploadedFile[]) => void;
  maxFiles?: number;
  maxFileSize?: number;
  acceptedTypes?: SupportedFileType[];
  disabled?: boolean;
  className?: string;
  folder?: string; // S3 folder to upload to
  userInfo?: {
    userId: string;
    userName?: string;
    userEmail?: string;
  };
}

/**
 * S3 File Upload Component
 * 
 * @param onFilesUploaded - Callback function called when files are successfully uploaded to S3
 * @param onUploadProgress - Callback function called during upload progress updates
 * @param maxFiles - Maximum number of files allowed (default: 5)
 * @param maxFileSize - Maximum file size in MB (default: 10)
 * @param acceptedTypes - Array of accepted file types
 * @param disabled - Whether the upload is disabled
 * @param className - Additional CSS classes
 * @param folder - S3 folder to upload files to (default: 'documents')
 */
export default function S3FileUpload({
  onFilesUploaded,
  onUploadProgress,
  maxFiles = 5,
  maxFileSize = 10,
  acceptedTypes = DEFAULT_ACCEPTED_TYPES,
  disabled = false,
  className = '',
  folder = 'documents',
  userInfo
}: S3FileUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState<S3UploadedFile[]>([]);
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
   * Upload files to S3 with progress tracking
   */
  const uploadFilesToS3 = useCallback(async (files: File[]) => {
    const initialFiles: S3UploadedFile[] = await Promise.all(
      files.map(async (file) => {
        const preview = await createFilePreview(file);
        return {
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          file,
          name: file.name,
          size: file.size,
          type: file.type,
          preview,
          uploadProgress: 0,
          isUploading: true,
          isCompleted: false
        };
      })
    );

    setUploadingFiles(initialFiles);
    onUploadProgress?.(initialFiles);

    const uploadedFiles: S3UploadedFile[] = [];

    for (const fileData of initialFiles) {
      try {
        // Upload to S3 with progress tracking
        const result = await s3UploadService.uploadFile(
          fileData.file,
          folder,
          (progress) => {
            // Update progress for this specific file
            setUploadingFiles(prev => 
              prev.map(f => 
                f.id === fileData.id 
                  ? { ...f, uploadProgress: progress }
                  : f
              )
            );
            
            // Call progress callback with updated files
            const updatedFiles = uploadingFiles.map(f => 
              f.id === fileData.id 
                ? { ...f, uploadProgress: progress }
                : f
            );
            onUploadProgress?.(updatedFiles);
          },
          userInfo
        );

        if (!result.success) {
          throw new Error(result.error || 'Upload failed');
        }

        // Mark as completed
        const completedFile: S3UploadedFile = {
          ...fileData,
          uploadProgress: 100,
          s3Url: result.fileUrl,
          isUploading: false,
          isCompleted: true
        };

        uploadedFiles.push(completedFile);

        // Update state
        setUploadingFiles(prev => 
          prev.map(f => 
            f.id === fileData.id ? completedFile : f
          )
        );

      } catch (error) {
        console.error('Upload failed:', error);
        
        // Mark as failed
        const failedFile: S3UploadedFile = {
          ...fileData,
          error: error instanceof Error ? error.message : 'Upload failed',
          isUploading: false,
          isCompleted: false
        };

        setUploadingFiles(prev => 
          prev.map(f => 
            f.id === fileData.id ? failedFile : f
          )
        );
      }
    }

    // Call completion callback with successfully uploaded files
    const successfulUploads = uploadedFiles.filter(f => f.isCompleted && !f.error);
    if (successfulUploads.length > 0) {
      onFilesUploaded(successfulUploads);
    }

    // Clear uploading state after a delay
    setTimeout(() => {
      setUploadingFiles([]);
    }, 2000);

  }, [folder, onFilesUploaded, onUploadProgress, uploadingFiles, userInfo]);

  /**
   * Process selected files and upload to S3
   */
  const processFiles = useCallback(async (fileList: FileList) => {
    if (disabled) return;

    const files = Array.from(fileList);
    if (files.length > maxFiles) {
      alert(`You can only upload up to ${maxFiles} files at once`);
      return;
    }

    // Validate files before upload
    const validFiles: File[] = [];
    for (const file of files) {
      const error = s3UploadService.validateFile(file);
      if (error) {
        alert(`${file.name}: ${error}`);
        continue;
      }
      if (!acceptedTypes.includes(file.type as SupportedFileType)) {
        alert(`${file.name}: File type ${file.type} is not supported`);
        continue;
      }
      validFiles.push(file);
    }

    if (validFiles.length === 0) return;

    // Upload valid files to S3
    await uploadFilesToS3(validFiles);
  }, [disabled, maxFiles, maxFileSize, acceptedTypes, uploadFilesToS3]);

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
  const isUploading = uploadingFiles.some(f => f.isUploading);

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
          relative border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-all duration-200
          ${isDragOver 
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-400' 
            : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 bg-gray-50 dark:bg-gray-700/50'
          }
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
          ${isUploading ? 'pointer-events-none' : ''}
        `}
      >
        {isUploading ? (
          <div className="flex flex-col items-center space-y-2">
            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-sm text-gray-600 dark:text-gray-300">Uploading to cloud storage...</p>
          </div>
        ) : (
          <>
            <div className="flex flex-col items-center space-y-2">
              <div className="text-3xl">☁️</div>
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {isDragOver ? 'Drop files here' : 'Click to upload or drag & drop'}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Up to {maxFiles} files, max {maxFileSize}MB each • Saves to secure cloud storage
                </p>
              </div>
            </div>
            
            {/* Supported formats */}
            <div className="mt-3 p-2 bg-gray-100 dark:bg-gray-600 rounded text-xs text-gray-600 dark:text-gray-300">
              <p className="font-medium mb-1">Supported formats:</p>
              <p>Images, PDF, Word, Excel, Text files</p>
            </div>
          </>
        )}
      </div>

      {/* Upload progress display */}
      {uploadingFiles.length > 0 && (
        <div className="mt-4 space-y-2">
          {uploadingFiles.map((file) => (
            <div key={file.id} className="flex items-center gap-3 p-2 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
              <div className="text-lg">{getFileIcon(file.type)}</div>
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
              <div className="flex-shrink-0 w-20">
                {file.isUploading ? (
                  <>
                    <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${file.uploadProgress}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-1">
                      {file.uploadProgress}%
                    </p>
                  </>
                ) : file.isCompleted ? (
                  <span className="text-green-500 text-xs">✓ Uploaded</span>
                ) : file.error ? (
                  <span className="text-red-500 text-xs">✗ Failed</span>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
