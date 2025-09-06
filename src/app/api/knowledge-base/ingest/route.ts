import { NextRequest, NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const s3 = new S3Client({ region: process.env.AWS_REGION || 'us-east-1' });

export async function POST(request: NextRequest) {
  try {
    const { userId, documentId, content } = await request.json();

    if (!userId || !documentId || typeof content !== 'string') {
      return NextResponse.json({ error: 'userId, documentId and content are required' }, { status: 400 });
    }

    const bucket = process.env.KNOWLEDGE_BASE_BUCKET || process.env.S3_DOCUMENTS_BUCKET_DEV || process.env.AWS_S3_BUCKET_NAME;
    if (!bucket) {
      return NextResponse.json({ error: 'Knowledge base bucket not configured' }, { status: 500 });
    }

    const key = `users/${userId}/documents/${documentId}.txt`;

    await s3.send(new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: content,
      ContentType: 'text/plain',
      Metadata: {
        userId,
        documentId,
        source: 'webapp',
        ingestedAt: new Date().toISOString(),
      }
    }));

    return NextResponse.json({ success: true, bucket, key });
  } catch (error) {
    console.error('Knowledge-base ingest error:', error);
    return NextResponse.json({ error: 'Failed to ingest content' }, { status: 500 });
  }
}
