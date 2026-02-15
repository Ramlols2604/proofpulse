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

  const verdictLabel: Record<Claim['verdict'], string> = {
    supported: 'Supported by evidence',
    contradicted: 'Contradicted by sources',
    unclear: 'Evidence unclear — need more sources',
  };

  return (
    <motion.div
      layout
      onClick={onClick}
      className={`
        cursor-pointer rounded-xl border transition-all duration-300
        bg-card overflow-hidden
        ${isActive ? 'border-primary shadow-lg shadow-primary/10' : 'border-border hover:border-muted-foreground/50'}
      `}
    >
      <div className="p-4 space-y-3">
        <div className="flex justify-between items-start gap-4">
          <h3 className="text-sm font-medium text-foreground line-clamp-2 leading-relaxed">
            "{claim.text}"
          </h3>
          <span className="shrink-0 text-xs font-mono text-muted-foreground bg-accent px-2 py-1 rounded">
            {formatTime(claim.timestamp)}
          </span>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold text-foreground uppercase tracking-wider">Verdict</span>
            <Badge variant={getVerdictVariant(claim.verdict)} className="text-xs font-semibold">
              {claim.verdict.charAt(0).toUpperCase() + claim.verdict.slice(1)}
            </Badge>
            <span className="text-xs text-muted-foreground font-medium">
              {claim.confidence}% confidence
            </span>
            {(claim.backboardVerdict != null || claim.backboardConfidence != null) && (
              <span className="text-xs text-muted-foreground">
                (Backboard: {claim.backboardVerdict ?? '—'}
                {claim.backboardConfidence != null ? ` ${claim.backboardConfidence}%` : ''})
              </span>
            )}
          </div>
          <p className="text-sm text-foreground/90 leading-snug">
            {verdictLabel[claim.verdict]}
          </p>
        </div>
        <div className="flex justify-end">
          {isActive ? <ChevronUp size={16} className="text-muted-foreground" /> : <ChevronDown size={16} className="text-muted-foreground" />}
        </div>
      </div>

      <AnimatePresence>
        {isActive && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-border bg-accent/30"
          >
            <div className="p-4 space-y-4">
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Research — Evidence summary</h4>
                <p className="text-sm text-foreground leading-relaxed">
                  {claim.evidence.summary}
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Sources</h4>
                <div className="grid gap-2">
                  {claim.evidence.sources.map((source, index) => (
                    <a
                      key={index}
                      href={source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-2 rounded-lg bg-background hover:bg-accent transition-colors group border border-border"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex flex-col min-w-0">
                        <span className="text-xs font-medium text-foreground truncate">{source.publisher}</span>
                        <span className="text-xs text-muted-foreground truncate">{source.title}</span>
                      </div>
                      <ExternalLink size={14} className="text-muted-foreground group-hover:text-primary shrink-0 ml-2" />
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
