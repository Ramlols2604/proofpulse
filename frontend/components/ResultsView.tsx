"use client";

interface ResultsViewProps {
  results: any;
  onReset: () => void;
}

export default function ResultsView({ results, onReset }: ResultsViewProps) {
  const getVerdictColor = (verdict: string) => {
    const colors: Record<string, string> = {
      "SUPPORTED": "bg-green-900/30 text-green-300 border-green-600",
      "MOSTLY_SUPPORTED": "bg-green-900/20 text-green-400 border-green-700",
      "UNCLEAR": "bg-yellow-900/30 text-yellow-300 border-yellow-600",
      "MOSTLY_CONTRADICTED": "bg-orange-900/30 text-orange-300 border-orange-600",
      "CONTRADICTED": "bg-red-900/30 text-red-300 border-red-600",
    };
    return colors[verdict] || "bg-slate-700/50 text-slate-300 border-slate-600";
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-400";
    if (score >= 60) return "text-green-500";
    if (score >= 40) return "text-yellow-400";
    if (score >= 20) return "text-orange-400";
    return "text-red-400";
  };

  // Check if any claim used Backboard fallback
  const usedBackboardFallback = results.claims?.some((claim: any) => 
    claim.explanation?.includes("Backboard fallback") || 
    claim.explanation?.includes("Backboard scoring")
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl shadow-xl p-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-white">Analysis Results</h2>
            <p className="text-sm text-slate-400 mt-1">Job ID: {results.job_id}</p>
            <p className="text-sm text-slate-400">Input Type: {results.input_type?.toUpperCase()}</p>
            {usedBackboardFallback && (
              <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 bg-blue-900/30 text-blue-300 text-xs rounded-full border border-blue-700">
                <span>ℹ️</span>
                <span>Using Backboard scoring</span>
              </div>
            )}
          </div>
          <button
            onClick={onReset}
            className="px-6 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 font-medium transition-colors border border-slate-600"
          >
            Analyze New Input
          </button>
        </div>
      </div>

      {/* Claims */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-slate-200">
          {results.claims.length} Claim{results.claims.length !== 1 ? "s" : ""} Analyzed
        </h3>

        {/* No Claims Message */}
        {results.claims.length === 0 && (
          <div className="bg-slate-800/90 border border-slate-700 rounded-xl p-8 text-center">
            <div className="text-5xl mb-4">💬</div>
            <h4 className="text-xl font-semibold text-slate-200 mb-2">
              Statement Analyzed - No Verifiable Claims Detected
            </h4>
            <p className="text-slate-400 max-w-md mx-auto">
              The system analyzed your input but could not extract verifiable factual claims.
            </p>
            <p className="text-sm text-slate-500 mt-4">
              💡 Tip: Provide statements with specific, verifiable facts.
            </p>
          </div>
        )}

        {results.claims.map((claim: any, index: number) => (
          <div
            key={claim.claim_id}
            className="bg-slate-800/90 border border-slate-700/80 rounded-xl shadow-lg p-6 space-y-4"
          >
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-sm font-semibold text-slate-500">CLAIM #{index + 1}</span>
                  {claim.claim_type && (
                    <span className="text-xs px-2 py-1 bg-slate-700 text-slate-400 rounded">
                      {claim.claim_type}
                    </span>
                  )}
                </div>
                <p className="text-lg font-medium text-slate-100">{claim.claim_text}</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className={`flex-1 px-4 py-3 rounded-lg border-2 ${getVerdictColor(claim.final_verdict)}`}>
                <div className="text-xs font-semibold mb-1">VERDICT</div>
                <div className="text-lg font-bold">{claim.final_verdict?.replace("_", " ") || "—"}</div>
              </div>
              <div className="flex-1 px-4 py-3 rounded-lg border-2 border-slate-600 bg-slate-700/50">
                <div className="text-xs font-semibold text-slate-400 mb-1">FACT SCORE</div>
                <div className={`text-3xl font-bold ${getScoreColor(claim.fact_score)}`}>
                  {claim.fact_score ?? "—"}
                  <span className="text-lg text-slate-500">/100</span>
                </div>
              </div>
            </div>

            <div className="bg-slate-900/50 border border-slate-600 rounded-lg p-4">
              <div className="text-xs font-semibold text-slate-400 mb-2">EXPLANATION</div>
              <p className="text-sm text-slate-300">{claim.explanation}</p>
            </div>

            {claim.breakdown && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {claim.breakdown.evidence_strength != null && (
                  <div className="bg-slate-700/50 p-3 rounded-lg">
                    <div className="text-xs text-slate-400 font-medium">Evidence Strength</div>
                    <div className="text-lg font-bold text-slate-200">{claim.breakdown.evidence_strength}/30</div>
                  </div>
                )}
                {claim.breakdown.evidence_agreement != null && (
                  <div className="bg-slate-700/50 p-3 rounded-lg">
                    <div className="text-xs text-slate-400 font-medium">Evidence Agreement</div>
                    <div className="text-lg font-bold text-slate-200">{claim.breakdown.evidence_agreement}/30</div>
                  </div>
                )}
                {claim.breakdown.context_accuracy != null && (
                  <div className="bg-slate-700/50 p-3 rounded-lg">
                    <div className="text-xs text-slate-400 font-medium">Context Accuracy</div>
                    <div className="text-lg font-bold text-slate-200">{claim.breakdown.context_accuracy}/20</div>
                  </div>
                )}
                {claim.breakdown.model_confidence_points != null && (
                  <div className="bg-slate-700/50 p-3 rounded-lg">
                    <div className="text-xs text-slate-400 font-medium">Model Confidence</div>
                    <div className="text-lg font-bold text-slate-200">{claim.breakdown.model_confidence_points}/20</div>
                  </div>
                )}
              </div>
            )}

            {claim.sources && claim.sources.length > 0 && (
              <div className="border-t border-slate-700 pt-4">
                <div className="text-sm font-semibold text-slate-400 mb-3">SOURCES ({claim.sources.length})</div>
                <div className="space-y-2">
                  {claim.sources.map((source: any, idx: number) => (
                    <div key={idx} className="bg-slate-700/50 p-3 rounded-lg hover:bg-slate-700 transition-colors">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="font-medium text-slate-200 text-sm">{source.title}</div>
                          <div className="text-xs text-slate-500 mt-1">{source.publisher} • {source.date || "N/A"}</div>
                          {source.snippet && (
                            <p className="text-xs text-slate-400 mt-2 line-clamp-2">{source.snippet}</p>
                          )}
                        </div>
                        <a
                          href={source.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="ml-3 text-blue-400 hover:text-blue-300 text-xs font-medium"
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
    </div>
  );
}
