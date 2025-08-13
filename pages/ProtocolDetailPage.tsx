
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Protocol, ProtocolStep, CalculatorName, VersionHistory } from '../types';
import Card, { CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { 
    AlertTriangleIcon, YoutubeIcon, LightbulbIcon, HistoryIcon, PaperclipIcon, 
    LockIcon, GitBranchIcon, PlaySquareIcon, CalculatorIcon, BeakerIcon 
} from '../components/icons';
import { getTroubleshootingAdvice } from '../services/geminiService';
// import { calculatorMap } from './CalculatorHubPage';

interface ProtocolDetailPageProps {
    protocols: Protocol[];
}

// --- MODAL COMPONENTS ---

const Modal: React.FC<{onClose: () => void, children: React.ReactNode, size?: 'md' | 'lg' | 'xl'}> = ({ onClose, children, size = 'lg' }) => {
    const sizeClasses = {
        md: 'max-w-md',
        lg: 'max-w-lg',
        xl: 'max-w-xl',
    }
    return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4" onClick={onClose}>
        <div className={`bg-white rounded-lg shadow-xl w-full ${sizeClasses[size]}`} onClick={e => e.stopPropagation()}>
            {children}
        </div>
    </div>
)};

const VersionHistoryModal: React.FC<{ history: VersionHistory[], onClose: () => void, forkedFrom?: string, protocols: Protocol[] }> = ({ history, onClose, forkedFrom, protocols }) => {
    const forkedProtocol = forkedFrom ? protocols.find(p => p.id === forkedFrom) : null;
    return (
    <Modal onClose={onClose} size="xl">
        <CardHeader>
            <CardTitle>Protocol Version History</CardTitle>
            {forkedProtocol && (
                <CardDescription>
                    Forked from <Link to={`/protocols/${forkedProtocol.id}`} className="text-blue-600 hover:underline">{forkedProtocol.title} v{forkedProtocol.version}</Link> by {forkedProtocol.author}.
                </CardDescription>
            )}
        </CardHeader>
        <CardContent className="max-h-[70vh] overflow-y-auto">
            <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                    <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-slate-500">Ver.</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-slate-500">Date</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-slate-500">Author</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-slate-500">Changes</th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                    {history.map(entry => (
                        <tr key={entry.version}>
                            <td className="px-4 py-3 font-semibold">{entry.version}</td>
                            <td className="px-4 py-3 text-sm">{entry.date}</td>
                            <td className="px-4 py-3 text-sm">{entry.author}</td>
                            <td className="px-4 py-3 text-sm">{entry.changes}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </CardContent>
        <div className="p-4 bg-slate-50 flex justify-end gap-3 rounded-b-lg">
            <Button onClick={onClose}>Close</Button>
        </div>
    </Modal>
)};

// --- TIMER COMPONENT ---

const Timer: React.FC<{ durationSeconds: number; onComplete: () => void }> = ({ durationSeconds, onComplete }) => {
    const [timeLeft, setTimeLeft] = useState(durationSeconds);

    useEffect(() => {
        if (timeLeft <= 0) {
            onComplete();
            return;
        }

        const interval = setInterval(() => {
            setTimeLeft(prev => prev - 1);
        }, 1000);

        return () => clearInterval(interval);
    }, [timeLeft, onComplete]);

    const formatTime = (seconds: number) => {
        if (seconds <= 0) return "00:00:00";
        const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
        const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
        const s = (seconds % 60).toString().padStart(2, '0');
        return `${h}:${m}:${s}`;
    };

    return (
        <div className="mt-2 p-2 bg-blue-100 border border-blue-300 rounded-md">
            <p className="text-center font-mono font-semibold text-lg text-blue-800">{formatTime(timeLeft)}</p>
        </div>
    );
};

// --- AI TROUBLESHOOTING ---

const LoadingSpinner: React.FC = () => (
    <div className="flex items-center justify-center space-x-2">
        <div className="w-2 h-2 rounded-full bg-slate-500 animate-bounce [animation-delay:-0.3s]"></div>
        <div className="w-2 h-2 rounded-full bg-slate-500 animate-bounce [animation-delay:-0.15s]"></div>
        <div className="w-2 h-2 rounded-full bg-slate-500 animate-bounce"></div>
    </div>
);

const TroubleshootAI: React.FC<{ protocol: Protocol; step: ProtocolStep }> = ({ protocol, step }) => {
    const [query, setQuery] = useState('');
    const [response, setResponse] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleTroubleshoot = async () => {
        if (!query) return;
        setIsLoading(true);
        setError('');
        setResponse('');
        try {
            const advice = await getTroubleshootingAdvice(protocol.title, step.description, query);
            setResponse(advice);
        } catch (err) {
            setError('Failed to get advice from AI. Please check your API key and try again.');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="mt-4 p-4 bg-slate-50 border border-slate-200 rounded-lg">
            <div className="flex items-center mb-2">
                <LightbulbIcon className="h-5 w-5 mr-2 text-yellow-500" />
                <h4 className="font-semibold text-slate-700">Troubleshoot with AI</h4>
            </div>
            <p className="text-sm text-slate-500 mb-3">Stuck on this step? Describe your problem to get instant suggestions.</p>
            <div className="flex gap-2">
                 <Input 
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="e.g., 'My gel bands are smeared.'"
                    disabled={isLoading}
                 />
                 <Button onClick={handleTroubleshoot} disabled={isLoading || !query}>
                    {isLoading ? <LoadingSpinner /> : 'Get Advice'}
                 </Button>
            </div>
            {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
            {response && (
                <div className="mt-4 p-4 bg-white rounded-md border">
                    <h5 className="font-semibold mb-2">AI Suggestion:</h5>
                    <pre className="text-sm text-slate-700 whitespace-pre-wrap font-sans">{response}</pre>
                </div>
            )}
        </div>
    );
};

// --- PROTOCOL STEP VIEW ---

const ProtocolStepView: React.FC<{ 
    step: ProtocolStep, 
    protocol: Protocol,
    isRunMode: boolean,
    isCompleted: boolean,
    activeTimer: number | null,
    onToggleComplete: (step: number) => void,
    onStartTimer: (step: number, durationMinutes: number) => void,
    onTimerComplete: (step: number) => void,
    onCalculatorOpen: (name: CalculatorName, inputs: any) => void 
}> = ({ 
    step, protocol, isRunMode, isCompleted, activeTimer,
    onToggleComplete, onStartTimer, onTimerComplete, onCalculatorOpen 
}) => {
  
  const handleVideoTimestampClick = () => {
      if(!step.videoTimestamp || !protocol.videoUrl) return;
      const baseUrl = protocol.videoUrl.split('?')[0]; // Get URL without existing params
      const urlWithTimestamp = `${baseUrl}?t=${step.videoTimestamp.time}s&autoplay=1`;
      window.open(urlWithTimestamp, '_blank');
  };

  const stepClasses = `flex items-start gap-4 p-4 transition-all duration-300 ${isCompleted ? 'bg-green-50' : 'hover:bg-slate-50'}`;

  return (
    <div className={stepClasses}>
      {isRunMode ? (
        <input 
            type="checkbox"
            checked={isCompleted}
            onChange={() => onToggleComplete(step.step)}
            className="h-8 w-8 mt-1 rounded-full text-blue-600 border-slate-300 focus:ring-blue-500 cursor-pointer flex-shrink-0"
        />
      ) : (
        <div className="flex-shrink-0 flex items-center justify-center h-10 w-10 bg-slate-200 text-slate-700 font-bold rounded-full">
            {step.step}
        </div>
      )}

      <div className={`flex-1 transition-opacity ${isCompleted ? 'opacity-60' : 'opacity-100'}`}>
        <p className="font-semibold text-slate-800">{step.description}</p>
        {step.details && <p className="mt-1 text-sm text-slate-600">{step.details}</p>}
        
        <div className="mt-3 space-y-3">
            {step.durationMinutes && isRunMode && (
                activeTimer !== null 
                ? <Timer durationSeconds={activeTimer} onComplete={() => onTimerComplete(step.step)} />
                : <Button variant="secondary" size="sm" onClick={() => onStartTimer(step.step, step.durationMinutes!)}>Start Timer ({step.durationMinutes} min)</Button>
            )}

            {step.calculator && (
                 <Button variant="secondary" size="sm" onClick={() => onCalculatorOpen(step.calculator!.name, step.calculator!.inputs)}>
                    <CalculatorIcon className="h-4 w-4 mr-2"/> Open {step.calculator.name} Calculator
                 </Button>
            )}
            {step.videoTimestamp && (
                <Button variant="secondary" size="sm" onClick={handleVideoTimestampClick}>
                    <PlaySquareIcon className="h-4 w-4 mr-2"/> {step.videoTimestamp.label}
                 </Button>
            )}
            {step.safetyWarning && (
              <div className="flex items-center gap-2 p-2 bg-yellow-100 border-l-4 border-yellow-400 text-yellow-800 rounded-r-md text-sm">
                <AlertTriangleIcon className="h-5 w-5 flex-shrink-0" />
                <span>{step.safetyWarning}</span>
              </div>
            )}
             {step.conditional && (
              <div className="p-3 bg-blue-50 border-l-4 border-blue-400 text-blue-800 rounded-r-md text-sm">
                <div className="flex items-center font-semibold mb-2">
                    <GitBranchIcon className="h-5 w-5 mr-2" />
                    Conditional Step
                </div>
                <p><span className="font-semibold">Condition:</span> {step.conditional.condition}</p>
                <p className="mt-1"><span className="font-semibold text-green-700">If True:</span> {step.conditional.ifTrue}</p>
                <p className="mt-1"><span className="font-semibold text-red-700">If False:</span> {step.conditional.ifFalse}</p>
              </div>
            )}
        </div>
        
        {!isRunMode && <TroubleshootAI protocol={protocol} step={step} />}
      </div>
    </div>
  );
};

// --- MAIN PAGE COMPONENT ---

const ProtocolDetailPage: React.FC<ProtocolDetailPageProps> = ({ protocols }) => {
  const { protocolId } = useParams<{ protocolId: string }>();
  const protocol = useMemo(() => protocols.find(p => p.id === protocolId) || null, [protocolId, protocols]);
  
  // Modals state
  const [isHistoryModalOpen, setHistoryModalOpen] = useState(false);
  const [isCalculatorModalOpen, setCalculatorModalOpen] = useState(false);
  const [modalCalculator, setModalCalculator] = useState<{name: CalculatorName, inputs: any} | null>(null);

  // Run mode state
  const [isRunMode, setIsRunMode] = useState(false);
  const [completedSteps, setCompletedSteps] = useState(new Set<number>());
  const [activeTimers, setActiveTimers] = useState<Record<number, number | null>>({});

  useEffect(() => {
    // Reset run mode if protocol changes
    resetRun();
  }, [protocolId]);

  // Effect to handle timers countdown
  useEffect(() => {
    const interval = setInterval(() => {
        setActiveTimers(currentTimers => {
            const newTimers = { ...currentTimers };
            let changed = false;
            Object.keys(newTimers).forEach(stepIdStr => {
                const stepId = Number(stepIdStr);
                if (newTimers[stepId] !== null && newTimers[stepId]! > 0) {
                    newTimers[stepId]! -= 1;
                    changed = true;
                }
            });
            return changed ? newTimers : currentTimers;
        });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleOpenCalculator = (name: CalculatorName, inputs: any) => {
    setModalCalculator({ name, inputs });
    setCalculatorModalOpen(true);
  };

  const handleToggleStep = (stepNumber: number) => {
    setCompletedSteps(prev => {
        const newSet = new Set(prev);
        if (newSet.has(stepNumber)) {
            newSet.delete(stepNumber);
        } else {
            newSet.add(stepNumber);
        }
        return newSet;
    });
  };
  
  const handleStartTimer = (stepNumber: number, durationMinutes: number) => {
      setActiveTimers(prev => ({...prev, [stepNumber]: durationMinutes * 60}));
  };
  
  const handleTimerComplete = (stepNumber: number) => {
    // Optionally auto-complete the step
    if (!completedSteps.has(stepNumber)) {
        handleToggleStep(stepNumber);
    }
    // Set timer to null to show the Start button again
    setActiveTimers(prev => ({ ...prev, [stepNumber]: null }));
    // Here you could trigger a browser notification or sound
    if (Notification.permission === 'granted') {
      new Notification(`Timer for step ${stepNumber} is complete!`, {
        body: `Your timer for "${protocol?.title}" has finished.`,
      });
    } else if (Notification.permission !== 'denied') {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          new Notification(`Timer for step ${stepNumber} is complete!`);
        }
      })
    }
  };

  const resetRun = () => {
    setIsRunMode(false);
    setCompletedSteps(new Set());
    setActiveTimers({});
  };

  const aggregatedMaterials = useMemo(() => {
      if (!protocol) return [];
      const allMaterials = protocol.steps.flatMap(step => step.materials || []);
      return [...new Set(allMaterials)];
  }, [protocol]);

  const progress = protocol ? (completedSteps.size / protocol.steps.length) * 100 : 0;

  if (!protocol) {
    return <div className="text-center py-10">Protocol not found. <Link to="/protocols" className="text-blue-600 hover:underline">Go back to library</Link></div>;
  }
  
  const { title, description, author, lastUpdated, version, tags, access, attachments, versionHistory, forkedFrom } = protocol;

  const renderCalculatorModal = () => {
    if(!modalCalculator) return null;
    // const CalculatorComponent = calculatorMap[modalCalculator.name];
    // if (!CalculatorComponent) return null;
    
    return (
        <Modal onClose={() => setCalculatorModalOpen(false)} size="lg">
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">Calculator: {modalCalculator.name}</h3>
              <p className="text-gray-600">Calculator functionality coming soon!</p>
            </div>
        </Modal>
    )
  };

  return (
    <div className="max-w-7xl mx-auto">
      {isHistoryModalOpen && <VersionHistoryModal history={versionHistory} onClose={() => setHistoryModalOpen(false)} forkedFrom={forkedFrom} protocols={protocols} />}
      {isCalculatorModalOpen && renderCalculatorModal()}
      
      {/* HEADER */}
      <div className="mb-8">
        <Link to="/protocols" className="text-sm text-blue-600 hover:underline mb-4 inline-block">&larr; Back to Protocol Library</Link>
        <h1 className="text-4xl font-bold text-slate-900">{title}</h1>
        <p className="mt-2 text-lg text-slate-600">{description}</p>
        
        <div className="mt-4 flex flex-wrap gap-2">
            {tags.map(tag => (
                <span key={tag} className="px-2 py-1 bg-slate-200 text-slate-700 text-xs font-medium rounded-full">{tag}</span>
            ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* MAIN CONTENT */}
        <div className="lg:col-span-2 space-y-4">
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <div>
                            <CardTitle>Procedure</CardTitle>
                            <CardDescription>Follow these steps carefully for best results.</CardDescription>
                        </div>
                         {isRunMode ? (
                             <Button variant="secondary" onClick={resetRun}>Exit Run</Button>
                         ) : (
                            <Button onClick={() => setIsRunMode(true)}>
                                <PlaySquareIcon className="h-5 w-5 mr-2" /> Start Run
                            </Button>
                         )}
                    </div>
                     {isRunMode && (
                        <div className="mt-4">
                            <div className="flex justify-between mb-1">
                                <span className="text-base font-medium text-blue-700">Progress</span>
                                <span className="text-sm font-medium text-blue-700">{completedSteps.size} of {protocol.steps.length} steps</span>
                            </div>
                            <div className="w-full bg-slate-200 rounded-full h-2.5">
                                <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${progress}%` }}></div>
                            </div>
                        </div>
                    )}
                </CardHeader>
                <CardContent className="p-0">
                    <div className="divide-y divide-slate-200">
                         {protocol.steps.map(step => (
                            <ProtocolStepView 
                                key={step.step} 
                                step={step} 
                                protocol={protocol} 
                                isRunMode={isRunMode}
                                isCompleted={completedSteps.has(step.step)}
                                activeTimer={activeTimers[step.step] ?? null}
                                onToggleComplete={handleToggleStep}
                                onStartTimer={handleStartTimer}
                                onTimerComplete={handleTimerComplete}
                                onCalculatorOpen={handleOpenCalculator}
                            />
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>

        {/* SIDEBAR */}
        <div className="space-y-6 lg:sticky lg:top-8">
            <Card>
                <CardHeader>
                    <CardTitle>Reagents & Equipment</CardTitle>
                    <CardDescription>Checklist for preparation.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2 max-h-60 overflow-y-auto">
                    {aggregatedMaterials.map(material => (
                        <div key={material} className="flex items-center">
                            <input id={`mat-${material}`} type="checkbox" className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                            <label htmlFor={`mat-${material}`} className="ml-3 block text-sm font-medium text-slate-700">{material}</label>
                        </div>
                    ))}
                    {aggregatedMaterials.length === 0 && <p className="text-sm text-slate-500">No materials listed for this protocol.</p>}
                </CardContent>
            </Card>

            {protocol.videoUrl && (
                <Card>
                    <CardHeader>
                        <CardTitle>Video Demonstration</CardTitle>
                    </CardHeader>
                    <CardContent>
                         <div className="aspect-w-16 aspect-h-9 relative" style={{paddingBottom: "56.25%"}}>
                            <iframe 
                                src={protocol.videoUrl} 
                                title="YouTube video player" 
                                frameBorder="0" 
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                                allowFullScreen
                                className="w-full h-full rounded-lg absolute inset-0"
                            ></iframe>
                        </div>
                    </CardContent>
                </Card>
            )}

            <Card>
                <CardHeader>
                    <CardTitle>Details & Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    <div className="text-sm">
                        <p><strong>Author:</strong> {author}</p>
                        <p><strong>Last Updated:</strong> {lastUpdated}</p>
                        <div className="flex items-center gap-4 mt-2">
                             <button onClick={() => setHistoryModalOpen(true)} className="flex items-center gap-1 hover:text-slate-800 transition-colors">
                                <HistoryIcon className="h-4 w-4"/> Version: {version}
                            </button>
                            <div className="flex items-center gap-1">
                                <LockIcon className="h-4 w-4"/> {access}
                            </div>
                        </div>
                    </div>

                    {attachments.length > 0 && (
                        <div className="pt-3 border-t">
                             <h4 className="font-semibold text-slate-700 mb-2 text-sm">Attachments</h4>
                             <div className="flex flex-wrap gap-3">
                                {attachments.map(att => (
                                    <a key={att.name} href={att.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm text-blue-600 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-md transition-colors">
                                        <PaperclipIcon className="h-4 w-4"/>
                                        {att.name}
                                    </a>
                                ))}
                             </div>
                        </div>
                    )}

                    <div className="pt-3 border-t space-y-2">
                        <Link to={`/protocols/${protocol.id}/edit`} className="w-full block">
                            <Button variant="secondary" className="w-full">
                                <GitBranchIcon className="h-4 w-4 mr-2" />
                                Duplicate & Edit
                            </Button>
                        </Link>
                    </div>
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
};

export default ProtocolDetailPage;
