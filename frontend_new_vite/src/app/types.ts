export interface Evidence {
  summary: string;
  sources: {
    publisher: string;
    title: string;
    url: string;
    snippet?: string;
    date?: string;
  }[];
}

export interface Claim {
  id: string;
  text: string;
  timestamp: number;
  endTime?: number;
  verdict: 'supported' | 'contradicted' | 'unclear';
  confidence: number;
  evidence: Evidence;
  breakdown?: any;
}

export interface TranscriptSegment {
  id: string;
  text: string;
  startTime: number;
  endTime: number;
}

export interface VideoData {
  title: string;
  credibilityScore: number;
  aiScore: number; // Percentage of AI generated content
  transcript: TranscriptSegment[];
  claims: Claim[];
}

export type InputType = 'video' | 'text' | 'url';
