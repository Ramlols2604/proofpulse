import React, { useState } from 'react';
import { LandingScreen } from './screens/LandingScreen';
import { ProcessingScreen2 } from './screens/ProcessingScreen2';
import { ResultsScreen } from './screens/ResultsScreen';
import { SettingsModal } from './components/ui/SettingsModal';
import type { InputType, VideoData } from './types';

type ViewState = 'landing' | 'processing' | 'results';

export default function App() {
  const [view, setView] = useState<ViewState>('landing');
  const [inputType, setInputType] = useState<InputType>('video');
  const [inputText, setInputText] = useState<string>('');
  const [inputUrl, setInputUrl] = useState<string>('');
  const [inputFile, setInputFile] = useState<File | undefined>(undefined);
  const [demoData, setDemoData] = useState<VideoData | undefined>(undefined);
  const [resultsData, setResultsData] = useState<VideoData | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const handleAnalyze = (
    type: InputType,
    text?: string,
    url?: string,
    file?: File,
    isDemoData?: VideoData
  ) => {
    setInputType(type);
    setInputText(text || '');
    setInputUrl(url || '');
    setInputFile(file);
    setDemoData(isDemoData);
    setView('processing');
  };

  const handleProcessingComplete = (data: VideoData) => {
    setResultsData(data);
    setView('results');
  };

  const handleProcessingError = (errorMessage: string) => {
    setView('landing');
    alert(`Processing failed: ${errorMessage}`);
  };

  const handleBack = () => {
    setView('landing');
    setResultsData(null);
    setInputText('');
    setInputUrl('');
    setInputFile(undefined);
    setDemoData(undefined);
  };

  return (
    <div className="font-sans antialiased min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-purple-950 text-gray-100">
      {view === 'landing' && (
        <>
          <div className="max-w-6xl mx-auto py-12 px-4 min-h-screen flex flex-col">
            <div className="text-center mb-10 relative flex-shrink-0">
              <button
                type="button"
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
            <LandingScreen onAnalyze={handleAnalyze} />
          </div>
        </>
      )}
      {view === 'processing' && (
        <ProcessingScreen2
          inputType={inputType}
          text={inputText}
          url={inputUrl}
          file={inputFile}
          demoData={demoData}
          onComplete={handleProcessingComplete}
          onError={handleProcessingError}
        />
      )}
      {view === 'results' && resultsData && (
        <div className="max-w-6xl mx-auto py-12 px-4">
          <ResultsScreen inputType={inputType} onBack={handleBack} data={resultsData} />
        </div>
      )}

      {settingsOpen && (
        <SettingsModal
          isOpen={settingsOpen}
          onClose={() => setSettingsOpen(false)}
          onLoadDemo={(data) => {
            setResultsData(data);
            setView('results');
            setSettingsOpen(false);
          }}
        />
      )}
    </div>
  );
}
