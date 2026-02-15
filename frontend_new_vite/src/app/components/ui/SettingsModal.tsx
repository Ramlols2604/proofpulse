import React, { useState, useEffect } from 'react';
import { loadDemoData } from '../../api';
import type { VideoData } from '../../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoadDemo?: (results: VideoData) => void;
}

export function SettingsModal({ isOpen, onClose, onLoadDemo }: SettingsModalProps) {
  const [demoMode, setDemoMode] = useState<'cached' | 'live'>('cached');
  const [demoLoading, setDemoLoading] = useState(false);
  const [demoStatus, setDemoStatus] = useState('');

  useEffect(() => {
    if (isOpen) setDemoStatus('');
  }, [isOpen]);

  const handleLoadDemo = async () => {
    if (!onLoadDemo) return;
    setDemoLoading(true);
    setDemoStatus('Loading demo...');
    try {
      const data = await loadDemoData();
      onLoadDemo(data);
      onClose();
    } catch (err) {
      setDemoStatus(`Error: ${err instanceof Error ? err.message : 'Failed'}`);
    } finally {
      setDemoLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={onClose} aria-hidden />
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Settings</h2>
            <button
              type="button"
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl"
            >
              ×
            </button>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block font-medium text-gray-900 mb-2">Demo Mode</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setDemoMode('cached')}
                  className={`px-4 py-3 rounded-lg font-medium transition-colors ${
                    demoMode === 'cached'
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <div className="text-sm">⚡ Cached</div>
                  <div className="text-xs opacity-80">Instant</div>
                </button>
                <button
                  type="button"
                  onClick={() => setDemoMode('live')}
                  className={`px-4 py-3 rounded-lg font-medium transition-colors ${
                    demoMode === 'live'
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <div className="text-sm">🔴 Live</div>
                  <div className="text-xs opacity-80">Real APIs</div>
                </button>
              </div>
              <p className="mt-2 text-xs text-gray-500">
                {demoMode === 'cached'
                  ? 'Demo loads instantly from cache'
                  : 'Demo runs through full pipeline'}
              </p>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={handleLoadDemo}
              disabled={demoLoading || !onLoadDemo}
              className={`w-full py-3 px-6 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2 ${
                demoMode === 'cached'
                  ? 'bg-purple-600 hover:bg-purple-700 text-white'
                  : 'bg-green-600 hover:bg-green-700 text-white'
              } disabled:bg-gray-400 disabled:cursor-not-allowed`}
            >
              <span>{demoMode === 'cached' ? '⚡' : '🔴'}</span>
              <span>{demoLoading ? 'Loading...' : demoMode === 'cached' ? 'Load Demo (Instant)' : 'Run Live Demo'}</span>
            </button>
            {demoStatus && <div className="mt-2 text-sm text-center text-gray-600">{demoStatus}</div>}
          </div>

          <div className="mt-6 flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 rounded-lg font-semibold bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
