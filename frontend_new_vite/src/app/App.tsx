import React, { useState } from 'react';
import { LandingScreen } from './screens/LandingScreen';
import { ProcessingScreen2 } from './screens/ProcessingScreen2';
import { ResultsScreen } from './screens/ResultsScreen';
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

  const handleAnalyze = (
    type: InputType, 
    text?: string, 
    url?: string, 
    file?: File, 
    isDemoData?: VideoData
  ) => {
    console.log('handleAnalyze called:', { type, text, url, file, isDemoData });
    setInputType(type);
    setInputText(text || '');
    setInputUrl(url || '');
    setInputFile(file);
    setDemoData(isDemoData);
    setView('processing');
  };

  const handleProcessingComplete = (data: VideoData) => {
    console.log('[App] Processing complete:', data);
    console.log('[App] Claims count:', data.claims?.length || 0);
    console.log('[App] Credibility score:', data.credibilityScore);
    console.log('[App] Full data:', JSON.stringify(data, null, 2));
    setResultsData(data);
    setView('results');
  };

  const handleProcessingError = (errorMessage: string) => {
    console.error('Processing error:', errorMessage);
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
    <div className="font-sans antialiased text-slate-900 bg-[#0F172A] min-h-screen">
      <style>{`
        ::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        ::-webkit-scrollbar-track {
          background: #0F172A; 
        }
        ::-webkit-scrollbar-thumb {
          background: #334155; 
          border-radius: 4px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: #475569; 
        }
      `}</style>
      
      {view === 'landing' && <LandingScreen onAnalyze={handleAnalyze} />}
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
        <ResultsScreen 
          inputType={inputType} 
          onBack={handleBack}
          data={resultsData}
        />
      )}
    </div>
  );
}
