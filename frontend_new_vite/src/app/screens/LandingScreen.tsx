import React, { useState } from 'react';
import { Upload, FileVideo, FileText, Link as LinkIcon, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from '../components/ui/Button';
import { loadDemoData } from '../api';
import type { VideoData } from '../types';

interface LandingScreenProps {
  onAnalyze: (type: 'video' | 'text' | 'url', text?: string, url?: string, file?: File, isDemoData?: VideoData) => void;
}

type InputType = 'upload' | 'url' | 'text';

export function LandingScreen({ onAnalyze }: LandingScreenProps) {
  const [inputType, setInputType] = useState<InputType>('upload');
  const [isDragging, setIsDragging] = useState(false);
  const [url, setUrl] = useState('');
  const [text, setText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (isProcessing) return;
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      setIsProcessing(true);
      onAnalyze('video', undefined, undefined, files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isProcessing) return;
    const files = e.target.files;
    if (files && files.length > 0) {
      setIsProcessing(true);
      onAnalyze('video', undefined, undefined, files[0]);
    }
  };

  const handleDemoClick = async () => {
    if (isProcessing) return;
    setIsProcessing(true);
    try {
      const demoData = await loadDemoData();
      onAnalyze('video', undefined, undefined, undefined, demoData);
    } catch (error) {
      alert('Failed to load demo data');
      setIsProcessing(false);
    }
  };

  const handleTextAnalyze = () => {
    if (isProcessing || !text) return;
    setIsProcessing(true);
    onAnalyze('text', text);
  };

  const handleUrlAnalyze = () => {
    if (isProcessing || !url) return;
    setIsProcessing(true);
    onAnalyze('url', undefined, url);
  };

  const tabs = [
    { id: 'upload', label: 'Upload File', icon: Upload },
    { id: 'url', label: 'URL', icon: LinkIcon },
    { id: 'text', label: 'Text', icon: FileText },
  ] as const;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#0F172A] text-slate-50 px-4 relative overflow-hidden">
      
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute top-[20%] -right-[10%] w-[40%] h-[40%] bg-indigo-500/10 rounded-full blur-3xl" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="z-10 w-full max-w-4xl flex flex-col items-center text-center space-y-8"
      >
        <div className="space-y-2">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-400">
            ProofPulse
          </h1>
          <p className="text-xl text-slate-400">Real-Time Claim Verifier</p>
        </div>

        <div className="w-full max-w-[600px] bg-[#1E293B]/50 backdrop-blur-sm rounded-2xl overflow-hidden border border-slate-700 shadow-xl">
          {/* Tabs */}
          <div className="flex border-b border-slate-700">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = inputType === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setInputType(tab.id)}
                  className={`flex-1 flex items-center justify-center gap-2 py-4 text-sm font-medium transition-colors relative
                    ${isActive ? 'text-blue-400 bg-slate-800/50' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/30'}
                  `}
                >
                  <Icon size={18} />
                  {tab.label}
                  {isActive && (
                    <motion.div 
                      layoutId="activeTab"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500"
                    />
                  )}
                </button>
              );
            })}
          </div>

          {/* Content Area */}
          <div className="p-8 min-h-[300px] flex items-center justify-center">
            <AnimatePresence mode="wait">
              {inputType === 'upload' && (
                <motion.div 
                  key="upload"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className={`w-full h-full border-2 border-dashed rounded-xl flex flex-col items-center justify-center p-8 transition-all duration-300
                    ${isDragging ? 'border-blue-500 bg-blue-500/5' : 'border-slate-700 hover:border-slate-600'}
                  `}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  <div className={`p-4 rounded-full bg-slate-800 mb-4 ${isDragging ? 'text-blue-400' : 'text-slate-400'}`}>
                    <Upload size={32} />
                  </div>
                  <div className="space-y-1 text-center mb-6">
                    <p className="text-lg font-medium">Drag and drop file</p>
                    <p className="text-sm text-slate-500">Video (MP4, MOV), PDF, TXT supported</p>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <label className="inline-flex items-center justify-center rounded-lg px-6 py-3 font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 bg-[#2563EB] text-white hover:bg-[#1d4ed8] focus:ring-[#2563EB] cursor-pointer">
                      <input
                        type="file"
                        accept="video/*,.pdf,.txt"
                        onChange={handleFileSelect}
                        className="hidden"
                      />
                      Analyze File
                    </label>
                    <Button variant="secondary" onClick={handleDemoClick} disabled={isProcessing}>
                      {isProcessing ? 'Loading...' : 'Try Demo Clip'}
                    </Button>
                  </div>
                </motion.div>
              )}

              {inputType === 'url' && (
                <motion.div 
                  key="url"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="w-full flex flex-col gap-6"
                >
                  <div className="space-y-2 text-left">
                    <label className="text-sm font-medium text-slate-300">Enter Content URL</label>
                    <input 
                      type="url"
                      placeholder="https://youtube.com/... or https://article..."
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-slate-200 placeholder:text-slate-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                    />
                    <p className="text-xs text-slate-500 flex items-center gap-1">
                      <AlertCircle size={12} />
                      Supports YouTube, Vimeo, and major news sites
                    </p>
                  </div>
                  <Button onClick={handleUrlAnalyze} disabled={!url || isProcessing} fullWidth>
                    {isProcessing ? 'Processing...' : 'Analyze URL'}
                  </Button>
                </motion.div>
              )}

              {inputType === 'text' && (
                <motion.div 
                  key="text"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="w-full flex flex-col gap-6"
                >
                  <div className="space-y-2 text-left h-full">
                    <label className="text-sm font-medium text-slate-300">Paste Text Content</label>
                    <textarea 
                      placeholder="Paste the text you want to verify here..."
                      className="w-full h-40 bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-slate-200 placeholder:text-slate-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all resize-none"
                      value={text}
                      onChange={(e) => setText(e.target.value)}
                    />
                  </div>
                  <Button onClick={handleTextAnalyze} disabled={!text || isProcessing} fullWidth>
                    {isProcessing ? 'Processing...' : 'Analyze Text'}
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="flex items-center space-x-2 text-xs text-slate-500 mt-8">
          <span>Powered by TwelveLabs</span>
          <span>·</span>
          <span>Backboard</span>
          <span>·</span>
          <span>Valkey</span>
        </div>
      </motion.div>
    </div>
  );
}
