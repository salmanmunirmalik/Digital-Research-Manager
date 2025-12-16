import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Card, { CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import ProtocolAIAssistant from '../components/ProtocolAIAssistant';
import ProtocolExecutionMode from '../components/ProtocolExecutionMode';
import ProtocolExecutionModeMobile from '../components/ProtocolExecutionModeMobile';
import ProtocolCollaborationPanel from '../components/ProtocolCollaborationPanel';
import { 
  ClockIcon, 
  CheckCircleIcon, 
  StarIcon,
  PlayIcon,
  BookOpenIcon,
  ShieldCheckIcon,
  AcademicCapIcon,
  FireIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  LightBulbIcon,
  ExclamationTriangleIcon,
  UserGroupIcon,
  ClipboardDocumentCheckIcon,
  ShareIcon,
  BookmarkIcon,
  ArrowDownTrayIcon,
  PrinterIcon,
  SparklesIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';
import { XMarkIcon, RocketLaunchIcon, LanguageIcon } from '../components/icons';

interface Protocol {
  id: string;
  title: string;
  description: string;
  category: string;
  status: 'draft' | 'published' | 'archived';
  version: string;
  last_updated: string;
  author: string;
  institution: string;
  usage_count: number;
  success_rate: number;
  rating: number;
  total_ratings: number;
  video_url?: string;
  
  // Core protocol data
  objective: string;
  background: string;
  materials: string[];
  equipment: string[];
  safety_notes: string[];
  procedure: ProtocolStep[];
  expected_results: string;
  troubleshooting: { issue: string; solution: string }[];
  references: string[];
  tags: string[];
}

interface Material {
  name: string;
  quantity: string;
  unit: string;
  concentration?: string;
  supplier?: string;
  catalog_number?: string;
  storage_conditions?: string;
}

interface Equipment {
  name: string;
  model?: string;
  calibration_required: boolean;
  maintenance_schedule?: string;
}

const ProtocolsPage: React.FC = () => {
  const { user } = useAuth();
  const [protocols, setProtocols] = useState<Protocol[]>([]);
  const [selectedProtocol, setSelectedProtocol] = useState<Protocol | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showAIAssistant, setShowAIAssistant] = useState(false);
  const [showExecutionMode, setShowExecutionMode] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showCollaboration, setShowCollaboration] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [isSaved, setIsSaved] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'timeline'>('grid');
  const [language, setLanguage] = useState('en');
  const [searchResults, setSearchResults] = useState<Protocol[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [recommendations, setRecommendations] = useState<Protocol[]>([]);
  const [isMobile, setIsMobile] = useState(false);

  // Mock protocols with realistic data
  const mockProtocols: Protocol[] = [
    {
      id: '1',
      title: 'Western Blotting: Protein Detection & Quantification',
      description: 'A comprehensive protocol for detecting and quantifying specific proteins using Western Blot technique',
      category: 'Protein Analysis',
      status: 'published',
      version: '3.2',
      last_updated: '2024-01-15',
      author: 'Dr. Sarah Chen',
      institution: 'University Research Lab',
      usage_count: 1247,
      success_rate: 94.5,
      rating: 4.6,
      total_ratings: 89,
      video_url: 'https://www.youtube.com/embed/LMsz-p9-a90',
      objective: 'Detect and quantify specific proteins using Western Blot technique',
      background: 'Western Blot is a widely used technique for protein detection and quantification in biological samples. It combines SDS-PAGE electrophoresis with protein transfer to a membrane and specific antibody detection.',
      materials: [
        {
          name: 'SDS-PAGE gel',
          quantity: '1',
          unit: 'gel',
          concentration: '10% acrylamide',
          supplier: 'Bio-Rad',
          catalog_number: '456-1093',
          storage_conditions: 'Store at 4°C'
        },
        {
          name: 'Transfer buffer',
          quantity: '1',
          unit: 'L',
          concentration: '1x',
          supplier: 'Bio-Rad',
          catalog_number: '170-3935',
          storage_conditions: 'Store at room temperature'
        },
        {
          name: 'PVDF membrane',
          quantity: '1',
          unit: 'membrane',
          supplier: 'Millipore',
          catalog_number: 'IPVH00010',
          storage_conditions: 'Store at room temperature'
        },
        {
          name: 'Primary antibody',
          quantity: 'Variable',
          unit: 'µL',
          concentration: 'Variable',
          supplier: 'Variable',
          storage_conditions: 'Store at 4°C or -20°C'
        },
        {
          name: 'Secondary antibody',
          quantity: 'Variable',
          unit: 'µL',
          concentration: 'Variable',
          supplier: 'Variable',
          storage_conditions: 'Store at 4°C or -20°C'
        },
        {
          name: 'ECL substrate',
          quantity: '1',
          unit: 'kit',
          supplier: 'Thermo Fisher',
          catalog_number: '32106',
          storage_conditions: 'Store at 4°C, protect from light'
        },
        {
          name: 'Blocking buffer',
          quantity: '50',
          unit: 'mL',
          concentration: '5% BSA',
          storage_conditions: 'Store at 4°C'
        },
        {
          name: 'TBST buffer',
          quantity: '1',
          unit: 'L',
          concentration: '1x',
          storage_conditions: 'Store at room temperature'
        }
      ],
      equipment: [
        {
          name: 'Electrophoresis apparatus',
          model: 'Mini-PROTEAN Tetra System',
          calibration_required: false,
          maintenance_schedule: 'Clean after each use'
        },
        {
          name: 'Transfer apparatus',
          model: 'Mini Trans-Blot Cell',
          calibration_required: false,
          maintenance_schedule: 'Clean after each use'
        },
        {
          name: 'Power supply',
          model: 'Bio-Rad PowerPac HC',
          calibration_required: true,
          maintenance_schedule: 'Annual calibration'
        },
        {
          name: 'Membrane transfer cassette',
          calibration_required: false,
          maintenance_schedule: 'Clean after each use'
        },
        {
          name: 'Chemiluminescence imager',
          model: 'Bio-Rad ChemiDoc MP',
          calibration_required: true,
          maintenance_schedule: 'Quarterly calibration'
        }
      ],
      safety_notes: [
        'Wear gloves and lab coat at all times',
        'Methanol is flammable - use in well-ventilated area',
        'Avoid direct contact with acrylamide (neurotoxic)',
        'Dispose of waste according to institutional guidelines'
      ],
      procedure: [
        {
          id: 1,
          title: 'Sample Preparation',
          description: 'Prepare protein samples in Laemmli buffer. Heat at 95°C for 5 minutes. Load 20-30 µg protein per lane.',
          duration: 15,
          critical: true,
          materials_needed: [
            { name: 'Protein samples', quantity: 'Variable', unit: 'µL' },
            { name: 'Laemmli buffer', quantity: '10', unit: 'µL' },
            { name: 'Heat block', quantity: '1', unit: 'unit' }
          ],
          tips: ['Ensure protein concentration is accurately measured', 'Keep samples on ice until ready to load']
        },
        {
          id: 2,
          title: 'Electrophoresis',
          description: 'Load samples onto SDS-PAGE gel. Run at 120V until dye front reaches bottom of gel (approximately 90 minutes).',
          duration: 90,
          critical: true,
          materials_needed: [
            { name: 'SDS-PAGE gel', quantity: '1', unit: 'gel' },
            { name: 'Running buffer', quantity: '500', unit: 'mL' }
          ],
          warnings: ['Do not exceed voltage limits', 'Monitor gel temperature'],
          tips: ['Use protein ladder for molecular weight reference']
        },
        {
          id: 3,
          title: 'Protein Transfer',
          description: 'Transfer proteins to PVDF membrane using wet transfer method at 100V for 60 minutes in cold room.',
          duration: 60,
          critical: true,
          materials_needed: [
            { name: 'PVDF membrane', quantity: '1', unit: 'membrane' },
            { name: 'Transfer buffer', quantity: '1', unit: 'L' },
            { name: 'Filter paper', quantity: '4', unit: 'sheets' }
          ],
          warnings: ['Methanol is flammable - work in well-ventilated area'],
          tips: ['Ensure good contact between gel and membrane', 'Use cold transfer buffer']
        },
        {
          id: 4,
          title: 'Blocking',
          description: 'Block membrane with 5% BSA in TBST for 1 hour at room temperature with gentle shaking.',
          duration: 60,
          critical: false,
          materials_needed: [
            { name: '5% BSA', quantity: '50', unit: 'mL' },
            { name: 'TBST buffer', quantity: '500', unit: 'mL' },
            { name: 'Shaker', quantity: '1', unit: 'unit' }
          ],
          tips: ['Ensure complete coverage of membrane']
        },
        {
          id: 5,
          title: 'Primary Antibody Incubation',
          description: 'Incubate membrane with primary antibody diluted in blocking buffer overnight at 4°C.',
          duration: 960,
          critical: true,
          materials_needed: [
            { name: 'Primary antibody', quantity: 'Variable', unit: 'µL' },
            { name: 'Blocking buffer', quantity: '10', unit: 'mL' }
          ],
          tips: ['Use optimal antibody dilution', 'Store membrane at 4°C']
        },
        {
          id: 6,
          title: 'Washing',
          description: 'Wash membrane 3 times for 5 minutes each in TBST with gentle shaking.',
          duration: 15,
          critical: true,
          materials_needed: [
            { name: 'TBST buffer', quantity: '500', unit: 'mL' }
          ],
          tips: ['Ensure thorough washing to reduce background']
        },
        {
          id: 7,
          title: 'Secondary Antibody Incubation',
          description: 'Incubate membrane with HRP-conjugated secondary antibody for 1 hour at room temperature.',
          duration: 60,
          critical: true,
          materials_needed: [
            { name: 'Secondary antibody (HRP-conjugated)', quantity: 'Variable', unit: 'µL' }
          ],
          tips: ['Protect from light during incubation']
        },
        {
          id: 8,
          title: 'Detection',
          description: 'Apply ECL substrate and image using chemiluminescence imager.',
          duration: 10,
          critical: true,
          materials_needed: [
            { name: 'ECL substrate', quantity: '1', unit: 'mL' },
            { name: 'Chemiluminescence imager', quantity: '1', unit: 'unit' }
          ],
          tips: ['Work quickly once substrate is applied', 'Use appropriate exposure time']
        }
      ],
      expected_results: 'Clear, specific bands corresponding to target protein molecular weight. Band intensity should correlate with protein abundance.',
      troubleshooting: [
        { issue: 'No bands detected', solution: 'Check antibody specificity and concentration. Verify protein transfer efficiency.' },
        { issue: 'High background', solution: 'Increase blocking time. Use higher concentration of blocking agent.' },
        { issue: 'Multiple bands', solution: 'Check antibody specificity. May need to use different antibody.' }
      ],
      references: [
        'Towbin H, et al. (1979) Electrophoretic transfer of proteins from polyacrylamide gels to nitrocellulose sheets',
        'Burnette WN (1981) Western blotting: electrophoretic transfer of proteins from SDS-polyacrylamide gels'
      ],
      tags: ['protein', 'western blot', 'antibody', 'immunoblot', 'protein detection']
    }
  ];

  useEffect(() => {
    setProtocols(mockProtocols);
  }, []);

  const filteredProtocols = searchTerm.trim() && searchResults.length > 0
    ? searchResults.filter(protocol => !filterCategory || protocol.category === filterCategory)
    : protocols.filter(protocol => {
        const matchesSearch = !searchTerm || 
          protocol.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          protocol.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          protocol.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
        const matchesCategory = !filterCategory || protocol.category === filterCategory;
        return matchesSearch && matchesCategory;
      });

  const toggleStepComplete = (stepId: number) => {
    const newCompleted = new Set(completedSteps);
    if (newCompleted.has(stepId)) {
      newCompleted.delete(stepId);
    } else {
      newCompleted.add(stepId);
    }
    setCompletedSteps(newCompleted);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    alert('Download functionality - In a real app, this would download the protocol as PDF');
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: selectedProtocol?.title,
        text: selectedProtocol?.description,
        url: window.location.href
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard!');
    }
  };

  const handleSave = () => {
    setIsSaved(!isSaved);
    alert(isSaved ? 'Protocol unsaved' : 'Protocol saved to your library');
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

    return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
        <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">Protocol Library</h1>
              <p className="text-gray-600 text-lg">Standardized research protocols with step-by-step guidance</p>
        </div>
          <Button
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 px-6 py-3"
            onClick={() => setShowCreateForm(true)}
            >
              <PlusIcon className="w-5 h-5 mr-2" />
              Create Protocol
          </Button>
      </div>

          {/* Enhanced Search and Filters */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <MagnifyingGlassIcon className="w-4 h-4 inline mr-1" />
                  Smart Search (AI-powered semantic search)
                </label>
                <div className="relative">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search by intent, technique, or goal... (e.g., 'detect proteins', 'amplify DNA')"
                    className="pl-10"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  💡 Try: "protein detection methods" or "DNA amplification techniques"
                </p>
            </div>
            <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Category</label>
              <Select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                options={[
                  { value: '', label: 'All Categories' },
                    { value: 'Protein Analysis', label: 'Protein Analysis' },
                    { value: 'Molecular Biology', label: 'Molecular Biology' },
                    { value: 'Cell Culture', label: 'Cell Culture' }
                ]}
              />
            </div>
            <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">View Mode</label>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      viewMode === 'grid' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Grid
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      viewMode === 'list' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    List
                  </button>
                </div>
            </div>
            </div>
            <div className="flex items-center justify-between pt-4 border-t border-gray-200">
              <div className="flex items-center space-x-6">
                <div className="flex items-center space-x-2">
                  <UserGroupIcon className="w-5 h-5 text-blue-600" />
                  <span className="text-sm font-medium text-gray-700">{protocols.length} protocols</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircleIcon className="w-5 h-5 text-emerald-600" />
                  <span className="text-sm font-medium text-gray-700">
                    {protocols.length > 0 ? (protocols.reduce((acc, p) => acc + p.success_rate, 0) / protocols.length).toFixed(1) : '0'}% avg success
                  </span>
                </div>
                <button
                  onClick={() => setShowAnalytics(true)}
                  className="flex items-center space-x-2 text-sm text-blue-600 hover:text-blue-700"
                >
                  <ChartBarIcon className="w-4 h-4" />
                  <span>Analytics</span>
                </button>
              </div>
              <div className="flex items-center space-x-2">
                <LanguageIcon className="w-4 h-4 text-gray-400" />
                <Select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  options={[
                    { value: 'en', label: 'English' },
                    { value: 'es', label: 'Español' },
                    { value: 'fr', label: 'Français' },
                    { value: 'de', label: 'Deutsch' },
                    { value: 'zh', label: '中文' }
                  ]}
                  className="w-32"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Protocol Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProtocols.map((protocol) => (
            <Card key={protocol.id} className="hover:shadow-xl transition-all duration-300 cursor-pointer group border border-gray-200">
            <CardHeader className="pb-3">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 pr-4">
                    <CardTitle className="text-lg font-bold text-gray-900 line-clamp-2 group-hover:text-blue-600 transition-colors">
                    {protocol.title}
                  </CardTitle>
                  <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                    {protocol.description}
                  </p>
                </div>
                  {protocol.video_url && (
                    <div className="ml-2 bg-red-500 text-white px-2 py-1 rounded-full text-xs font-bold flex items-center">
                      <PlayIcon className="w-3 h-3 mr-1" />
                      Video
                    </div>
                  )}
                </div>
                <div className="flex flex-wrap gap-2 mt-3">
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-bold">
                    {protocol.category}
                  </span>
                  <span className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-bold">
                    <ShieldCheckIcon className="w-3 h-3 inline mr-1" />
                    {protocol.success_rate}% success
                  </span>
              </div>
            </CardHeader>
            
            <CardContent className="pt-0">
              <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="flex items-center space-x-2">
                      <ClockIcon className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-600">{formatDuration(protocol.procedure.reduce((acc, step) => acc + step.duration, 0))}</span>
                  </div>
                    <div className="flex items-center space-x-2">
                      <UserGroupIcon className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-600">{protocol.usage_count} uses</span>
                  </div>
                </div>

                  <div className="flex items-center space-x-2 pt-2 border-t border-gray-100">
                  <div className="flex items-center">
                    {[1, 2, 3, 4, 5].map((star) => (
                        <StarIcon
                        key={star}
                        className={`w-4 h-4 ${
                            star <= Math.round(protocol.rating)
                              ? 'text-yellow-400 fill-yellow-400'
                            : 'text-gray-300'
                        }`}
                        />
                    ))}
                  </div>
                  <span className="text-sm text-gray-600">
                      {protocol.rating.toFixed(1)} ({protocol.total_ratings})
                  </span>
                </div>

                  <div className="flex space-x-2">
                    <Button
                      className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                      onClick={() => {
                        setSelectedProtocol(protocol);
                        setShowDetails(true);
                        setActiveStep(0);
                        setCompletedSteps(new Set());
                      }}
                    >
                      View Protocol
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSelectedProtocol(protocol);
                        setShowExecutionMode(true);
                      }}
                      className="border-emerald-600 text-emerald-600 hover:bg-emerald-50"
                      title="Start execution mode"
                    >
                      <RocketLaunchIcon className="w-4 h-4" />
                    </Button>
                  </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {filteredProtocols.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
              <AcademicCapIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No protocols found</h3>
              <p className="text-gray-600">Try adjusting your filters</p>
          </CardContent>
        </Card>
      )}
      </div>

      {/* Protocol Detail Modal */}
      {showDetails && selectedProtocol && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-6xl max-h-[95vh] overflow-hidden shadow-2xl">
            {/* Header */}
            <div className="bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6 border-b border-gray-200">
              <div className="flex items-start justify-between">
                <div className="flex-1 pr-8">
                  <div className="flex items-center space-x-3 mb-3">
                    <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-bold">
                      {selectedProtocol.category}
                    </span>
                    <span className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-bold">
                      {selectedProtocol.success_rate}% success
                    </span>
                    <span className="text-sm text-gray-600">
                      v{selectedProtocol.version}
                    </span>
                  </div>
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">{selectedProtocol.title}</h2>
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    <span className="flex items-center">
                      <ClockIcon className="w-4 h-4 mr-1" />
                      {formatDuration(selectedProtocol.procedure.reduce((acc, step) => acc + step.duration, 0))}
                    </span>
                    <span className="flex items-center">
                      <CheckCircleIcon className="w-4 h-4 mr-1" />
                      {selectedProtocol.success_rate}% success
                    </span>
                    <span className="flex items-center">
                      <UserGroupIcon className="w-4 h-4 mr-1" />
                      {selectedProtocol.usage_count} uses
                    </span>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                <button
                    onClick={handleSave}
                    className={`p-2 rounded-lg transition-colors ${
                      isSaved ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                    }`}
                    title="Save protocol"
                  >
                    <BookmarkIcon className="w-5 h-5" />
                  </button>
                  <button
                    onClick={handleShare}
                    className="p-2 rounded-lg bg-gray-100 text-gray-400 hover:bg-gray-200 transition-colors"
                    title="Share protocol"
                  >
                    <ShareIcon className="w-5 h-5" />
                  </button>
                  <button
                    onClick={handleDownload}
                    className="p-2 rounded-lg bg-gray-100 text-gray-400 hover:bg-gray-200 transition-colors"
                    title="Download protocol"
                  >
                    <ArrowDownTrayIcon className="w-5 h-5" />
                  </button>
                  <button
                    onClick={handlePrint}
                    className="p-2 rounded-lg bg-gray-100 text-gray-400 hover:bg-gray-200 transition-colors"
                    title="Print protocol"
                  >
                    <PrinterIcon className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setShowDetails(false)}
                    className="ml-2 p-2 rounded-lg bg-gray-100 text-gray-400 hover:bg-gray-200 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
                </div>
              </div>
            </div>
            
            <div className="overflow-y-auto max-h-[calc(95vh-200px)] bg-gray-50 p-6">
              {/* Overview */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                <div className="lg:col-span-2 space-y-6">
                  {/* Objective */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <LightBulbIcon className="w-5 h-5 mr-2 text-blue-600" />
                        Objective
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-700">{selectedProtocol.objective}</p>
                    </CardContent>
                  </Card>

                  {/* Background */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <BookOpenIcon className="w-5 h-5 mr-2 text-blue-600" />
                        Background
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-700">{selectedProtocol.background}</p>
                    </CardContent>
                  </Card>

                  {/* Materials */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <ClipboardDocumentCheckIcon className="w-5 h-5 mr-2 text-blue-600" />
                        Materials & Equipment
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-2">Materials</h4>
                          <ul className="list-disc list-inside space-y-1 text-gray-700">
                            {selectedProtocol.materials.map((material, index) => (
                              <li key={index}>
                                <span className="font-medium">{material.name}</span>
                                {material.quantity && ` - ${material.quantity} ${material.unit}`}
                                {material.concentration && ` (${material.concentration})`}
                                {material.supplier && ` - ${material.supplier}`}
                                {material.catalog_number && ` [${material.catalog_number}]`}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-2">Equipment</h4>
                          <ul className="list-disc list-inside space-y-1 text-gray-700">
                            {selectedProtocol.equipment.map((equipment, index) => (
                              <li key={index}>
                                <span className="font-medium">{equipment.name}</span>
                                {equipment.model && ` - ${equipment.model}`}
                                {equipment.calibration_required && ' (Calibration Required)'}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Safety Notes */}
                  <Card className="border-orange-200 bg-orange-50">
                    <CardHeader>
                      <CardTitle className="flex items-center text-orange-900">
                        <ExclamationTriangleIcon className="w-5 h-5 mr-2" />
                        Safety Notes
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="list-disc list-inside space-y-1 text-orange-900">
                        {selectedProtocol.safety_notes.map((note, index) => (
                          <li key={index}>{note}</li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                      </div>

                {/* Sidebar */}
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Protocol Info</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Version</span>
                          <span className="font-bold">{selectedProtocol.version}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Author</span>
                          <span className="font-bold">{selectedProtocol.author}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Last Updated</span>
                          <span className="font-bold">{selectedProtocol.last_updated}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Institution</span>
                          <span className="font-bold">{selectedProtocol.institution}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Tags</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {selectedProtocol.tags.map((tag, index) => (
                          <span key={index} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Interactive Procedure */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <ClipboardDocumentCheckIcon className="w-5 h-5 mr-2 text-blue-600" />
                    Step-by-Step Procedure
                  </CardTitle>
                  <p className="text-sm text-gray-600 mt-2">
                    {completedSteps.size} of {selectedProtocol.procedure.length} steps completed
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {selectedProtocol.procedure.map((step, index) => (
                      <div
                        key={step.id}
                        className={`p-6 rounded-xl border-2 transition-all ${
                          activeStep === index
                            ? 'border-blue-500 bg-blue-50'
                            : completedSteps.has(step.id)
                            ? 'border-emerald-300 bg-emerald-50'
                            : 'border-gray-200 bg-white'
                        }`}
                      >
                        <div className="flex items-start space-x-4">
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold text-white ${
                            completedSteps.has(step.id)
                              ? 'bg-emerald-500'
                              : step.critical
                              ? 'bg-red-500'
                              : 'bg-blue-500'
                          }`}>
                            {step.id}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="text-lg font-bold text-gray-900">{step.title}</h4>
                              <div className="flex items-center space-x-2">
                                {step.critical && (
                                  <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs font-bold">
                                    Critical
                                  </span>
                                )}
                                <button
                                  onClick={() => toggleStepComplete(step.id)}
                                  className={`p-2 rounded-lg transition-colors ${
                                    completedSteps.has(step.id)
                                      ? 'bg-emerald-100 text-emerald-600'
                                      : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                                  }`}
                                >
                                  <CheckCircleIcon className="w-5 h-5" />
                                </button>
                              </div>
                            </div>
                            <p className="text-gray-700 mb-3">{step.description}</p>
                            <div className="flex items-center space-x-4 text-sm text-gray-600">
                              <span className="flex items-center">
                                <ClockIcon className="w-4 h-4 mr-1" />
                                {step.duration}m
                              </span>
                              {step.materials_needed && (
                                <span className="flex items-center">
                                  <ClipboardDocumentCheckIcon className="w-4 h-4 mr-1" />
                                  {step.materials_needed.length} materials
                                </span>
                              )}
                            </div>
                            {step.materials_needed && (
                              <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                                <p className="text-xs font-semibold text-gray-700 mb-2">Materials Needed:</p>
                                <div className="space-y-1">
                                  {step.materials_needed.map((material, idx) => (
                                    <div key={idx} className="flex items-center justify-between text-xs bg-white p-2 rounded border border-gray-200">
                                      <span className="font-medium text-gray-900">{material.name}</span>
                                      <span className="text-gray-600">{material.quantity} {material.unit}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            {step.warnings && step.warnings.length > 0 && (
                              <div className="mt-3 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                                <p className="text-xs font-semibold text-orange-900 mb-1 flex items-center">
                                  <ExclamationTriangleIcon className="w-4 h-4 mr-1" />
                                  Warnings:
                                </p>
                                <ul className="list-disc list-inside text-xs text-orange-900">
                                  {step.warnings.map((warning, idx) => (
                                    <li key={idx}>{warning}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            {step.tips && step.tips.length > 0 && (
                              <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                <p className="text-xs font-semibold text-blue-900 mb-1 flex items-center">
                                  <LightBulbIcon className="w-4 h-4 mr-1" />
                                  Tips:
                                </p>
                                <ul className="list-disc list-inside text-xs text-blue-900">
                                  {step.tips.map((tip, idx) => (
                                    <li key={idx}>{tip}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                    </CardContent>
                  </Card>

              {/* Expected Results */}
              <Card className="bg-emerald-50 border-emerald-200">
                <CardHeader>
                  <CardTitle className="flex items-center text-emerald-900">
                    <CheckCircleIcon className="w-5 h-5 mr-2" />
                    Expected Results
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-emerald-900">{selectedProtocol.expected_results}</p>
                </CardContent>
              </Card>

              {/* Troubleshooting */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <LightBulbIcon className="w-5 h-5 mr-2 text-blue-600" />
                    Troubleshooting
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {selectedProtocol.troubleshooting.map((item, index) => (
                      <div key={index} className="p-4 bg-gray-50 rounded-lg">
                        <p className="font-semibold text-gray-900 mb-1">Issue: {item.issue}</p>
                        <p className="text-gray-700">Solution: {item.solution}</p>
                      </div>
                ))}
              </div>
                </CardContent>
              </Card>

              {/* References */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <BookOpenIcon className="w-5 h-5 mr-2 text-blue-600" />
                    References
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="list-disc list-inside space-y-1 text-gray-700">
                    {selectedProtocol.references.map((ref, index) => (
                      <li key={index}>{ref}</li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              {/* Video Section - Now at the end */}
              {selectedProtocol.video_url && (
                <Card className="bg-white">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <PlayIcon className="w-6 h-6 mr-2 text-red-600" />
                      Video Tutorial
                    </CardTitle>
                    <p className="text-sm text-gray-600 mt-2">
                      Watch this comprehensive video tutorial demonstrating the complete protocol
                    </p>
                  </CardHeader>
                  <CardContent>
                    <div className="relative aspect-video bg-black rounded-lg overflow-hidden shadow-lg">
                      <iframe
                        src={selectedProtocol.video_url}
                        className="absolute inset-0 w-full h-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        title="Protocol Video Tutorial"
                      />
            </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Footer */}
            <div className="bg-gray-50 border-t border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <StarIcon
                        key={star}
                        className={`w-5 h-5 ${
                          star <= Math.round(selectedProtocol.rating)
                            ? 'text-yellow-400 fill-yellow-400'
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-gray-700">
                    {selectedProtocol.rating.toFixed(1)} ({selectedProtocol.total_ratings} reviews)
                  </span>
                </div>
                <div className="flex space-x-3">
                  <Button variant="outline" onClick={() => setShowDetails(false)}>
                    Close
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowAIAssistant(true);
                    }}
                    className="border-purple-600 text-purple-600 hover:bg-purple-50"
                  >
                    <SparklesIcon className="w-4 h-4 mr-2" />
                    AI Optimize
                  </Button>
                  <Button
                    onClick={() => {
                      setShowDetails(false);
                      setShowExecutionMode(true);
                    }}
                    className="bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700"
                  >
                    <RocketLaunchIcon className="w-4 h-4 mr-2" />
                    Start Execution
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Protocol Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-5xl max-h-[95vh] overflow-hidden shadow-2xl">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">Create New Protocol</h2>
                <button
                  onClick={() => setShowCreateForm(false)}
                  className="text-white hover:text-gray-200 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[calc(95vh-200px)]">
              <div className="space-y-6">
                {/* Basic Information */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                  <h3 className="text-lg font-bold text-blue-900 mb-4">Basic Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Protocol Title *</label>
                      <Input
                        placeholder="e.g., Western Blotting: Protein Detection"
                        className="border-2"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Category *</label>
                      <Select
                        options={[
                          { value: '', label: 'Select Category' },
                          { value: 'Protein Analysis', label: 'Protein Analysis' },
                          { value: 'Molecular Biology', label: 'Molecular Biology' },
                          { value: 'Cell Culture', label: 'Cell Culture' },
                          { value: 'Biochemistry', label: 'Biochemistry' },
                          { value: 'Genetics', label: 'Genetics' }
                        ]}
                      />
                    </div>
                  </div>
                  <div className="mt-4">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Description *</label>
                    <textarea
                      className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows={3}
                      placeholder="Brief description of the protocol..."
                    />
                  </div>
                </div>

                {/* Scientific Context */}
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-6">
                  <h3 className="text-lg font-bold text-purple-900 mb-4">Scientific Context</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Objective *</label>
                      <textarea
                        className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        rows={3}
                        placeholder="What does this protocol accomplish?"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Background & Rationale *</label>
                      <textarea
                        className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        rows={4}
                        placeholder="Scientific background and rationale for this protocol..."
                      />
                    </div>
                  </div>
                </div>

                {/* Materials & Equipment */}
                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 mb-6">
                  <h3 className="text-lg font-bold text-emerald-900 mb-4">Materials & Equipment</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Materials *</label>
                      <textarea
                        className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        rows={6}
                        placeholder="Enter materials with details (one per line)&#10;Example:&#10;SDS-PAGE gel (10% acrylamide) - Bio-Rad #456-1093&#10;Transfer buffer (1x) - Bio-Rad #170-3935&#10;PVDF membrane - Millipore #IPVH00010"
                      />
                      <p className="text-xs text-gray-500 mt-1">Include name, concentration, supplier, and catalog number</p>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Equipment *</label>
                      <textarea
                        className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        rows={6}
                        placeholder="Enter equipment (one per line)&#10;Example:&#10;Electrophoresis apparatus (Mini-PROTEAN Tetra)&#10;Transfer apparatus (Mini Trans-Blot Cell)&#10;Power supply (Bio-Rad PowerPac HC)"
                      />
                      <p className="text-xs text-gray-500 mt-1">Include equipment name and model if applicable</p>
                    </div>
                  </div>
                </div>

                {/* Safety & Warnings */}
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
                  <h3 className="text-lg font-bold text-orange-900 mb-4">Safety & Warnings</h3>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Safety Notes *</label>
                    <textarea
                      className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows={4}
                      placeholder="Important safety precautions and warnings..."
                    />
                  </div>
                </div>

                {/* Procedure Steps */}
                <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 mb-6">
                  <h3 className="text-lg font-bold text-indigo-900 mb-4">Procedure Steps</h3>
                  <div className="space-y-4">
                    <div className="bg-white p-4 rounded-lg border-2 border-gray-200">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">Step Title *</label>
                          <Input placeholder="e.g., Sample Preparation" className="border-2" />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">Duration (minutes) *</label>
                          <Input type="number" placeholder="e.g., 15" className="border-2" />
                          </div>
                        </div>
                      <div className="mb-4">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Step Description *</label>
                        <textarea
                          className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          rows={3}
                          placeholder="Detailed description of this step..."
                        />
                      </div>
                      <div className="flex items-center space-x-4">
                        <label className="flex items-center">
                          <input type="checkbox" className="mr-2" />
                          <span className="text-sm font-semibold text-gray-700">Critical Step</span>
                        </label>
                        <label className="flex items-center">
                          <input type="checkbox" className="mr-2" />
                          <span className="text-sm font-semibold text-gray-700">Has warnings</span>
                        </label>
                        <label className="flex items-center">
                          <input type="checkbox" className="mr-2" />
                          <span className="text-sm font-semibold text-gray-700">Has tips</span>
                        </label>
                      </div>
                    </div>
                    <Button variant="outline" className="w-full">
                      + Add Another Step
                    </Button>
                  </div>
                </div>

                {/* Expected Results */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                  <h3 className="text-lg font-bold text-green-900 mb-4">Expected Results</h3>
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">What should researchers expect to see? *</label>
                    <textarea
                      className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows={3}
                      placeholder="Describe the expected outcome..."
                    />
                  </div>
                </div>

                {/* Troubleshooting */}
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                  <h3 className="text-lg font-bold text-yellow-900 mb-4">Troubleshooting</h3>
                  <div className="bg-white p-4 rounded-lg border-2 border-gray-200">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Common Issue</label>
                        <Input placeholder="e.g., No bands detected" className="border-2" />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Solution</label>
                        <Input placeholder="e.g., Check antibody concentration" className="border-2" />
                      </div>
                    </div>
                  </div>
                  <Button variant="outline" className="w-full mt-4">
                    + Add Another Troubleshooting Tip
                  </Button>
                </div>

                {/* References */}
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">References</h3>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Literature References</label>
                    <textarea
                      className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows={3}
                      placeholder="Enter references (one per line)..."
                    />
                    <p className="text-xs text-gray-500 mt-1">Enter one reference per line</p>
                  </div>
                </div>

                {/* Additional Options */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                  <h3 className="text-lg font-bold text-blue-900 mb-4">Additional Options</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center">
                        <PlayIcon className="w-5 h-5 mr-2 text-red-600" />
                        YouTube Video Tutorial (Optional)
                      </label>
                      <Input
                        placeholder="https://www.youtube.com/watch?v=..."
                        className="border-2"
                      />
                      <p className="text-xs text-gray-500 mt-1">Add a video tutorial for this protocol</p>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Tags</label>
                      <Input
                        placeholder="e.g., protein, western blot, antibody (comma separated)"
                        className="border-2"
                      />
                      <p className="text-xs text-gray-500 mt-1">Add tags separated by commas</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-50 border-t border-gray-200 p-6">
              <div className="flex justify-end space-x-3">
                <Button variant="outline" onClick={() => setShowCreateForm(false)}>
                  Cancel
                </Button>
                <Button
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                  onClick={() => {
                    alert('Protocol creation form - In a real app, this would save to the database');
                    setShowCreateForm(false);
                  }}
                >
                  Create Protocol
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* AI Assistant Modal */}
      {showAIAssistant && (
        <ProtocolAIAssistant
          protocol={selectedProtocol ? {
            id: selectedProtocol.id,
            title: selectedProtocol.title,
            description: selectedProtocol.description,
            steps: selectedProtocol.procedure,
            materials: selectedProtocol.materials,
            equipment: selectedProtocol.equipment
          } : undefined}
          onOptimized={(optimized) => {
            // Handle optimized protocol
            console.log('Optimized protocol:', optimized);
            setShowAIAssistant(false);
          }}
          onClose={() => setShowAIAssistant(false)}
        />
      )}

      {/* Execution Mode - Desktop or Mobile */}
      {showExecutionMode && selectedProtocol && (
        isMobile ? (
          <ProtocolExecutionModeMobile
            protocol={{
              title: selectedProtocol.title,
              procedure: selectedProtocol.procedure
            }}
            onComplete={(executionData) => {
              console.log('Execution completed:', executionData);
              setShowExecutionMode(false);
            }}
            onExit={() => setShowExecutionMode(false)}
          />
        ) : (
          <ProtocolExecutionMode
            protocol={{
              title: selectedProtocol.title,
              procedure: selectedProtocol.procedure
            }}
            onComplete={(executionData) => {
              console.log('Execution completed:', executionData);
              setShowExecutionMode(false);
            }}
            onExit={() => setShowExecutionMode(false)}
          />
        )
      )}

      {/* Analytics Modal */}
      {showAnalytics && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <ChartBarIcon className="w-6 h-6" />
                  <CardTitle className="text-white">Protocol Analytics</CardTitle>
                </div>
                <button
                  onClick={() => setShowAnalytics(false)}
                  className="text-white hover:text-gray-200 transition-colors"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>
            </CardHeader>
            <CardContent className="p-6 overflow-y-auto max-h-[calc(90vh-100px)]">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-semibold text-gray-900 mb-2">Total Protocols</h4>
                  <p className="text-3xl font-bold text-blue-600">{protocols.length}</p>
                </div>
                <div className="p-4 bg-emerald-50 rounded-lg">
                  <h4 className="font-semibold text-gray-900 mb-2">Avg Success Rate</h4>
                  <p className="text-3xl font-bold text-emerald-600">
                    {protocols.length > 0 ? (protocols.reduce((acc, p) => acc + p.success_rate, 0) / protocols.length).toFixed(1) : '0'}%
                  </p>
                </div>
                <div className="p-4 bg-purple-50 rounded-lg">
                  <h4 className="font-semibold text-gray-900 mb-2">Total Usage</h4>
                  <p className="text-3xl font-bold text-purple-600">
                    {protocols.reduce((acc, p) => acc + p.usage_count, 0).toLocaleString()}
                  </p>
                </div>
              </div>
              <div className="space-y-4">
                <h4 className="font-bold text-gray-900">Top Protocols by Success Rate</h4>
                <div className="space-y-2">
                  {[...protocols]
                    .sort((a, b) => b.success_rate - a.success_rate)
                    .slice(0, 5)
                    .map((protocol) => (
                      <div key={protocol.id} className="p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-gray-900">{protocol.title}</span>
                          <span className="text-emerald-600 font-bold">{protocol.success_rate}%</span>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Collaboration Panel */}
      {showCollaboration && selectedProtocol && (
        <ProtocolCollaborationPanel
          protocolId={selectedProtocol.id}
          onClose={() => setShowCollaboration(false)}
        />
      )}
    </div>
  );
};

export default ProtocolsPage;

