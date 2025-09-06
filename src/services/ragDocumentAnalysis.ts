/**
 * Enhanced RAG-Powered Document Analysis Service
 * 
 * Provides intelligent document analysis using Amazon Bedrock RAG
 * with comprehensive content extraction, knowledge base integration,
 * and healthcare compliance checking.
 */

// Type definitions for document analysis
export interface DocumentAnalysisResult {
  documentType: string;
  healthcareTags: string[];
  confidence: number;
  ragContext: {
    matchedSources: string[];
    guidelines: string[];
    relevantContent: string[];
    confidence: number;
  };
  structuralAnalysis: {
    fieldsCompleted: number;
    totalFields: number;
    hasSignature: boolean;
    hasConsent: boolean;
    complianceStatus: 'compliant' | 'partial' | 'non_compliant';
    recommendations: string[];
    // Enhanced document type detection fields
    documentTypeDetection?: {
      type: string;
      confidence: number;
      requiresSignature: boolean;
      requiresPersonalInfo: boolean;
      medicalRecordPercentage: number;
    } | null;
    medicalRecordPercentage: number;
    requiresSignature: boolean;
    requiresPersonalInfo: boolean;
  };
  contentExtraction: {
    extractedText: string;
    keyFindings: string[];
    documentStructure: string[];
  };
  metadata: {
    analyzedAt: string;
    processingTime: number;
    method: 'rag_enhanced';
  };
}

/**
 * RAG-Enhanced Document Analysis Service
 */
export class RAGDocumentAnalysisService {
  private readonly apiBaseUrl: string;

  constructor(apiBaseUrl: string = '') {
    this.apiBaseUrl = apiBaseUrl;
  }

  /**
   * Main analysis function that orchestrates all analysis steps
   */
  async analyzeDocument(file: File): Promise<DocumentAnalysisResult> {
    const startTime = Date.now();

    try {
      // Step 1: Extract content from document
      const extractedContent = await this.extractContent(file);

      // Step 2: Query RAG knowledge base for context
      const ragContext = await this.queryKnowledgeBase(extractedContent, file.name);

      // Step 3: Perform structural analysis
      const structuralAnalysis = await this.analyzeDocumentStructure(extractedContent, ragContext.documentType, file.name);

      // Step 4: Determine document type and tags
      const documentType = this.determineDocumentType(ragContext, file.name);
      const healthcareTags = this.generateHealthcareTags(ragContext, structuralAnalysis);

      // Step 5: Calculate overall confidence
      const confidence = this.calculateOverallConfidence(ragContext, structuralAnalysis);

      const processingTime = Date.now() - startTime;

      return {
        documentType: structuralAnalysis.documentType?.type || documentType, // Use detected document type from analysis
        healthcareTags,
        confidence,
        ragContext,
        structuralAnalysis: {
          fieldsCompleted: structuralAnalysis.detectedFields?.length || 0,
          totalFields: (structuralAnalysis.detectedFields?.length || 0) + (structuralAnalysis.missingFields?.length || 0),
          hasSignature: structuralAnalysis.signatures?.some((sig: any) => sig.type !== 'Unsigned signature line detected') || false,
          hasConsent: structuralAnalysis.checkboxes?.some((cb: any) => cb.type === 'checked') || false,
          complianceStatus: structuralAnalysis.complianceStatus || 'non_compliant',
          recommendations: structuralAnalysis.recommendations?.map((rec: any) => rec.message || rec) || [],
          // Preserve important analysis metadata
          documentTypeDetection: structuralAnalysis.documentType || null,
          medicalRecordPercentage: structuralAnalysis.medicalRecordPercentage || 0,
          requiresSignature: structuralAnalysis.documentType?.requiresSignature || false,
          requiresPersonalInfo: structuralAnalysis.documentType?.requiresPersonalInfo || false
        },
        contentExtraction: {
          extractedText: extractedContent,
          keyFindings: this.extractKeyFindings(extractedContent, ragContext),
          documentStructure: this.analyzeDocumentStructure2(extractedContent)
        },
        metadata: {
          analyzedAt: new Date().toISOString(),
          processingTime,
          method: 'rag_enhanced'
        }
      };

    } catch (error) {
      console.error('Document analysis error:', error);
      throw new Error(`Failed to analyze document: ${error}`);
    }
  }

  /**
   * Extract text content from different file types
   */
  private async extractContent(file: File): Promise<string> {
    const fileType = file.type.toLowerCase();
    
    if (fileType === 'application/pdf') {
      return this.extractPDFContent(file);
    } else if (fileType.startsWith('image/')) {
      return this.extractImageContent(file);
    } else if (fileType === 'text/plain') {
      return file.text();
    } else {
      throw new Error(`Unsupported file type: ${fileType}`);
    }
  }

  /**
   * Extract text from PDF files using the PDF extraction API
   */
  private async extractPDFContent(file: File): Promise<string> {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/extract/pdf', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`PDF extraction failed: ${response.statusText}`);
      }

      const result = await response.json();
      return result.text || '';
    } catch (error) {
      console.error('PDF extraction error:', error);
      throw new Error(`Failed to extract PDF content: ${error}`);
    }
  }

  /**
   * Extract text from image files using OCR API
   */
  private async extractImageContent(file: File): Promise<string> {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/extract/ocr', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`OCR extraction failed: ${response.statusText}`);
      }

      const result = await response.json();
      return result.text || '';
    } catch (error) {
      console.error('OCR extraction error:', error);
      throw new Error(`Failed to extract image content: ${error}`);
    }
  }

  /**
   * Query the RAG knowledge base for document context
   */
  private async queryKnowledgeBase(content: string, fileName: string): Promise<any> {
    try {
      const response = await fetch('/api/bedrock/rag-query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: content.substring(0, 1000), // First 1000 chars for context
          fileName,
          maxResults: 10
        }),
      });

      if (!response.ok) {
        throw new Error(`RAG query failed: ${response.statusText}`);
      }

      const ragResult = await response.json();
      return {
        ...ragResult,
        documentType: this.inferDocumentTypeFromRAG(ragResult)
      };
    } catch (error) {
      console.error('RAG query error:', error);
      // Return basic fallback
      return {
        matchedSources: [],
        guidelines: [],
        relevantContent: [],
        confidence: 0.5,
        documentType: 'unknown'
      };
    }
  }

  /**
   * Analyze document structure using Bedrock structure analysis
   */
  private async analyzeDocumentStructure(content: string, documentType: string, fileName: string): Promise<any> {
    try {
      const response = await fetch('/api/bedrock/structure-analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content,
          documentType,
          fileName,
        }),
      });

      if (!response.ok) {
        throw new Error(`Structure analysis failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Structure analysis error:', error);
      // Return basic fallback
      return {
        detectedFields: [],
        missingFields: [],
        signatures: [],
        checkboxes: [],
        completionPercentage: 0,
        complianceStatus: 'unknown',
        recommendations: []
      };
    }
  }

  /**
   * Infer document type from RAG results
   */
  private inferDocumentTypeFromRAG(ragResult: any): string {
    if (ragResult.matchedSources?.some((source: string) => source.includes('ndis'))) {
      return 'ndis';
    }
    if (ragResult.guidelines?.some((guideline: string) => guideline.toLowerCase().includes('consent'))) {
      return 'consent';
    }
    if (ragResult.guidelines?.some((guideline: string) => guideline.toLowerCase().includes('medical'))) {
      return 'medical';
    }
    return 'healthcare';
  }

  /**
   * Determine final document type
   */
  private determineDocumentType(ragContext: any, fileName: string): string {
    const ragType = ragContext.documentType || 'unknown';
    const fileNameLower = fileName.toLowerCase();

    // Priority: RAG context > filename patterns
    if (ragType !== 'unknown') {
      return ragType;
    }

    // Fallback to filename analysis
    if (fileNameLower.includes('ndis')) return 'ndis';
    if (fileNameLower.includes('consent')) return 'consent';
    if (fileNameLower.includes('blood') || fileNameLower.includes('test')) return 'lab_results';
    if (fileNameLower.includes('prescription')) return 'prescription';
    
    return 'healthcare';
  }

  /**
   * Generate healthcare tags based on RAG and structural analysis
   */
  private generateHealthcareTags(ragContext: any, structuralAnalysis: any): string[] {
    const tags = new Set<string>();

    // Tags from detected document type
    if (structuralAnalysis.documentType) {
      const docType = structuralAnalysis.documentType.type;
      
      if (docType === 'ndis_welcome_pack') {
        tags.add('ndis');
        tags.add('welcome pack');
        tags.add('informational');
      } else if (docType === 'ndis_form' || docType === 'ndis') {
        tags.add('ndis');
        tags.add('service delivery');
        tags.add('form');
      } else if (docType === 'medical_record') {
        tags.add('medical record');
        tags.add('healthcare');
      } else if (docType === 'consent_form') {
        tags.add('consent form');
        tags.add('authorization');
      } else if (docType === 'informational') {
        tags.add('informational');
        tags.add('guide');
      }
    }

    // Tags from RAG context
    if (ragContext.guidelines) {
      ragContext.guidelines.forEach((guideline: string) => {
        if (guideline.toLowerCase().includes('ndis')) {
          tags.add('ndis');
          tags.add('service delivery');
        }
        if (guideline.toLowerCase().includes('consent')) {
          tags.add('consent form');
        }
        if (guideline.toLowerCase().includes('participant')) {
          tags.add('participant');
        }
      });
    }

    // Tags from compliance status
    if (structuralAnalysis.complianceStatus === 'compliant') {
      tags.add('complete');
    } else if (structuralAnalysis.complianceStatus === 'partial') {
      tags.add('incomplete');
    }

    // Tags from structural analysis - only add signature requirement if document actually requires it
    if (structuralAnalysis.documentType?.requiresSignature && structuralAnalysis.signatures?.length > 0) {
      const hasValidSignature = structuralAnalysis.signatures.some((sig: any) => sig.type !== 'Unsigned signature line detected');
      if (!hasValidSignature) {
        tags.add('requires signature');
      }
    }

    // Default healthcare tag for non-informational documents
    if (!tags.has('informational')) {
      tags.add('healthcare');
    }

    return Array.from(tags);
  }

  /**
   * Calculate overall confidence score
   */
  private calculateOverallConfidence(ragContext: any, structuralAnalysis: any): number {
    const ragConfidence = ragContext.confidence || 0.5;
    const structureConfidence = (structuralAnalysis.completionPercentage || 50) / 100;
    
    return Math.round(((ragConfidence * 0.6 + structureConfidence * 0.4) * 100));
  }

  /**
   * Extract key findings from content
   */
  private extractKeyFindings(content: string, ragContext: any): string[] {
    const findings: string[] = [];
    const lowerContent = content.toLowerCase();

    // RAG-based findings
    if (ragContext.relevantContent) {
      findings.push(...ragContext.relevantContent.slice(0, 3));
    }

    // Content-based findings
    if (lowerContent.includes('ndis number')) {
      findings.push('NDIS participant information detected');
    }
    if (lowerContent.includes('signature')) {
      findings.push('Document requires signatures');
    }
    if (lowerContent.includes('consent')) {
      findings.push('Consent form elements identified');
    }

    return findings.slice(0, 5); // Limit to 5 key findings
  }

  /**
   * Analyze document structure for content organization
   */
  private analyzeDocumentStructure2(content: string): string[] {
    const structure: string[] = [];
    const lines = content.split('\n').filter(line => line.trim());

    let sectionCount = 0;
    let fieldCount = 0;
    let signatureCount = 0;

    for (const line of lines) {
      const trimmedLine = line.trim();
      
      // Detect sections (headers in caps or with colons)
      if (trimmedLine.length > 0 && (trimmedLine === trimmedLine.toUpperCase() || trimmedLine.endsWith(':'))) {
        sectionCount++;
      }
      
      // Detect form fields
      if (trimmedLine.includes('___') || trimmedLine.includes('[') || trimmedLine.includes(':')) {
        fieldCount++;
      }
      
      // Detect signatures
      if (trimmedLine.toLowerCase().includes('signature')) {
        signatureCount++;
      }
    }

    structure.push(`Document contains ${sectionCount} sections`);
    structure.push(`${fieldCount} form fields detected`);
    structure.push(`${signatureCount} signature areas identified`);

    return structure;
  }
}

/**
 * Create and export an instance of the RAG Document Analysis Service
 */
export const ragDocumentAnalysisService = new RAGDocumentAnalysisService();
