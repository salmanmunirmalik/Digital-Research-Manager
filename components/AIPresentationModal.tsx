import React, { useState, useEffect } from 'react';
import { 
  XMarkIcon, 
  SparklesIcon,
  DocumentTextIcon,
  PhotoIcon,
  PaletteIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  PlayIcon,
  PauseIcon,
  ForwardIcon,
  BackwardIcon,
  EyeIcon,
  PencilIcon,
  ShareIcon,
  DocumentArrowDownIcon,
  LightBulbIcon,
  ChatBubbleLeftRightIcon
} from '@heroicons/react/24/outline';
import PlateEditor from './PlateEditor';

interface Slide {
  id: string;
  order: number;
  title: string;
  content: string;
  type: 'title' | 'content' | 'conclusion' | 'data';
  visualSuggestions?: string[];
  dataPoints?: string[];
  notes?: string;
  originalOutline?: any;
}

interface Presentation {
  title: string;
  theme: string;
  slides: Slide[];
  metadata: {
    generatedAt: string;
    totalSlides: number;
    context: string;
  };
}

interface AIPresentationModalProps {
  onClose: () => void;
  dataEntries: any[];
}

const AIPresentationModal: React.FC<AIPresentationModalProps> = ({ onClose, dataEntries }) => {
  const [step, setStep] = useState<'input' | 'generating' | 'editing' | 'preview'>('input');
  const [topic, setTopic] = useState('');
  const [context, setContext] = useState('');
  const [slides, setSlides] = useState(8);
  const [theme, setTheme] = useState('research-professional');
  const [availableThemes, setAvailableThemes] = useState<any[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [presentation, setPresentation] = useState<Presentation | null>(null);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [editingSlide, setEditingSlide] = useState<Slide | null>(null);
  const [improvementFeedback, setImprovementFeedback] = useState('');
  const [isImproving, setIsImproving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load available themes on mount
  useEffect(() => {
    loadThemes();
  }, []);

  const loadThemes = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) return;

      const response = await fetch('/api/presentations/ai/themes', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setAvailableThemes(data.themes || []);
      }
    } catch (error) {
      console.error('Error loading themes:', error);
    }
  };

  const generatePresentation = async () => {
    if (!topic.trim()) {
      setError('Please enter a presentation topic');
      return;
    }

    setIsGenerating(true);
    setGenerationProgress(0);
    setError(null);

    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('Authentication required. Please log in again.');
      }

      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setGenerationProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 2000);

      const response = await fetch('/api/presentations/ai/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          topic,
          context: context || generateContextFromData(),
          slides,
          theme
        })
      });

      clearInterval(progressInterval);
      setGenerationProgress(100);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();

      if (result.success) {
        setPresentation(result.presentation);
        setStep('editing');
        console.log('Presentation generated successfully:', result);
      } else {
        throw new Error(result.error || 'Presentation generation failed');
      }

    } catch (error) {
      console.error('Presentation generation error:', error);
      setError((error as Error).message || 'Failed to generate presentation. Please try again.');
    } finally {
      setIsGenerating(false);
      setGenerationProgress(0);
    }
  };

  const generateContextFromData = () => {
    if (dataEntries.length === 0) return '';
    
    const categories = [...new Set(dataEntries.map(entry => entry.category))];
    const recentEntries = dataEntries
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);

    return `Based on recent lab data including: ${categories.join(', ')}. Recent entries: ${recentEntries.map(e => e.name).join(', ')}.`;
  };

  const improveSlideContent = async (slideId: string) => {
    if (!improvementFeedback.trim() || !presentation) return;

    setIsImproving(true);
    setError(null);

    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('Authentication required. Please log in again.');
      }

      const slide = presentation.slides.find(s => s.id === slideId);
      if (!slide) return;

      const response = await fetch('/api/presentations/ai/improve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          presentationId: presentation.title,
          slideId: slideId,
          feedback: improvementFeedback,
          currentContent: {
            title: slide.title,
            content: slide.content
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Content improvement failed');
      }

      const result = await response.json();

      if (result.success) {
        // Update the slide with improved content
        const updatedSlides = presentation.slides.map(slide => 
          slide.id === slideId 
            ? { ...slide, ...result.improvedContent }
            : slide
        );
        
        setPresentation({ ...presentation, slides: updatedSlides });
        setEditingSlide(null);
        setImprovementFeedback('');
        console.log('Slide content improved successfully');
      } else {
        throw new Error(result.error || 'Content improvement failed');
      }

    } catch (error) {
      console.error('Content improvement error:', error);
      setError((error as Error).message || 'Failed to improve slide content. Please try again.');
    } finally {
      setIsImproving(false);
    }
  };

  const exportPresentation = (format: 'pdf' | 'pptx' | 'html') => {
    if (!presentation) return;

    // In a real implementation, this would call a backend service to generate the file
    console.log(`Exporting presentation as ${format}:`, presentation);
    alert(`Exporting as ${format.toUpperCase()}... (Feature coming soon!)`);
  };

  const sharePresentation = () => {
    if (!presentation) return;

    // In a real implementation, this would generate a shareable link
    console.log('Sharing presentation:', presentation);
    alert('Sharing feature coming soon!');
  };

  const renderInputStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <SparklesIcon className="w-12 h-12 text-purple-600 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          AI-Powered Presentation Generator
        </h3>
        <p className="text-gray-600">
          Create professional research presentations with AI assistance
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Presentation Topic *
          </label>
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g., CRISPR Gene Editing Applications in Cancer Research"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Context & Background
          </label>
          <textarea
            value={context}
            onChange={(e) => setContext(e.target.value)}
            placeholder="Provide additional context, objectives, or background information..."
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          {dataEntries.length > 0 && (
            <p className="text-xs text-gray-500 mt-1">
              💡 We'll automatically include context from your recent lab data
            </p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Number of Slides
            </label>
            <select
              value={slides}
              onChange={(e) => setSlides(parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              {[5, 6, 7, 8, 10, 12, 15, 20].map(num => (
                <option key={num} value={num}>{num} slides</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Theme
            </label>
            <select
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              {availableThemes.map(themeOption => (
                <option key={themeOption.id} value={themeOption.id}>
                  {themeOption.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {availableThemes.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Selected Theme Preview
            </label>
            <div className="p-4 border border-gray-300 rounded-md bg-gray-50">
              {availableThemes.find(t => t.id === theme) && (
                <div className="flex items-center gap-4">
                  <div 
                    className="w-8 h-8 rounded"
                    style={{ 
                      backgroundColor: availableThemes.find(t => t.id === theme)?.colors.primary 
                    }}
                  />
                  <div>
                    <p className="font-medium">{availableThemes.find(t => t.id === theme)?.name}</p>
                    <p className="text-sm text-gray-600">
                      {availableThemes.find(t => t.id === theme)?.description}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-3 pt-4">
        <button
          onClick={generatePresentation}
          disabled={!topic.trim()}
          className="flex-1 bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          <SparklesIcon className="w-4 h-4" />
          Generate Presentation
        </button>
        <button
          onClick={onClose}
          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
        >
          Cancel
        </button>
      </div>
    </div>
  );

  const renderGeneratingStep = () => (
    <div className="text-center space-y-6">
      <div className="flex justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600"></div>
      </div>
      
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Generating Your Presentation
        </h3>
        <p className="text-gray-600 mb-4">
          Our AI is creating a professional presentation about "{topic}"
        </p>
        
        <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
          <div 
            className="bg-purple-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${generationProgress}%` }}
          />
        </div>
        <p className="text-sm text-gray-500">{generationProgress}% complete</p>
      </div>

      <div className="text-left bg-blue-50 p-4 rounded-md">
        <h4 className="font-medium text-blue-900 mb-2">What's happening:</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>✓ Analyzing your topic and context</li>
          <li>✓ Creating presentation outline</li>
          <li>✓ Generating slide content</li>
          <li>✓ Applying professional theme</li>
          <li>✓ Finalizing presentation structure</li>
        </ul>
      </div>
    </div>
  );

  const renderEditingStep = () => {
    if (!presentation) return null;

    const currentSlide = presentation.slides[currentSlideIndex];

    return (
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {presentation.title}
            </h3>
            <p className="text-sm text-gray-600">
              Slide {currentSlideIndex + 1} of {presentation.slides.length}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setStep('preview')}
              className="flex items-center gap-2 px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              <EyeIcon className="w-4 h-4" />
              Preview
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex">
          {/* Slide Navigation */}
          <div className="w-64 border-r bg-gray-50 overflow-y-auto">
            <div className="p-4">
              <h4 className="font-medium text-gray-900 mb-3">Slides</h4>
              <div className="space-y-1">
                {presentation.slides.map((slide, index) => (
                  <button
                    key={slide.id}
                    onClick={() => setCurrentSlideIndex(index)}
                    className={`w-full text-left p-2 rounded-md text-sm ${
                      index === currentSlideIndex
                        ? 'bg-purple-100 text-purple-900 border border-purple-200'
                        : 'hover:bg-gray-100 text-gray-700'
                    }`}
                  >
                    <div className="font-medium truncate">{slide.title}</div>
                    <div className="text-xs text-gray-500 capitalize">{slide.type}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Slide Editor */}
          <div className="flex-1 flex flex-col">
            <div className="flex-1 p-6">
              <div className="max-w-4xl mx-auto">
                <div className="mb-6">
                  <input
                    type="text"
                    value={currentSlide.title}
                    onChange={(e) => {
                      const updatedSlides = [...presentation.slides];
                      updatedSlides[currentSlideIndex].title = e.target.value;
                      setPresentation({ ...presentation, slides: updatedSlides });
                    }}
                    className="w-full text-2xl font-bold border-none outline-none bg-transparent"
                    placeholder="Slide Title"
                  />
                </div>

                <PlateEditor
                  value={currentSlide.content}
                  onChange={(content) => {
                    const updatedSlides = [...presentation.slides];
                    updatedSlides[currentSlideIndex].content = content;
                    setPresentation({ ...presentation, slides: updatedSlides });
                  }}
                  placeholder="Enter slide content..."
                  className="min-h-[400px]"
                  enableToolbar={true}
                  enableImages={true}
                  enableLinks={true}
                />

                {/* Slide Notes */}
                {currentSlide.notes && (
                  <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                    <h5 className="font-medium text-yellow-800 mb-1">Speaker Notes:</h5>
                    <p className="text-sm text-yellow-700">{currentSlide.notes}</p>
                  </div>
                )}

                {/* Visual Suggestions */}
                {currentSlide.visualSuggestions && currentSlide.visualSuggestions.length > 0 && (
                  <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                    <h5 className="font-medium text-blue-800 mb-2">Visual Suggestions:</h5>
                    <ul className="text-sm text-blue-700 space-y-1">
                      {currentSlide.visualSuggestions.map((suggestion, index) => (
                        <li key={index}>• {suggestion}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="border-t p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentSlideIndex(Math.max(0, currentSlideIndex - 1))}
                    disabled={currentSlideIndex === 0}
                    className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                  >
                    <BackwardIcon className="w-5 h-5" />
                  </button>
                  <span className="text-sm text-gray-600">
                    {currentSlideIndex + 1} / {presentation.slides.length}
                  </span>
                  <button
                    onClick={() => setCurrentSlideIndex(Math.min(presentation.slides.length - 1, currentSlideIndex + 1))}
                    disabled={currentSlideIndex === presentation.slides.length - 1}
                    className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                  >
                    <ForwardIcon className="w-5 h-5" />
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setEditingSlide(currentSlide)}
                    className="flex items-center gap-2 px-3 py-1 text-sm bg-green-600 text-white rounded-md hover:bg-green-700"
                  >
                    <LightBulbIcon className="w-4 h-4" />
                    Improve with AI
                  </button>
                  
                  <div className="flex gap-1">
                    <button
                      onClick={() => exportPresentation('pdf')}
                      className="flex items-center gap-2 px-3 py-1 text-sm bg-gray-600 text-white rounded-md hover:bg-gray-700"
                    >
                      <DocumentArrowDownIcon className="w-4 h-4" />
                      Export
                    </button>
                    <button
                      onClick={sharePresentation}
                      className="flex items-center gap-2 px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                      <ShareIcon className="w-4 h-4" />
                      Share
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* AI Improvement Modal */}
        {editingSlide && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h4 className="text-lg font-semibold mb-4">Improve Slide with AI</h4>
              <p className="text-sm text-gray-600 mb-4">
                Provide feedback on how to improve this slide:
              </p>
              <textarea
                value={improvementFeedback}
                onChange={(e) => setImprovementFeedback(e.target.value)}
                placeholder="e.g., Make it more engaging, add more data points, simplify the language..."
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 mb-4"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => improveSlideContent(editingSlide.id)}
                  disabled={!improvementFeedback.trim() || isImproving}
                  className="flex-1 bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isImproving ? 'Improving...' : 'Improve'}
                </button>
                <button
                  onClick={() => {
                    setEditingSlide(null);
                    setImprovementFeedback('');
                  }}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderPreviewStep = () => {
    if (!presentation) return null;

    return (
      <div className="h-full flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold text-gray-900">
            Presentation Preview: {presentation.title}
          </h3>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setStep('editing')}
              className="flex items-center gap-2 px-3 py-1 text-sm bg-gray-600 text-white rounded-md hover:bg-gray-700"
            >
              <PencilIcon className="w-4 h-4" />
              Edit
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-4xl mx-auto space-y-8">
            {presentation.slides.map((slide, index) => (
              <div key={slide.id} className="bg-white border border-gray-200 rounded-lg p-8 shadow-sm">
                <div className="text-center mb-6">
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">
                    {slide.title}
                  </h2>
                  <div className="w-16 h-1 bg-purple-600 mx-auto"></div>
                </div>
                
                <div 
                  className="prose max-w-none"
                  dangerouslySetInnerHTML={{ __html: slide.content }}
                />

                {slide.visualSuggestions && slide.visualSuggestions.length > 0 && (
                  <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
                    <h4 className="font-medium text-blue-800 mb-2">Visual Suggestions:</h4>
                    <ul className="text-sm text-blue-700 space-y-1">
                      {slide.visualSuggestions.map((suggestion, idx) => (
                        <li key={idx}>• {suggestion}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="border-t p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={() => exportPresentation('pdf')}
                className="flex items-center gap-2 px-3 py-1 text-sm bg-gray-600 text-white rounded-md hover:bg-gray-700"
              >
                <DocumentArrowDownIcon className="w-4 h-4" />
                Export PDF
              </button>
              <button
                onClick={() => exportPresentation('pptx')}
                className="flex items-center gap-2 px-3 py-1 text-sm bg-gray-600 text-white rounded-md hover:bg-gray-700"
              >
                <DocumentArrowDownIcon className="w-4 h-4" />
                Export PPTX
              </button>
            </div>
            <button
              onClick={sharePresentation}
              className="flex items-center gap-2 px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              <ShareIcon className="w-4 h-4" />
              Share Presentation
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl h-[90vh] flex flex-col">
        {/* Header */}
        {step !== 'editing' && step !== 'preview' && (
          <div className="flex items-center justify-between p-6 border-b">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                AI Presentation Generator
              </h2>
              <p className="text-gray-600">
                Create professional research presentations with AI assistance
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
              <div className="flex items-center gap-2">
                <ExclamationTriangleIcon className="w-5 h-5 text-red-600" />
                <p className="text-red-800">{error}</p>
              </div>
            </div>
          )}

          {step === 'input' && renderInputStep()}
          {step === 'generating' && renderGeneratingStep()}
          {step === 'editing' && renderEditingStep()}
          {step === 'preview' && renderPreviewStep()}
        </div>
      </div>
    </div>
  );
};

export default AIPresentationModal;
