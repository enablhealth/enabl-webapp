/**
 * Migration Script: Local Storage to DynamoDB
 * 
 * Migrates existing document metadata from .storage/documents.json to DynamoDB
 */

import { promises as fs } from 'fs';
import path from 'path';
import { documentStorage } from '../services/documentStorage.js';

const STORAGE_DIR = path.join(process.cwd(), '.storage');
const DOCUMENTS_FILE = path.join(STORAGE_DIR, 'documents.json');

interface LegacyDocument {
  id: string;
  name: string;
  size: number;
  type: string;
  uploadDate?: string;
  s3Url: string;
  s3Key: string;
  savedAt?: string;
  owner?: {
    id: string;
  };
  aiAnalysis?: any;
}

async function loadLegacyDocuments(): Promise<LegacyDocument[]> {
  try {
    const data = await fs.readFile(DOCUMENTS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.log('No legacy documents found or file is empty');
    return [];
  }
}

async function migrateDocuments() {
  console.log('🚀 Starting migration from local storage to DynamoDB...');
  
  const legacyDocuments = await loadLegacyDocuments();
  
  if (legacyDocuments.length === 0) {
    console.log('✅ No documents to migrate');
    return;
  }

  console.log(`📄 Found ${legacyDocuments.length} documents to migrate`);

  let successful = 0;
  let failed = 0;

  for (const doc of legacyDocuments) {
    try {
      // Convert legacy document to new format
      const documentRecord = {
        userId: doc.owner?.id || 'guest-user',
        documentId: doc.id,
        name: doc.name,
        size: doc.size || 0,
        type: doc.type || 'application/pdf',
        uploadDate: doc.uploadDate || doc.savedAt || new Date().toISOString(),
        s3Key: doc.s3Key,
        s3Url: doc.s3Url,
        analysisResult: doc.aiAnalysis ? {
          documentTypeDetection: doc.aiAnalysis.documentTypeDetection || {
            detectedType: 'informational',
            confidence: 0.5,
            reasoning: 'Migrated from legacy storage'
          },
          medicalRecordPercentage: doc.aiAnalysis.medicalRecordPercentage || 0,
          requiresSignature: doc.aiAnalysis.requiresSignature || false,
          fields: doc.aiAnalysis.fields || [],
          tags: doc.aiAnalysis.tags || [],
          healthcareTags: doc.aiAnalysis.healthcareTags || [],
        } : undefined,
      };

      await documentStorage.saveDocument(documentRecord);
      console.log(`✅ Migrated: ${doc.name} (${doc.id})`);
      successful++;

    } catch (error) {
      console.error(`❌ Failed to migrate ${doc.name}:`, error);
      failed++;
    }
  }

  console.log(`\n📊 Migration Summary:`);
  console.log(`✅ Successful: ${successful}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📄 Total: ${legacyDocuments.length}`);

  if (successful > 0) {
    console.log(`\n🗂️  Legacy documents have been migrated to DynamoDB`);
    console.log(`📁 The .storage/documents.json file can be safely deleted after verification`);
  }
}

// Check if running as script
if (import.meta.url === `file://${process.argv[1]}`) {
  migrateDocuments()
    .then(() => {
      console.log('✅ Migration completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Migration failed:', error);
      process.exit(1);
    });
}

export { migrateDocuments };
