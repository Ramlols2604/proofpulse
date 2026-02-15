import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Spinner } from '../components/ui/Spinner';
import type { InputType, VideoData } from '../types';
import { submitTextForAnalysis, submitUrlForAnalysis, submitFileForAnalysis, pollForResult } from '../api';

interface ProcessingScreenProps {
  onComplete: (data: VideoData) => void;
  onError: (error: string) => void;
  inputType: InputType;
  preloadedData?: VideoData | null;
}

export function ProcessingScreen({ onComplete, onError, inputType, preloadedData }: ProcessingScreenProps) {
  const getSteps = () => {
    switch (inputType) {
      case 'text':
        return [
          "Parsing text content...",
          "Extracting claims...",
          "Retrieving evidence...",
          "Scoring claims...",
          "Generating report..."
        ];
      case 'url':
        return [
          "Fetching content...",
          "Extracting claims...",
          "Verifying statements...",
          "Finalizing analysis..."
        ];
      default: // video
        return [
          "Extracting transcript...",
          "Identifying claims...",
          "Verifying evidence...",
          "Finalizing report..."
        ];
    }
  };

  const steps = getSteps();
  const [currentStep, setCurrentStep] = useState(0);
  const [statusMessage, setStatusMessage] = useState(steps[0]);

  useEffect(() => {
    const process = async () => {
      try {
        // If we have preloaded demo data, just show the steps and complete
        if (preloadedData) {
          const timer = setInterval(() => {
            setCurrentStep(prev => {
              if (prev < steps.length - 1) {
                const next = prev + 1;
                setStatusMessage(steps[next]);
                return next;
              }
              clearInterval(timer);
              setTimeout(() => onComplete(preloadedData), 500);
              return prev;
            });
          }, 800);
          return () => clearInterval(timer);
        }

        // Otherwise, process with real API
        // Note: Need to get actual input from App.tsx
        // For now, this will be handled by App passing the data
        // This component just shows the UI
        
      } catch (err) {
        onError(err instanceof Error ? err.message : 'Processing failed');
      }
    };

    process();
  }, [onComplete, onError, preloadedData, steps]);

  const getTitle = () => {
    switch (inputType) {
      case 'text': return "Analyzing Text";
      case 'url': return "Analyzing Content";
      default: return "Analyzing Video";
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#0F172A] text-slate-50 px-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center space-y-8 text-center"
      >
        <div className="relative">
          <Spinner size="xl" className="text-blue-500" />
          <motion.div 
            className="absolute inset-0 flex items-center justify-center text-xs font-mono text-blue-300"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ repeat: Infinity, duration: 2 }}
          >
            {Math.min((currentStep + 1) * Math.floor(100 / steps.length), 99)}%
          </motion.div>
        </div>
        
        <div className="space-y-2 h-16">
          <h2 className="text-2xl font-semibold tracking-tight">{getTitle()}</h2>
          <motion.p 
            key={currentStep}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="text-slate-400 font-mono text-sm"
          >
            {statusMessage}
          </motion.p>
        </div>

        {/* Progress bar */}
        <div className="w-64 h-1.5 bg-slate-800 rounded-full overflow-hidden">
          <motion.div 
            className="h-full bg-blue-500"
            initial={{ width: "0%" }}
            animate={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      </motion.div>
    </div>
  );
}
