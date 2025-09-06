/**
 * Bedrock Structure Analysis API Endpoint
 * 
 * Analyzes document structure using Amazon Bedrock for field completion
 * and signature detection
 */

import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    console.log('Structure analysis endpoint called');
    const body = await request.json();
    console.log('Request body:', body);
    
    const { content, documentType, fileName } = body;

    if (!content) {
      console.error('Missing content in request');
      return NextResponse.json(
        { error: 'Document content is required' },
        { status: 400 }
      );
    }

    console.log('Processing structure analysis for:', { documentType, fileName: fileName || 'unknown' });

    // Mock structure analysis (replace with actual Bedrock analysis)
    const structureAnalysis = await mockStructureAnalysis(content, documentType || 'unknown', fileName || 'unknown');

    console.log('Structure analysis completed successfully');
    return NextResponse.json(structureAnalysis);

  } catch (error) {
    console.error('Structure Analysis Error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to analyze document structure',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * Advanced Document Type Detection
 */
function detectDocumentType(content: string, fileName: string, providedType: string) {
  const docType = {
    type: 'unknown',
    confidence: 0.5,
    requiresSignature: false,
    requiresPersonalInfo: false,
    medicalRecordPercentage: 0
  };

  // Check for NDIS documents
  if (content.includes('ndis') || fileName.includes('ndis') || content.includes('national disability insurance')) {
    if (content.includes('welcome') || fileName.includes('welcome') || content.includes('introduction')) {
      docType.type = 'ndis_welcome_pack';
      docType.confidence = 0.9;
      docType.requiresSignature = false; // Welcome packs are informational
      docType.requiresPersonalInfo = false;
      docType.medicalRecordPercentage = 15; // Minimal medical content
    } else if (content.includes('application') || content.includes('form') || content.includes('agreement')) {
      docType.type = 'ndis_form';
      docType.confidence = 0.85;
      docType.requiresSignature = true;
      docType.requiresPersonalInfo = true;
      docType.medicalRecordPercentage = 60; // Forms have medical relevance
    } else {
      docType.type = 'ndis';
      docType.confidence = 0.8;
      docType.requiresSignature = true;
      docType.requiresPersonalInfo = true;
      docType.medicalRecordPercentage = 40;
    }
  }
  // Check for medical records
  else if (content.includes('medical') || content.includes('diagnosis') || content.includes('prescription') || 
           content.includes('treatment') || content.includes('doctor') || content.includes('clinic')) {
    docType.type = 'medical_record';
    docType.confidence = 0.9;
    docType.requiresSignature = true;
    docType.requiresPersonalInfo = true;
    docType.medicalRecordPercentage = 95;
  }
  // Check for consent forms
  else if (content.includes('consent') || content.includes('agreement') || content.includes('authorization')) {
    docType.type = 'consent_form';
    docType.confidence = 0.85;
    docType.requiresSignature = true;
    docType.requiresPersonalInfo = true;
    docType.medicalRecordPercentage = 70;
  }
  // Check for informational documents
  else if (content.includes('information') || content.includes('guide') || content.includes('instructions') ||
           fileName.includes('info') || fileName.includes('guide') || fileName.includes('instructions')) {
    docType.type = 'informational';
    docType.confidence = 0.8;
    docType.requiresSignature = false;
    docType.requiresPersonalInfo = false;
    docType.medicalRecordPercentage = 20;
  }
  // Default to form if has fields
  else if (content.includes('name:') || content.includes('date:') || content.includes('signature:')) {
    docType.type = 'form';
    docType.confidence = 0.7;
    docType.requiresSignature = true;
    docType.requiresPersonalInfo = true;
    docType.medicalRecordPercentage = 50;
  }

  console.log('Document type detection result:', docType);
  return docType;
}

/**
 * Get field patterns based on document type
 */
function getFieldPatterns(docType: any) {
  const patterns = [];

  // Medical record specific fields
  if (docType.type === 'medical_record') {
    patterns.push(
      { name: 'Medical Record Number', pattern: /(?:mrn|medical record)[:\s]+(\w+)/gi, required: true },
      { name: 'Diagnosis', pattern: /diagnosis[:\s]+(.*)/gi, required: true },
      { name: 'Attending Physician', pattern: /(?:doctor|physician)[:\s]+(.*)/gi, required: true },
      { name: 'Treatment Date', pattern: /(?:treatment|visit) date[:\s]+(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/gi, required: true }
    );
  }

  // NDIS welcome pack - minimal required fields
  if (docType.type === 'ndis_welcome_pack') {
    patterns.push(
      { name: 'Welcome Information', pattern: /welcome|introduction/gi, required: false },
      { name: 'Contact Information', pattern: /contact[:\s]+(.*)/gi, required: false }
    );
  }

  // NDIS forms - comprehensive fields
  if (docType.type === 'ndis_form' || docType.type === 'ndis') {
    patterns.push(
      { name: 'NDIS Number', pattern: /ndis number[:\s]+(\d{9})/gi, required: true },
      { name: 'Participant Number', pattern: /participant[:\s]+(?:number|id)[:\s]+(\d+)/gi, required: true },
      { name: 'Plan Start Date', pattern: /plan start[:\s]+(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/gi, required: true },
      { name: 'Support Categories', pattern: /support categor[yi][es]*[:\s]+(.*)/gi, required: true }
    );
  }

  // Consent forms
  if (docType.type === 'consent_form') {
    patterns.push(
      { name: 'Consent Type', pattern: /consent for[:\s]+(.*)/gi, required: true },
      { name: 'Consent Date', pattern: /consent date[:\s]+(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/gi, required: true },
      { name: 'Witness Name', pattern: /witness[:\s]+(.*)/gi, required: true }
    );
  }

  return patterns;
}

/**
 * Mock Structure Analysis (replace with actual Bedrock implementation)
 */
async function mockStructureAnalysis(content: string, documentType: string, fileName: string) {
  console.log('Starting mock structure analysis for:', { documentType, fileName });
  
  const lowerContent = content.toLowerCase();
  const lowerFileName = (fileName || '').toLowerCase();
  
  // Advanced Document Type Detection
  const detectedDocType = detectDocumentType(lowerContent, lowerFileName, documentType);
  console.log('Detected document type:', detectedDocType);
  
  // Field Detection
  const detectedFields = [];
  const missingFields = [];
  const signatures = [];
  const checkboxes = [];
  
  // Get field patterns based on document type
  const fieldPatterns = getFieldPatterns(detectedDocType);
  
  console.log(`Analyzing ${fieldPatterns.length} field patterns for document type: ${detectedDocType.type}`);

  // Common form fields detection
  const commonFieldPatterns = [
    { name: 'Patient Name', pattern: /(?:patient\s+)?name[:\s]+(.*)/gi, required: detectedDocType.requiresPersonalInfo },
    { name: 'Date of Birth', pattern: /(?:dob|date of birth)[:\s]+(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/gi, required: detectedDocType.requiresPersonalInfo },
    { name: 'Phone Number', pattern: /(?:phone|tel|mobile)[:\s]+(\d{3}[-.\s]?\d{3}[-.\s]?\d{4})/gi, required: detectedDocType.requiresPersonalInfo },
    { name: 'Email', pattern: /email[:\s]+([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/gi, required: false },
    { name: 'Address', pattern: /address[:\s]+([\w\s,]+)/gi, required: detectedDocType.requiresPersonalInfo }
  ];

  // Add common patterns first
  fieldPatterns.push(...commonFieldPatterns);

  // NDIS-specific fields
  if (detectedDocType.type === 'ndis' || detectedDocType.type === 'ndis_welcome_pack') {
    fieldPatterns.push(
      { name: 'NDIS Number', pattern: /ndis number[:\s]+(\d{9})/gi, required: detectedDocType.type !== 'ndis_welcome_pack' },
      { name: 'Participant Number', pattern: /participant[:\s]+(?:number|id)[:\s]+(\d+)/gi, required: detectedDocType.type !== 'ndis_welcome_pack' },
      { name: 'Support Coordinator', pattern: /support coordinator[:\s]+(.*)/gi, required: false },
      { name: 'Plan Manager', pattern: /plan manager[:\s]+(.*)/gi, required: false }
    );
  }

  // Check each field
  for (const field of fieldPatterns) {
    const matches = [...content.matchAll(field.pattern)];
    
    if (matches.length > 0) {
      detectedFields.push({
        name: field.name,
        value: matches[0][1]?.trim() || 'Found but value unclear',
        confidence: 0.85,
        position: matches[0].index
      });
    } else if (field.required) {
      missingFields.push({
        name: field.name,
        required: field.required,
        suggestion: `Please complete the ${field.name} field`
      });
    }
  }

  // Signature Detection - only if document type requires it
  if (detectedDocType.requiresSignature) {
    const signaturePatterns = [
      /signature[:\s]*$/gmi,
      /signed[:\s]*$/gmi,
      /participant signature/gi,
      /witness signature/gi,
      /date signed/gi,
      /x[:\s]*$/gmi
    ];

    for (const pattern of signaturePatterns) {
      const matches = [...content.matchAll(pattern)];
      if (matches.length > 0) {
        signatures.push({
          type: 'Text signature detected',
          position: matches[0].index,
          confidence: 0.75
        });
      }
    }

    // Check for blank signature lines only if signature is required
    const blankSignatureLines = content.match(/_{3,}|\.{3,}/g);
    if (blankSignatureLines) {
      signatures.push({
        type: 'Unsigned signature line detected',
        count: blankSignatureLines.length,
        confidence: 0.90
      });
    }
  } else {
    // For informational documents, don't flag missing signatures
    console.log('Document type does not require signature:', detectedDocType.type);
  }

  // Checkbox Detection
  const checkboxPatterns = [
    /\[[ x]\]/gi,
    /☐|☑|✓|✗/g,
    /\(\s*\)/g,
    /\(x\)/gi
  ];

  for (const pattern of checkboxPatterns) {
    const matches = [...content.matchAll(pattern)];
    for (const match of matches) {
      const isChecked = /[x✓✗☑]/.test(match[0]);
      checkboxes.push({
        type: isChecked ? 'checked' : 'unchecked',
        symbol: match[0],
        position: match.index,
        confidence: 0.80
      });
    }
  }

  // Date validation
  const dates = [];
  const datePattern = /\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}/g;
  const dateMatches = [...content.matchAll(datePattern)];
  
  for (const match of dateMatches) {
    const dateStr = match[0];
    const parsedDate = new Date(dateStr);
    const isValid = !isNaN(parsedDate.getTime());
    
    dates.push({
      value: dateStr,
      valid: isValid,
      position: match.index,
      confidence: isValid ? 0.95 : 0.60
    });
  }

  // Compliance Analysis based on document type
  const totalPossibleFields = detectedFields.length + missingFields.length;
  const completionPercentage = totalPossibleFields > 0 ? (detectedFields.length / totalPossibleFields) * 100 : 100;
  const hasSignature = signatures.some(sig => sig.type !== 'Unsigned signature line detected');
  
  let complianceStatus = 'incomplete';
  
  // Different compliance thresholds based on document type
  if (detectedDocType.type === 'ndis_welcome_pack' || detectedDocType.type === 'informational') {
    // Informational documents have different compliance criteria
    if (completionPercentage >= 50) {
      complianceStatus = 'compliant'; // Informational docs don't need to be 100% complete
    } else {
      complianceStatus = 'incomplete';
    }
  } else {
    // Forms and medical records have stricter requirements
    if (completionPercentage >= 90 && (!detectedDocType.requiresSignature || hasSignature)) {
      complianceStatus = 'compliant';
    } else if (completionPercentage >= 70) {
      complianceStatus = 'partially_compliant';
    }
  }

  return {
    documentType: detectedDocType,
    detectedFields,
    missingFields,
    signatures,
    checkboxes,
    dates,
    completionPercentage,
    complianceStatus,
    medicalRecordPercentage: detectedDocType.medicalRecordPercentage,
    recommendations: generateRecommendations(missingFields, signatures, completionPercentage, detectedDocType),
    analysisMetadata: {
      timestamp: new Date().toISOString(),
      contentLength: content.length,
      fieldsAnalyzed: fieldPatterns.length,
      detectedDocumentType: detectedDocType.type,
      documentTypeConfidence: detectedDocType.confidence,
      method: 'enhanced-mock-structure-analysis'
    }
  };
}

/**
 * Generate recommendations based on analysis and document type
 */
function generateRecommendations(missingFields: any[], signatures: any[], completionPercentage: number, docType: any) {
  const recommendations = [];

  // Only add missing fields recommendations if the document type requires personal info
  if (missingFields.length > 0 && docType.requiresPersonalInfo) {
    recommendations.push({
      type: 'missing_fields',
      priority: 'high',
      message: `Complete ${missingFields.length} missing required fields`,
      fields: missingFields.map(f => f.name)
    });
  }

  // Only require signature if document type needs it
  if (docType.requiresSignature) {
    const hasValidSignature = signatures.some(sig => sig.type !== 'Unsigned signature line detected');
    if (!hasValidSignature) {
      recommendations.push({
        type: 'signature_required',
        priority: 'high',
        message: 'Document requires signature to be valid'
      });
    }
  }

  // Adjust incomplete form threshold based on document type
  const incompletethreshold = docType.type === 'ndis_welcome_pack' || docType.type === 'informational' ? 25 : 50;
  
  if (completionPercentage < incompletethreshold) {
    if (docType.type === 'ndis_welcome_pack' || docType.type === 'informational') {
      recommendations.push({
        type: 'informational_review',
        priority: 'low',
        message: 'Review informational content for completeness'
      });
    } else {
      recommendations.push({
        type: 'incomplete_form',
        priority: 'critical',
        message: 'Form is significantly incomplete - review all sections'
      });
    }
  }

  // Add document type specific recommendations
  if (docType.type === 'ndis_welcome_pack') {
    recommendations.push({
      type: 'document_info',
      priority: 'info',
      message: 'This appears to be an NDIS welcome pack - informational content that typically does not require completion or signature'
    });
  }

  return recommendations;
}
