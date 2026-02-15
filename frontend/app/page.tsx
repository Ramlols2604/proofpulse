"use client";

import { useState } from "react";
import dynamic from "next/dynamic";

// Dynamically import components to avoid SSR issues
const InputForm = dynamic(() => import("@/components/InputForm"), { ssr: false });
const ResultsView = dynamic(() => import("@/components/ResultsView"), { ssr: false });
const Settings = dynamic(() => import("@/components/Settings"), { ssr: false });

export default function Home() {
  const [jobId, setJobId] = useState<string | null>(null);
  const [results, setResults] = useState<any | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12 relative">
          {/* Settings Button */}
          <button
            onClick={() => setSettingsOpen(true)}
            className="absolute top-0 right-0 bg-white text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-100 transition-colors shadow-md flex items-center gap-2"
          >
            <span>⚙️</span>
            <span>Settings</span>
          </button>

          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            ProofPulse
          </h1>
          <p className="text-xl text-gray-600">
            Real-Time AI Claim Verification
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Upload video, text, links, PDF, or TXT to verify factual claims
          </p>
        </div>

        {/* Input Form */}
        {!results && (
          <InputForm 
            onJobCreated={setJobId} 
            onResults={setResults}
          />
        )}

        {/* Results View */}
        {results && (
          <ResultsView 
            results={results} 
            onReset={() => {
              setResults(null);
              setJobId(null);
            }}
          />
        )}
      </div>

      {/* Settings Modal */}
      {settingsOpen && (
        <Settings 
          isOpen={settingsOpen} 
          onClose={() => setSettingsOpen(false)}
          onLoadDemo={setResults}
          onJobCreated={setJobId}
        />
      )}
    </main>
  );
}
