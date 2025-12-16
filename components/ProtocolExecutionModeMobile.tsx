/**
 * Mobile-Optimized Protocol Execution Mode
 * Hands-free mode, barcode scanning, voice commands, and mobile-first design
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  PlayIcon,
  PauseIcon,
  CameraIcon,
  CheckCircleIcon,
  ArrowLeftIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline';
import { MicrophoneIcon, QrCodeIcon, SpeakerWaveIcon } from './icons';
import Button from './ui/Button';
import Card, { CardContent, CardHeader, CardTitle } from './ui/Card';

interface ProtocolStep {
  id: number;
  title: string;
  description: string;
  duration: number;
  critical: boolean;
  materials_needed?: Array<{ name: string; quantity: string; unit: string }>;
}

interface ProtocolExecutionModeMobileProps {
  protocol: {
    title: string;
    procedure: ProtocolStep[];
  };
  onComplete?: (executionData: any) => void;
  onExit?: () => void;
}

const ProtocolExecutionModeMobile: React.FC<ProtocolExecutionModeMobileProps> = ({
  protocol,
  onComplete,
  onExit
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [stepStartTime, setStepStartTime] = useState<number | null>(null);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [notes, setNotes] = useState<{ [stepId: number]: string }>({});
  const [photos, setPhotos] = useState<{ [stepId: number]: string[] }>({});
  const [handsFreeMode, setHandsFreeMode] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);
  const [scannedMaterials, setScannedMaterials] = useState<Set<string>>(new Set());
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  const currentStep = protocol.procedure[currentStepIndex];
  const totalSteps = protocol.procedure.length;
  const progress = ((currentStepIndex + 1) / totalSteps) * 100;

  // Voice recognition setup
  useEffect(() => {
    if (voiceEnabled && 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = false;

      recognitionRef.current.onresult = (event: any) => {
        const command = event.results[event.results.length - 1][0].transcript.toLowerCase();
        handleVoiceCommand(command);
      };

      recognitionRef.current.start();
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [voiceEnabled]);

  // Timer effect
  useEffect(() => {
    if (isRunning && stepStartTime !== null) {
      timerRef.current = setInterval(() => {
        setTimeElapsed(Date.now() - stepStartTime);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isRunning, stepStartTime]);

  // Text-to-speech for hands-free mode
  const speak = (text: string) => {
    if (handsFreeMode && 'speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    }
  };

  // Voice command handler
  const handleVoiceCommand = (command: string) => {
    if (command.includes('next') || command.includes('continue')) {
      handleNextStep();
    } else if (command.includes('previous') || command.includes('back')) {
      handlePreviousStep();
    } else if (command.includes('complete') || command.includes('done')) {
      handleCompleteStep();
    } else if (command.includes('start')) {
      handleStartStep();
    } else if (command.includes('pause')) {
      handlePauseStep();
    } else if (command.includes('note')) {
      // Extract note text after "note"
      const noteText = command.replace(/note/i, '').trim();
      if (noteText) {
        setNotes(prev => ({ ...prev, [currentStep.id]: noteText }));
        speak('Note saved');
      }
    }
  };

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleStartStep = () => {
    setIsRunning(true);
    setStepStartTime(Date.now());
    setTimeElapsed(0);
    if (handsFreeMode) {
      speak(`Starting step ${currentStep.id}: ${currentStep.title}`);
    }
  };

  const handlePauseStep = () => {
    setIsRunning(false);
    if (handsFreeMode) {
      speak('Step paused');
    }
  };

  const handleCompleteStep = () => {
    const newCompleted = new Set(completedSteps);
    newCompleted.add(currentStep.id);
    setCompletedSteps(newCompleted);
    setIsRunning(false);
    setStepStartTime(null);
    setTimeElapsed(0);

    if (handsFreeMode) {
      speak(`Step ${currentStep.id} completed`);
    }

    // Auto-advance to next step if not last
    if (currentStepIndex < totalSteps - 1) {
      setTimeout(() => {
        setCurrentStepIndex(currentStepIndex + 1);
        if (handsFreeMode) {
          speak(`Moving to step ${currentStep.id + 1}`);
        }
      }, 1000);
    }
  };

  const handleNextStep = () => {
    if (currentStepIndex < totalSteps - 1) {
      setCurrentStepIndex(currentStepIndex + 1);
      setIsRunning(false);
      setStepStartTime(null);
      setTimeElapsed(0);
      if (handsFreeMode) {
        speak(`Step ${currentStep.id + 1}: ${protocol.procedure[currentStepIndex + 1].title}`);
      }
    }
  };

  const handlePreviousStep = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(currentStepIndex - 1);
      setIsRunning(false);
      setStepStartTime(null);
      setTimeElapsed(0);
    }
  };

  const handleCapturePhoto = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const photoUrl = reader.result as string;
        setPhotos(prev => ({
          ...prev,
          [currentStep.id]: [...(prev[currentStep.id] || []), photoUrl]
        }));
        if (handsFreeMode) {
          speak('Photo captured');
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleBarcodeScan = () => {
    // Simulate barcode scanning (in real app, use camera API)
    const materialName = prompt('Enter material name or scan barcode:');
    if (materialName) {
      setScannedMaterials(prev => new Set([...prev, materialName]));
      if (handsFreeMode) {
        speak(`${materialName} scanned`);
      }
    }
  };

  const handleFinishExecution = async () => {
    const executionData = {
      protocolId: protocol.title,
      startTime: new Date().toISOString(),
      endTime: new Date().toISOString(),
      completedSteps: Array.from(completedSteps),
      notes,
      photos,
      totalDuration: timeElapsed,
      success: completedSteps.size === protocol.procedure.length
    };

    // Save to backend
    try {
      const token = localStorage.getItem('token');
      await fetch('/api/protocol-execution', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(executionData)
      });
    } catch (error) {
      console.error('Failed to save execution data:', error);
    }

    if (onComplete) {
      onComplete(executionData);
    }
  };

  const allStepsCompleted = completedSteps.size === totalSteps;

  // Auto-read step when it changes in hands-free mode
  useEffect(() => {
    if (handsFreeMode && currentStep) {
      setTimeout(() => {
        speak(`Step ${currentStep.id}: ${currentStep.title}. ${currentStep.description}`);
      }, 500);
    }
  }, [currentStepIndex, handsFreeMode]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 pb-20">
      <div className="max-w-md mx-auto px-4 py-4">
        {/* Mobile Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h1 className="text-lg font-bold text-gray-900 line-clamp-1">{protocol.title}</h1>
              <p className="text-sm text-gray-600">
                Step {currentStepIndex + 1} of {totalSteps}
              </p>
            </div>
            <button
              onClick={onExit}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>
          
          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
            <div
              className="bg-gradient-to-r from-blue-600 to-indigo-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Timer - Large for mobile */}
          <div className="flex items-center justify-center space-x-2">
            <div className="text-2xl font-bold text-gray-900">
              {formatTime(timeElapsed)}
            </div>
            {currentStep.duration && (
              <span className="text-sm text-gray-500">
                / {currentStep.duration}m
              </span>
            )}
          </div>
        </div>

        {/* Hands-Free Controls */}
        <div className="flex space-x-2 mb-4">
          <button
            onClick={() => {
              setHandsFreeMode(!handsFreeMode);
              if (!handsFreeMode) {
                speak('Hands-free mode enabled');
              }
            }}
            className={`flex-1 px-4 py-3 rounded-lg font-medium transition-colors ${
              handsFreeMode
                ? 'bg-green-600 text-white'
                : 'bg-gray-200 text-gray-700'
            }`}
          >
            <SpeakerWaveIcon className="w-5 h-5 inline mr-2" />
            Hands-Free
          </button>
          <button
            onClick={() => setVoiceEnabled(!voiceEnabled)}
            className={`flex-1 px-4 py-3 rounded-lg font-medium transition-colors ${
              voiceEnabled
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700'
            }`}
          >
            <MicrophoneIcon className="w-5 h-5 inline mr-2" />
            Voice
          </button>
        </div>

        {/* Current Step Card - Mobile Optimized */}
        <Card className="mb-4">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold text-white ${
                    completedSteps.has(currentStep.id)
                      ? 'bg-emerald-500'
                      : currentStep.critical
                      ? 'bg-red-500'
                      : 'bg-blue-500'
                  }`}
                >
                  {currentStep.id}
                </div>
                <div>
                  <CardTitle className="text-lg">{currentStep.title}</CardTitle>
                  {currentStep.critical && (
                    <span className="text-xs text-red-600 font-bold">Critical</span>
                  )}
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-4">
            <p className="text-gray-700 mb-4 text-base leading-relaxed">{currentStep.description}</p>

            {/* Materials - Barcode Scan Option */}
            {currentStep.materials_needed && currentStep.materials_needed.length > 0 && (
              <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-gray-900 text-sm">Materials Needed:</h4>
                  <button
                    onClick={handleBarcodeScan}
                    className="p-1 text-blue-600 hover:bg-blue-100 rounded"
                    title="Scan barcode"
                  >
                    <QrCodeIcon className="w-5 h-5" />
                  </button>
                </div>
                <div className="space-y-1">
                  {currentStep.materials_needed.map((material, idx) => {
                    const isScanned = scannedMaterials.has(material.name);
                    return (
                      <div
                        key={idx}
                        className={`flex items-center justify-between text-sm p-2 rounded ${
                          isScanned ? 'bg-green-100' : 'bg-white'
                        }`}
                      >
                        <span className={isScanned ? 'line-through text-gray-500' : 'text-gray-900'}>
                          {material.name}
                        </span>
                        <span className="text-gray-600">
                          {material.quantity} {material.unit}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Quick Actions - Large Touch Targets */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              {!completedSteps.has(currentStep.id) && (
                <>
                  {!isRunning ? (
                    <Button
                      onClick={handleStartStep}
                      className="bg-green-600 hover:bg-green-700 h-12 text-base"
                    >
                      <PlayIcon className="w-5 h-5 mr-2" />
                      Start
                    </Button>
                  ) : (
                    <Button
                      onClick={handlePauseStep}
                      variant="outline"
                      className="h-12 text-base"
                    >
                      <PauseIcon className="w-5 h-5 mr-2" />
                      Pause
                    </Button>
                  )}
                  <Button
                    onClick={handleCompleteStep}
                    className="bg-emerald-600 hover:bg-emerald-700 h-12 text-base"
                  >
                    <CheckCircleIcon className="w-5 h-5 mr-2" />
                    Complete
                  </Button>
                </>
              )}
            </div>

            {/* Notes - Voice Input Ready */}
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Notes (say "note" + your text in voice mode):
              </label>
              <textarea
                value={notes[currentStep.id] || ''}
                onChange={(e) => setNotes(prev => ({ ...prev, [currentStep.id]: e.target.value }))}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-base"
                rows={3}
                placeholder="Add notes or use voice command..."
              />
            </div>

            {/* Photo Capture - Large Button */}
            <Button
              onClick={handleCapturePhoto}
              variant="outline"
              className="w-full h-12 text-base mb-2"
            >
              <CameraIcon className="w-5 h-5 mr-2" />
              Capture Photo
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handlePhotoUpload}
              className="hidden"
            />
            {photos[currentStep.id] && photos[currentStep.id].length > 0 && (
              <div className="grid grid-cols-2 gap-2 mt-2">
                {photos[currentStep.id].map((photo, idx) => (
                  <img
                    key={idx}
                    src={photo}
                    alt={`Step ${currentStep.id} photo ${idx + 1}`}
                    className="w-full h-24 object-cover rounded border border-gray-200"
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Navigation - Swipe-Friendly */}
        <div className="flex items-center justify-between mb-4">
          <Button
            onClick={handlePreviousStep}
            disabled={currentStepIndex === 0}
            variant="outline"
            className="flex-1 h-12 text-base"
          >
            <ArrowLeftIcon className="w-5 h-5 mr-2" />
            Previous
          </Button>

          <div className="flex space-x-1 mx-4 overflow-x-auto">
            {protocol.procedure.map((step, idx) => (
              <button
                key={step.id}
                onClick={() => {
                  setCurrentStepIndex(idx);
                  setIsRunning(false);
                  setStepStartTime(null);
                  setTimeElapsed(0);
                }}
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all flex-shrink-0 ${
                  idx === currentStepIndex
                    ? 'bg-blue-600 text-white scale-110'
                    : completedSteps.has(step.id)
                    ? 'bg-emerald-500 text-white'
                    : 'bg-gray-200 text-gray-600'
                }`}
              >
                {step.id}
              </button>
            ))}
          </div>

          <Button
            onClick={handleNextStep}
            disabled={currentStepIndex === totalSteps - 1}
            variant="outline"
            className="flex-1 h-12 text-base"
          >
            Next
            <ArrowRightIcon className="w-5 h-5 ml-2" />
          </Button>
        </div>

        {/* Completion */}
        {allStepsCompleted && (
          <Card className="bg-emerald-50 border-emerald-200">
            <CardContent className="p-6 text-center">
              <CheckCircleIcon className="w-16 h-16 text-emerald-600 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-emerald-900 mb-2">
                Protocol Complete!
              </h3>
              <Button
                onClick={handleFinishExecution}
                className="bg-emerald-600 hover:bg-emerald-700 w-full h-12 text-base mt-4"
              >
                Save & Finish
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default ProtocolExecutionModeMobile;

