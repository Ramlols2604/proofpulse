import React, { useEffect, useRef } from 'react';
import type { TranscriptSegment, Claim } from '../../types';

interface TranscriptViewerProps {
  transcript: TranscriptSegment[];
  claims: Claim[];
  currentTime: number;
  activeClaimId: string | null;
  onTimeSelect: (time: number) => void;
}

export function TranscriptViewer({ 
  transcript, 
  claims, 
  currentTime, 
  activeClaimId, 
  onTimeSelect 
}: TranscriptViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const activeSegmentRef = useRef<HTMLSpanElement>(null);

  // Scroll to active segment when activeClaimId changes
  useEffect(() => {
    if (activeClaimId && activeSegmentRef.current && containerRef.current) {
      const container = containerRef.current;
      const element = activeSegmentRef.current;
      
      const elementTop = element.offsetTop;
      const containerHeight = container.clientHeight;
      const scrollTop = elementTop - (containerHeight / 2); // Center it

      container.scrollTo({
        top: Math.max(0, scrollTop),
        behavior: 'smooth'
      });
    }
  }, [activeClaimId]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col h-full bg-card rounded-xl border border-border overflow-hidden">
      <div className="p-4 border-b border-border bg-accent/30 flex justify-between items-center sticky top-0 z-10 backdrop-blur-sm">
        <h3 className="font-semibold text-foreground">Transcript with timestamps</h3>
        <span className="text-xs text-muted-foreground font-mono">Click time to seek</span>
      </div>
      
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto p-4 space-y-2 text-foreground leading-relaxed custom-scrollbar"
      >
        {transcript.length === 0 ? (
          <p className="text-sm text-muted-foreground">No timestamped segments.</p>
        ) : (
          transcript.map((segment) => {
            const isActiveTime = currentTime >= segment.startTime && currentTime < segment.endTime;
            const matchingClaim = claims.find(c =>
              (c.timestamp >= segment.startTime && c.timestamp < segment.endTime) ||
              (c.endTime && c.endTime > segment.startTime && c.endTime <= segment.endTime)
            );
            const isContradicted = matchingClaim?.verdict === 'contradicted';
            const isUnclear = matchingClaim?.verdict === 'unclear';
            const isActiveClaim = matchingClaim?.id === activeClaimId;

            let blockClass = "flex gap-3 rounded-lg px-3 py-2 cursor-pointer transition-colors ";
            if (isActiveTime) blockClass += "bg-primary/20 text-foreground ";
            else if (isContradicted) blockClass += "bg-red-500/10 text-foreground border-l-2 border-red-500 ";
            else if (isUnclear) blockClass += "bg-amber-500/10 text-foreground border-l-2 border-amber-500 ";
            else blockClass += "hover:bg-accent/50 ";
            if (isActiveClaim) blockClass += "ring-2 ring-primary ring-offset-2 ring-offset-background ";

            const timeLabel = `${formatTime(segment.startTime)} – ${formatTime(segment.endTime)}`;
            return (
              <div
                key={segment.id}
                ref={isActiveClaim ? activeSegmentRef : null}
                className={blockClass}
                onClick={() => onTimeSelect(segment.startTime)}
                title={matchingClaim ? `Claim: ${matchingClaim.verdict}` : `Seek to ${timeLabel}`}
              >
                <span className="shrink-0 font-mono text-xs text-muted-foreground min-w-[64px]">
                  {timeLabel}
                </span>
                <span className="flex-1">{segment.text}</span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
