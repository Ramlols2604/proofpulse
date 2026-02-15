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

  // Helper to find matching claim for a segment
  const getClaimForSegment = (segment: TranscriptSegment) => {
    return claims.find(claim => 
      claim.timestamp >= segment.startTime && 
      (claim.endTime ? claim.endTime : claim.timestamp + 5) <= segment.endTime + 5 // Fuzzy match
    );
  };

  return (
    <div className="flex flex-col h-full bg-[#1E293B] rounded-xl border border-slate-700 overflow-hidden">
      <div className="p-4 border-b border-slate-700 bg-slate-800/50 flex justify-between items-center sticky top-0 z-10 backdrop-blur-sm">
        <h3 className="font-semibold text-slate-200">Transcript</h3>
        <span className="text-xs text-slate-400 font-mono">
           Auto-generated
        </span>
      </div>
      
      <div 
        ref={containerRef}
        className="flex-1 overflow-y-auto p-6 space-y-1 font-serif text-slate-300 leading-relaxed custom-scrollbar relative"
      >
        {transcript.map((segment) => {
          const isActiveTime = currentTime >= segment.startTime && currentTime < segment.endTime;
          const matchingClaim = claims.find(c => 
            // Check if claim overlaps with this segment
            (c.timestamp >= segment.startTime && c.timestamp < segment.endTime) ||
            (c.endTime && c.endTime > segment.startTime && c.endTime <= segment.endTime)
          );
          
          const isContradicted = matchingClaim?.verdict === 'contradicted';
          const isUnclear = matchingClaim?.verdict === 'unclear';
          const isActiveClaim = matchingClaim?.id === activeClaimId;

          let className = "inline px-1 py-0.5 rounded cursor-pointer transition-colors duration-200 ";
          
          if (isActiveTime) {
            className += "bg-blue-500/20 text-blue-200 ";
          } else if (isContradicted) {
             className += "bg-red-500/20 text-red-200 border-b-2 border-red-500/50 ";
          } else if (isUnclear) {
             className += "bg-amber-500/10 text-amber-200 border-b-2 border-amber-500/50 ";
          } else {
            className += "hover:bg-slate-700/50 ";
          }

          if (isActiveClaim) {
             className += "ring-2 ring-blue-500 ring-offset-2 ring-offset-slate-900 ";
          }

          return (
            <span
              key={segment.id}
              ref={isActiveClaim ? activeSegmentRef : null}
              className={className}
              onClick={() => onTimeSelect(segment.startTime)}
              title={matchingClaim ? `Claim: ${matchingClaim.verdict.toUpperCase()}` : undefined}
            >
              {segment.text}{" "}
            </span>
          );
        })}
      </div>
    </div>
  );
}
