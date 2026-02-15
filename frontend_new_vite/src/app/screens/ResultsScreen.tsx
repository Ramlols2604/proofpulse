import React from 'react';
import { VideoPlayer } from '../components/ui/VideoPlayer';
import type { Claim, VideoData, InputType } from '../types';

interface ResultsScreenProps {
  onBack: () => void;
  inputType: InputType;
  data: VideoData;
}

function getVerdictColor(verdict: Claim['verdict']) {
  const map: Record<Claim['verdict'], string> = {
    supported: 'bg-green-100 text-green-800 border-green-300',
    contradicted: 'bg-red-100 text-red-800 border-red-300',
    unclear: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  };
  return map[verdict] || 'bg-gray-100 text-gray-800 border-gray-300';
}

function getScoreColor(score: number) {
  if (score >= 80) return 'text-green-600';
  if (score >= 60) return 'text-green-500';
  if (score >= 40) return 'text-yellow-600';
  if (score >= 20) return 'text-orange-600';
  return 'text-red-600';
}

export function ResultsScreen({ onBack, inputType, data }: ResultsScreenProps) {
  const claims = data.claims || [];
  const hasTranscript = (data.transcriptText || (data.transcript?.length ?? 0) > 0);

  return (
    <div className="space-y-6">
      {/* Header card — match frontend ResultsView */}
      <div className="bg-white rounded-2xl shadow-xl p-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Analysis Results</h2>
            {data.jobId && <p className="text-sm text-gray-500 mt-1">Job ID: {data.jobId}</p>}
            <p className="text-sm text-gray-500">Input Type: {inputType.toUpperCase()}</p>
          </div>
          <button
            type="button"
            onClick={onBack}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
          >
            Analyze New Input
          </button>
        </div>
      </div>

      {/* Optional: Video preview + transcript (frontend doesn't have these; we keep in same style) */}
      {inputType === 'video' && (data.videoUrl || hasTranscript) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {data.videoUrl && (
            <div className="bg-white rounded-2xl shadow-xl p-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Video Preview</h3>
              <div className="rounded-lg overflow-hidden bg-black">
                <VideoPlayer
                  src={data.videoUrl}
                  markers={[]}
                  seekTo={null}
                  onMarkerClick={() => {}}
                  onTimeUpdate={() => {}}
                />
              </div>
            </div>
          )}
          {hasTranscript && (
            <div className="bg-white rounded-2xl shadow-xl p-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Transcript</h3>
              <div className="max-h-48 overflow-y-auto text-sm text-gray-700 whitespace-pre-wrap">
                {data.transcriptText || data.transcript?.map((s) => s.text).join(' ')}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Claims — same layout as frontend ResultsView */}
      <h3 className="text-xl font-semibold text-gray-900">
        {claims.length} Claim{claims.length !== 1 ? 's' : ''} Analyzed
      </h3>

      {claims.length === 0 && (
        <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-8 text-center">
          <div className="text-5xl mb-4">💬</div>
          <h4 className="text-xl font-semibold text-blue-900 mb-2">No Verifiable Claims Detected</h4>
          <p className="text-blue-700 max-w-md mx-auto">
            The system analyzed your input but could not extract verifiable factual claims.
          </p>
        </div>
      )}

      {claims.map((claim, index) => (
        <div key={claim.id} className="bg-white rounded-xl shadow-lg p-6 space-y-4">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-sm font-semibold text-gray-500">CLAIM #{index + 1}</span>
              </div>
              <p className="text-lg font-medium text-gray-900">{claim.text}</p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className={`flex-1 px-4 py-3 rounded-lg border-2 ${getVerdictColor(claim.verdict)}`}>
              <div className="text-xs font-semibold mb-1">VERDICT</div>
              <div className="text-lg font-bold">{claim.verdict.charAt(0).toUpperCase() + claim.verdict.slice(1)}</div>
            </div>
            <div className="flex-1 px-4 py-3 rounded-lg border-2 border-gray-200 bg-gray-50">
              <div className="text-xs font-semibold text-gray-600 mb-1">FACT SCORE</div>
              <div className={`text-3xl font-bold ${getScoreColor(claim.confidence)}`}>
                {claim.confidence}
                <span className="text-lg text-gray-500">/100</span>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="text-xs font-semibold text-blue-900 mb-2">EXPLANATION</div>
            <p className="text-sm text-blue-800">{claim.evidence?.summary || '—'}</p>
          </div>

          {claim.breakdown && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {claim.breakdown.evidence_strength != null && (
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="text-xs text-gray-600 font-medium">Evidence Strength</div>
                  <div className="text-lg font-bold text-gray-900">{claim.breakdown.evidence_strength}/30</div>
                </div>
              )}
              {claim.breakdown.evidence_agreement != null && (
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="text-xs text-gray-600 font-medium">Evidence Agreement</div>
                  <div className="text-lg font-bold text-gray-900">{claim.breakdown.evidence_agreement}/30</div>
                </div>
              )}
              {claim.breakdown.context_accuracy != null && (
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="text-xs text-gray-600 font-medium">Context Accuracy</div>
                  <div className="text-lg font-bold text-gray-900">{claim.breakdown.context_accuracy}/20</div>
                </div>
              )}
              {claim.breakdown.model_confidence_points != null && (
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="text-xs text-gray-600 font-medium">Model Confidence</div>
                  <div className="text-lg font-bold text-gray-900">{claim.breakdown.model_confidence_points}/20</div>
                </div>
              )}
            </div>
          )}

          {claim.evidence?.sources && claim.evidence.sources.length > 0 && (
            <div className="border-t pt-4">
              <div className="text-sm font-semibold text-gray-700 mb-3">SOURCES ({claim.evidence.sources.length})</div>
              <div className="space-y-2">
                {claim.evidence.sources.map((source, idx) => (
                  <div key={idx} className="bg-gray-50 p-3 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="font-medium text-gray-900 text-sm">{source.title}</div>
                        <div className="text-xs text-gray-600 mt-1">{source.publisher} • {source.date || 'N/A'}</div>
                        {source.snippet && (
                          <p className="text-xs text-gray-700 mt-2 line-clamp-2">{source.snippet}</p>
                        )}
                      </div>
                      <a
                        href={source.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ml-3 text-blue-600 hover:text-blue-700 text-xs font-medium"
                      >
                        View →
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
