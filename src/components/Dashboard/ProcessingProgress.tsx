'use client';

import { useEffect, useState, useRef } from 'react';
import Spinner from '@/components/ui/spinner';
import { FaCheck, FaTimes } from 'react-icons/fa';

interface ProgressStep {
  step: string;
  message: string;
  progress?: number;
  data?: any;
}

interface ProcessingProgressProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (result: any) => void;
  audioFile: Blob;
  babyId: string;
  babyName?: string;
}

/** Matches saved `cry_predictions.model_confidence_threshold` unless backend sends another value */
const DEFAULT_CONFIDENCE_THRESHOLD = (() => {
  const raw = process.env.NEXT_PUBLIC_CRY_CONFIDENCE_THRESHOLD
  if (raw === undefined || String(raw).trim() === '') return 0.5
  const n = Number(raw)
  return Number.isFinite(n) && n >= 0 && n <= 1 ? n : 0.5
})()

function confidenceThresholdFromPayload(data: any): number {
  const candidates = [
    data?.model_confidence_threshold,
    data?.prediction?.model_confidence_threshold,
    data?.confidence_threshold,
    data?.prediction?.confidence_threshold,
  ]
  for (const c of candidates) {
    const n = Number(c)
    if (Number.isFinite(n) && n >= 0 && n <= 1) return n
  }
  return DEFAULT_CONFIDENCE_THRESHOLD
}

const STEP_CONFIG: Record<string, { label: string; icon?: string }> = {
  receiving: { label: 'Receiving audio file...', icon: '📥' },
  preprocessing: { label: 'Getting audio clean format...', icon: '🔧' },
  saving: { label: 'Audio formatted and saved...', icon: '💾' },
  feature_extraction: { label: 'Extracting features from audio...', icon: '🔬' },
  classification: { label: 'Running baby cry classification...', icon: '🤖' },
  completed: { label: 'Complete', icon: '✅' },
  error: { label: 'Error', icon: '❌' },
};

export default function ProcessingProgress({
  isOpen,
  onClose,
  onComplete,
  audioFile,
  babyId,
  babyName
}: ProcessingProgressProps) {
  const [currentStep, setCurrentStep] = useState<string>('');
  const [steps, setSteps] = useState<ProgressStep[]>([]);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const hasProcessedRef = useRef<boolean>(false);
  const onCompleteRef = useRef(onComplete);
  
  // Update ref when onComplete changes
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    if (!isOpen || !audioFile) {
      // Cleanup when modal closes
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
      hasProcessedRef.current = false;
      return;
    }

    // Prevent multiple simultaneous processing
    if (hasProcessedRef.current) {
      return;
    }

    // Reset state
    setSteps([]);
    setCurrentStep('');
    setResult(null);
    setError(null);
    hasProcessedRef.current = true;

    const processAudio = async () => {
      try {
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';
        const endpoint = `${backendUrl}/api/streaming/process-audio`;
        
        // Log for debugging
        console.log('Processing audio with backend URL:', backendUrl);
        console.log('Endpoint:', endpoint);
        
        // First, test if backend is reachable and streaming endpoint exists
        try {
          const healthCheck = await fetch(`${backendUrl}/health`, { method: 'GET' });
          if (!healthCheck.ok) {
            console.warn('Backend health check failed:', healthCheck.status);
          }
          
          // Test streaming endpoint specifically
          const streamingHealthCheck = await fetch(`${backendUrl}/api/streaming/health`, { method: 'GET' });
          if (!streamingHealthCheck.ok) {
            console.error('Streaming endpoint not found:', streamingHealthCheck.status);
            setError(`Streaming endpoint not found at ${backendUrl}/api/streaming/health. Please restart the FastAPI server to load the streaming router.`);
            setCurrentStep('error');
            return;
          }
          console.log('✓ Streaming endpoint is available');
        } catch (healthError: any) {
          console.error('Cannot reach backend server:', healthError);
          setError(`Cannot connect to backend server at ${backendUrl}. Make sure the FastAPI server is running and has been restarted after adding the streaming router.`);
          setCurrentStep('error');
          return;
        }
        
        const formData = new FormData();
        formData.append('file', audioFile, 'recording.webm');
        formData.append('baby_id', babyId);
        formData.append('remove_noise', 'true');
        formData.append('normalize', 'true');
        formData.append('n_mfcc', '13');

        // Create abort controller for cleanup
        abortControllerRef.current = new AbortController();
        
        const response = await fetch(endpoint, {
          method: 'POST',
          body: formData,
          signal: abortControllerRef.current.signal,
        });

        if (!response.ok) {
          const errorText = await response.text().catch(() => 'Unknown error');
          console.error('Backend error:', response.status, errorText);
          
          if (response.status === 404) {
            setError(`Endpoint not found: ${endpoint}. Make sure the FastAPI server is running and the route is registered.`);
          } else {
            setError(`HTTP error! status: ${response.status}. ${errorText}`);
          }
          setCurrentStep('error');
          return;
        }

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();

        if (!reader) {
          throw new Error('No response body');
        }

        let buffer = '';
        let processedAudioBase64: string | null = null;
        let durationSeconds: number | null = null;
        let savedRecordingId: string | null = null;
        let savedFileUrl: string | null = null;
        let hasSaved = false; // Flag to prevent duplicate saves
        let hasSavedFeatures = false;
        let hasSavedPrediction = false;

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));
                const step: ProgressStep = {
                  step: data.step,
                  message: data.message,
                  progress: data.progress,
                  data: data,
                };

                setCurrentStep(data.step);
                setSteps(prev => [...prev, step]);

                // Handle saving cleaned audio (only once)
                if (data.step === 'saving' && data.processed_audio_base64 && !processedAudioBase64 && !hasSaved) {
                  console.log('🔄 Starting save process...', { hasSaved, hasProcessedAudio: !!processedAudioBase64 });
                  processedAudioBase64 = data.processed_audio_base64;
                  durationSeconds = data.duration || null;
                  hasSaved = true; // Mark as saved to prevent duplicates - MUST be set BEFORE async operations

                  // Save cleaned audio to database via Next.js API (only once)
                  if (!abortControllerRef.current?.signal.aborted) {
                    try {
                      console.log('💾 Saving audio to database...');
                      const saveFormData = new FormData();
                      saveFormData.append('file', audioFile); // Original file for reference
                      saveFormData.append('baby_id', babyId);
                      if (processedAudioBase64) {
                        saveFormData.append('processed_audio_base64', processedAudioBase64);
                      }
                      if (durationSeconds) {
                        saveFormData.append('duration_seconds', String(durationSeconds));
                      }

                      const saveResponse = await fetch('/api/audio/process', {
                        method: 'POST',
                        body: saveFormData,
                        signal: abortControllerRef.current?.signal,
                      });

                      if (!saveResponse.ok) {
                        const errorData = await saveResponse.json().catch(() => ({}));
                        console.error('Failed to save cleaned audio:', errorData);
                        setError(errorData.error || 'Failed to save cleaned audio');
                      } else {
                        // Verify save was successful
                        const saveResult = await saveResponse.json();
                        savedRecordingId = saveResult.recording_id || null;
                        savedFileUrl = saveResult.file_url || null;
                        
                        // Update the step message to show verification
                        setSteps(prev => prev.map(step => 
                          step.step === 'saving' 
                            ? { 
                                ...step, 
                                message: savedRecordingId 
                                  ? `Cleaned audio saved successfully (ID: ${savedRecordingId.slice(0, 8)}...)`
                                  : savedFileUrl
                                  ? `Cleaned audio saved successfully`
                                  : step.message,
                                data: { ...step.data, recording_id: savedRecordingId, file_url: savedFileUrl }
                              }
                            : step
                        ));
                        
                        console.log('✓ Audio saved successfully:', { recording_id: savedRecordingId, file_url: savedFileUrl });
                      }
                    } catch (saveError: any) {
                      if (saveError.name !== 'AbortError') {
                        console.error('❌ Error saving cleaned audio:', saveError);
                        setError(saveError.message || 'Failed to save cleaned audio');
                        // Don't reset hasSaved on error - we don't want to retry automatically
                      }
                    }
                  } else {
                    console.warn('⚠️ Save skipped - request was aborted');
                  }
                } else if (data.step === 'saving' && data.processed_audio_base64 && hasSaved) {
                  // Log if we receive a duplicate save request
                  console.warn('⚠️ Duplicate save request detected but prevented by hasSaved flag');
                }

                // Handle completion
                if (data.step === 'completed') {
                  setResult(data);
                  if (!abortControllerRef.current?.signal.aborted) {
                    onCompleteRef.current(data);
                  }

                  if (!hasSavedFeatures && savedRecordingId && data.features) {
                    hasSavedFeatures = true;
                    try {
                      await fetch(`/api/recordings/${savedRecordingId}/features`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ features: data.features, extraction_method: 'streaming' })
                      });
                    } catch (featureError) {
                      console.error('Failed to save extracted features:', featureError);
                    }
                  }

                  if (!hasSavedPrediction && savedRecordingId && (data.prediction || data.predicted_cry_type)) {
                    hasSavedPrediction = true;
                    try {
                      await fetch(`/api/recordings/${savedRecordingId}/prediction`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          prediction: data.prediction,
                          predicted_cry_type: data.predicted_cry_type,
                          confidence_score: data.confidence_score,
                          confidence_scores: data.confidence_scores,
                          model_info: data.model_info,
                          model_confidence_threshold: confidenceThresholdFromPayload(data),
                        })
                      });
                    } catch (predictionError) {
                      console.error('Failed to save prediction:', predictionError);
                    }
                  }
                }

                // Handle errors
                if (data.step === 'error') {
                  setError(data.message || 'An error occurred');
                }
              } catch (e) {
                console.error('Error parsing SSE data:', e);
              }
            }
          }
        }
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          setError(err.message || 'Failed to process audio');
          setCurrentStep('error');
        }
      } finally {
        abortControllerRef.current = null;
      }
    };

    processAudio();
    
    // Cleanup function
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
      hasProcessedRef.current = false;
    };
  }, [isOpen, audioFile, babyId]); // Removed onComplete from dependencies

  if (!isOpen) return null;

  const getStepStatus = (stepName: string) => {
    const stepIndex = steps.findIndex(s => s.step === stepName);
    if (stepIndex === -1) return 'pending';
    if (currentStep === stepName && stepName !== 'completed' && stepName !== 'error') return 'active';
    if (stepIndex < steps.findIndex(s => s.step === currentStep)) return 'completed';
    return 'pending';
  };

  const allSteps = ['preprocessing', 'saving', 'feature_extraction', 'classification'];
  const isCompleted = currentStep === 'completed';
  const hasError = currentStep === 'error' || error;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] transform transition-all flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100 flex-shrink-0">
          <div>
            <h3 className="text-xl font-bold text-gray-900">
              {hasError ? 'Processing Error' : isCompleted ? 'Processing Complete' : 'Processing Audio'}
            </h3>
            {babyName && (
              <p className="text-sm text-gray-500 mt-1">Processing for {babyName}</p>
            )}
          </div>
          {(isCompleted || hasError) && (
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Close"
            >
              <FaTimes className="text-gray-400 hover:text-gray-600" />
            </button>
          )}
        </div>

        {/* Progress Steps */}
        <div className="p-6 overflow-y-auto flex-1">
        
          {hasError ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaTimes className="text-red-600 text-2xl" />
              </div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">Error Processing Audio</h4>
              <p className="text-gray-600 mb-6">{error || 'An unexpected error occurred'}</p>
              <button
                onClick={onClose}
                className="px-6 py-2.5 rounded-xl bg-gray-500 text-white font-semibold hover:bg-gray-600 transition-colors"
              >
                Close
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {allSteps.map((stepName, index) => {
                const config = STEP_CONFIG[stepName] || { label: stepName };
                const status = getStepStatus(stepName);
                const stepData = steps.find(s => s.step === stepName);
                const isActive = status === 'active';
                const isCompleted = status === 'completed';

                return (
                  <div
                    key={stepName}
                    className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${
                      isActive
                        ? 'border-pink-500 bg-pink-50 shadow-md'
                        : isCompleted
                        ? 'border-green-200 bg-green-50'
                        : 'border-gray-200 bg-gray-50'
                    }`}
                  >
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
                        isActive
                          ? 'bg-pink-500 text-white'
                          : isCompleted
                          ? 'bg-green-500 text-white'
                          : 'bg-gray-300 text-gray-600'
                      }`}
                    >
                      {isActive ? (
                        <Spinner size={20} color="white" />
                      ) : isCompleted ? (
                        <FaCheck className="text-lg" />
                      ) : (
                        <span className="text-lg">{config.icon || '○'}</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-gray-900">{config.label}</div>
                      {stepData && (
                        <div className="text-sm text-gray-600 mt-1">{stepData.message}</div>
                      )}
                      {isActive && stepData?.progress !== undefined && (
                        <div className="mt-2">
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-pink-500 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${stepData.progress}%` }}
                            />
                          </div>
                        </div>
                      )}
                      {isCompleted && stepData?.data?.recording_id && (
                        <div className="mt-2 text-xs text-green-600 font-medium">
                          ✓ Verified: Recording ID {stepData.data.recording_id.slice(0, 8)}...
                        </div>
                      )}
                      {isCompleted && stepData?.data?.file_url && !stepData?.data?.recording_id && (
                        <div className="mt-2 text-xs text-green-600 font-medium">
                          ✓ Verified: File saved to storage
                        </div>
                      )}
                      {isCompleted && stepData?.step === 'feature_extraction' && stepData?.data?.features && (
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <div className="text-xs font-semibold text-gray-700 mb-2">Extracted Features:</div>
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className="flex justify-between">
                              <span className="text-gray-600">MFCC Coefficients:</span>
                              <span className="font-medium text-gray-900">{stepData.data.features.mfcc_coefficients}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">MFCC Frames:</span>
                              <span className="font-medium text-gray-900">{stepData.data.features.mfcc_frames}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Pitch (Mean):</span>
                              <span className="font-medium text-gray-900">{stepData.data.features.pitch_mean} Hz</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Dominant Freq:</span>
                              <span className="font-medium text-gray-900">{stepData.data.features.dominant_frequency} Hz</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Duration:</span>
                              <span className="font-medium text-gray-900">{stepData.data.features.duration_seconds}s</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Audio Duration:</span>
                              <span className="font-medium text-gray-900">{stepData.data.features.actual_audio_duration}s</span>
                            </div>
                            <div className="flex justify-between col-span-2">
                              <span className="text-gray-600">Silence:</span>
                              <span className="font-medium text-gray-900">{stepData.data.features.silence_percentage}%</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Results */}
              {isCompleted && result && (
                <div className="mt-6 space-y-4">
                  {(() => {
                    const threshold = confidenceThresholdFromPayload(result)
                    const mainConfidence =
                      Number(result.confidence_score ?? result.prediction?.confidence_score ?? 0) || 0
                    const meetsThreshold = mainConfidence >= threshold
                    return (
                  <div className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border-2 border-green-200">
                    <h4 className="text-lg font-bold text-gray-900 mb-4">Classification Results</h4>
                  {result.prediction || result.predicted_cry_type ? (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-700 font-medium">Predicted Cry Type:</span>
                        <span className="text-xl font-bold text-pink-600 capitalize">
                          {result.predicted_cry_type || result.prediction?.predicted_cry_type || 'Unknown'}
                        </span>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                        <span className="text-gray-700 font-medium">Confidence score</span>
                        <div className="text-right sm:text-right">
                          <span className={`text-xl font-bold ${meetsThreshold ? 'text-green-600' : 'text-amber-600'}`}>
                            {Math.round(mainConfidence * 100)}%
                          </span>
                          <span className="text-gray-500 font-normal text-base ml-2">
                            / threshold {Math.round(threshold * 100)}%
                          </span>
                        </div>
                      </div>
                      <p className={`text-sm rounded-lg px-3 py-2 ${meetsThreshold ? 'bg-green-100/80 text-green-900' : 'bg-amber-50 text-amber-900'}`}>
                        {meetsThreshold
                          ? `This reading is at or above the ${Math.round(threshold * 100)}% confidence threshold we use for a clear match.`
                          : `This reading is below the ${Math.round(threshold * 100)}% threshold — treat it as a hint and check context (feeding, sleep, diaper).`}
                      </p>
                      {(result.confidence_scores || result.prediction?.confidence_scores) && (
                        <div className="mt-4 pt-4 border-t border-green-200">
                          <div className="flex flex-wrap items-baseline justify-between gap-2 mb-2">
                            <span className="text-sm font-medium text-gray-700">All predictions</span>
                            <span className="text-xs text-gray-500">
                              Threshold line: {Math.round(threshold * 100)}% (per class)
                            </span>
                          </div>
                          <div className="space-y-2">
                            {Object.entries(result.confidence_scores || result.prediction?.confidence_scores || {})
                              .sort(([, a], [, b]) => (b as number) - (a as number))
                              .map(([cryType, confidence]) => {
                                const c = confidence as number
                                const pct = Math.round(c * 100)
                                const thrPct = Math.round(threshold * 100)
                                const above = c >= threshold
                                return (
                                  <div key={cryType} className="flex items-center justify-between text-sm gap-2">
                                    <span className="text-gray-600 capitalize shrink-0">{cryType}</span>
                                    <div className="flex items-center gap-2 min-w-0 flex-1 justify-end">
                                      <div className="relative w-24 max-w-[40%] bg-gray-200 rounded-full h-2 shrink">
                                        <div
                                          className={`h-2 rounded-full ${above ? 'bg-pink-500' : 'bg-gray-400'}`}
                                          style={{ width: `${pct}%` }}
                                        />
                                        <div
                                          className="absolute top-0 bottom-0 w-0.5 bg-gray-800/70 pointer-events-none"
                                          style={{ left: `${Math.min(thrPct, 100)}%` }}
                                          title={`${thrPct}% threshold`}
                                        />
                                      </div>
                                      <span className={`font-medium w-[4.5rem] text-right shrink-0 ${above ? 'text-gray-900' : 'text-gray-500'}`}>
                                        {pct}%
                                        <span className="block text-[10px] font-normal text-gray-500 leading-tight">
                                          vs {thrPct}%
                                        </span>
                                      </span>
                                    </div>
                                  </div>
                                )
                              })}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-gray-600">
                      <p>Features extracted successfully, but classification model is not available.</p>
                      <p className="text-sm mt-2">Please train a model first to get predictions.</p>
                    </div>
                  )}
                  </div>
                    );
                  })()}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

