import React, { useState, useEffect } from 'react';
import Card, { CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import { 
  Presentation, 
  PresentationTemplate,
  PresentationSlide,
  SlideLayout,
  SlideContent,
  ChartData,
  TableData
} from '../types';

const AutomatedPresentationsPage: React.FC = () => {
  const [presentations, setPresentations] = useState<Presentation[]>([]);
  const [selectedPresentation, setSelectedPresentation] = useState<Presentation | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<PresentationTemplate | 'All'>('All');

  // Mock data for demonstration
  useEffect(() => {
    const mockPresentations: Presentation[] = [
      {
        id: '1',
        title: 'Cancer Immunotherapy Research Update - Q3 2024',
        description: 'Comprehensive update on our CAR-T cell therapy research progress, including preclinical results and next steps.',
        template: 'Research Update',
        slides: [
          {
            id: 'slide1',
            slideNumber: 1,
            title: 'Research Overview',
            content: {
              text: ['Cancer Immunotherapy Research Update', 'Q3 2024 Progress Report', 'Dr. Sarah Chen, Principal Investigator'],
              images: [],
              charts: [],
              tables: []
            },
            layout: 'Title',
            animations: [{ type: 'Fade', duration: 1000, delay: 0 }]
          },
          {
            id: 'slide2',
            slideNumber: 2,
            title: 'Project Objectives',
            content: {
              text: [
                'Develop novel CAR-T cell therapy for solid tumors',
                'Overcome tumor microenvironment barriers',
                'Improve therapeutic efficacy and safety',
                'Advance to clinical trials'
              ],
              images: [],
              charts: [],
              tables: []
            },
            layout: 'Content',
            animations: [{ type: 'Slide', duration: 800, delay: 200 }]
          },
          {
            id: 'slide3',
            slideNumber: 3,
            title: 'Methodology',
            content: {
              text: [
                'CRISPR-Cas9 gene editing of T cells',
                'In vitro activation and expansion',
                'Preclinical testing in mouse models',
                'Safety and efficacy evaluation'
              ],
              images: [],
              charts: [],
              tables: []
            },
            layout: 'Two Column',
            animations: [{ type: 'Zoom', duration: 600, delay: 400 }]
          },
          {
            id: 'slide4',
            slideNumber: 4,
            title: 'Results Summary',
            content: {
              text: ['Key Findings:'],
              images: [],
              charts: [
                {
                  id: 'chart1',
                  type: 'bar',
                  title: 'Tumor Growth Inhibition',
                  data: [
                    { group: 'Control', value: 100 },
                    { group: 'Standard CAR-T', value: 65 },
                    { group: 'Enhanced CAR-T', value: 25 }
                  ],
                  options: { color: 'blue' }
                }
              ],
              tables: [
                {
                  id: 'table1',
                  title: 'Treatment Response Rates',
                  headers: ['Treatment Group', 'Complete Response', 'Partial Response', 'No Response'],
                  rows: [
                    ['Control', '0%', '0%', '100%'],
                    ['Standard CAR-T', '15%', '45%', '40%'],
                    ['Enhanced CAR-T', '60%', '30%', '10%']
                  ],
                  summary: 'Enhanced CAR-T shows significantly improved response rates'
                }
              ]
            },
            layout: 'Data Chart',
            animations: [{ type: 'Fade', duration: 1000, delay: 600 }]
          },
          {
            id: 'slide5',
            slideNumber: 5,
            title: 'Next Steps',
            content: {
              text: [
                'Complete safety studies',
                'Scale up production',
                'Submit IND application',
                'Plan Phase I clinical trial',
                'Collaborate with clinical partners'
              ],
              images: [],
              charts: [],
              tables: []
            },
            layout: 'Content',
            animations: [{ type: 'Slide', duration: 800, delay: 800 }]
          }
        ],
        dataSources: ['Lab notebook entries', 'Experimental results', 'Statistical analysis', 'Literature review'],
        generatedAt: new Date('2024-08-10'),
        lastModified: new Date('2024-08-12'),
        exportedFormats: ['PDF', 'PowerPoint', 'Keynote'],
        sharedWith: ['lab-members', 'collaborators']
      },
      {
        id: '2',
        title: 'CRISPR Safety Analysis Report',
        description: 'Comprehensive analysis of CRISPR-Cas9 off-target effects and safety measures in our gene editing protocols.',
        template: 'Lab Meeting',
        slides: [
          {
            id: 'slide1',
            slideNumber: 1,
            title: 'CRISPR Safety Analysis',
            content: {
              text: ['CRISPR-Cas9 Safety Analysis', 'Off-Target Effects Assessment', 'Dr. Michael Rodriguez'],
              images: [],
              charts: [],
              tables: []
            },
            layout: 'Title',
            animations: [{ type: 'Fade', duration: 1000, delay: 0 }]
          },
          {
            id: 'slide2',
            slideNumber: 2,
            title: 'Safety Measures Implemented',
            content: {
              text: [
                'High-fidelity Cas9 variants',
                'Computational off-target prediction',
                'Comprehensive sequencing validation',
                'Multiple safety checkpoints'
              ],
              images: [],
              charts: [],
              tables: []
            },
            layout: 'Content',
            animations: [{ type: 'Slide', duration: 800, delay: 200 }]
          }
        ],
        dataSources: ['CRISPR validation data', 'Sequencing results', 'Safety protocols'],
        generatedAt: new Date('2024-08-08'),
        lastModified: new Date('2024-08-09'),
        exportedFormats: ['PDF', 'PowerPoint'],
        sharedWith: ['lab-members']
      }
    ];

    setPresentations(mockPresentations);
  }, []);

  const handleCreatePresentation = (presentation: Omit<Presentation, 'id' | 'generatedAt' | 'lastModified' | 'slides'>) => {
    const newPresentation: Presentation = {
      ...presentation,
      id: Date.now().toString(),
      generatedAt: new Date(),
      lastModified: new Date(),
      slides: generateDefaultSlides(presentation.template, presentation.title)
    };
    setPresentations(prev => [newPresentation, ...prev]);
    setShowCreateForm(false);
  };

  const generateDefaultSlides = (template: PresentationTemplate, title: string): PresentationSlide[] => {
    const baseSlides: PresentationSlide[] = [
      {
        id: 'title-slide',
        slideNumber: 1,
        title: 'Title Slide',
        content: {
          text: [title, 'Generated by Digital Research Manager', new Date().toLocaleDateString()],
          images: [],
          charts: [],
          tables: []
        },
        layout: 'Title',
        animations: [{ type: 'Fade', duration: 1000, delay: 0 }]
      }
    ];

    switch (template) {
      case 'Research Update':
        return [
          ...baseSlides,
          {
            id: 'overview',
            slideNumber: 2,
            title: 'Research Overview',
            content: {
              text: ['Project Background', 'Current Status', 'Key Achievements'],
              images: [],
              charts: [],
              tables: []
            },
            layout: 'Content',
            animations: [{ type: 'Slide', duration: 800, delay: 200 }]
          },
          {
            id: 'results',
            slideNumber: 3,
            title: 'Results & Data',
            content: {
              text: ['Experimental Results', 'Data Analysis', 'Key Findings'],
              images: [],
              charts: [],
              tables: []
            },
            layout: 'Data Chart',
            animations: [{ type: 'Zoom', duration: 600, delay: 400 }]
          },
          {
            id: 'next-steps',
            slideNumber: 4,
            title: 'Next Steps',
            content: {
              text: ['Future Plans', 'Timeline', 'Collaborations'],
              images: [],
              charts: [],
              tables: []
            },
            layout: 'Content',
            animations: [{ type: 'Slide', duration: 800, delay: 600 }]
          }
        ];
      case 'Conference Talk':
        return [
          ...baseSlides,
          {
            id: 'introduction',
            slideNumber: 2,
            title: 'Introduction',
            content: {
              text: ['Research Question', 'Background', 'Hypothesis'],
              images: [],
              charts: [],
              tables: []
            },
            layout: 'Content',
            animations: [{ type: 'Slide', duration: 800, delay: 200 }]
          },
          {
            id: 'methods',
            slideNumber: 3,
            title: 'Methods',
            content: {
              text: ['Experimental Design', 'Protocols', 'Analysis Methods'],
              images: [],
              charts: [],
              tables: []
            },
            layout: 'Two Column',
            animations: [{ type: 'Zoom', duration: 600, delay: 400 }]
          },
          {
            id: 'results',
            slideNumber: 4,
            title: 'Results',
            content: {
              text: ['Key Results', 'Data Visualization', 'Statistical Analysis'],
              images: [],
              charts: [],
              tables: []
            },
            layout: 'Data Chart',
            animations: [{ type: 'Fade', duration: 1000, delay: 600 }]
          },
          {
            id: 'conclusion',
            slideNumber: 5,
            title: 'Conclusion',
            content: {
              text: ['Summary', 'Implications', 'Future Directions'],
              images: [],
              charts: [],
              tables: []
            },
            layout: 'Conclusion',
            animations: [{ type: 'Slide', duration: 800, delay: 800 }]
          }
        ];
      default:
        return baseSlides;
    }
  };

  const handleExportPresentation = (presentationId: string, format: string) => {
    // Mock export functionality
    console.log(`Exporting presentation ${presentationId} in ${format} format`);
    alert(`Presentation exported as ${format}!`);
  };

  const handleSharePresentation = (presentationId: string, recipients: string[]) => {
    // Mock sharing functionality
    console.log(`Sharing presentation ${presentationId} with:`, recipients);
    alert(`Presentation shared with ${recipients.length} recipients!`);
  };

  const filteredPresentations = presentations.filter(presentation => {
    const matchesSearch = presentation.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         presentation.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTemplate = selectedTemplate === 'All' || presentation.template === selectedTemplate;
    return matchesSearch && matchesTemplate;
  });

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Automated Presentations</h1>
          <p className="text-gray-600">
            Generate professional presentations and reports from your research data. Our AI-powered system 
            creates compelling slides with your experimental results, charts, and insights.
          </p>
        </div>

        {/* Controls */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-wrap gap-4 items-center justify-between">
            <div className="flex gap-4 flex-1">
              <Input
                placeholder="Search presentations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-xs"
              />
              <Select
                value={selectedTemplate}
                onChange={(e) => setSelectedTemplate(e.target.value as PresentationTemplate | 'All')}
                className="max-w-xs"
              >
                <option value="All">All Templates</option>
                <option value="Research Update">Research Update</option>
                <option value="Conference Talk">Conference Talk</option>
                <option value="Lab Meeting">Lab Meeting</option>
                <option value="Grant Proposal">Grant Proposal</option>
                <option value="Thesis Defense">Thesis Defense</option>
                <option value="Journal Club">Journal Club</option>
                <option value="Custom">Custom</option>
              </Select>
            </div>
            <div className="flex gap-4">
              <Button onClick={() => setShowCreateForm(true)}>
                Create New Presentation
              </Button>
            </div>
          </div>
        </div>

        {/* Presentations Grid */}
        <div className="grid gap-6">
          {filteredPresentations.map(presentation => (
            <Card key={presentation.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-600">
                        {presentation.template}
                      </span>
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-600">
                        {presentation.slides.length} slides
                      </span>
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-600">
                        {presentation.dataSources.length} data sources
                      </span>
                    </div>
                    <CardTitle className="text-lg mb-2 cursor-pointer hover:text-blue-600"
                               onClick={() => setSelectedPresentation(presentation)}>
                      {presentation.title}
                    </CardTitle>
                    <p className="text-gray-600 text-sm mb-3">{presentation.description}</p>
                    <div className="text-sm text-gray-500 mb-2">
                      Generated: {presentation.generatedAt.toLocaleDateString()} • 
                      Last modified: {presentation.lastModified.toLocaleDateString()}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {presentation.exportedFormats.map(format => (
                        <span key={format} className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                          {format}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="text-right text-sm text-gray-500 ml-4">
                    <div className="flex items-center gap-4 mt-2">
                      <span>📊 {presentation.slides.length}</span>
                      <span>📅 {presentation.dataSources.length}</span>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center">
                  <div className="text-sm text-gray-600">
                    <span className="font-medium">Data Sources:</span> {presentation.dataSources.join(', ')}
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      onClick={() => setSelectedPresentation(presentation)}
                      className="text-blue-600 border-blue-600 hover:bg-blue-50"
                    >
                      View & Edit
                    </Button>
                    <Select
                      onChange={(e) => handleExportPresentation(presentation.id, e.target.value)}
                      className="max-w-xs"
                    >
                      <option value="">Export as...</option>
                      {presentation.exportedFormats.map(format => (
                        <option key={format} value={format}>{format}</option>
                      ))}
                    </Select>
                    <Button 
                      variant="outline" 
                      onClick={() => handleSharePresentation(presentation.id, ['lab-members'])}
                      className="text-green-600 border-green-600 hover:bg-green-50"
                    >
                      Share
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Create Presentation Form Modal */}
        {showCreateForm && (
          <CreatePresentationForm 
            onSubmit={handleCreatePresentation}
            onCancel={() => setShowCreateForm(false)}
          />
        )}

        {/* Presentation Detail Modal */}
        {selectedPresentation && (
          <PresentationDetailModal
            presentation={selectedPresentation}
            onClose={() => setSelectedPresentation(null)}
            onEdit={() => setShowEditForm(true)}
          />
        )}
      </div>
    </div>
  );
};

// Create Presentation Form Component
const CreatePresentationForm: React.FC<{
  onSubmit: (presentation: Omit<Presentation, 'id' | 'generatedAt' | 'lastModified' | 'slides'>) => void;
  onCancel: () => void;
}> = ({ onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    template: 'Research Update' as PresentationTemplate,
    dataSources: '',
    sharedWith: [] as string[]
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      dataSources: formData.dataSources.split(',').map(source => source.trim()).filter(Boolean),
      exportedFormats: ['PDF', 'PowerPoint']
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-4">Create New Presentation</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="e.g., Research Update Q3 2024"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Brief description of the presentation content and purpose"
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={3}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Template</label>
            <Select
              value={formData.template}
              onChange={(e) => setFormData(prev => ({ ...prev, template: e.target.value as PresentationTemplate }))}
              required
            >
              <option value="Research Update">Research Update</option>
              <option value="Conference Talk">Conference Talk</option>
              <option value="Lab Meeting">Lab Meeting</option>
              <option value="Grant Proposal">Grant Proposal</option>
              <option value="Thesis Defense">Thesis Defense</option>
              <option value="Journal Club">Journal Club</option>
              <option value="Custom">Custom</option>
            </Select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Data Sources (comma-separated)</label>
            <Input
              value={formData.dataSources}
              onChange={(e) => setFormData(prev => ({ ...prev, dataSources: e.target.value }))}
              placeholder="e.g., Lab notebook, Experimental results, Literature review"
              required
            />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit">
              Generate Presentation
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Presentation Detail Modal Component
const PresentationDetailModal: React.FC<{
  presentation: Presentation;
  onClose: () => void;
  onEdit: () => void;
}> = ({ presentation, onClose, onEdit }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-2xl font-bold">{presentation.title}</h2>
          <Button variant="outline" onClick={onClose}>✕</Button>
        </div>

        {/* Presentation Info */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">Template:</span> {presentation.template}
            </div>
            <div>
              <span className="font-medium">Slides:</span> {presentation.slides.length}
            </div>
            <div>
              <span className="font-medium">Generated:</span> {presentation.generatedAt.toLocaleDateString()}
            </div>
            <div>
              <span className="font-medium">Last Modified:</span> {presentation.lastModified.toLocaleDateString()}
            </div>
          </div>
          <div className="mt-3">
            <span className="font-medium">Data Sources:</span> {presentation.dataSources.join(', ')}
          </div>
        </div>

        {/* Slides Preview */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3">Slides Preview</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {presentation.slides.map(slide => (
              <div key={slide.id} className="border border-gray-200 rounded-lg p-4 bg-white">
                <div className="text-sm font-medium text-gray-900 mb-2">
                  Slide {slide.slideNumber}: {slide.title}
                </div>
                <div className="text-xs text-gray-600 mb-2">
                  Layout: {slide.layout}
                </div>
                <div className="text-xs text-gray-500">
                  {slide.content.text.length > 0 && `Text: ${slide.content.text.length} elements`}
                  {slide.content.charts.length > 0 && ` • Charts: ${slide.content.charts.length}`}
                  {slide.content.tables.length > 0 && ` • Tables: ${slide.content.tables.length}`}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onEdit}>
            Edit Presentation
          </Button>
          <Button>
            Export Presentation
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AutomatedPresentationsPage;
