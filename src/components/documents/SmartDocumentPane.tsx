/**
 * Smart Document Pane Component
 * 
 * Appears at the bottom of chat when Document Agent is selected
 * Provides smart organization, automatic tagging, and document management
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import S3FileUpload, { S3UploadedFile } from '../S3FileUpload';
import { SemanticSearch } from '../SemanticSearch';
import { ragDocumentAnalysisService } from '@/services/ragDocumentAnalysis';
import DocumentViewer from '../DocumentViewer';
import { DocumentRecord } from '@/services/documentStorage';
import { 
  FileText, 
  Search, 
  Upload, 
  Tag, 
  FolderOpen, 
  Filter, 
  Grid3X3, 
  List, 
  Calendar,
  FileImage,
  FileType,
  Brain,
  Loader2,
  X,
  Star,
  Download,
  Eye,
  Trash2,
  MoreVertical,
  Minimize2,
  Maximize2,
  ChevronUp,
  ChevronDown
} from 'lucide-react';

interface SmartDocument {
  id: string;
  name: string;
  type: string;
  size: number;
  uploadDate: string;
  url: string;
  thumbnailUrl?: string;
  smartTags: SmartTag[];
  aiAnalysis?: {
    summary: string;
    keyPoints: string[];
    extractedData: Record<string, any>;
    category: DocumentCategory;
    confidence: number;
    lastAnalyzed: string;
  };
  folder?: string;
  isFavorite?: boolean;
  // Owner and sharing information
  owner: {
    id: string;
    name: string;
    email: string;
  };
  permissions: {
    canView: string[]; // Array of user IDs who can view
    canEdit: string[]; // Array of user IDs who can edit
    canShare: string[]; // Array of user IDs who can share
    isPublic: boolean; // Whether document is publicly accessible
  };
  sharedWith?: {
    userId: string;
    userName: string;
    userEmail: string;
    permission: 'view' | 'edit' | 'share';
    sharedDate: string;
  }[];
}

interface SmartTag {
  id: string;
  name: string;
  type: 'auto' | 'manual';
  color: string;
  confidence?: number;
}

type DocumentCategory = 
  | 'medical-records'
  | 'lab-results' 
  | 'prescriptions'
  | 'insurance'
  | 'appointments'
  | 'imaging'
  | 'referrals'
  | 'billing'
  | 'other';

interface SmartDocumentPaneProps {
  isVisible: boolean;
  onClose: () => void;
  onDocumentSelect: (document: SmartDocument) => void;
  onUploadComplete: (documents: SmartDocument[]) => void;
  isMinimized?: boolean;
  onToggleMinimize?: () => void;
}

const categoryIcons: Record<DocumentCategory, React.ReactNode> = {
  'medical-records': <FileText className="w-4 h-4" />,
  'lab-results': <FileType className="w-4 h-4" />,
  'prescriptions': <FileText className="w-4 h-4" />,
  'insurance': <FileImage className="w-4 h-4" />,
  'appointments': <Calendar className="w-4 h-4" />,
  'imaging': <FileImage className="w-4 h-4" />,
  'referrals': <FileText className="w-4 h-4" />,
  'billing': <FileType className="w-4 h-4" />,
  'other': <FileText className="w-4 h-4" />
};

const categoryColors: Record<DocumentCategory, string> = {
  'medical-records': 'bg-blue-100 text-blue-800 border-blue-200',
  'lab-results': 'bg-green-100 text-green-800 border-green-200',
  'prescriptions': 'bg-purple-100 text-purple-800 border-purple-200',
  'insurance': 'bg-orange-100 text-orange-800 border-orange-200',
  'appointments': 'bg-pink-100 text-pink-800 border-pink-200',
  'imaging': 'bg-indigo-100 text-indigo-800 border-indigo-200',
  'referrals': 'bg-yellow-100 text-yellow-800 border-yellow-200',
  'billing': 'bg-red-100 text-red-800 border-red-200',
  'other': 'bg-gray-100 text-gray-800 border-gray-200'
};

// Helper function to convert DynamoDB document structure to SmartDocument format
function convertToSmartDocument(doc: any): SmartDocument {
  // Handle both old and new document structures
  const smartTags: SmartTag[] = [];
  
  // If it has the new DynamoDB structure
  if (doc.analysisResult) {
    // Convert healthcareTags to smartTags
    if (doc.analysisResult.healthcareTags) {
      doc.analysisResult.healthcareTags.forEach((tag: string, index: number) => {
        smartTags.push({
          id: `healthcare-${index}`,
          name: tag,
          type: 'auto',
          color: getTagColor(tag),
          confidence: 0.8
        });
      });
    }
    
    // Convert regular tags to smartTags
    if (doc.analysisResult.tags) {
      doc.analysisResult.tags.forEach((tag: string, index: number) => {
        smartTags.push({
          id: `tag-${index}`,
          name: tag,
          type: 'auto',
          color: getTagColor(tag),
          confidence: 0.7
        });
      });
    }
  }
  
  // If it has old structure, use existing smartTags
  if (doc.smartTags && Array.isArray(doc.smartTags)) {
    smartTags.push(...doc.smartTags);
  }
  
  return {
    id: doc.id || doc.documentId,
    name: doc.name,
    type: doc.type,
    size: doc.size,
    uploadDate: doc.uploadDate || doc.createdAt,
    url: doc.url || doc.s3Url,
    smartTags,
    aiAnalysis: doc.aiAnalysis || {
      summary: doc.analysisResult?.documentTypeDetection?.reasoning || 'No analysis available',
      keyPoints: [],
      extractedData: {},
      category: 'other',
      confidence: doc.analysisResult?.documentTypeDetection?.confidence || 0.5,
      lastAnalyzed: doc.updatedAt || doc.createdAt
    },
    owner: doc.owner || { 
      id: doc.userId,
      name: 'Current User',
      email: 'user@example.com'
    },
    permissions: {
      canView: [doc.userId || 'guest-user'],
      canEdit: [doc.userId || 'guest-user'],
      canShare: [doc.userId || 'guest-user'],
      isPublic: false
    }
  };
}

// Helper function to assign colors to tags
function getTagColor(tag: string): string {
  const colorMap: Record<string, string> = {
    'medical': 'red',
    'lab': 'green',
    'prescription': 'blue',
    'ndis': 'purple',
    'consent': 'pink',
    'informational': 'gray',
    'insurance': 'yellow',
    'appointment': 'indigo'
  };
  
  const tagLower = tag.toLowerCase();
  for (const [key, color] of Object.entries(colorMap)) {
    if (tagLower.includes(key)) {
      return color;
    }
  }
  return 'gray';
}

export default function SmartDocumentPane({
  isVisible,
  onClose,
  onDocumentSelect,
  onUploadComplete,
  isMinimized = false,
  onToggleMinimize
}: SmartDocumentPaneProps) {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<SmartDocument[]>([]);
  const [filteredDocuments, setFilteredDocuments] = useState<SmartDocument[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<DocumentCategory | 'all'>('all');
  const [selectedFolder, setSelectedFolder] = useState<string>('all');
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [isAnalyzing, setIsAnalyzing] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<string[]>([]); // Track which documents are being deleted
  const [activeTab, setActiveTab] = useState<'documents' | 'search' | 'insights'>('documents'); // New tab state
  const [viewerDocument, setViewerDocument] = useState<DocumentRecord | null>(null); // Document viewer state

  // Load documents on mount
  useEffect(() => {
    if (isVisible && user) {
      loadDocuments();
    }
  }, [isVisible, user]);

  // Filter documents based on search, category, and folder
  useEffect(() => {
    let filtered = documents;

    if (searchQuery) {
      filtered = filtered.filter(doc => 
        doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.smartTags.some(tag => tag.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        doc.aiAnalysis?.summary.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(doc => doc.aiAnalysis?.category === selectedCategory);
    }

    if (selectedFolder !== 'all') {
      filtered = filtered.filter(doc => doc.folder === selectedFolder);
    }

    setFilteredDocuments(filtered);
  }, [documents, searchQuery, selectedCategory, selectedFolder]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (openDropdown) {
        setOpenDropdown(null);
      }
    };

    if (openDropdown) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [openDropdown]);

  // Utility function to format long filenames for display
  const formatFileName = (filename: string, maxLength: number = 40) => {
    if (filename.length <= maxLength) return filename;
    
    // Try to find a good break point (dot, underscore, hyphen)
    const extension = filename.match(/\.[^.]+$/)?.[0] || '';
    const nameWithoutExt = filename.replace(/\.[^.]+$/, '');
    
    if (nameWithoutExt.length <= maxLength - extension.length) {
      return filename;
    }
    
    // Truncate but keep extension
    const truncatedName = nameWithoutExt.substring(0, maxLength - extension.length - 3);
    return `${truncatedName}...${extension}`;
  };

  // Convert SmartDocument to DocumentRecord for the viewer
  const convertToDocumentRecord = (smartDoc: SmartDocument): DocumentRecord => {
    return {
      userId: smartDoc.owner?.id || user?.id || 'anonymous',
      documentId: smartDoc.id,
      name: smartDoc.name,
      type: smartDoc.type,
      size: smartDoc.size,
      uploadDate: smartDoc.uploadDate,
      s3Key: `documents/${smartDoc.name}`,
      s3Url: smartDoc.url,
      analysisResult: {
        documentTypeDetection: {
          detectedType: smartDoc.aiAnalysis?.category || 'other',
          confidence: smartDoc.aiAnalysis?.confidence || 0,
          reasoning: smartDoc.aiAnalysis?.summary || 'No analysis available'
        },
        medicalRecordPercentage: smartDoc.aiAnalysis?.confidence || 0,
        requiresSignature: smartDoc.smartTags.some(tag => tag.name.toLowerCase().includes('signature')),
        fields: [],
        tags: smartDoc.smartTags.map(tag => tag.name),
        healthcareTags: smartDoc.smartTags.filter(tag => tag.type === 'auto').map(tag => tag.name)
      },
      createdAt: smartDoc.uploadDate,
      updatedAt: smartDoc.uploadDate
    };
  };

  // Handle document click for viewing
  const handleDocumentView = (document: SmartDocument) => {
    const documentRecord = convertToDocumentRecord(document);
    setViewerDocument(documentRecord);
  };

  const loadDocuments = async () => {
    try {
      setIsLoading(true);
      
      // Fetch documents from API with user ID filter
      const userId = user?.id || user?.userId;
      console.log('📥 Loading documents for user:', userId);
      
      const queryParams = userId ? `?userId=${encodeURIComponent(userId)}` : '';
      const response = await fetch(`/api/documents${queryParams}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch documents: ${response.statusText}`);
      }
      
      const result = await response.json();
      const rawDocuments = result.documents || [];
      
      // Convert DynamoDB documents to SmartDocument format
      const apiDocuments = rawDocuments.map(convertToSmartDocument);
      
      console.log(`Loaded ${apiDocuments.length} documents from API for user: ${userId || 'anonymous'}`);
      
      // Always use API documents (including empty array)
      setDocuments(apiDocuments);
      
    } catch (error) {
      console.error('Error loading documents:', error);
      // Show empty state on error
      setDocuments([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Delete document function
  const deleteDocument = async (documentId: string, documentName: string) => {
    if (!confirm(`Are you sure you want to delete "${documentName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      // Add to deleting state
      setIsDeleting(prev => [...prev, documentId]);
      
      const userId = user?.id || user?.userId || 'guest-user';
      console.log('🗑️ Deleting document with userId:', userId);
      
      const response = await fetch(`/api/documents/${documentId}?userId=${encodeURIComponent(userId)}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`Failed to delete document: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('Document deleted successfully:', result);

      // Remove the document from local state
      setDocuments(prev => prev.filter(doc => doc.id !== documentId));
      
      // Show success message (you could replace this with a toast notification)
      alert(`Successfully deleted "${documentName}"`);

    } catch (error) {
      console.error('Error deleting document:', error);
      alert(`Failed to delete "${documentName}". Please try again.`);
    } finally {
      // Remove from deleting state
      setIsDeleting(prev => prev.filter(id => id !== documentId));
    }
  };

  // Clean up orphaned documents (metadata exists but S3 file doesn't)
  const cleanupOrphanedDocuments = async () => {
    if (!confirm('This will remove any documents from the list that no longer exist in S3. Continue?')) {
      return;
    }

    try {
      setIsLoading(true);
      
      // Check each document's S3 URL
      const validDocuments: SmartDocument[] = [];
      
      for (const doc of documents) {
        if (doc.url) {
          try {
            // Check if the S3 file exists by making a HEAD request
            const response = await fetch(doc.url, { method: 'HEAD' });
            if (response.ok) {
              validDocuments.push(doc);
            } else {
              console.log(`Orphaned document found: ${doc.name} (S3 file missing)`);
            }
          } catch (error) {
            console.log(`Error checking ${doc.name}: ${error}`);
            // If we can't check, assume it's orphaned
          }
        } else {
          // Keep documents without S3 URLs (like mock documents)
          validDocuments.push(doc);
        }
      }

      // Update local storage with only valid documents
      if (validDocuments.length < documents.length) {
        // Save the cleaned up documents to local storage
        try {
          const response = await fetch('/api/documents/cleanup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ validDocuments })
          });

          if (response.ok) {
            setDocuments(validDocuments);
            alert(`Cleaned up ${documents.length - validDocuments.length} orphaned documents.`);
          } else {
            console.error('Failed to save cleaned documents');
          }
        } catch (error) {
          console.error('Error saving cleaned documents:', error);
          // Update UI anyway
          setDocuments(validDocuments);
          alert(`Cleaned up ${documents.length - validDocuments.length} orphaned documents locally.`);
        }
      } else {
        alert('No orphaned documents found. All documents are properly synced.');
      }

    } catch (error) {
      console.error('Error during cleanup:', error);
      alert('Failed to cleanup orphaned documents. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle S3 file uploads
  const handleS3Upload = async (uploadedFiles: S3UploadedFile[]) => {
    const newDocuments: SmartDocument[] = [];
    
    for (const uploadedFile of uploadedFiles) {
      if (!uploadedFile.s3Url) continue;
      
      try {
        // Start AI analysis
        setIsAnalyzing(prev => [...prev, uploadedFile.id]);
        
        // Enhanced AI analysis using knowledge base
        const analysis = await analyzeDocument(uploadedFile.file);
        
        console.log('👤 Current user in upload:', {
          user: user,
          userId: user?.id,
          userIdFromUserId: user?.userId,
          username: user?.username,
          email: user?.email
        });
        
        const newDocument: SmartDocument = {
          id: uploadedFile.id,
          name: uploadedFile.name,
          type: uploadedFile.type,
          size: uploadedFile.size,
          uploadDate: new Date().toISOString(),
          url: uploadedFile.s3Url,
          thumbnailUrl: uploadedFile.preview || undefined,
          smartTags: analysis.smartTags,
          aiAnalysis: analysis.aiAnalysis,
          folder: analysis.suggestedFolder,
          isFavorite: false,
          // Add owner information from authenticated user
          owner: {
            id: user?.id || user?.userId || 'anonymous',
            name: user?.name || user?.username || 'Anonymous User',
            email: user?.email || 'anonymous@example.com'
          },
          permissions: {
            canView: [user?.id || 'anonymous'],
            canEdit: [user?.id || 'anonymous'],
            canShare: [user?.id || 'anonymous'],
            isPublic: false
          }
        };

        // Save document to API for persistence
        try {
          const saveResponse = await fetch('/api/documents', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              document: newDocument,
              s3Url: uploadedFile.s3Url,
              // Use the actual stored S3 key derived from the presigned file URL
              s3Key: (() => {
                try {
                  const url = new URL(uploadedFile.s3Url);
                  // URL pathname starts with /<prefix>/...; remove leading '/'
                  return url.pathname.replace(/^\//, '');
                } catch {
                  // Fallback to previous behavior
                  return `documents/${uploadedFile.name}`;
                }
              })(),
            }),
          });

          if (!saveResponse.ok) {
            console.error('Failed to save document to API:', await saveResponse.text());
            // Still add to local state even if API save fails
          } else {
            const saveResult = await saveResponse.json();
            console.log('Document saved successfully:', saveResult);
          }
        } catch (apiError) {
          console.error('Error saving document to API:', apiError);
          // Continue with local state update even if API fails
        }

        // NEW: Process document for vector search and knowledge base (Phase 3)
        try {
          console.log('🚀 Starting Phase 3 vector processing for:', uploadedFile.name);
          
          // Import vector processor (we'll make it a dynamic import to avoid build issues)
          const { vectorDocumentProcessor } = await import('@/services/vectorDocumentProcessor');
          
          // Process document for vector embeddings and knowledge base
          await vectorDocumentProcessor.processDocumentForVector(
            uploadedFile.id,
            user?.id || user?.userId || 'anonymous',
            `documents/${uploadedFile.name}`, // S3 key
            uploadedFile.name,
            uploadedFile.type
          );
          
          console.log('✅ Vector processing completed for:', uploadedFile.name);
          
        } catch (vectorError) {
          console.error('🔴 Vector processing failed for', uploadedFile.name, ':', vectorError);
          // Don't fail the entire upload if vector processing fails
        }

        newDocuments.push(newDocument);
        
      } catch (error) {
        console.error(`Failed to analyze ${uploadedFile.name}:`, error);
      } finally {
        // Remove from analyzing state
        setIsAnalyzing(prev => prev.filter(id => id !== uploadedFile.id));
      }
    }

    if (newDocuments.length > 0) {
      setDocuments(prev => [...newDocuments, ...prev]);
      onUploadComplete(newDocuments);
    }
  };

  const analyzeDocument = async (file: File): Promise<{
    smartTags: SmartTag[];
    aiAnalysis: SmartDocument['aiAnalysis'];
    suggestedFolder: string;
  }> => {
    try {
      console.log('🧠 Starting RAG-powered document analysis for:', file.name);
      
      // Use the RAG document analysis service
      const ragResult = await ragDocumentAnalysisService.analyzeDocument(file);
      
      console.log('✅ RAG analysis completed:', {
        documentType: ragResult.documentType,
        confidence: ragResult.confidence,
        tagCount: ragResult.healthcareTags.length,
        hasSignature: ragResult.structuralAnalysis.hasSignature,
        fieldsCompleted: ragResult.structuralAnalysis.fieldsCompleted,
        totalFields: ragResult.structuralAnalysis.totalFields
      });

      // Convert RAG results to SmartDocument format
      const smartTags: SmartTag[] = ragResult.healthcareTags.map((tag, index) => ({
        id: `tag-${Date.now()}-${index}`,
        name: tag,
        type: 'auto' as const,
        color: getTagColor(tag),
        confidence: ragResult.confidence / 100
      }));

      // Add structural analysis tags
      if (ragResult.structuralAnalysis.hasSignature) {
        smartTags.push({
          id: `tag-${Date.now()}-signature`,
          name: 'Signed Document',
          type: 'auto',
          color: 'green',
          confidence: 0.95
        });
      } else if (ragResult.structuralAnalysis.totalFields > 0) {
        smartTags.push({
          id: `tag-${Date.now()}-unsigned`,
          name: 'Requires Signature',
          type: 'auto',
          color: 'red',
          confidence: 0.90
        });
      }

      // Add completion status tag
      const completionRate = ragResult.structuralAnalysis.totalFields > 0 
        ? ragResult.structuralAnalysis.fieldsCompleted / ragResult.structuralAnalysis.totalFields 
        : 1;

      if (completionRate === 1) {
        smartTags.push({
          id: `tag-${Date.now()}-complete`,
          name: 'Complete',
          type: 'auto',
          color: 'green',
          confidence: 0.95
        });
      } else if (completionRate > 0.5) {
        smartTags.push({
          id: `tag-${Date.now()}-partial`,
          name: 'Partially Complete',
          type: 'auto',
          color: 'yellow',
          confidence: 0.90
        });
      } else {
        smartTags.push({
          id: `tag-${Date.now()}-incomplete`,
          name: 'Incomplete',
          type: 'auto',
          color: 'red',
          confidence: 0.85
        });
      }

      // Add date-based tag
      const today = new Date();
      const monthYear = today.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      smartTags.push({
        id: `tag-${Date.now()}-date`,
        name: monthYear,
        type: 'auto',
        color: 'gray',
        confidence: 0.99
      });

      // Generate AI analysis summary
      const summary = `RAG-powered analysis identified this as a ${ragResult.documentType} document with ${ragResult.confidence}% confidence. ${ragResult.structuralAnalysis.recommendations.length > 0 ? 'Contains actionable recommendations.' : 'Document structure analyzed successfully.'}`;

      const keyPoints = [
        `Document type: ${ragResult.documentType}`,
        `Confidence: ${ragResult.confidence}%`,
        `Fields completed: ${ragResult.structuralAnalysis.fieldsCompleted}/${ragResult.structuralAnalysis.totalFields}`,
        `Compliance status: ${ragResult.structuralAnalysis.complianceStatus}`,
        `Signature status: ${ragResult.structuralAnalysis.hasSignature ? 'Signed' : 'Requires signature'}`,
        ...ragResult.contentExtraction.keyFindings.slice(0, 3)
      ];

      // Determine suggested folder based on document type
      const suggestedFolder = getSuggestedFolder(ragResult.documentType, ragResult.healthcareTags);

      return {
        smartTags,
        aiAnalysis: {
          summary,
          keyPoints,
          extractedData: {
            'File Type': file.type,
            'Upload Date': today.toISOString(),
            'Document Type': ragResult.documentType,
            'RAG Confidence': `${ragResult.confidence}%`,
            'Analysis Method': 'RAG + Bedrock',
            'Compliance Status': ragResult.structuralAnalysis.complianceStatus,
            'Fields Status': `${ragResult.structuralAnalysis.fieldsCompleted}/${ragResult.structuralAnalysis.totalFields}`,
            'Processing Time': `${ragResult.metadata.processingTime}ms`
          },
          category: mapDocumentTypeToCategory(ragResult.documentType),
          confidence: ragResult.confidence / 100,
          lastAnalyzed: ragResult.metadata.analyzedAt
        },
        suggestedFolder
      };

    } catch (error) {
      console.error('❌ RAG document analysis failed:', error);
      
      // Fallback to basic analysis
      return await fallbackAnalyzeDocument(file);
    }
  };

  // Helper function to get tag colors based on content
  const getTagColor = (tag: string): string => {
    const tagLower = tag.toLowerCase();
    if (tagLower.includes('ndis') || tagLower.includes('service delivery')) return 'blue';
    if (tagLower.includes('consent') || tagLower.includes('authorization')) return 'purple';
    if (tagLower.includes('lab') || tagLower.includes('test')) return 'green';
    if (tagLower.includes('prescription') || tagLower.includes('medication')) return 'purple';
    if (tagLower.includes('imaging') || tagLower.includes('scan')) return 'indigo';
    if (tagLower.includes('insurance') || tagLower.includes('billing')) return 'orange';
    if (tagLower.includes('appointment') || tagLower.includes('consultation')) return 'pink';
    if (tagLower.includes('healthcare') || tagLower.includes('medical')) return 'blue';
    return 'gray';
  };

  // Helper function to suggest folders based on document analysis
  const getSuggestedFolder = (documentType: string, tags: string[]): string => {
    if (documentType === 'ndis' || tags.some(tag => tag.toLowerCase().includes('ndis'))) {
      return 'NDIS Documents';
    }
    if (documentType === 'consent' || tags.some(tag => tag.toLowerCase().includes('consent'))) {
      return 'Consent & Authorization';
    }
    if (documentType === 'lab_results' || tags.some(tag => tag.toLowerCase().includes('lab'))) {
      return 'Lab Results';
    }
    if (documentType === 'prescription' || tags.some(tag => tag.toLowerCase().includes('prescription'))) {
      return 'Prescriptions';
    }
    if (documentType === 'medical' || tags.some(tag => tag.toLowerCase().includes('medical'))) {
      return 'Medical Records';
    }
    return 'Healthcare Documents';
  };

  // Helper function to map RAG document types to legacy categories
  const mapDocumentTypeToCategory = (documentType: string): DocumentCategory => {
    switch (documentType) {
      case 'ndis': return 'other'; // NDIS doesn't fit standard categories
      case 'consent': return 'medical-records';
      case 'lab_results': return 'lab-results';
      case 'prescription': return 'prescriptions';
      case 'medical': return 'medical-records';
      case 'healthcare': return 'medical-records';
      default: return 'other';
    }
  };

  // Fallback analysis function for when RAG fails
  const fallbackAnalyzeDocument = async (file: File): Promise<{
    smartTags: SmartTag[];
    aiAnalysis: SmartDocument['aiAnalysis'];
    suggestedFolder: string;
  }> => {
    console.log('🔄 Using fallback analysis for:', file.name);
    
    const fileName = file.name.toLowerCase();
    const smartTags: SmartTag[] = [];
    let category: DocumentCategory = 'other';
    let suggestedFolder = 'Uncategorized';

    // Basic filename analysis
    if (fileName.includes('ndis')) {
      smartTags.push({ id: `tag-${Date.now()}-ndis`, name: 'NDIS', type: 'auto', color: 'blue', confidence: 0.85 });
      suggestedFolder = 'NDIS Documents';
    } else if (fileName.includes('consent')) {
      smartTags.push({ id: `tag-${Date.now()}-consent`, name: 'Consent Form', type: 'auto', color: 'purple', confidence: 0.80 });
      category = 'medical-records';
      suggestedFolder = 'Consent & Authorization';
    } else if (fileName.includes('blood') || fileName.includes('lab')) {
      smartTags.push({ id: `tag-${Date.now()}-lab`, name: 'Lab Results', type: 'auto', color: 'green', confidence: 0.80 });
      category = 'lab-results';
      suggestedFolder = 'Lab Results';
    }

    // Add fallback tag
    smartTags.push({
      id: `tag-${Date.now()}-fallback`,
      name: 'Basic Analysis',
      type: 'auto',
      color: 'gray',
      confidence: 0.60
    });

    return {
      smartTags,
      aiAnalysis: {
        summary: 'Document analyzed using basic filename pattern matching.',
        keyPoints: [
          'Fallback analysis used',
          'Limited content analysis available',
          'Consider re-uploading for advanced analysis'
        ],
        extractedData: {
          'File Type': file.type,
          'Analysis Method': 'Fallback - Filename Only'
        },
        category,
        confidence: 0.60,
        lastAnalyzed: new Date().toISOString()
      },
      suggestedFolder
    };
  };

  const formatFileSize = (bytes: number) => {
    const sizes = ['B', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 B';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const uniqueCategories = Array.from(new Set(documents.map(doc => doc.aiAnalysis?.category).filter(Boolean))) as DocumentCategory[];
  const uniqueFolders = Array.from(new Set(documents.map(doc => doc.folder).filter(Boolean)));

  if (!isVisible) return null;

  return (
    <div className="flex flex-col h-full border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
      {/* Header */}
      <div className="flex-shrink-0 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">Smart Document Organization</h3>
            <span className="text-xs bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 px-2 py-1 rounded-full">
              AI-Powered
            </span>
          </div>
          <div className="flex items-center gap-1">
            {/* Minimize/Maximize Button */}
            {onToggleMinimize && (
              <button
                onClick={onToggleMinimize}
                className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
                title={isMinimized ? "Expand document pane" : "Minimize document pane"}
              >
                {isMinimized ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
              </button>
            )}
            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
              title="Close document pane"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Content - hidden when minimized */}
      {!isMinimized && (
        <div className="flex-1 overflow-y-auto min-h-0 pb-4" style={{ 
          scrollbarWidth: 'thin',
          scrollbarColor: '#CBD5E0 #F7FAFC'
        }}>
          {/* Tab Navigation */}
          <div className="flex-shrink-0 px-4 pt-3 bg-white dark:bg-gray-900">
            <div className="flex border-b border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setActiveTab('documents')}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'documents'
                    ? 'border-purple-500 text-purple-600 dark:text-purple-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Documents ({documents.length})
                </div>
              </button>
              <button
                onClick={() => setActiveTab('search')}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'search'
                    ? 'border-purple-500 text-purple-600 dark:text-purple-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Brain className="w-4 h-4" />
                  AI Search
                </div>
              </button>
              <button
                onClick={() => setActiveTab('insights')}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'insights'
                    ? 'border-purple-500 text-purple-600 dark:text-purple-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Brain className="w-4 h-4" />
                  Health Insights
                </div>
              </button>
            </div>
          </div>

          {/* Tab Content */}
          {activeTab === 'documents' && (
            <>
              {/* Controls */}
              <div className="flex-shrink-0 px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
            <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="flex-1 min-w-64">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search documents, tags, or content..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>

          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value as DocumentCategory | 'all')}
            className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="all">All Categories</option>
            {uniqueCategories.map(category => (
              <option key={category} value={category}>
                {category.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </option>
            ))}
          </select>

          {/* Folder Filter */}
          <select
            value={selectedFolder}
            onChange={(e) => setSelectedFolder(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="all">All Folders</option>
            {uniqueFolders.map(folder => (
              <option key={folder} value={folder}>{folder}</option>
            ))}
          </select>

          {/* View Toggle */}
          <div className="flex border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
            <button
              onClick={() => setView('grid')}
              className={`px-3 py-2 text-sm ${view === 'grid' ? 'bg-purple-600 text-white' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300'}`}
            >
              <Grid3X3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setView('list')}
              className={`px-3 py-2 text-sm ${view === 'list' ? 'bg-purple-600 text-white' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300'}`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Upload Area */}
      <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
        <S3FileUpload
          onFilesUploaded={handleS3Upload}
          onUploadProgress={(files) => {
            // Optional: handle progress display
          }}
          maxFiles={5}
          maxFileSize={10}
          className="mb-4"
          folder="documents"
          userInfo={user && user.id ? {
            userId: user.id,
            userName: user.name,
            userEmail: user.email
          } : undefined}
        />
      </div>

          {/* Documents */}
          <div className="flex-1">
            {filteredDocuments.length === 0 ? (
              <div className="p-8 text-center">
                <Upload className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
                <h4 className="text-xl font-medium text-gray-900 dark:text-gray-100 mb-3">
                  {documents.length === 0 ? "No documents uploaded yet" : "No documents match your filters"}
                </h4>
                <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
                  {documents.length === 0 
                    ? "Upload your first document above to get started with AI-powered organization, smart tagging, and document analysis."
                    : "Try adjusting your search query or clearing your filters to see more documents."
                  }
                </p>
                {documents.length === 0 && (
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 text-sm text-blue-800 dark:text-blue-200">
                    <div className="flex items-start gap-3">
                      <Brain className="w-5 h-5 mt-0.5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                      <div className="text-left">
                        <p className="font-medium mb-1">AI-Powered Features Available:</p>
                        <ul className="space-y-1 text-blue-700 dark:text-blue-300">
                          <li>• Automatic document categorization and tagging</li>
                          <li>• Smart content analysis and key point extraction</li>
                          <li>• Intelligent folder organization suggestions</li>
                          <li>• Medical document analysis and insights</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
          <div className={view === 'grid' ? 'p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4' : 'divide-y divide-gray-200 dark:divide-gray-700'}>
            {filteredDocuments.map((document) => (
              <div
                key={document.id}
                className={`${view === 'grid' 
                  ? 'border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer' 
                  : 'p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer'
                }`}
                onClick={() => handleDocumentView(document)}
              >
                {view === 'grid' ? (
                  // Grid View
                  <div className="h-full flex flex-col relative group">
                    {/* Delete button - appears on hover */}
                    <button
                      className="absolute top-2 right-2 p-1 bg-red-100 hover:bg-red-200 text-red-600 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10 disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Delete document"
                      disabled={isDeleting.includes(document.id)}
                      onClick={(e) => {
                        e.stopPropagation(); // Prevent triggering document selection
                        deleteDocument(document.id, document.name);
                      }}
                    >
                      {isDeleting.includes(document.id) ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <Trash2 className="w-3 h-3" />
                      )}
                    </button>

                    <div className="flex items-start justify-between mb-3 gap-2 min-h-0">
                      <div className="flex items-start gap-2 min-w-0 flex-1">
                        <div className="flex-shrink-0 mt-0.5">
                          {document.aiAnalysis?.category && categoryIcons[document.aiAnalysis.category]}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 
                            className="text-sm font-medium text-gray-900 dark:text-gray-100 break-words leading-tight"
                            style={{
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                              hyphens: 'auto',
                              wordBreak: 'break-all'
                            }}
                            title={document.name} // Show full filename on hover
                          >
                            {document.name}
                          </h3>
                        </div>
                      </div>
                      {document.isFavorite && (
                        <div className="flex-shrink-0">
                          <Star className="w-4 h-4 text-yellow-500 fill-current" />
                        </div>
                      )}
                    </div>
                    
                    {document.aiAnalysis && (
                      <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs border mb-3 ${categoryColors[document.aiAnalysis.category]}`}>
                        {categoryIcons[document.aiAnalysis.category]}
                        <span>{document.aiAnalysis.category.replace('-', ' ')}</span>
                        <span className="text-xs opacity-75">({Math.round(document.aiAnalysis.confidence * 100)}%)</span>
                      </div>
                    )}

                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                      {document.aiAnalysis?.summary || 'No analysis available'}
                    </p>

                    <div className="flex flex-wrap gap-1 mb-3">
                      {document.smartTags.slice(0, 3).map((tag) => (
                        <span
                          key={tag.id}
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-${tag.color}-100 text-${tag.color}-800 border border-${tag.color}-200`}
                        >
                          <Tag className="w-3 h-3" />
                          {tag.name}
                        </span>
                      ))}
                      {document.smartTags.length > 3 && (
                        <span className="text-xs text-gray-500">+{document.smartTags.length - 3} more</span>
                      )}
                    </div>

                    <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                      <span>{formatFileSize(document.size)}</span>
                      <span>{formatDate(document.uploadDate)}</span>
                    </div>

                    {isAnalyzing.includes(document.id) && (
                      <div className="absolute inset-0 bg-white/80 dark:bg-gray-900/80 rounded-lg flex items-center justify-center">
                        <div className="flex items-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span className="text-sm">Analyzing...</span>
                        </div>
                      </div>
                    )}

                    {isDeleting.includes(document.id) && (
                      <div className="absolute inset-0 bg-red-50/90 dark:bg-red-900/20 rounded-lg flex items-center justify-center">
                        <div className="flex items-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin text-red-600" />
                          <span className="text-sm text-red-600 dark:text-red-400">Deleting...</span>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  // List View
                  <div className="flex items-center gap-4">
                    <div className="flex-shrink-0">
                      {document.aiAnalysis?.category && categoryIcons[document.aiAnalysis.category]}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-gray-900 dark:text-gray-100 truncate">{document.name}</span>
                        {document.isFavorite && <Star className="w-4 h-4 text-yellow-500 fill-current" />}
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {document.aiAnalysis && (
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs border ${categoryColors[document.aiAnalysis.category]}`}>
                            {document.aiAnalysis.category.replace('-', ' ')}
                          </span>
                        )}
                        <span className="text-xs text-gray-500">{formatFileSize(document.size)}</span>
                        <span className="text-xs text-gray-500">{formatDate(document.uploadDate)}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button 
                        className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        title="View document"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDocumentView(document);
                        }}
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button 
                        className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        title="Download document"
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(document.url, '_blank');
                        }}
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      <button 
                        className="p-1 text-red-400 hover:text-red-600 dark:hover:text-red-300 disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Delete document"
                        disabled={isDeleting.includes(document.id)}
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteDocument(document.id, document.name);
                        }}
                      >
                        {isDeleting.includes(document.id) ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </button>
                      <div className="relative">
                        <button 
                          className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                          title="More actions"
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenDropdown(openDropdown === document.id ? null : document.id);
                          }}
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>
                        
                        {/* Dropdown Menu - can contain additional actions */}
                        {openDropdown === document.id && (
                          <div className="absolute right-0 top-8 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg z-10 min-w-32">
                            <button
                              className="w-full px-3 py-2 text-left text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2"
                              onClick={() => {
                                setOpenDropdown(null);
                                // Add favorite/unfavorite functionality here
                              }}
                            >
                              <Star className="w-4 h-4" />
                              {document.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
            </>
          )}

          {/* AI Search Tab */}
          {activeTab === 'search' && (
            <div className="flex-1 p-4">
              <SemanticSearch 
                userId={user?.id || user?.userId || 'anonymous'}
                onDocumentSelect={(documentId) => {
                  // Find and view the selected document
                  const doc = documents.find(d => d.id === documentId);
                  if (doc) {
                    console.log('Selected document from search:', doc.name);
                    // Open document in viewer
                    handleDocumentView(doc);
                    // Switch to documents tab and highlight the document
                    setActiveTab('documents');
                  }
                }}
              />
            </div>
          )}

          {/* Health Insights Tab */}
          {activeTab === 'insights' && (
            <div className="flex-1 p-4">
              <div className="space-y-6">
                <div className="text-center">
                  <Brain className="w-12 h-12 mx-auto mb-4 text-purple-600" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                    Health Insights
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    AI-powered analysis of your health documents and trends
                  </p>
                </div>

                <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border border-purple-200 dark:border-purple-700 rounded-lg p-6">
                  <div className="flex items-start gap-4">
                    <Brain className="w-6 h-6 text-purple-600 dark:text-purple-400 flex-shrink-0 mt-1" />
                    <div>
                      <h4 className="font-medium text-purple-900 dark:text-purple-100 mb-2">
                        Coming Soon: Personalized Health Intelligence
                      </h4>
                      <div className="space-y-2 text-sm text-purple-700 dark:text-purple-300">
                        <p>📊 <strong>Health Timeline:</strong> Track your health journey over time</p>
                        <p>🔍 <strong>Pattern Detection:</strong> Identify trends in your lab results and vitals</p>
                        <p>💊 <strong>Medication Insights:</strong> Monitor drug interactions and adherence</p>
                        <p>⚠️ <strong>Health Alerts:</strong> Get notified about important health changes</p>
                        <p>📋 <strong>Care Recommendations:</strong> Personalized suggestions based on your data</p>
                      </div>
                    </div>
                  </div>
                </div>

                {documents.length > 0 && (
                  <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-3">
                      Your Document Summary
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                      <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                          {documents.length}
                        </div>
                        <div className="text-xs text-blue-700 dark:text-blue-300">
                          Total Documents
                        </div>
                      </div>
                      <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                        <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                          {documents.filter(d => d.aiAnalysis?.category === 'lab-results').length}
                        </div>
                        <div className="text-xs text-green-700 dark:text-green-300">
                          Lab Results
                        </div>
                      </div>
                      <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                        <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                          {documents.filter(d => d.aiAnalysis?.category === 'prescriptions').length}
                        </div>
                        <div className="text-xs text-purple-700 dark:text-purple-300">
                          Prescriptions
                        </div>
                      </div>
                      <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                        <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                          {documents.filter(d => d.aiAnalysis?.category === 'medical-records').length}
                        </div>
                        <div className="text-xs text-orange-700 dark:text-orange-300">
                          Medical Records
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Document Viewer Modal */}
      {viewerDocument && (
        <DocumentViewer
          document={viewerDocument}
          isOpen={!!viewerDocument}
          onClose={() => setViewerDocument(null)}
        />
      )}
    </div>
  );
}
