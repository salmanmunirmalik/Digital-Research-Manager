import React, { useState, useRef, useEffect } from 'react';
import { 
  BoldIcon, 
  ItalicIcon, 
  UnderlineIcon,
  ListBulletIcon,
  NumberedListIcon,
  Bars3BottomLeftIcon,
  Bars3Icon,
  Bars3BottomRightIcon,
  PaletteIcon,
  PhotoIcon,
  LinkIcon,
  CodeBracketIcon,
  PlusIcon,
  TrashIcon,
  EyeIcon,
  ShareIcon,
  ArrowDownTrayIcon,
  SparklesIcon,
  DocumentArrowDownIcon,
  DocumentTextIcon,
  CodeBracketSquareIcon
} from '@heroicons/react/24/outline';
import { SaveIcon } from './icons';
import { exportService, ExportOptions } from './ExportService';

interface Slide {
  id: string;
  title: string;
  content: string;
  type: 'title' | 'content' | 'image' | 'chart';
  order: number;
  theme?: string;
}

interface Presentation {
  id: string;
  title: string;
  slides: Slide[];
  theme: string;
  createdAt: string;
  updatedAt: string;
}

interface AdvancedPresentationEditorProps {
  presentation?: Presentation;
  onSave?: (presentation: Presentation) => void;
  onClose?: () => void;
}

const AdvancedPresentationEditor: React.FC<AdvancedPresentationEditorProps> = ({
  presentation,
  onSave,
  onClose
}) => {
  const [currentPresentation, setCurrentPresentation] = useState<Presentation>(
    presentation || {
      id: `presentation-${Date.now()}`,
      title: 'Untitled Presentation',
      slides: [
        {
          id: 'slide-1',
          title: 'Welcome',
          content: 'Click to edit this slide...',
          type: 'title',
          order: 1
        }
      ],
      theme: 'research-professional',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  );

  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showExportOptions, setShowExportOptions] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const editorRef = useRef<HTMLDivElement>(null);

  const currentSlide = currentPresentation.slides[currentSlideIndex];

  const themes = [
    { id: 'research-professional', name: 'Research Professional', colors: ['#2563eb', '#64748b'] },
    { id: 'academic-classic', name: 'Academic Classic', colors: ['#1e40af', '#6b7280'] },
    { id: 'modern-scientific', name: 'Modern Scientific', colors: ['#7c3aed', '#059669'] },
    { id: 'lab-meeting', name: 'Lab Meeting', colors: ['#dc2626', '#f59e0b'] },
    { id: 'conference', name: 'Conference', colors: ['#059669', '#0ea5e9'] }
  ];

  const slideTemplates = [
    {
      id: 'title-slide',
      name: 'Title Slide',
      template: { title: 'Presentation Title', content: 'Subtitle or description', type: 'title' as const }
    },
    {
      id: 'content-slide',
      name: 'Content Slide',
      template: { title: 'Slide Title', content: 'Your content here...', type: 'content' as const }
    },
    {
      id: 'image-slide',
      name: 'Image Slide',
      template: { title: 'Image Title', content: 'Description of the image', type: 'image' as const }
    },
    {
      id: 'chart-slide',
      name: 'Chart Slide',
      template: { title: 'Chart Title', content: 'Chart description and insights', type: 'chart' as const }
    }
  ];

  const handleSlideUpdate = (field: keyof Slide, value: string) => {
    const updatedSlides = [...currentPresentation.slides];
    updatedSlides[currentSlideIndex] = {
      ...updatedSlides[currentSlideIndex],
      [field]: value
    };

    setCurrentPresentation({
      ...currentPresentation,
      slides: updatedSlides,
      updatedAt: new Date().toISOString()
    });
  };

  const addSlide = (template?: typeof slideTemplates[0]) => {
    const newSlide: Slide = {
      id: `slide-${Date.now()}`,
      title: template?.template.title || 'New Slide',
      content: template?.template.content || 'Click to edit...',
      type: template?.template.type || 'content',
      order: currentPresentation.slides.length + 1
    };

    setCurrentPresentation({
      ...currentPresentation,
      slides: [...currentPresentation.slides, newSlide],
      updatedAt: new Date().toISOString()
    });

    setCurrentSlideIndex(currentPresentation.slides.length);
    setShowTemplates(false);
  };

  const deleteSlide = (slideId: string) => {
    if (currentPresentation.slides.length <= 1) return;

    const updatedSlides = currentPresentation.slides.filter(slide => slide.id !== slideId);
    const newIndex = Math.max(0, currentSlideIndex - 1);

    setCurrentPresentation({
      ...currentPresentation,
      slides: updatedSlides,
      updatedAt: new Date().toISOString()
    });

    setCurrentSlideIndex(newIndex);
  };

  const generateWithAI = async () => {
    setIsGenerating(true);
    try {
      // Simulate AI generation
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const aiSlides: Slide[] = [
        {
          id: 'ai-slide-1',
          title: 'AI Generated Content',
          content: 'This slide was generated using AI based on your presentation topic.',
          type: 'content',
          order: currentPresentation.slides.length + 1
        },
        {
          id: 'ai-slide-2',
          title: 'Key Insights',
          content: 'AI has identified key insights for your presentation.',
          type: 'content',
          order: currentPresentation.slides.length + 2
        }
      ];

      setCurrentPresentation({
        ...currentPresentation,
        slides: [...currentPresentation.slides, ...aiSlides],
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('AI generation failed:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = () => {
    if (onSave) {
      onSave(currentPresentation);
    }
  };

  const exportPresentation = async (format: 'pdf' | 'html' | 'json') => {
    setIsExporting(true);
    try {
      const options: ExportOptions = {
        format,
        quality: 'high',
        includeNotes: false,
        theme: currentPresentation.theme
      };

      const filename = `${currentPresentation.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${new Date().toISOString().split('T')[0]}`;

      switch (format) {
        case 'pdf':
          const pdfBlob = await exportService.exportToPDF(currentPresentation, options);
          exportService.downloadFile(pdfBlob, `${filename}.pdf`);
          break;
        case 'html':
          const html = await exportService.exportToHTML(currentPresentation, options);
          exportService.downloadHTML(html, `${filename}.html`);
          break;
        case 'json':
          const json = await exportService.exportToJSON(currentPresentation);
          exportService.downloadJSON(json, `${filename}.json`);
          break;
      }
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please try again.');
    } finally {
      setIsExporting(false);
      setShowExportOptions(false);
    }
  };

  const sharePresentation = async () => {
    try {
      await exportService.sharePresentation(currentPresentation);
    } catch (error) {
      console.error('Share failed:', error);
      alert('Share failed. Please try again.');
    }
  };

  const currentTheme = themes.find(theme => theme.id === currentPresentation.theme);

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <input
            type="text"
            value={currentPresentation.title}
            onChange={(e) => setCurrentPresentation({
              ...currentPresentation,
              title: e.target.value,
              updatedAt: new Date().toISOString()
            })}
            className="w-full text-lg font-semibold border-none outline-none bg-transparent"
            placeholder="Presentation Title"
          />
        </div>

        {/* Theme Selector */}
        <div className="p-4 border-b border-gray-200">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Theme
          </label>
          <select
            value={currentPresentation.theme}
            onChange={(e) => setCurrentPresentation({
              ...currentPresentation,
              theme: e.target.value,
              updatedAt: new Date().toISOString()
            })}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {themes.map(theme => (
              <option key={theme.id} value={theme.id}>
                {theme.name}
              </option>
            ))}
          </select>
        </div>

        {/* Slides List */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-700">Slides</h3>
            <div className="flex gap-2">
              <button
                onClick={() => setShowTemplates(true)}
                className="p-1 text-gray-500 hover:text-blue-600 transition-colors"
                title="Add Slide"
              >
                <PlusIcon className="w-4 h-4" />
              </button>
              <button
                onClick={generateWithAI}
                disabled={isGenerating}
                className="p-1 text-gray-500 hover:text-purple-600 transition-colors disabled:opacity-50"
                title="Generate with AI"
              >
                <SparklesIcon className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          <div className="space-y-2">
            {currentPresentation.slides.map((slide, index) => (
              <div
                key={slide.id}
                className={`p-3 rounded-lg border cursor-pointer transition-all ${
                  index === currentSlideIndex
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setCurrentSlideIndex(index)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900 truncate">
                      {slide.title || `Slide ${index + 1}`}
                    </div>
                    <div className="text-xs text-gray-500 truncate">
                      {slide.content.substring(0, 50)}...
                    </div>
                  </div>
                  {currentPresentation.slides.length > 1 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteSlide(slide.id);
                      }}
                      className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                    >
                      <TrashIcon className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="p-4 border-t border-gray-200 space-y-2">
          <button
            onClick={handleSave}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md flex items-center justify-center gap-2 transition-colors"
          >
            <SaveIcon className="w-4 h-4" />
            Save Presentation
          </button>
          <div className="flex gap-2">
            <button
              onClick={() => setShowExportOptions(true)}
              disabled={isExporting}
              className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded-md flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
            >
              <ArrowDownTrayIcon className={`w-4 h-4 ${isExporting ? 'animate-spin' : ''}`} />
              {isExporting ? 'Exporting...' : 'Export'}
            </button>
            <button
              onClick={sharePresentation}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-md flex items-center justify-center gap-2 transition-colors"
            >
              <ShareIcon className="w-4 h-4" />
              Share
            </button>
          </div>
        </div>
      </div>

      {/* Main Editor */}
      <div className="flex-1 flex flex-col">
        {/* Toolbar */}
        <div className="bg-white border-b border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsEditing(!isEditing)}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                  isEditing
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {isEditing ? 'Preview' : 'Edit'}
              </button>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">
                Slide {currentSlideIndex + 1} of {currentPresentation.slides.length}
              </span>
              <div className="flex gap-1">
                <button
                  onClick={() => setCurrentSlideIndex(Math.max(0, currentSlideIndex - 1))}
                  disabled={currentSlideIndex === 0}
                  className="p-2 text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  ←
                </button>
                <button
                  onClick={() => setCurrentSlideIndex(Math.min(currentPresentation.slides.length - 1, currentSlideIndex + 1))}
                  disabled={currentSlideIndex === currentPresentation.slides.length - 1}
                  className="p-2 text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  →
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Slide Editor */}
        <div className="flex-1 p-8">
          <div 
            className="w-full h-full bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden"
            style={{
              background: currentTheme?.colors[0] ? `linear-gradient(135deg, ${currentTheme.colors[0]}20, ${currentTheme.colors[1]}20)` : undefined
            }}
          >
            <div className="h-full flex flex-col items-center justify-center p-12">
              {isEditing ? (
                <div className="w-full max-w-4xl space-y-8">
                  <input
                    type="text"
                    value={currentSlide.title}
                    onChange={(e) => handleSlideUpdate('title', e.target.value)}
                    className="w-full text-4xl font-bold text-center border-none outline-none bg-transparent placeholder-gray-400"
                    placeholder="Slide Title"
                  />
                  <textarea
                    value={currentSlide.content}
                    onChange={(e) => handleSlideUpdate('content', e.target.value)}
                    className="w-full text-lg text-center border-none outline-none bg-transparent placeholder-gray-400 resize-none"
                    rows={8}
                    placeholder="Slide content..."
                  />
                </div>
              ) : (
                <div className="w-full max-w-4xl space-y-8">
                  <h1 className="text-4xl font-bold text-center">
                    {currentSlide.title || 'Slide Title'}
                  </h1>
                  <div className="text-lg text-center whitespace-pre-wrap">
                    {currentSlide.content || 'Slide content...'}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Slide Templates Modal */}
      {showTemplates && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Choose Slide Template</h3>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-2 gap-4">
                {slideTemplates.map(template => (
                  <button
                    key={template.id}
                    onClick={() => addSlide(template)}
                    className="p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors text-left"
                  >
                    <div className="font-medium text-gray-900">{template.template.title}</div>
                    <div className="text-sm text-gray-500 mt-1">{template.name}</div>
                  </button>
                ))}
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 flex justify-end">
              <button
                onClick={() => setShowTemplates(false)}
                className="px-4 py-2 text-gray-700 hover:text-gray-900 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Export Options Modal */}
      {showExportOptions && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Export Presentation</h3>
              <p className="text-gray-600 mt-1">Choose your preferred export format</p>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <button
                  onClick={() => exportPresentation('pdf')}
                  disabled={isExporting}
                  className="w-full p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors text-left disabled:opacity-50"
                >
                  <div className="flex items-center gap-3">
                    <DocumentArrowDownIcon className="w-6 h-6 text-red-600" />
                    <div>
                      <div className="font-medium text-gray-900">PDF Document</div>
                      <div className="text-sm text-gray-500">High-quality PDF for printing and sharing</div>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => exportPresentation('html')}
                  disabled={isExporting}
                  className="w-full p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors text-left disabled:opacity-50"
                >
                  <div className="flex items-center gap-3">
                    <DocumentTextIcon className="w-6 h-6 text-blue-600" />
                    <div>
                      <div className="font-medium text-gray-900">HTML Web Page</div>
                      <div className="text-sm text-gray-500">Interactive web version with styling</div>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => exportPresentation('json')}
                  disabled={isExporting}
                  className="w-full p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors text-left disabled:opacity-50"
                >
                  <div className="flex items-center gap-3">
                    <CodeBracketSquareIcon className="w-6 h-6 text-green-600" />
                    <div>
                      <div className="font-medium text-gray-900">JSON Data</div>
                      <div className="text-sm text-gray-500">Raw data format for backup and integration</div>
                    </div>
                  </div>
                </button>
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 flex justify-end">
              <button
                onClick={() => setShowExportOptions(false)}
                disabled={isExporting}
                className="px-4 py-2 text-gray-700 hover:text-gray-900 transition-colors disabled:opacity-50"
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

export default AdvancedPresentationEditor;
