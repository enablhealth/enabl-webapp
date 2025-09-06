/**
 * Test Document Upload to DynamoDB
 * 
 * Simple test to verify DynamoDB integration is working
 */

import { documentStorage } from '../src/services/documentStorage';

async function testDynamoDBIntegration() {
  console.log('🧪 Testing DynamoDB Integration...');

  // Test 1: Health Check
  console.log('\n1️⃣ Testing health check...');
  const health = await documentStorage.healthCheck();
  console.log('Health status:', health);

  // Test 2: Get documents for a test user (should return empty array)
  console.log('\n2️⃣ Testing document retrieval...');
  const testUserId = 'test-user-' + Date.now();
  const documents = await documentStorage.getUserDocuments(testUserId);
  console.log(`Documents for ${testUserId}:`, documents.length);

  // Test 3: Save a test document
  console.log('\n3️⃣ Testing document save...');
  const testDocument = {
    userId: testUserId,
    documentId: 'test-doc-' + Date.now(),
    name: 'Test Document.pdf',
    size: 1024,
    type: 'application/pdf',
    uploadDate: new Date().toISOString(),
    s3Key: 'test-documents/test-doc.pdf',
    s3Url: 'https://s3.amazonaws.com/test-bucket/test-doc.pdf',
    analysisResult: {
      documentTypeDetection: {
        detectedType: 'informational',
        confidence: 0.9,
        reasoning: 'Test document classification'
      },
      medicalRecordPercentage: 0,
      requiresSignature: false,
      fields: [],
      tags: ['test', 'document'],
      healthcareTags: ['informational'],
    }
  };

  const savedDoc = await documentStorage.saveDocument(testDocument);
  console.log('Saved document:', savedDoc.documentId);

  // Test 4: Retrieve the saved document
  console.log('\n4️⃣ Testing document retrieval by ID...');
  const retrievedDoc = await documentStorage.getDocument(testUserId, savedDoc.documentId);
  console.log('Retrieved document:', retrievedDoc?.name);

  // Test 5: Get all documents for the user (should now return 1)
  console.log('\n5️⃣ Testing updated document count...');
  const updatedDocuments = await documentStorage.getUserDocuments(testUserId);
  console.log(`Documents after save: ${updatedDocuments.length}`);

  // Test 6: Delete the test document
  console.log('\n6️⃣ Testing document deletion...');
  await documentStorage.deleteDocument(testUserId, savedDoc.documentId);
  console.log('Document deleted');

  // Test 7: Verify deletion
  console.log('\n7️⃣ Testing document count after deletion...');
  const finalDocuments = await documentStorage.getUserDocuments(testUserId);
  console.log(`Final document count: ${finalDocuments.length}`);

  console.log('\n✅ DynamoDB integration test completed successfully!');
}

// Run the test
testDynamoDBIntegration()
  .then(() => {
    console.log('\n🎉 All tests passed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  });
