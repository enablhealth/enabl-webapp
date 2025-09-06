/**
 * S3 Upload Service for Enabl Health
 * 
 * Handles secure file uploads to AWS S3 for document storage
 */

export interface S3UploadConfig {
  bucketName: string;
  region: string;
  folder?: string;
}

export interface S3UploadProgress {
  fileName: string;
  progress: number;
  uploaded: number;
  total: number;
}

export interface S3UploadResult {
  success: boolean;
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  error?: string;
}

export interface PresignedUrlResponse {
  uploadUrl: string;
  fileUrl: string;
  fileName: string;
}

class S3UploadService {
  private readonly baseUrl: string;

  constructor() {
    // Use relative URLs for Next.js API routes in browser
    // For server-side, this will work with the same domain
    this.baseUrl = typeof window !== 'undefined' ? '' : 'http://localhost:3000';
  }

  /**
   * Get presigned URL for direct S3 upload with owner information
   */
  async getPresignedUrl(
    fileName: string, 
    fileType: string, 
    fileSize: number,
    folder: string = 'documents',
    userInfo?: {
      userId: string;
      userName?: string;
      userEmail?: string;
    }
  ): Promise<PresignedUrlResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/api/s3/presigned-url`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileName,
          fileType,
          fileSize,
          folder,
          userId: userInfo?.userId,
          userName: userInfo?.userName,
          userEmail: userInfo?.userEmail
        }),
      });      if (!response.ok) {
        throw new Error(`Failed to get presigned URL: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting presigned URL:', error);
      throw error;
    }
  }

  /**
   * Upload file directly to S3 using presigned URL
   */
  async uploadToS3(
    file: File,
    presignedUrl: string,
    onProgress?: (progress: S3UploadProgress) => void
  ): Promise<boolean> {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      // Track upload progress
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable && onProgress) {
          const progress = Math.round((event.loaded / event.total) * 100);
          onProgress({
            fileName: file.name,
            progress,
            uploaded: event.loaded,
            total: event.total,
          });
        }
      };

      xhr.onload = () => {
        if (xhr.status === 200 || xhr.status === 204) {
          resolve(true);
        } else {
          reject(new Error(`Upload failed with status: ${xhr.status}`));
        }
      };

      xhr.onerror = () => {
        reject(new Error('Upload failed due to network error'));
      };

      xhr.open('PUT', presignedUrl);
      xhr.setRequestHeader('Content-Type', file.type);
      xhr.send(file);
    });
  }

  /**
   * Complete upload process: get presigned URL and upload file with owner tracking
   */
  async uploadFile(
    file: File,
    folder: string = 'documents',
    onProgress?: (progress: number) => void,
    userInfo?: {
      userId: string;
      userName?: string;
      userEmail?: string;
    }
  ): Promise<S3UploadResult> {
    try {
      // Validate file
      const validationError = this.validateFile(file);
      if (validationError) {
        return {
          success: false,
          error: validationError,
        };
      }

      // Get presigned URL with user information
      const { uploadUrl, fileUrl, fileName } = await this.getPresignedUrl(
        file.name,
        file.type,
        file.size,
        folder,
        userInfo
      );

      // Upload to S3
      await this.uploadToS3(file, uploadUrl, (progress) => {
        onProgress?.(progress.progress);
      });

      return {
        success: true,
        fileUrl,
        fileName,
        fileSize: file.size,
      };
    } catch (error) {
      console.error('Error uploading file:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown upload error',
      };
    }
  }

  /**
   * Upload multiple files
   */
  async uploadFiles(
    files: File[],
    folder: string = 'documents',
    onProgress?: (fileName: string, progress: number) => void
  ): Promise<S3UploadResult[]> {
    const uploadPromises = files.map(file =>
      this.uploadFile(file, folder, onProgress ? (progress) => onProgress(file.name, progress) : undefined)
    );

    return Promise.all(uploadPromises);
  }

  /**
   * Delete file from S3
   */
  async deleteFile(fileUrl: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/s3/delete`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ fileUrl }),
      });

      return response.ok;
    } catch (error) {
      console.error('Error deleting file:', error);
      return false;
    }
  }

  /**
   * Validate file before upload
   */
  validateFile(file: File): string | null {
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'application/pdf',
      'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain', 'text/csv',
      'application/json'
    ];

    if (file.size > maxSize) {
      return `File size exceeds 10MB limit. File size: ${(file.size / 1024 / 1024).toFixed(2)}MB`;
    }

    if (!allowedTypes.includes(file.type as any)) {
      return `File type not supported: ${file.type}`;
    }

    return null;
  }

  /**
   * Generate thumbnail for images
   */
  async generateThumbnail(file: File, maxWidth: number = 200, maxHeight: number = 200): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!file.type.startsWith('image/')) {
        reject(new Error('File is not an image'));
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');

          if (!ctx) {
            reject(new Error('Could not get canvas context'));
            return;
          }

          // Calculate new dimensions
          let { width, height } = img;
          if (width > height) {
            if (width > maxWidth) {
              height = (height * maxWidth) / width;
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width = (width * maxHeight) / height;
              height = maxHeight;
            }
          }

          canvas.width = width;
          canvas.height = height;

          // Draw and convert to data URL
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.8));
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  }
}

export const s3UploadService = new S3UploadService();
