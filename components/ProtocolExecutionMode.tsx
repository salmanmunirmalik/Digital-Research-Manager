/**
 * Protocol Execution Mode Component
 * Real-time interactive protocol execution with timers, photo capture, and tracking
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  PlayIcon,
  PauseIcon,
  StopIcon,
  CameraIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  DocumentTextIcon,
  ArrowLeftIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline';
import Button from './ui/Button';
import Card, { CardContent, CardHeader, CardTitle } from './ui/Card';

interface ProtocolStep {
  id: number;
  title: string;
  description: string;
  duration: number;
  critical: boolean;
  materials_needed?: Array<{ name: string; quantity: string; unit: string }>;
  warnings?: string[];
  tips?: string[];
}

interface ProtocolExecutionModeProps {
  protocol: {
    title: string;
    procedure: ProtocolStep[];
  };
  onComplete?: (executionData: any) => void;
  onExit?: () => void;
}

const ProtocolExecutionMode: React.FC<ProtocolExecutionModeProps> = ({
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
  const [deviations, setDeviations] = useState<{ [stepId: number]: string }>({});
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentStep = protocol.procedure[currentStepIndex];
  const totalSteps = protocol.procedure.length;
  const progress = ((currentStepIndex + 1) / totalSteps) * 100;

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
  };

  const handlePauseStep = () => {
    setIsRunning(false);
  };

  const handleCompleteStep = () => {
    const newCompleted = new Set(completedSteps);
    newCompleted.add(currentStep.id);
    setCompletedSteps(newCompleted);
    setIsRunning(false);
    setStepStartTime(null);
    setTimeElapsed(0);

    // Auto-advance to next step if not last
    if (currentStepIndex < totalSteps - 1) {
      setTimeout(() => {
        setCurrentStepIndex(currentStepIndex + 1);
      }, 500);
    }
  };

  const handleNextStep = () => {
    if (currentStepIndex < totalSteps - 1) {
      setCurrentStepIndex(currentStepIndex + 1);
      setIsRunning(false);
      setStepStartTime(null);
      setTimeElapsed(0);
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
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveNote = (stepId: number, note: string) => {
    setNotes(prev => ({ ...prev, [stepId]: note }));
  };

  const handleSaveDeviation = (stepId: number, deviation: string) => {
    setDeviations(prev => ({ ...prev, [stepId]: deviation }));
  };

  const handleFinishExecution = async () => {
    const executionData = {
      protocolId: protocol.title,
      startTime: new Date().toISOString(),
      endTime: new Date().toISOString(),
      completedSteps: Array.from(completedSteps),
      notes,
      photos,
      deviations,
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{protocol.title}</h1>
              <p className="text-gray-600">
                Step {currentStepIndex + 1} of {totalSteps}
              </p>
            </div>
            <Button variant="outline" onClick={onExit}>
              Exit Execution Mode
            </Button>
          </div>
          
          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
            <div
              className="bg-gradient-to-r from-blue-600 to-indigo-600 h-3 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Timer */}
          <div className="flex items-center justify-center space-x-4">
            <div className="flex items-center space-x-2">
              <ClockIcon className="w-5 h-5 text-gray-600" />
              <span className="text-lg font-bold text-gray-900">
                {formatTime(timeElapsed)}
              </span>
            </div>
            {currentStep.duration && (
              <span className="text-sm text-gray-600">
                Estimated: {currentStep.duration}m
              </span>
            )}
          </div>
        </div>

        {/* Current Step Card */}
        <Card className="mb-6">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
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
                  <CardTitle className="text-xl">{currentStep.title}</CardTitle>
                  {currentStep.critical && (
                    <span className="inline-flex items-center px-2 py-1 mt-1 bg-red-100 text-red-800 rounded-full text-xs font-bold">
                      <ExclamationTriangleIcon className="w-3 h-3 mr-1" />
                      Critical Step
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {!completedSteps.has(currentStep.id) && (
                  <>
                    {!isRunning ? (
                      <Button onClick={handleStartStep} className="bg-green-600 hover:bg-green-700">
                        <PlayIcon className="w-4 h-4 mr-2" />
                        Start Step
                      </Button>
                    ) : (
                      <Button onClick={handlePauseStep} variant="outline">
                        <PauseIcon className="w-4 h-4 mr-2" />
                        Pause
                      </Button>
                    )}
                    <Button
                      onClick={handleCompleteStep}
                      className="bg-emerald-600 hover:bg-emerald-700"
                    >
                      <CheckCircleIcon className="w-4 h-4 mr-2" />
                      Complete Step
                    </Button>
                  </>
                )}
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-6">
            <p className="text-gray-700 mb-6">{currentStep.description}</p>

            {/* Materials Needed */}
            {currentStep.materials_needed && currentStep.materials_needed.length > 0 && (
              <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-2">Materials Needed:</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {currentStep.materials_needed.map((material, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-white p-2 rounded">
                      <span className="text-sm font-medium text-gray-900">{material.name}</span>
                      <span className="text-sm text-gray-600">
                        {material.quantity} {material.unit}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Warnings */}
            {currentStep.warnings && currentStep.warnings.length > 0 && (
              <div className="mb-6 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                <h4 className="font-semibold text-orange-900 mb-2 flex items-center">
                  <ExclamationTriangleIcon className="w-5 h-5 mr-2" />
                  Warnings:
                </h4>
                <ul className="list-disc list-inside text-sm text-orange-900">
                  {currentStep.warnings.map((warning, idx) => (
                    <li key={idx}>{warning}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Tips */}
            {currentStep.tips && currentStep.tips.length > 0 && (
              <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="font-semibold text-blue-900 mb-2">💡 Tips:</h4>
                <ul className="list-disc list-inside text-sm text-blue-900">
                  {currentStep.tips.map((tip, idx) => (
                    <li key={idx}>{tip}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Notes Section */}
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <DocumentTextIcon className="w-4 h-4 inline mr-1" />
                Notes for this step:
              </label>
              <textarea
                value={notes[currentStep.id] || ''}
                onChange={(e) => handleSaveNote(currentStep.id, e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={3}
                placeholder="Add observations, measurements, or notes..."
              />
            </div>

            {/* Deviation Tracking */}
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Deviations from protocol:
              </label>
              <textarea
                value={deviations[currentStep.id] || ''}
                onChange={(e) => handleSaveDeviation(currentStep.id, e.target.value)}
                className="w-full px-4 py-3 border-2 border-orange-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                rows={2}
                placeholder="Document any deviations from the standard protocol..."
              />
            </div>

            {/* Photo Capture */}
            <div className="mb-4">
              <Button
                onClick={handleCapturePhoto}
                variant="outline"
                className="w-full"
              >
                <CameraIcon className="w-4 h-4 mr-2" />
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
                <div className="mt-4 grid grid-cols-3 gap-2">
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
            </div>
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex items-center justify-between mb-6">
          <Button
            onClick={handlePreviousStep}
            disabled={currentStepIndex === 0}
            variant="outline"
          >
            <ArrowLeftIcon className="w-4 h-4 mr-2" />
            Previous Step
          </Button>

          <div className="flex space-x-2">
            {protocol.procedure.map((step, idx) => (
              <button
                key={step.id}
                onClick={() => {
                  setCurrentStepIndex(idx);
                  setIsRunning(false);
                  setStepStartTime(null);
                  setTimeElapsed(0);
                }}
                className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                  idx === currentStepIndex
                    ? 'bg-blue-600 text-white scale-110'
                    : completedSteps.has(step.id)
                    ? 'bg-emerald-500 text-white'
                    : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
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
          >
            Next Step
            <ArrowRightIcon className="w-4 h-4 ml-2" />
          </Button>
        </div>

        {/* Completion */}
        {allStepsCompleted && (
          <Card className="bg-emerald-50 border-emerald-200">
            <CardContent className="p-6 text-center">
              <CheckCircleIcon className="w-16 h-16 text-emerald-600 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-emerald-900 mb-2">
                Protocol Execution Complete!
              </h3>
              <p className="text-emerald-700 mb-4">
                All steps have been completed. Review your notes and photos before finalizing.
              </p>
              <Button
                onClick={handleFinishExecution}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                Finish & Save Execution Record
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default ProtocolExecutionMode;

