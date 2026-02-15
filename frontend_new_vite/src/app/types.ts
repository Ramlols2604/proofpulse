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
  /** Backboard SDK verdict from verify_claim (e.g. SUPPORTED, CONTRADICTED, UNCLEAR) */
  backboardVerdict?: string;
  /** Backboard confidence 0–100 */
  backboardConfidence?: number;
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
  /** Full transcript from TwelveLabs (or extracted text) */
  transcriptText?: string;
  transcript: TranscriptSegment[];
  claims: Claim[];
  /** URL for video preview (uploaded video served by backend) */
  videoUrl?: string;
  /** Backend job ID (for display) */
  jobId?: string;
}

export type InputType = 'video' | 'text' | 'url';
