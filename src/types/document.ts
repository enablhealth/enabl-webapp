export interface Document {
  id: string;
  name: string;
  type: string;
  size: string;
  url: string;
  uploadedAt: string;
  tags?: string[];
  category?: string;
  userId: string;
}

export interface DocumentFile {
  id: string;
  name: string;
  type: string;
  size: number;
  uploadDate: string;
  category: 'medical' | 'insurance' | 'lab' | 'prescription' | 'other';
  url: string;
  thumbnailUrl?: string;
  aiAnalysis?: {
    summary: string;
    keyPoints: string[];
    extractedData: Record<string, any>;
    lastAnalyzed: string;
  };
}
