import type { VideoData, Claim, TranscriptSegment } from './types';

const API_BASE = 'http://localhost:8000';

// Generate or retrieve client ID
function getClientId(): string {
  if (typeof window === 'undefined') return 'ssr-placeholder';
  let clientId = localStorage.getItem('proofpulse_client_id');
  if (!clientId) {
    clientId = crypto.randomUUID();
    localStorage.setItem('proofpulse_client_id', clientId);
  }
  return clientId;
}

// API call wrapper with client ID header
async function apiCall(endpoint: string, options: RequestInit = {}) {
  const headers = {
    'x-client-id': getClientId(),
    ...options.headers,
  };
  
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });
  
  if (!response.ok) {
    throw new Error(`API error: ${response.statusText}`);
  }
  
  return response.json();
}

// Transform backend claim to frontend format
function transformClaim(backendClaim: any): Claim {
  console.log('[transformClaim] Input:', backendClaim);
  
  // Map backend verdict to frontend format
  const verdictMap: Record<string, 'supported' | 'contradicted' | 'unclear'> = {
    'SUPPORTED': 'supported',
    'MOSTLY_SUPPORTED': 'supported',
    'CONTRADICTED': 'contradicted',
    'MOSTLY_CONTRADICTED': 'contradicted',
    'UNCLEAR': 'unclear',
  };
  
  const claim = {
    id: backendClaim.claim_id,
    text: backendClaim.claim_text,
    timestamp: backendClaim.start_time || 0,
    endTime: backendClaim.end_time,
    verdict: verdictMap[backendClaim.final_verdict] || 'unclear',
    confidence: backendClaim.fact_score,
    evidence: {
      summary: backendClaim.explanation || '',
      sources: (backendClaim.sources || []).map((s: any) => ({
        publisher: s.publisher || 'Unknown',
        title: s.title || 'Untitled',
        url: s.url || '#',
        snippet: s.snippet || '',
        date: s.date || '',
      })),
    },
    breakdown: backendClaim.breakdown,
  };
  
  console.log('[transformClaim] Output:', claim);
  return claim;
}

// Transform backend response to VideoData format
function transformBackendResponse(backendResult: any): VideoData {
  console.log('[transformBackendResponse] Input:', backendResult);
  
  const claims = (backendResult.claims || []).map(transformClaim);
  
  // Calculate credibility score (average of all claim scores)
  const avgScore = claims.length > 0 
    ? Math.round(claims.reduce((sum, c) => sum + c.confidence, 0) / claims.length)
    : 0;
  
  // Generate transcript from claims if available
  const transcript: TranscriptSegment[] = claims
    .filter(c => c.timestamp !== null && c.timestamp !== 0)
    .map(c => ({
      id: c.id,
      text: c.text,
      startTime: c.timestamp,
      endTime: c.endTime || c.timestamp + 10,
    }));
  
  const result = {
    title: `Analysis Results (${backendResult.input_type})`,
    credibilityScore: avgScore,
    aiScore: 0, // Not provided by backend yet
    transcript,
    claims,
  };
  
  console.log('[transformBackendResponse] Output:', result);
  console.log('[transformBackendResponse] Claims count:', claims.length);
  console.log('[transformBackendResponse] Credibility score:', avgScore);
  
  return result;
}

// API functions
export async function submitTextForAnalysis(text: string): Promise<string> {
  console.log('submitTextForAnalysis called with:', text);
  
  // Step 1: Ingest - Use FormData for backend Form parameters
  const formData = new FormData();
  formData.append('type', 'text');
  formData.append('content', text);
  
  const ingestResponse = await apiCall('/ingest', {
    method: 'POST',
    body: formData,
  });
  
  console.log('Ingest response:', ingestResponse);
  const jobId = ingestResponse.job_id;
  
  // Step 2: Process
  await apiCall(`/process?job_id=${jobId}`, {
    method: 'POST',
  });
  
  return jobId;
}

export async function submitUrlForAnalysis(url: string): Promise<string> {
  console.log('submitUrlForAnalysis called with:', url);
  
  const formData = new FormData();
  formData.append('type', 'url');
  formData.append('content', url);
  
  const ingestResponse = await apiCall('/ingest', {
    method: 'POST',
    body: formData,
  });
  
  console.log('Ingest response:', ingestResponse);
  const jobId = ingestResponse.job_id;
  
  await apiCall(`/process?job_id=${jobId}`, {
    method: 'POST',
  });
  
  return jobId;
}

export async function submitFileForAnalysis(file: File): Promise<string> {
  console.log('submitFileForAnalysis called with:', file);
  
  const formData = new FormData();
  // Determine type based on file extension
  const fileExt = file.name.split('.').pop()?.toLowerCase();
  const type = fileExt === 'pdf' ? 'pdf' : 'video';
  
  formData.append('type', type);
  formData.append('file', file);
  
  const ingestResponse = await apiCall('/ingest', {
    method: 'POST',
    body: formData,
  });
  
  console.log('Ingest response:', ingestResponse);
  const jobId = ingestResponse.job_id;
  
  await apiCall(`/process?job_id=${jobId}`, {
    method: 'POST',
  });
  
  return jobId;
}

export async function checkJobStatus(jobId: string): Promise<{
  status: string;
  message: string;
}> {
  return apiCall(`/status?job_id=${jobId}`);
}

export async function getJobResult(jobId: string): Promise<VideoData> {
  const result = await apiCall(`/result?job_id=${jobId}`);
  return transformBackendResponse(result);
}

export async function loadDemoData(): Promise<VideoData> {
  // Demo endpoint returns status, need to get actual result
  await apiCall('/demo'); // Ensure demo cache exists
  const result = await apiCall('/result?job_id=demo');
  return transformBackendResponse(result);
}

// Poll for job completion
export async function pollForResult(
  jobId: string,
  onStatusUpdate?: (status: string) => void
): Promise<VideoData> {
  const maxAttempts = 60; // 60 attempts * 2 seconds = 2 minutes max
  let attempts = 0;
  
  while (attempts < maxAttempts) {
    const status = await checkJobStatus(jobId);
    onStatusUpdate?.(status.message || status.status);
    
    if (status.status === 'READY') {
      return getJobResult(jobId);
    }
    
    if (status.status === 'FAILED') {
      throw new Error(status.message || 'Processing failed');
    }
    
    // Wait 2 seconds before next poll
    await new Promise(resolve => setTimeout(resolve, 2000));
    attempts++;
  }
  
  throw new Error('Processing timeout');
}
