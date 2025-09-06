# S3 Upload Implementation Guide

## Overview
Successfully implemented AWS S3 file upload functionality for Enabl Health document management.

## Features Implemented

### 1. S3 Upload Service (`src/services/s3UploadService.ts`)
- **Presigned URL Generation**: Secure client-side uploads without exposing AWS credentials
- **Progress Tracking**: Real-time upload progress with XMLHttpRequest
- **File Validation**: Size limits (10MB) and type restrictions
- **Error Handling**: Comprehensive error messages and retry logic
- **Multiple Upload Support**: Batch upload capabilities

### 2. API Routes
- **`/api/s3/presigned-url`**: Generates presigned URLs for direct S3 upload
- **`/api/s3/delete`**: Handles secure file deletion from S3

### 3. S3FileUpload Component (`src/components/S3FileUpload.tsx`)
- **Drag & Drop**: Enhanced file upload with visual feedback
- **Progress Display**: Real-time upload progress bars
- **Cloud Icon**: Visual indication of cloud storage
- **Error Handling**: User-friendly error messages

### 4. SmartDocumentPane Integration
- **S3 Integration**: Replaced mock uploads with real S3 storage
- **AI Analysis Pipeline**: Seamless integration with document analysis
- **Cloud URLs**: Documents stored with S3 URLs for direct access

## Setup Instructions

### 1. Environment Configuration
```bash
# Copy the development environment template
cp .env.development.local.example .env.local

# Add your AWS credentials
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-actual-access-key
AWS_SECRET_ACCESS_KEY=your-actual-secret-key
```

### 2. S3 Bucket Setup
```bash
# Ensure these buckets exist in your AWS account:
# - enabl-documents-dev (development)
# - enabl-documents-staging (staging)  
# - enabl-documents-prod (production)
```

### 3. CORS Configuration
The S3 buckets need proper CORS configuration for browser uploads:
```json
{
  "CORSRules": [
    {
      "AllowedOrigins": [
        "http://localhost:3000",
        "https://dev.enabl.health",
        "https://staging.enabl.health", 
        "https://enabl.health"
      ],
      "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
      "AllowedHeaders": ["*"],
      "MaxAgeSeconds": 3000
    }
  ]
}
```

### 4. IAM Permissions
The AWS user/role needs these permissions:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject"
      ],
      "Resource": [
        "arn:aws:s3:::enabl-documents-dev/*",
        "arn:aws:s3:::enabl-documents-staging/*",
        "arn:aws:s3:::enabl-documents-prod/*"
      ]
    }
  ]
}
```

## Testing

### 1. Local Development Testing
```bash
# Start the development server
npm run dev

# Navigate to chat interface
# Select "Document Agent"
# Document pane should appear at bottom
# Upload files using the new S3 upload component
```

### 2. Verification Steps
1. **Upload Progress**: Verify progress bars show during upload
2. **S3 Storage**: Check AWS S3 console for uploaded files
3. **Document Display**: Confirm documents appear in the pane
4. **AI Analysis**: Verify mock analysis runs after upload
5. **Error Handling**: Test with oversized/invalid files

## Architecture Benefits

### 1. Security
- **No Credential Exposure**: Presigned URLs prevent client-side credential exposure
- **Time-Limited Access**: URLs expire after 1 hour
- **Validation**: Server-side file type and size validation

### 2. Performance  
- **Direct Upload**: Files go directly to S3, bypassing server
- **Progress Tracking**: Real-time feedback for better UX
- **Concurrent Uploads**: Multiple files can upload simultaneously

### 3. Scalability
- **No Server Storage**: Files stored in S3, not server filesystem
- **Global Access**: S3 provides worldwide CDN capabilities
- **Environment Isolation**: Separate buckets per environment

## File Flow

1. **User selects files** → S3FileUpload component
2. **Client requests presigned URL** → `/api/s3/presigned-url`
3. **Server generates secure URL** → Returns upload URL + file URL
4. **Client uploads directly to S3** → XMLHttpRequest with progress
5. **Upload completes** → Document added to SmartDocumentPane
6. **AI analysis triggers** → Mock analysis (TODO: real AI integration)

## Next Steps

### 1. AI Integration
- Replace mock analysis with real Bedrock agent calls
- Implement document categorization and tagging
- Add content extraction for text documents

### 2. Enhanced Features
- **File versioning**: Track document updates
- **Sharing**: Enable secure document sharing between users
- **Thumbnails**: Generate previews for images and PDFs
- **Search**: Full-text search across document content

### 3. Production Deployment
- Configure App Runner environment variables
- Set up CloudFront for global S3 access
- Implement proper IAM roles for production

## Troubleshooting

### Common Issues
1. **CORS Errors**: Check S3 bucket CORS configuration
2. **Permission Denied**: Verify IAM permissions for S3 operations
3. **Invalid Credentials**: Ensure AWS credentials are correct
4. **Bucket Not Found**: Verify bucket names and region settings

### Debug Steps
1. Check browser developer console for errors
2. Verify AWS credentials in environment variables
3. Test presigned URL generation in API routes
4. Confirm S3 bucket exists and is accessible

This implementation provides a solid foundation for production-ready document uploads with AWS S3 integration.
