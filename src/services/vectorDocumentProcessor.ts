// Embeddings are generated server-side via /api/embeddings to avoid browser AWS creds
import { v4 as uuidv4 } from 'uuid';

interface DocumentMetadata {
  documentName: string;
  documentType: string;
  uploadDate: string;
  medicalCategories: string[];
}

interface DocumentChunk {
  chunkId: string;
  documentId: string;
  userId: string;
  content: string;
  chunkIndex: number;
  startOffset: number;
  endOffset: number;
  metadata: DocumentMetadata;
  embedding?: number[];
}

interface VectorSearchResult {
  chunkId: string;
  documentId: string;
  content: string;
  score: number;
  metadata: Record<string, unknown>;
}

interface HealthInsights {
  summary: string;
  categories: string[];
  recommendations: string[];
  trends: Array<{
    type: string;
    direction: 'up' | 'down' | 'stable';
    confidence: number;
  }>;
  alerts: Array<{
    level: 'low' | 'medium' | 'high';
    message: string;
  }>;
}

export class VectorDocumentProcessor {
  private collectionEndpoint: string;
  private knowledgeBaseBucket: string;

  constructor() {
    this.collectionEndpoint = process.env.NEXT_PUBLIC_OPENSEARCH_ENDPOINT || 
                              process.env.OPENSEARCH_COLLECTION_ENDPOINT || '';
    this.knowledgeBaseBucket = process.env.KNOWLEDGE_BASE_BUCKET || '';
  }

  /**
   * Process document: Extract text, chunk content, generate embeddings, store in OpenSearch
   */
  async processDocumentForVector(
    documentId: string,
    userId: string,
    s3Key: string,
    documentName: string,
    documentType: string
  ): Promise<void> {
    try {
      console.log(`Processing document ${documentId} for vector storage`);

      // 1. Extract text content from S3
  const textContent = await this.extractTextFromDocument(documentId, userId, s3Key, documentName, documentType);

      // 2. Chunk the document content
      const chunks = await this.chunkDocument(textContent, documentId, userId, {
        documentName,
        documentType,
        uploadDate: new Date().toISOString(),
        medicalCategories: this.extractMedicalCategories(textContent)
      });

      // 3. Generate embeddings for each chunk
      const chunksWithEmbeddings = await this.generateEmbeddings(chunks);

      // 4. Store chunks in OpenSearch (via API call since we're in frontend context)
      await this.storeChunksViaAPI(chunksWithEmbeddings);

      // 5. Update user's knowledge base
      await this.updateUserKnowledgeBase(userId, documentId, textContent);

      console.log(`Successfully processed document ${documentId} into ${chunks.length} chunks`);

    } catch (error) {
      console.error(`Error processing document ${documentId}:`, error);
      throw error;
    }
  }

  /**
   * Extract text content using server APIs (signed URL + PDF extractor)
   */
  private async extractTextFromDocument(
    documentId: string,
    userId: string,
    s3Key: string,
    documentName: string,
    documentType: string
  ): Promise<string> {
    try {
      // 1) Request a signed URL from our secure API (server-side credentials)
      const signedResp = await fetch(`/api/documents/${encodeURIComponent(documentId)}/view?userId=${encodeURIComponent(userId)}&action=view`);
      if (!signedResp.ok) {
        throw new Error(`Failed to get signed URL: ${signedResp.statusText}`);
      }
      const { signedUrl, fileType } = await signedResp.json();

      // 2) Fetch the file via the signed URL (public, no AWS creds needed in browser)
      const fileFetch = await fetch(signedUrl);
      if (!fileFetch.ok) {
        throw new Error(`Failed to fetch signed file: ${fileFetch.statusText}`);
      }
      const blob = await fileFetch.blob();

      const effectiveType = documentType || fileType || blob.type || '';

      // 3) If it's a PDF, send to our PDF extraction API
      if (effectiveType.includes('pdf')) {
        const form = new FormData();
        const pdfFile = new File([blob], documentName || 'document.pdf', { type: 'application/pdf' });
        form.append('file', pdfFile);

        const extractResp = await fetch('/api/extract/pdf', { method: 'POST', body: form });
        if (!extractResp.ok) {
          throw new Error(`PDF extract failed: ${extractResp.statusText}`);
        }
        const data = await extractResp.json();
        return data.text || '';
      }

      // 4) Otherwise, attempt text() directly
      return await fileFetch.text();

    } catch (error) {
      console.error('Error extracting text via API:', error);
      throw new Error(`Failed to extract text from document: ${error}`);
    }
  }

  /**
   * Chunk document content for better semantic search
   */
  private async chunkDocument(
    content: string,
    documentId: string,
    userId: string,
    metadata: DocumentMetadata
  ): Promise<DocumentChunk[]> {
    const chunks: DocumentChunk[] = [];
    const chunkSize = 1000; // characters
    const overlap = 200; // character overlap between chunks

    for (let i = 0; i < content.length; i += chunkSize - overlap) {
      const chunkContent = content.substring(i, Math.min(i + chunkSize, content.length));
      
      // Skip very short chunks
      if (chunkContent.trim().length < 50) continue;

      chunks.push({
        chunkId: uuidv4(),
        documentId,
        userId,
        content: chunkContent.trim(),
        chunkIndex: Math.floor(i / (chunkSize - overlap)),
        startOffset: i,
        endOffset: Math.min(i + chunkSize, content.length),
        metadata
      });
    }

    return chunks;
  }

  /**
   * Generate vector embeddings using Bedrock
   */
  private async generateEmbeddings(chunks: DocumentChunk[]): Promise<DocumentChunk[]> {
    const chunksWithEmbeddings: DocumentChunk[] = [];

    for (const chunk of chunks) {
      try {
        const embedding = await this.generateSingleEmbedding(chunk.content);
        chunksWithEmbeddings.push({
          ...chunk,
          embedding
        });
      } catch (error) {
        console.error(`Error generating embedding for chunk ${chunk.chunkId}:`, error);
        // Skip chunks that fail embedding generation
      }
    }

    return chunksWithEmbeddings;
  }

  /**
   * Generate single embedding using Titan Embeddings
   */
  private async generateSingleEmbedding(text: string): Promise<number[]> {
    try {
      const resp = await fetch('/api/embeddings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: text.substring(0, 8000) })
      });

      if (resp.ok) {
        const data = await resp.json();
        if (Array.isArray(data.embedding)) return data.embedding;
        if (Array.isArray(data.embeddings) && Array.isArray(data.embeddings[0])) return data.embeddings[0];
      }
      throw new Error(`Embeddings API error: ${resp.status} ${resp.statusText}`);
    } catch (error) {
      console.error('Error generating embedding via API, falling back to local hash embedding:', error);
      return this.fallbackEmbedding(text);
    }
  }

  /**
   * Simple deterministic fallback embedding (no AWS creds required)
   */
  private fallbackEmbedding(text: string, dim = 128): number[] {
    const out = new Array(dim).fill(0);
    for (let i = 0; i < text.length; i++) {
      const code = text.charCodeAt(i);
      const idx = i % dim;
      out[idx] = (out[idx] + code) % 9973;
    }
    // Normalize
    const norm = Math.sqrt(out.reduce((s, v) => s + v * v, 0)) || 1;
    return out.map(v => v / norm);
  }

  /**
   * Store document chunks via API endpoint (since we're in frontend context)
   */
  private async storeChunksViaAPI(chunks: DocumentChunk[]): Promise<void> {
    try {
      const response = await fetch('/api/documents/store-chunks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ chunks })
      });

      if (!response.ok) {
        throw new Error(`Failed to store chunks: ${response.statusText}`);
      }

      console.log(`Successfully stored ${chunks.length} chunks in OpenSearch`);

    } catch (error) {
      console.error('Error storing chunks via API:', error);
      throw error;
    }
  }

  /**
   * Semantic search across user's documents
   */
  async semanticSearch(
    query: string,
    userId: string,
    options: {
      limit?: number;
      minScore?: number;
      documentTypes?: string[];
      dateRange?: { start: string; end: string };
    } = {}
  ): Promise<VectorSearchResult[]> {
    try {
      const response = await fetch('/api/documents/semantic-search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query,
          userId,
          options
        })
      });

      if (!response.ok) {
        throw new Error(`Search failed: ${response.statusText}`);
      }

      const data = await response.json();
      return data.results || [];

    } catch (error) {
      console.error('Error performing semantic search:', error);
      return [];
    }
  }

  /**
   * Update user's Bedrock Knowledge Base with new document
   */
  private async updateUserKnowledgeBase(userId: string, documentId: string, content: string): Promise<void> {
    try {
      // Store document content via server API (avoids browser AWS creds)
      const resp = await fetch('/api/knowledge-base/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, documentId, content })
      });

      if (!resp.ok) {
        console.warn('Knowledge base ingest failed:', await resp.text());
      } else {
        console.log(`Updated knowledge base for user ${userId} with document ${documentId}`);
      }

      // Trigger knowledge base sync via API (best-effort)
      await this.syncUserKnowledgeBaseViaAPI(userId);

    } catch (error) {
      console.error(`Error updating knowledge base for user ${userId}:`, error);
    }
  }

  /**
   * Sync user's knowledge base with Bedrock via API
   */
  private async syncUserKnowledgeBaseViaAPI(userId: string): Promise<void> {
    try {
      const response = await fetch('/api/knowledge-base/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId })
      });

      if (!response.ok) {
        console.warn(`Knowledge base sync failed: ${response.statusText}`);
      } else {
        console.log(`Triggered knowledge base sync for user ${userId}`);
      }

    } catch (error) {
      console.error('Error syncing knowledge base:', error);
    }
  }

  /**
   * Extract medical categories from text content
   */
  private extractMedicalCategories(text: string): string[] {
    const categories: string[] = [];
    const lowerText = text.toLowerCase();

    const categoryKeywords = {
      'lab-results': ['blood test', 'laboratory', 'lab result', 'pathology', 'blood work', 'urine test'],
      'medical-records': ['diagnosis', 'condition', 'treatment', 'medical history', 'symptoms', 'examination'],
      'medications': ['prescription', 'medication', 'drug', 'pharmacy', 'dosage', 'pills'],
      'imaging': ['x-ray', 'mri', 'ct scan', 'ultrasound', 'imaging', 'radiology'],
      'insurance': ['insurance', 'claim', 'coverage', 'policy', 'deductible', 'copay'],
      'appointments': ['appointment', 'schedule', 'visit', 'consultation', 'follow-up'],
      'vitals': ['blood pressure', 'heart rate', 'temperature', 'weight', 'height', 'bmi'],
      'allergies': ['allergy', 'allergic', 'reaction', 'sensitivity', 'intolerance']
    };

    Object.entries(categoryKeywords).forEach(([category, keywords]) => {
      if (keywords.some(keyword => lowerText.includes(keyword))) {
        categories.push(category);
      }
    });

    return categories.length > 0 ? categories : ['general'];
  }

  /**
   * Get similar documents based on content
   */
  async findSimilarDocuments(
    documentId: string,
    userId: string,
    limit: number = 5
  ): Promise<VectorSearchResult[]> {
    try {
      const response = await fetch('/api/documents/similar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          documentId,
          userId,
          limit
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to find similar documents: ${response.statusText}`);
      }

      const data = await response.json();
      return data.results || [];

    } catch (error) {
      console.error('Error finding similar documents:', error);
      return [];
    }
  }

  /**
   * Get health insights from user's documents
   */
  async getHealthInsights(userId: string): Promise<HealthInsights | null> {
    try {
      const response = await fetch('/api/health/insights', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId })
      });

      if (!response.ok) {
        throw new Error(`Failed to get health insights: ${response.statusText}`);
      }

      return await response.json();

    } catch (error) {
      console.error('Error getting health insights:', error);
      return null;
    }
  }
}

// Export singleton instance
export const vectorDocumentProcessor = new VectorDocumentProcessor();
