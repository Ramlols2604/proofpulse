import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ExternalLink, ChevronDown, ChevronUp } from 'lucide-react';
import { Badge } from './Badge';
import type { Claim } from '../../types';

interface ClaimCardProps {
  claim: Claim;
  isActive: boolean;
  onClick: () => void;
}

export function ClaimCard({ claim, isActive, onClick }: ClaimCardProps) {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getVerdictVariant = (verdict: Claim['verdict']) => {
    switch (verdict) {
      case 'supported': return 'success';
      case 'contradicted': return 'danger';
      case 'unclear': return 'warning';
      default: return 'neutral';
    }
  };

  return (
    <motion.div
      layout
      onClick={onClick}
      className={`
        cursor-pointer rounded-xl border transition-all duration-300
        bg-[#1E293B] overflow-hidden
        ${isActive ? 'border-blue-500 shadow-lg shadow-blue-500/10' : 'border-slate-700 hover:border-slate-600'}
      `}
    >
      <div className="p-4 space-y-3">
        <div className="flex justify-between items-start gap-4">
          <h3 className="text-sm font-medium text-slate-200 line-clamp-2 leading-relaxed">
            "{claim.text}"
          </h3>
          <span className="shrink-0 text-xs font-mono text-slate-500 bg-slate-800 px-2 py-1 rounded">
            {formatTime(claim.timestamp)}
          </span>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge variant={getVerdictVariant(claim.verdict)}>
              {claim.verdict.charAt(0).toUpperCase() + claim.verdict.slice(1)}
            </Badge>
            <span className="text-xs text-slate-500 font-medium">
              {claim.confidence}% confidence
            </span>
          </div>
          {isActive ? <ChevronUp size={16} className="text-slate-500" /> : <ChevronDown size={16} className="text-slate-500" />}
        </div>
      </div>

      <AnimatePresence>
        {isActive && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-slate-700/50 bg-slate-800/50"
          >
            <div className="p-4 space-y-4">
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Evidence Summary</h4>
                <p className="text-sm text-slate-300 leading-relaxed">
                  {claim.evidence.summary}
                </p>
              </div>
              
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Sources</h4>
                <div className="grid gap-2">
                  {claim.evidence.sources.map((source, index) => (
                    <a 
                      key={index}
                      href={source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-2 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors group border border-slate-700 hover:border-slate-600"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex flex-col min-w-0">
                        <span className="text-xs font-medium text-slate-200 truncate">{source.publisher}</span>
                        <span className="text-xs text-slate-500 truncate">{source.title}</span>
                      </div>
                      <ExternalLink size={14} className="text-slate-500 group-hover:text-blue-400 shrink-0 ml-2" />
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
