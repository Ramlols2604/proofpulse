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
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-purple-950 text-gray-100 py-12 px-4">
      <div className="max-w-6xl mx-auto min-h-screen flex flex-col">
        {/* Header */}
        <div className="text-center mb-10 relative flex-shrink-0">
          <button
            onClick={() => setSettingsOpen(true)}
            className="absolute top-0 right-0 bg-slate-800/80 text-slate-300 px-4 py-2 rounded-lg font-medium hover:bg-slate-700 hover:text-white transition-colors border border-slate-600/50 flex items-center gap-2"
          >
            <span>⚙️</span>
            <span>Settings</span>
          </button>
          <h1 className="text-5xl font-bold mb-2 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            ProofPulse
          </h1>
          <p className="text-xl text-slate-400">Real-Time Claim Verifier</p>
        </div>

        {/* Input Form */}
        {!results && (
          <div className="flex-1 flex flex-col items-center justify-center">
            <InputForm
              onJobCreated={setJobId}
              onResults={setResults}
            />
          </div>
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
