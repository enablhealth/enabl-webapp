/**
 * PDF Text Extraction API Endpoint
 * 
 * Extracts text content from uploaded PDF files
 */

import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    if (file.type !== 'application/pdf') {
      return NextResponse.json(
        { error: 'File must be a PDF' },
        { status: 400 }
      );
    }

    // Mock PDF extraction (replace with actual PDF.js or similar library)
    const extractedText = await mockPDFExtraction(file);

    return NextResponse.json({
      text: extractedText,
      metadata: {
        fileName: file.name,
        fileSize: file.size,
        extractedAt: new Date().toISOString(),
        method: 'mock-pdf-extraction'
      }
    });

  } catch (error) {
    console.error('PDF Extraction Error:', error);
    return NextResponse.json(
      { error: 'Failed to extract text from PDF' },
      { status: 500 }
    );
  }
}

/**
 * Mock PDF Text Extraction (replace with actual PDF.js implementation)
 */
async function mockPDFExtraction(file: File): Promise<string> {
  const fileName = file.name.toLowerCase();
  
  // Return mock content based on filename patterns for development
  if (fileName.includes('consent')) {
    return `
PARTICIPANT CONSENT FORM

Patient Information:
Name: [Not Filled]
Date of Birth: __/__/____
Phone: ___-___-____
Email: [Not Filled]
Address: [Not Filled]

NDIS Information:
NDIS Number: [Not Filled]
Participant Number: [Not Filled]
Support Coordinator: [Not Filled]

Consent Declaration:
I consent to receiving support services under the NDIS program.
I understand my rights and responsibilities as a participant.

☐ I agree to the terms and conditions
☐ I consent to information sharing
☐ I understand the service delivery model

Participant Signature: _________________ Date: __/__/____

Witness Signature: _________________ Date: __/__/____

Document Status: INCOMPLETE - Missing required fields and signatures
    `.trim();
  }
  
  if (fileName.includes('ndis') || fileName.includes('support')) {
    return `
NDIS SUPPORT PLAN REVIEW

Participant Details:
Name: John Smith
Date of Birth: 15/03/1985
NDIS Number: 123456789
Plan Start Date: 01/01/2024
Plan End Date: 31/12/2024

Support Categories:
☑ Core Supports - Daily Activities
☑ Capacity Building - Life Skills
☐ Capital Supports - Equipment

Service Providers:
Primary Support Worker: [Not Assigned]
Support Coordinator: Sarah Johnson
Plan Manager: ABC Plan Management

Goals and Outcomes:
1. Improve independent living skills ✓
2. Increase community participation ☐
3. Develop employment skills ☐

Participant Signature: John Smith    Date: 15/01/2024
Support Coordinator Signature: S. Johnson    Date: 15/01/2024

Document Status: PARTIALLY COMPLETE - Some goals not addressed
    `.trim();
  }
  
  if (fileName.includes('blood') || fileName.includes('test') || fileName.includes('results')) {
    return `
BLOOD TEST RESULTS

Patient: Jane Doe
DOB: 22/08/1990
Medicare Number: 2234 5678 9
Test Date: 15/03/2024
Ordered by: Dr. Michael Chen

Complete Blood Count (CBC):
- White Blood Cells: 7.2 (Normal: 4.0-11.0)
- Red Blood Cells: 4.5 (Normal: 4.2-5.4)
- Hemoglobin: 13.8 (Normal: 12.0-15.5)
- Platelets: 285 (Normal: 150-450)

Lipid Panel:
- Total Cholesterol: 195 mg/dL (Desirable: <200)
- LDL Cholesterol: 118 mg/dL (Optimal: <100)
- HDL Cholesterol: 58 mg/dL (Good: >40)
- Triglycerides: 95 mg/dL (Normal: <150)

Additional Notes:
All values within normal ranges. Recommend follow-up in 6 months.

Physician Signature: Dr. M. Chen    Date: 16/03/2024

Document Status: COMPLETE
    `.trim();
  }
  
  // Default mock content for unknown files
  return `
MEDICAL DOCUMENT

This is a mock extraction of the PDF content for: ${file.name}

The actual implementation would use a PDF parsing library like PDF.js
to extract the real text content from the uploaded PDF file.

Key features to implement:
- Text extraction from PDF pages
- Handling of form fields
- OCR for scanned documents
- Metadata extraction
- Error handling for corrupted files

File Details:
- Name: ${file.name}
- Size: ${(file.size / 1024).toFixed(2)} KB
- Type: ${file.type}

Document Status: MOCK EXTRACTION
  `.trim();
}
