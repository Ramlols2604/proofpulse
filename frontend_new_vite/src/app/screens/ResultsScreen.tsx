import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Share2, CheckCircle, AlertTriangle, XCircle, Info, AlertOctagon, BrainCircuit } from 'lucide-react';
import { VideoPlayer } from '../components/ui/VideoPlayer';
import { ClaimCard } from '../components/ui/ClaimCard';
import { Button } from '../components/ui/Button';
import { TranscriptViewer } from '../components/ui/TranscriptViewer';
import type { Claim, VideoData, InputType, TranscriptSegment } from '../types';

interface ResultsScreenProps {
  onBack: () => void;
  inputType: InputType;
  data: VideoData;
}

const mockTranscript: TranscriptSegment[] = [
  { id: '1', text: "Welcome to our detailed look at the future of energy production.", startTime: 0, endTime: 5 },
  { id: '2', text: "Today we'll explore some of the most exciting advancements in renewable energy sectors.", startTime: 5, endTime: 12 },
  { id: '3', text: "Specifically, let's talk about solar power.", startTime: 12, endTime: 15 },
  { id: '4', text: "Solar panel efficiency has doubled every year since 2010.", startTime: 45, endTime: 55 },
  { id: '5', text: "This rapid increase means that solar is becoming incredibly cheap.", startTime: 55, endTime: 60 },
  { id: '6', text: "Moving on to wind energy, the landscape is changing fast.", startTime: 110, endTime: 118 },
  { id: '7', text: "Wind energy is now the cheapest source of new electricity generation in most countries.", startTime: 120, endTime: 135 },
  { id: '8', text: "Surpassing even natural gas and coal in terms of cost effectiveness.", startTime: 135, endTime: 140 },
  { id: '9', text: "Finally, let's look at the holy grail: Fusion.", startTime: 170, endTime: 175 },
  { id: '10', text: "Nuclear fusion will be commercially viable by 2025.", startTime: 180, endTime: 190 },
  { id: '11', text: "Solving the world's energy crisis once and for all.", startTime: 190, endTime: 195 },
  { id: '12', text: "Some people even claim the earth is flat and stationary.", startTime: 210, endTime: 220 },
  { id: '13', text: "But obviously we know that isn't true based on centuries of science.", startTime: 220, endTime: 230 },
];

const mockData: VideoData = {
  title: "Example: The Future of Renewable Energy",
  credibilityScore: 82,
  aiScore: 12, // 12% AI generated content
  transcript: mockTranscript,
  claims: [
    {
      id: "1",
      text: "Solar panel efficiency has doubled every year since 2010.",
      timestamp: 45,
      endTime: 55,
      verdict: "contradicted",
      confidence: 95,
      evidence: {
        summary: "Solar panel efficiency has improved significantly, but not doubled annually. The average efficiency has increased from ~15% to ~22% over the decade.",
        sources: [
          { publisher: "Energy.gov", title: "Solar Photovoltaic Technology Basics", url: "#" },
          { publisher: "NREL", title: "Best Research-Cell Efficiency Chart", url: "#" }
        ]
      }
    },
    {
      id: "2",
      text: "Wind energy is now the cheapest source of new electricity generation in most countries.",
      timestamp: 120,
      endTime: 135,
      verdict: "supported",
      confidence: 88,
      evidence: {
        summary: "Multiple reports confirm that onshore wind and solar PV are the cheapest sources of new bulk electricity generation in countries representing two-thirds of the world population.",
        sources: [
          { publisher: "BloombergNEF", title: "Levelized Cost of Electricity 2023", url: "#" },
          { publisher: "IEA", title: "Renewables 2023 Analysis", url: "#" }
        ]
      }
    },
    {
      id: "3",
      text: "Nuclear fusion will be commercially viable by 2025.",
      timestamp: 180,
      endTime: 190,
      verdict: "unclear",
      confidence: 60,
      evidence: {
        summary: "Most experts suggest commercial fusion power is likely decades away (2040s or later), making a 2025 target highly improbable.",
        sources: [
          { publisher: "Nature", title: "Nuclear fusion timeline", url: "#" },
          { publisher: "ITER", title: "Project Milestones", url: "#" }
        ]
      }
    },
    {
        id: "4",
        text: "The earth is flat and stationary.",
        timestamp: 210,
        endTime: 220,
        verdict: "contradicted",
        confidence: 99,
        evidence: {
            summary: "Overwhelming scientific evidence confirms the Earth is an oblate spheroid rotating on its axis.",
            sources: [
                { publisher: "NASA", title: "Earth", url: "#" }
            ]
        }
    }
  ]
};

export function ResultsScreen({ onBack, inputType, data: mockData }: ResultsScreenProps) {
  console.log('[ResultsScreen] Received data:', mockData);
  console.log('[ResultsScreen] Claims:', mockData.claims);
  console.log('[ResultsScreen] Claims count:', mockData.claims?.length || 0);
  
  const [activeClaimId, setActiveClaimId] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [seekTime, setSeekTime] = useState<number | null>(null);

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-500";
    if (score >= 50) return "text-amber-500";
    return "text-red-500";
  };

  const getAiScoreColor = (score: number) => {
    if (score < 20) return "text-green-500";
    if (score < 50) return "text-amber-500";
    return "text-red-500";
  };

  const markers = mockData.claims.map(c => ({
    id: c.id,
    time: c.timestamp,
    endTime: c.endTime,
    type: c.verdict,
    claim: c.text
  }));

  const contradictedClaims = mockData.claims.filter(c => c.verdict === 'contradicted');
  
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleTimeSelect = (time: number) => {
    setSeekTime(time);
    // Find if this time corresponds to a claim
    const claim = mockData.claims.find(c => 
      (c.timestamp <= time && (c.endTime || c.timestamp + 5) >= time)
    );
    if (claim) setActiveClaimId(claim.id);
  };

  return (
    <div className="flex flex-col h-screen bg-[#0F172A] text-slate-50 overflow-hidden">
      
      {/* Header */}
      <header className="flex-none h-16 border-b border-slate-800 bg-[#0F172A]/95 backdrop-blur z-10 flex items-center justify-between px-6">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 hover:bg-slate-800 rounded-full transition-colors text-slate-400 hover:text-white">
            <ArrowLeft size={20} />
          </button>
          <div className="h-6 w-px bg-slate-800" />
          <h1 className="text-lg font-semibold truncate max-w-md" title={mockData.title}>
            {mockData.title}
          </h1>
        </div>
        
        <div className="flex items-center gap-6">
          <div className="flex flex-col items-end">
             <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold flex items-center gap-1">
               <BrainCircuit size={12} /> AI Content
             </span>
             <div className={`text-xl font-bold font-mono ${getAiScoreColor(mockData.aiScore)}`}>
               {mockData.aiScore}%
             </div>
          </div>
          <div className="h-8 w-px bg-slate-800" />
          <div className="flex flex-col items-end">
            <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Credibility</span>
            <div className={`text-2xl font-bold font-mono ${getScoreColor(mockData.credibilityScore)}`}>
              {mockData.credibilityScore}/100
            </div>
          </div>
          <div className="h-8 w-px bg-slate-800" />
          <Button variant="secondary" className="gap-2">
            <Share2 size={16} />
            Share Report
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Left Panel: Content & Transcript */}
        <div className="w-[65%] flex flex-col overflow-hidden border-r border-slate-800">
            {/* Top: Video Player */}
            <div className="flex-none p-6 pb-0">
               {inputType === 'video' ? (
                <VideoPlayer 
                  src="https://media.w3.org/2010/05/sintel/trailer_hd.mp4" 
                  markers={markers}
                  seekTo={seekTime}
                  onMarkerClick={(id) => {
                      setActiveClaimId(id);
                      const claim = mockData.claims.find(c => c.id === id);
                      if (claim) setSeekTime(claim.timestamp);
                  }}
                  onTimeUpdate={setCurrentTime}
                />
              ) : (
                 <div className="bg-[#1E293B] rounded-xl p-8 border border-slate-700 min-h-[200px] flex items-center justify-center text-slate-500">
                    <p>No video source available for text input</p>
                 </div>
              )}
            </div>

            {/* Middle: Flagged Inaccuracies List */}
            <div className="flex-none px-6 py-4">
              {contradictedClaims.length > 0 && (
                <div className="bg-red-900/10 border border-red-500/20 rounded-xl overflow-hidden shadow-sm">
                  <div className="bg-red-500/10 px-4 py-2 border-b border-red-500/20 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <AlertOctagon className="text-red-500" size={16} />
                      <h3 className="text-red-200 font-semibold text-sm">Flagged Inaccuracies ({contradictedClaims.length})</h3>
                    </div>
                  </div>
                  <div className="max-h-[120px] overflow-y-auto divide-y divide-red-500/10 custom-scrollbar">
                    {contradictedClaims.map(claim => (
                      <button 
                        key={claim.id}
                        className={`w-full text-left p-3 hover:bg-red-500/5 transition-colors flex gap-3 text-sm items-center ${activeClaimId === claim.id ? 'bg-red-500/10' : ''}`}
                        onClick={() => {
                            setActiveClaimId(claim.id);
                            setSeekTime(claim.timestamp);
                        }}
                      >
                        <span className="font-mono text-xs text-red-400 bg-red-950/50 px-1.5 py-0.5 rounded border border-red-500/20 min-w-[48px] text-center">
                          {formatTime(claim.timestamp)}
                        </span>
                        <span className="text-slate-300 truncate flex-1">{claim.text}</span>
                        <Info size={14} className="text-slate-500" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Bottom: Transcript Viewer */}
            <div className="flex-1 px-6 pb-6 overflow-hidden">
               <TranscriptViewer 
                 transcript={mockData.transcript}
                 claims={mockData.claims}
                 currentTime={currentTime}
                 activeClaimId={activeClaimId}
                 onTimeSelect={(time) => {
                     setSeekTime(time);
                 }}
               />
            </div>
        </div>

        {/* Right Panel: Claims */}
        <div className="w-[35%] bg-[#0F172A] flex flex-col border-l border-slate-800 shadow-2xl z-10">
          <div className="p-4 border-b border-slate-800 bg-[#0F172A] flex justify-between items-center">
            <h2 className="font-semibold text-slate-200">Detected Claims ({mockData.claims.length})</h2>
            <div className="text-xs text-slate-500">
                Auto-scrolling enabled
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
            {mockData.claims.map((claim) => (
              <ClaimCard
                key={claim.id}
                claim={claim}
                isActive={activeClaimId === claim.id}
                onClick={() => {
                    setActiveClaimId(activeClaimId === claim.id ? null : claim.id);
                    if (activeClaimId !== claim.id) {
                        setSeekTime(claim.timestamp);
                    }
                }}
              />
            ))}
            
            <div className="p-8 text-center text-slate-500 text-sm">
              <p>End of claims list</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
