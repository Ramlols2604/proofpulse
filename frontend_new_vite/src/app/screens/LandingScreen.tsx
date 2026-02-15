import React, { useState } from 'react';
import { Upload, FileText, Link as LinkIcon, Video, FileUp } from 'lucide-react';
import { loadDemoData } from '../api';
import type { VideoData } from '../types';

type TabId = 'video' | 'document' | 'url' | 'text';

interface LandingScreenProps {
  onAnalyze: (type: 'video' | 'text' | 'url', text?: string, url?: string, file?: File, isDemoData?: VideoData) => void;
}

const tabs: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: 'video', label: 'Video Upload', icon: Video },
  { id: 'document', label: 'Document Upload', icon: FileUp },
  { id: 'url', label: 'URL', icon: LinkIcon },
  { id: 'text', label: 'Text', icon: FileText },
];

export function LandingScreen({ onAnalyze }: LandingScreenProps) {
  const [activeTab, setActiveTab] = useState<TabId>('video');
  const [content, setContent] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);

  const handleDemo = async () => {
    if (demoLoading) return;
    setDemoLoading(true);
    try {
      const demoData = await loadDemoData();
      onAnalyze('video', undefined, undefined, undefined, demoData);
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Failed to load demo');
    } finally {
      setDemoLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (activeTab === 'text' || activeTab === 'url') {
      if (!content.trim()) return;
      if (activeTab === 'text') onAnalyze('text', content.trim());
      else onAnalyze('url', undefined, content.trim());
    } else {
      if (!file) return;
      const type = activeTab === 'video' ? 'video' : 'text';
      onAnalyze(type, undefined, undefined, file);
    }
  };

  const canSubmit =
    (activeTab === 'text' || activeTab === 'url') ? content.trim().length > 0 : !!file;

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const handleDragLeave = () => setIsDragging(false);
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) setFile(f);
  };

  const fileAccept = activeTab === 'video' ? 'video/*' : '.pdf';
  const fileHint =
    activeTab === 'video' ? 'Video (MP4, MOV) supported' : 'PDF supported';

  return (
    <div className="flex-1 flex flex-col items-center justify-center w-full max-w-2xl mx-auto">
      {/* Card with dark gray bg and blue-purple glow */}
      <div className="w-full rounded-2xl bg-slate-800/90 border border-slate-700/80 shadow-2xl shadow-indigo-500/10 overflow-hidden">
        {/* Tabs */}
        <div className="flex border-b border-slate-700/80">
          {tabs.map(({ id, label, icon: Icon }) => {
            const isActive = activeTab === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setActiveTab(id)}
                className={`flex-1 flex items-center justify-center gap-2 py-4 text-sm font-medium transition-colors relative ${
                  isActive
                    ? 'text-blue-300 bg-slate-700/50'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/30'
                }`}
              >
                <Icon size={18} />
                {label}
                {isActive && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500" />
                )}
              </button>
            );
          })}
        </div>

        <form onSubmit={handleSubmit} className="p-8">
          {(activeTab === 'video' || activeTab === 'document') && (
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-xl flex flex-col items-center justify-center py-12 px-6 transition-all ${
                isDragging ? 'border-blue-500 bg-blue-500/10' : 'border-slate-600 hover:border-slate-500'
              }`}
            >
              <div className="rounded-full bg-slate-700/80 p-4 mb-4 text-slate-400">
                <Upload size={32} />
              </div>
              <p className="text-slate-300 font-medium mb-1">Drag and drop file</p>
              <p className="text-sm text-slate-500">{fileHint}</p>
              <input
                type="file"
                accept={fileAccept}
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="hidden"
                id="file-upload"
                required={activeTab === 'video' || activeTab === 'document'}
              />
              <label
                htmlFor="file-upload"
                className="mt-4 cursor-pointer text-sm text-blue-400 hover:text-blue-300 font-medium"
              >
                {file ? file.name : 'Or click to browse'}
              </label>
            </div>
          )}

          {(activeTab === 'url' || activeTab === 'text') && (
            <div className="space-y-4">
              <label className="block text-sm font-medium text-slate-400">
                {activeTab === 'url' ? 'Enter URL' : 'Paste text content'}
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={activeTab === 'url' ? 'https://...' : 'Paste the text you want to verify...'}
                className="w-full h-32 px-4 py-3 rounded-lg bg-slate-900/80 border border-slate-600 text-slate-200 placeholder-slate-500 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 resize-none"
                required={activeTab === 'url' || activeTab === 'text'}
              />
            </div>
          )}

          <div className="flex gap-3 mt-6">
            <button
              type="submit"
              disabled={!canSubmit}
              className="flex-1 bg-slate-800 border border-slate-500 text-white py-3 px-6 rounded-lg font-semibold hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Analyze File
            </button>
            <button
              type="button"
              onClick={handleDemo}
              disabled={demoLoading}
              className="flex-1 bg-slate-700/50 border border-slate-600 text-slate-200 py-3 px-6 rounded-lg font-semibold hover:bg-slate-600/50 disabled:opacity-50 transition-colors"
            >
              {demoLoading ? 'Loading...' : 'Try Demo Clip'}
            </button>
          </div>
        </form>
      </div>

      <p className="mt-8 text-sm text-slate-500 text-center">
        Powered by TwelveLabs • Backboard • Valkey
      </p>
    </div>
  );
}
