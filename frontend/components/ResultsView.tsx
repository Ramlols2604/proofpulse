"use client";

interface ResultsViewProps {
  results: any;
  onReset: () => void;
}

export default function ResultsView({ results, onReset }: ResultsViewProps) {
  const getVerdictColor = (verdict: string) => {
    const colors: Record<string, string> = {
      "SUPPORTED": "bg-green-100 text-green-800 border-green-300",
      "MOSTLY_SUPPORTED": "bg-green-50 text-green-700 border-green-200",
      "UNCLEAR": "bg-yellow-100 text-yellow-800 border-yellow-300",
      "MOSTLY_CONTRADICTED": "bg-orange-100 text-orange-800 border-orange-300",
      "CONTRADICTED": "bg-red-100 text-red-800 border-red-300",
    };
    return colors[verdict] || "bg-gray-100 text-gray-800 border-gray-300";
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-green-500";
    if (score >= 40) return "text-yellow-600";
    if (score >= 20) return "text-orange-600";
    return "text-red-600";
  };

  // Check if any claim used Backboard fallback
  const usedBackboardFallback = results.claims?.some((claim: any) => 
    claim.explanation?.includes("Backboard fallback") || 
    claim.explanation?.includes("Backboard scoring")
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-xl p-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Analysis Results</h2>
            <p className="text-sm text-gray-500 mt-1">
              Job ID: {results.job_id}
            </p>
            <p className="text-sm text-gray-500">
              Input Type: {results.input_type.toUpperCase()}
            </p>
            {/* Gemini Status Indicator */}
            {usedBackboardFallback && (
              <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-700 text-xs rounded-full border border-blue-200">
                <span>ℹ️</span>
                <span>Gemini unavailable • Using Backboard scoring</span>
              </div>
            )}
          </div>
          <button
            onClick={onReset}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
          >
            Analyze New Input
          </button>
        </div>
      </div>

      {/* Claims */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-gray-900">
          {results.claims.length} Claim{results.claims.length !== 1 ? "s" : ""} Analyzed
        </h3>

        {/* No Claims Message */}
        {results.claims.length === 0 && (
          <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-8 text-center">
            <div className="text-5xl mb-4">💬</div>
            <h4 className="text-xl font-semibold text-blue-900 mb-2">
              Statement Analyzed - No Verifiable Claims Detected
            </h4>
            <p className="text-blue-700 max-w-md mx-auto">
              The system analyzed your input but could not extract verifiable factual claims. 
              This is a statement, but not a claim that can be fact-checked because:
            </p>
            <ul className="text-sm text-blue-600 mt-3 space-y-1 max-w-md mx-auto text-left">
              <li>• The content is primarily opinion-based or subjective</li>
              <li>• The input contains only questions or hypotheticals</li>
              <li>• The text is too vague or lacks specific factual assertions</li>
            </ul>
            <p className="text-sm text-blue-800 mt-4 font-medium">
              💡 Tip: For fact-checking, provide statements with specific, verifiable facts like dates, numbers, events, or scientific assertions.
            </p>
          </div>
        )}

        {results.claims.map((claim: any, index: number) => (
          <div
            key={claim.claim_id}
            className="bg-white rounded-xl shadow-lg p-6 space-y-4"
          >
            {/* Claim Header */}
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-sm font-semibold text-gray-500">
                    CLAIM #{index + 1}
                  </span>
                  <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded">
                    {claim.claim_type}
                  </span>
                </div>
                <p className="text-lg font-medium text-gray-900">
                  {claim.claim_text}
                </p>
              </div>
            </div>

            {/* Verdict and Score */}
            <div className="flex gap-4">
              <div className={`flex-1 px-4 py-3 rounded-lg border-2 ${getVerdictColor(claim.final_verdict)}`}>
                <div className="text-xs font-semibold mb-1">VERDICT</div>
                <div className="text-lg font-bold">
                  {claim.final_verdict.replace("_", " ")}
                </div>
              </div>
              <div className="flex-1 px-4 py-3 rounded-lg border-2 border-gray-200 bg-gray-50">
                <div className="text-xs font-semibold text-gray-600 mb-1">
                  FACT SCORE
                </div>
                <div className={`text-3xl font-bold ${getScoreColor(claim.fact_score)}`}>
                  {claim.fact_score}
                  <span className="text-lg text-gray-500">/100</span>
                </div>
              </div>
            </div>

            {/* Explanation */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="text-xs font-semibold text-blue-900 mb-2">
                EXPLANATION
              </div>
              <p className="text-sm text-blue-800">{claim.explanation}</p>
            </div>

            {/* Score Breakdown */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="text-xs text-gray-600 font-medium">Evidence Strength</div>
                <div className="text-lg font-bold text-gray-900">
                  {claim.breakdown.evidence_strength}/30
                </div>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="text-xs text-gray-600 font-medium">Evidence Agreement</div>
                <div className="text-lg font-bold text-gray-900">
                  {claim.breakdown.evidence_agreement}/30
                </div>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="text-xs text-gray-600 font-medium">Context Accuracy</div>
                <div className="text-lg font-bold text-gray-900">
                  {claim.breakdown.context_accuracy}/20
                </div>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="text-xs text-gray-600 font-medium">Model Confidence</div>
                <div className="text-lg font-bold text-gray-900">
                  {claim.breakdown.model_confidence_points}/20
                </div>
              </div>
            </div>

            {/* Sources */}
            {claim.sources && claim.sources.length > 0 && (
              <div className="border-t pt-4">
                <div className="text-sm font-semibold text-gray-700 mb-3">
                  SOURCES ({claim.sources.length})
                </div>
                <div className="space-y-2">
                  {claim.sources.map((source: any, idx: number) => (
                    <div
                      key={idx}
                      className="bg-gray-50 p-3 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="font-medium text-gray-900 text-sm">
                            {source.title}
                          </div>
                          <div className="text-xs text-gray-600 mt-1">
                            {source.publisher} • {source.date || "N/A"}
                          </div>
                          <p className="text-xs text-gray-700 mt-2 line-clamp-2">
                            {source.snippet}
                          </p>
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
    </div>
  );
}
