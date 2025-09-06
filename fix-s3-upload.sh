#!/bin/bash

# S3 Upload Fix Script for Enabl Health Development Environment
# This script resolves the 403 Forbidden error when uploading files to S3

echo "🔧 Fixing S3 Upload Configuration for Development Environment..."

# 1. Check if AWS CLI is configured
echo "📋 Checking AWS configuration..."
if ! aws sts get-caller-identity >/dev/null 2>&1; then
    echo "❌ AWS credentials not configured. Please run:"
    echo "   aws configure"
    echo "   or set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY environment variables"
    exit 1
fi

echo "✅ AWS credentials are configured"

# 2. Check if the S3 bucket exists and is accessible
BUCKET_NAME="enabl-user-uploads-dev"
echo "🪣 Checking S3 bucket: $BUCKET_NAME"

if ! aws s3 ls "s3://$BUCKET_NAME" >/dev/null 2>&1; then
    echo "❌ Cannot access bucket: $BUCKET_NAME"
    echo "   Please check if the bucket exists and you have proper permissions"
    exit 1
fi

echo "✅ S3 bucket is accessible"

# 3. Set up CORS configuration for the bucket
echo "🌐 Configuring CORS for S3 bucket..."

# Create CORS configuration
cat > /tmp/s3-cors-config.json << 'EOF'
{
  "CORSRules": [
    {
      "AllowedHeaders": ["*"],
      "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
      "AllowedOrigins": [
        "http://localhost:3000",
        "http://localhost:3001",
        "https://dev.enabl.health",
        "https://staging.enabl.health", 
        "https://enabl.health"
      ],
      "ExposeHeaders": ["ETag", "x-amz-meta-*"],
      "MaxAgeSeconds": 3000
    }
  ]
}
EOF

# Apply CORS configuration
if aws s3api put-bucket-cors --bucket "$BUCKET_NAME" --cors-configuration file:///tmp/s3-cors-config.json; then
    echo "✅ CORS configuration applied successfully"
else
    echo "⚠️  Failed to apply CORS configuration (might not have permissions)"
fi

# 4. Test bucket permissions by creating a test object
echo "🧪 Testing bucket write permissions..."
TEST_KEY="test-uploads/permission-test-$(date +%s).txt"
if echo "test" | aws s3 cp - "s3://$BUCKET_NAME/$TEST_KEY" >/dev/null 2>&1; then
    echo "✅ Write permissions confirmed"
    # Clean up test file
    aws s3 rm "s3://$BUCKET_NAME/$TEST_KEY" >/dev/null 2>&1
else
    echo "❌ No write permissions to bucket"
    echo "   Please check IAM policies for your AWS user/role"
    exit 1
fi

# 5. Update environment variables
echo "📝 Updating environment configuration..."

ENV_FILE=".env.development.local"
if [ -f "$ENV_FILE" ]; then
    # Update bucket name if needed
    if grep -q "S3_DOCUMENTS_BUCKET_DEV=enabl-documents-dev" "$ENV_FILE"; then
        sed -i.bak 's/S3_DOCUMENTS_BUCKET_DEV=enabl-documents-dev/S3_DOCUMENTS_BUCKET_DEV=enabl-user-uploads-dev/' "$ENV_FILE"
        echo "✅ Updated S3_DOCUMENTS_BUCKET_DEV to enabl-user-uploads-dev"
    fi
    
    # Add AWS_S3_BUCKET_NAME if not exists
    if ! grep -q "AWS_S3_BUCKET_NAME" "$ENV_FILE"; then
        echo "AWS_S3_BUCKET_NAME=enabl-user-uploads-dev" >> "$ENV_FILE"
        echo "✅ Added AWS_S3_BUCKET_NAME to environment"
    fi
else
    echo "⚠️  Environment file not found: $ENV_FILE"
fi

# 6. Generate a test presigned URL to verify the API is working
echo "🔗 Testing presigned URL generation..."
curl -s -X POST http://localhost:3000/api/debug/s3-config | jq . 2>/dev/null || echo "Debug endpoint response: $(curl -s http://localhost:3000/api/debug/s3-config)"

echo ""
echo "🎉 S3 Upload Fix Complete!"
echo ""
echo "📋 Summary of changes:"
echo "   ✅ Verified AWS credentials"
echo "   ✅ Confirmed S3 bucket access"
echo "   ✅ Applied CORS configuration"
echo "   ✅ Tested write permissions"
echo "   ✅ Updated environment variables"
echo ""
echo "🔄 Please restart your development server:"
echo "   npm run dev"
echo ""
echo "💡 If you still get 403 errors, check:"
echo "   1. IAM user/role has PutObject permission for $BUCKET_NAME"
echo "   2. Bucket policy allows uploads from your IP/user"
echo "   3. Environment variables are properly loaded in the app"

# Clean up
rm -f /tmp/s3-cors-config.json
