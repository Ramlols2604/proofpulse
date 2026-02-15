import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Spinner } from '../components/ui/Spinner';
import type { InputType, VideoData } from '../types';
import { submitTextForAnalysis, submitUrlForAnalysis, submitFileForAnalysis, pollForResult } from '../api';

interface ProcessingScreen2Props {
  onComplete: (data: VideoData) => void;
  onError: (error: string) => void;
  inputType: InputType;
  text?: string;
  url?: string;
  file?: File;
  demoData?: VideoData;
}

export function ProcessingScreen2({ 
  onComplete, 
  onError, 
  inputType, 
  text, 
  url, 
  file,
  demoData 
}: ProcessingScreen2Props) {
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
          "Scoring claims...",
          "Finalizing analysis..."
        ];
      default: // video
        return [
          "Extracting transcript...",
          "Identifying claims...",
          "Verifying evidence...",
          "Scoring claims...",
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
        console.log('[ProcessingScreen2] Starting process with:', { text, url, file: file?.name, hasDemoData: !!demoData });
        
        // Prefer real input over demo: only use demo when there is no file/text/url
        let jobId: string;
        
        if (file) {
          console.log('[ProcessingScreen2] Submitting file for analysis:', file.name);
          setStatusMessage("Uploading file for analysis...");
          jobId = await submitFileForAnalysis(file);
          console.log('[ProcessingScreen2] Got job ID:', jobId);
        } else if (text) {
          console.log('[ProcessingScreen2] Submitting text:', text.slice(0, 50) + '...');
          setStatusMessage("Submitting text for analysis...");
          jobId = await submitTextForAnalysis(text);
          console.log('[ProcessingScreen2] Got job ID:', jobId);
        } else if (url) {
          console.log('[ProcessingScreen2] Submitting URL:', url);
          setStatusMessage("Submitting URL for analysis...");
          jobId = await submitUrlForAnalysis(url);
          console.log('[ProcessingScreen2] Got job ID:', jobId);
        } else if (demoData) {
          console.log('[ProcessingScreen2] Using preloaded demo data (no file/text/url)');
          const timer = setInterval(() => {
            setCurrentStep(prev => {
              if (prev < steps.length - 1) {
                const next = prev + 1;
                setStatusMessage(steps[next]);
                return next;
              }
              clearInterval(timer);
              setTimeout(() => onComplete(demoData), 500);
              return prev;
            });
          }, 600);
          return () => clearInterval(timer);
        } else {
          console.error('[ProcessingScreen2] No input provided!');
          throw new Error("No input provided");
        }

        // Poll for results with status updates
        console.log('[ProcessingScreen2] Starting to poll for results');
        const result = await pollForResult(jobId, (status) => {
          console.log('[ProcessingScreen2] Status update:', status);
          setStatusMessage(status);
          
          // Update step based on status message
          const statusUpper = status.toUpperCase();
          if (statusUpper.includes('PARSING') || statusUpper.includes('EXTRACT') && statusUpper.includes('TEXT')) {
            setCurrentStep(0);
          } else if (statusUpper.includes('CLAIM')) {
            setCurrentStep(1);
          } else if (statusUpper.includes('EVIDENCE') || statusUpper.includes('RETRIEV')) {
            setCurrentStep(2);
          } else if (statusUpper.includes('GEMINI') || statusUpper.includes('SCOR') || statusUpper.includes('REVIEW')) {
            setCurrentStep(3);
          } else if (statusUpper.includes('FINAL') || statusUpper.includes('READY')) {
            setCurrentStep(4);
          }
        });

        console.log('[ProcessingScreen2] Got result, calling onComplete');
        onComplete(result);
        
      } catch (err) {
        console.error('[ProcessingScreen2] ERROR:', err);
        console.error('[ProcessingScreen2] Error details:', {
          message: err instanceof Error ? err.message : 'Unknown error',
          stack: err instanceof Error ? err.stack : undefined,
          error: err
        });
        onError(err instanceof Error ? err.message : 'Processing failed');
      }
    };

    process();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run once on mount - all needed values are captured in closure

  const getTitle = () => {
    switch (inputType) {
      case 'text': return "Analyzing Text";
      case 'url': return "Analyzing Content";
      default: return "Analyzing Video";
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 text-gray-900 px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl shadow-xl p-8 flex flex-col items-center space-y-8 text-center max-w-md"
      >
        <div className="relative">
          <Spinner size="xl" className="text-blue-600" />
          <motion.div
            className="absolute inset-0 flex items-center justify-center text-xs font-mono text-blue-600"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ repeat: Infinity, duration: 2 }}
          >
            {Math.min((currentStep + 1) * Math.floor(100 / steps.length), 99)}%
          </motion.div>
        </div>

        <div className="space-y-2 min-h-24">
          <h2 className="text-2xl font-semibold tracking-tight text-gray-900">{getTitle()}</h2>
          <motion.p
            key={statusMessage}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="text-gray-600 font-mono text-sm"
          >
            {statusMessage}
          </motion.p>
        </div>

        <div className="w-64 h-1.5 bg-gray-200 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-blue-600"
            initial={{ width: '0%' }}
            animate={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      </motion.div>
    </div>
  );
}
