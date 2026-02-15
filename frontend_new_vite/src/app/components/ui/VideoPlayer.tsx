import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize } from 'lucide-react';

export interface Marker {
  id: string;
  time: number; // start time in seconds
  endTime?: number; // end time in seconds
  type: 'supported' | 'contradicted' | 'unclear';
  claim: string;
}

interface VideoPlayerProps {
  src?: string;
  markers: Marker[];
  seekTo?: number | null;
  onTimeUpdate?: (time: number) => void;
  onMarkerClick?: (markerId: string) => void;
}

export function VideoPlayer({ src, markers, seekTo, onTimeUpdate, onMarkerClick }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  // Handle external seek
  useEffect(() => {
    if (seekTo !== undefined && seekTo !== null && videoRef.current) {
        if (Math.abs(videoRef.current.currentTime - seekTo) > 0.5) {
            videoRef.current.currentTime = seekTo;
        }
    }
  }, [seekTo]);
  const [isMuted, setIsMuted] = useState(false);
  const [hoveredMarker, setHoveredMarker] = useState<Marker | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      const current = video.currentTime;
      setCurrentTime(current);
      if (onTimeUpdate) onTimeUpdate(current);
    };

    const handleLoadedMetadata = () => {
      setDuration(video.duration);
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
    };
  }, [onTimeUpdate]);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) videoRef.current.pause();
      else videoRef.current.play();
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!videoRef.current || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    const newTime = percentage * duration;
    videoRef.current.currentTime = newTime;
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getMarkerColor = (type: Marker['type']) => {
    switch (type) {
      case 'supported': return 'bg-green-500 border-green-400';
      case 'contradicted': return 'bg-red-500 border-red-400';
      case 'unclear': return 'bg-amber-500 border-amber-400';
      default: return 'bg-slate-500 border-slate-400';
    }
  };

  const getSegmentColor = (type: Marker['type']) => {
    switch (type) {
      case 'supported': return 'bg-green-500/50 hover:bg-green-500/70';
      case 'contradicted': return 'bg-red-500/50 hover:bg-red-500/70';
      case 'unclear': return 'bg-amber-500/50 hover:bg-amber-500/70';
      default: return 'bg-slate-500/50 hover:bg-slate-500/70';
    }
  };

  return (
    <div className="group bg-slate-900 rounded-lg overflow-hidden border border-slate-700 shadow-xl flex flex-col">
      <div className="relative aspect-video bg-black">
        <video
          ref={videoRef}
          className="w-full h-full object-contain"
          src={src}
          onClick={togglePlay}
          poster="https://images.unsplash.com/photo-1576267423048-15c0040fec78?q=80&w=2070&auto=format&fit=crop"
        />
        
        {/* Play/Pause Overlay */}
        {!isPlaying && (
          <div 
            className="absolute inset-0 flex items-center justify-center bg-black/30 cursor-pointer"
            onClick={togglePlay}
          >
            <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-white/30 transition-colors">
              <Play size={32} className="text-white ml-1" />
            </div>
          </div>
        )}
      </div>
      
      {/* Controls Bar */}
      <div className="p-4 bg-slate-800 border-t border-slate-700 space-y-3">
        
        {/* Timeline Track */}
        <div 
          className="relative w-full h-8 bg-slate-700/50 rounded cursor-pointer group/timeline overflow-hidden"
          onClick={handleTimelineClick}
        >
          {/* Progress Fill */}
          <div 
            className="absolute top-0 left-0 h-full bg-slate-600/30 pointer-events-none" 
            style={{ width: `${(currentTime / (duration || 1)) * 100}%` }}
          />
          
          {/* Current Time Indicator Line */}
          <div 
            className="absolute top-0 bottom-0 w-0.5 bg-white z-20 pointer-events-none"
            style={{ left: `${(currentTime / (duration || 1)) * 100}%` }}
          />

          {/* Markers & Segments */}
          {markers.map((marker) => {
             const startPercent = (marker.time / (duration || 1)) * 100;
             const endPercent = marker.endTime 
               ? (marker.endTime / (duration || 1)) * 100 
               : startPercent + 1; // Minimum width for points
             const widthPercent = Math.max(endPercent - startPercent, 1);

             return (
              <div
                key={marker.id}
                className={`absolute top-1 bottom-1 rounded-sm cursor-pointer transition-colors z-10 ${
                  marker.endTime ? getSegmentColor(marker.type) : getMarkerColor(marker.type).replace('bg-', 'bg-')
                } ${!marker.endTime ? 'w-1 h-4 top-2 rounded-full transform -translate-x-1/2' : ''}`}
                style={{ 
                  left: `${startPercent}%`,
                  width: marker.endTime ? `${widthPercent}%` : undefined
                }}
                onMouseEnter={() => setHoveredMarker(marker)}
                onMouseLeave={() => setHoveredMarker(null)}
                onClick={(e) => {
                  e.stopPropagation();
                  if (videoRef.current) {
                      videoRef.current.currentTime = marker.time;
                  }
                  if (onMarkerClick) onMarkerClick(marker.id);
                }}
              />
            );
          })}
        </div>
        
        {/* Tooltip */}
        {hoveredMarker && (
          <div className="text-xs text-slate-300 bg-slate-900/90 px-3 py-1.5 rounded border border-slate-700 absolute -mt-16 z-30 pointer-events-none whitespace-nowrap shadow-lg backdrop-blur-sm left-1/2 transform -translate-x-1/2">
            <span className={
              hoveredMarker.type === 'contradicted' ? 'text-red-400 font-bold' : 
              hoveredMarker.type === 'supported' ? 'text-green-400 font-bold' : 'text-amber-400 font-bold'
            }>
              {hoveredMarker.type.toUpperCase()}: 
            </span> {hoveredMarker.claim}
          </div>
        )}

        {/* Playback Controls */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-4">
            <button onClick={togglePlay} className="text-slate-300 hover:text-white transition-colors">
              {isPlaying ? <Pause size={20} /> : <Play size={20} />}
            </button>
            <div className="flex items-center gap-2 group/volume">
              <button onClick={toggleMute} className="text-slate-300 hover:text-white transition-colors">
                {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
              </button>
            </div>
            <span className="text-slate-400 font-mono text-xs">
              {formatTime(currentTime)} / {formatTime(duration || 0)}
            </span>
          </div>
          <button className="text-slate-300 hover:text-white transition-colors">
            <Maximize size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}
