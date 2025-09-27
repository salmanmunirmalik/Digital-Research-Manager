import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Card, { CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import ProfessionalProtocolForm from '../components/ProfessionalProtocolForm';

interface ProfessionalProtocol {
  id: string;
  title: string;
  description: string;
  protocol_type: string;
  category: string;
  subcategory?: string;
  version: string;
  difficulty_level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  skill_requirements: string[];
  estimated_duration_minutes: number;
  estimated_cost_usd: number;
  cost_per_sample: number;
  safety_level: 'low' | 'medium' | 'high' | 'biosafety_level_2' | 'biosafety_level_3';
  ppe_required: string[];
  objective: string;
  background?: string;
  reagents: any[];
  equipment: any[];
  procedure_steps: any[];
  expected_results: string;
  privacy_level: 'personal' | 'team' | 'lab' | 'institution' | 'global';
  status: 'draft' | 'review' | 'validated' | 'approved' | 'archived' | 'deprecated';
  validation_level: 'none' | 'peer_reviewed' | 'lab_validated' | 'institution_approved' | 'published';
  tags: string[];
  literature_references: string[];
  usage_count: number;
  success_rate: number;
  average_rating: number;
  total_ratings: number;
  created_by: string;
  created_at: string;
  updated_at: string;
  last_used_at?: string;
}

interface ProtocolTemplate {
  id: string;
  template_name: string;
  protocol_type: string;
  category: string;
  description: string;
  template_data: any;
  usage_count: number;
  created_by: string;
  created_at: string;
}

const ProfessionalProtocolsPage: React.FC = () => {
  const { user } = useAuth();
  const [protocols, setProtocols] = useState<ProfessionalProtocol[]>([]);
  const [templates, setTemplates] = useState<ProtocolTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  
  // UI State
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<ProtocolTemplate | null>(null);
  const [selectedProtocol, setSelectedProtocol] = useState<ProfessionalProtocol | null>(null);
  const [showProtocolDetails, setShowProtocolDetails] = useState(false);
  
  // Filters
  const [filters, setFilters] = useState({
    search: '',
    protocol_type: '',
    category: '',
    difficulty_level: '',
    privacy_level: '',
    status: '',
    validation_level: ''
  });

  // Mock data for demonstration
  const mockProtocols: ProfessionalProtocol[] = [
    {
      id: '1',
      title: 'Western Blot for Protein Detection',
      description: 'Complete Western Blot protocol for detecting and quantifying specific proteins in biological samples',
      protocol_type: 'western_blot',
      category: 'protein_analysis',
      subcategory: 'protein_detection',
      version: '2.1',
      difficulty_level: 'intermediate',
      skill_requirements: ['pipetting', 'microscopy', 'data_analysis'],
      estimated_duration_minutes: 480,
      estimated_cost_usd: 150.00,
      cost_per_sample: 12.50,
      safety_level: 'medium',
      ppe_required: ['lab_coat', 'gloves', 'safety_goggles'],
      objective: 'Detect and quantify specific proteins using Western Blot technique',
      background: 'Western Blot is a widely used technique for protein detection and quantification',
      reagents: [
        { name: 'SDS-PAGE Gel', concentration: '10%', supplier: 'Bio-Rad', catalog: '456-1093' },
        { name: 'Transfer Buffer', concentration: '1x', supplier: 'Bio-Rad', catalog: '170-3935' }
      ],
      equipment: [
        { name: 'Electrophoresis Unit', specifications: 'Mini-PROTEAN Tetra System', calibration: 'Monthly' },
        { name: 'Transfer Unit', specifications: 'Mini Trans-Blot Cell', calibration: 'Monthly' }
      ],
      procedure_steps: [
        { step: 1, description: 'Prepare SDS-PAGE gel', duration_minutes: 30, critical: true },
        { step: 2, description: 'Load samples and run electrophoresis', duration_minutes: 60, critical: true },
        { step: 3, description: 'Transfer proteins to membrane', duration_minutes: 90, critical: true }
      ],
      expected_results: 'Clear, specific bands corresponding to target protein molecular weight',
      privacy_level: 'lab',
      status: 'approved',
      validation_level: 'lab_validated',
      tags: ['protein', 'detection', 'antibody', 'molecular_biology'],
      literature_references: ['Towbin et al., 1979', 'Burnette, 1981'],
      usage_count: 45,
      success_rate: 92.5,
      average_rating: 4.3,
      total_ratings: 12,
      created_by: user?.id || 'user-1',
      created_at: '2024-01-15T10:00:00Z',
      updated_at: '2024-01-20T14:30:00Z',
      last_used_at: '2024-01-25T09:15:00Z'
    },
    {
      id: '2',
      title: 'PCR Amplification Protocol',
      description: 'Standard Polymerase Chain Reaction protocol for DNA amplification',
      protocol_type: 'pcr',
      category: 'molecular_biology',
      subcategory: 'dna_amplification',
      version: '1.5',
      difficulty_level: 'beginner',
      skill_requirements: ['pipetting', 'aseptic_technique'],
      estimated_duration_minutes: 180,
      estimated_cost_usd: 75.00,
      cost_per_sample: 5.00,
      safety_level: 'low',
      ppe_required: ['lab_coat', 'gloves'],
      objective: 'Amplify specific DNA sequences using polymerase chain reaction',
      background: 'PCR is a fundamental technique in molecular biology for amplifying DNA sequences',
      reagents: [
        { name: 'PCR Master Mix', concentration: '2x', supplier: 'Thermo Fisher', catalog: 'K0171' },
        { name: 'Forward Primer', concentration: '10 μM', supplier: 'IDT', catalog: 'Custom' }
      ],
      equipment: [
        { name: 'Thermal Cycler', specifications: 'Applied Biosystems 2720', calibration: 'Monthly' }
      ],
      procedure_steps: [
        { step: 1, description: 'Prepare PCR reaction mix', duration_minutes: 15, critical: true },
        { step: 2, description: 'Run PCR cycles', duration_minutes: 120, critical: true },
        { step: 3, description: 'Analyze results', duration_minutes: 45, critical: false }
      ],
      expected_results: 'Single band of expected size on agarose gel',
      privacy_level: 'global',
      status: 'approved',
      validation_level: 'published',
      tags: ['pcr', 'dna', 'amplification', 'molecular_biology'],
      literature_references: ['Mullis et al., 1986', 'Saiki et al., 1988'],
      usage_count: 128,
      success_rate: 95.2,
      average_rating: 4.6,
      total_ratings: 28,
      created_by: user?.id || 'user-2',
      created_at: '2024-01-10T08:00:00Z',
      updated_at: '2024-01-18T16:45:00Z',
      last_used_at: '2024-01-26T11:30:00Z'
    },
    {
      id: '3',
      title: 'ELISA Protein Quantification',
      description: 'Enzyme-Linked Immunosorbent Assay for protein quantification',
      protocol_type: 'elisa',
      category: 'immunoassays',
      subcategory: 'protein_quantification',
      version: '1.2',
      difficulty_level: 'intermediate',
      skill_requirements: ['pipetting', 'data_analysis', 'quality_control'],
      estimated_duration_minutes: 300,
      estimated_cost_usd: 200.00,
      cost_per_sample: 15.00,
      safety_level: 'low',
      ppe_required: ['lab_coat', 'gloves'],
      objective: 'Quantify specific proteins in biological samples using ELISA',
      background: 'ELISA is a plate-based assay technique for detecting and quantifying proteins',
      reagents: [
        { name: 'ELISA Plate', concentration: '96-well', supplier: 'Corning', catalog: '3590' },
        { name: 'Capture Antibody', concentration: 'Variable', supplier: 'R&D Systems', catalog: 'Custom' }
      ],
      equipment: [
        { name: 'Plate Reader', specifications: 'BioTek Synergy H1', calibration: 'Weekly' }
      ],
      procedure_steps: [
        { step: 1, description: 'Coat plate with capture antibody', duration_minutes: 480, critical: true },
        { step: 2, description: 'Block and add samples', duration_minutes: 180, critical: true },
        { step: 3, description: 'Add detection antibody and substrate', duration_minutes: 90, critical: true }
      ],
      expected_results: 'Linear standard curve with R² > 0.99',
      privacy_level: 'team',
      status: 'review',
      validation_level: 'peer_reviewed',
      tags: ['elisa', 'protein', 'quantification', 'immunoassay'],
      literature_references: ['Engvall & Perlmann, 1971', 'Voller et al., 1978'],
      usage_count: 23,
      success_rate: 88.7,
      average_rating: 4.1,
      total_ratings: 8,
      created_by: user?.id || 'user-3',
      created_at: '2024-01-12T12:00:00Z',
      updated_at: '2024-01-22T10:15:00Z',
      last_used_at: '2024-01-24T14:20:00Z'
    }
  ];

  const mockTemplates: ProtocolTemplate[] = [
    {
      id: '1',
      template_name: 'Western Blot Standard Protocol',
      protocol_type: 'western_blot',
      category: 'protein_analysis',
      description: 'Complete Western Blot protocol template',
      template_data: {
        objective: 'Detect and quantify specific proteins in biological samples using Western Blot technique',
        difficulty_level: 'intermediate',
        estimated_duration_minutes: 480,
        safety_level: 'medium',
        ppe_required: ['lab_coat', 'gloves', 'safety_goggles'],
        reagents: [
          { name: 'SDS-PAGE Gel', concentration: '10%', supplier: 'Bio-Rad', catalog: '456-1093' },
          { name: 'Transfer Buffer', concentration: '1x', supplier: 'Bio-Rad', catalog: '170-3935' }
        ],
        equipment: [
          { name: 'Electrophoresis Unit', specifications: 'Mini-PROTEAN Tetra System', calibration: 'Monthly' }
        ]
      },
      usage_count: 156,
      created_by: 'system',
      created_at: '2024-01-01T00:00:00Z'
    },
    {
      id: '2',
      template_name: 'PCR Standard Protocol',
      protocol_type: 'pcr',
      category: 'molecular_biology',
      description: 'Standard PCR protocol template',
      template_data: {
        objective: 'Amplify specific DNA sequences using polymerase chain reaction',
        difficulty_level: 'beginner',
        estimated_duration_minutes: 180,
        safety_level: 'low',
        ppe_required: ['lab_coat', 'gloves'],
        reagents: [
          { name: 'PCR Master Mix', concentration: '2x', supplier: 'Thermo Fisher', catalog: 'K0171' }
        ],
        equipment: [
          { name: 'Thermal Cycler', specifications: 'Applied Biosystems 2720', calibration: 'Monthly' }
        ]
      },
      usage_count: 234,
      created_by: 'system',
      created_at: '2024-01-01T00:00:00Z'
    }
  ];

  useEffect(() => {
    // Load mock data
    setProtocols(mockProtocols);
    setTemplates(mockTemplates);
    setIsLoading(false);
  }, []);

  const filteredProtocols = protocols.filter(protocol => {
    return (
      (!filters.search || protocol.title.toLowerCase().includes(filters.search.toLowerCase()) ||
       protocol.description.toLowerCase().includes(filters.search.toLowerCase()) ||
       protocol.tags.some(tag => tag.toLowerCase().includes(filters.search.toLowerCase()))) &&
      (!filters.protocol_type || protocol.protocol_type === filters.protocol_type) &&
      (!filters.category || protocol.category === filters.category) &&
      (!filters.difficulty_level || protocol.difficulty_level === filters.difficulty_level) &&
      (!filters.privacy_level || protocol.privacy_level === filters.privacy_level) &&
      (!filters.status || protocol.status === filters.status) &&
      (!filters.validation_level || protocol.validation_level === filters.validation_level)
    );
  });

  const handleCreateProtocol = async (protocolData: ProfessionalProtocol) => {
    try {
      // In a real app, this would make an API call
      const newProtocol: ProfessionalProtocol = {
        ...protocolData,
        id: Date.now().toString(),
        usage_count: 0,
        success_rate: 0,
        average_rating: 0,
        total_ratings: 0,
        created_by: user?.id || 'current-user',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      setProtocols(prev => [newProtocol, ...prev]);
      setShowCreateForm(false);
      setShowTemplateModal(false);
      setSelectedTemplate(null);
    } catch (error) {
      console.error('Error creating protocol:', error);
    }
  };

  const getDifficultyColor = (level: string) => {
    switch (level) {
      case 'beginner': return 'bg-green-100 text-green-800';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'advanced': return 'bg-orange-100 text-orange-800';
      case 'expert': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getSafetyColor = (level: string) => {
    switch (level) {
      case 'low': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'biosafety_level_2': return 'bg-red-100 text-red-800';
      case 'biosafety_level_3': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'review': return 'bg-blue-100 text-blue-800';
      case 'validated': return 'bg-green-100 text-green-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'archived': return 'bg-gray-100 text-gray-800';
      case 'deprecated': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Professional Protocols</h1>
          <p className="text-gray-600 mt-1">Manage and share standardized research protocols</p>
        </div>
        <div className="flex space-x-3">
          <Button
            onClick={() => setShowTemplateModal(true)}
            variant="outline"
            className="flex items-center space-x-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span>From Template</span>
          </Button>
          <Button
            onClick={() => setShowCreateForm(true)}
            className="bg-slate-800 hover:bg-slate-700 flex items-center space-x-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>Create Protocol</span>
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
              <Input
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                placeholder="Search protocols..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Protocol Type</label>
              <Select
                value={filters.protocol_type}
                onChange={(e) => setFilters(prev => ({ ...prev, protocol_type: e.target.value }))}
                options={[
                  { value: '', label: 'All Types' },
                  { value: 'western_blot', label: 'Western Blot' },
                  { value: 'pcr', label: 'PCR' },
                  { value: 'elisa', label: 'ELISA' },
                  { value: 'cell_culture', label: 'Cell Culture' },
                  { value: 'immunofluorescence', label: 'Immunofluorescence' },
                  { value: 'flow_cytometry', label: 'Flow Cytometry' },
                  { value: 'microscopy', label: 'Microscopy' }
                ]}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <Select
                value={filters.category}
                onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
                options={[
                  { value: '', label: 'All Categories' },
                  { value: 'molecular_biology', label: 'Molecular Biology' },
                  { value: 'cell_biology', label: 'Cell Biology' },
                  { value: 'protein_analysis', label: 'Protein Analysis' },
                  { value: 'immunology', label: 'Immunology' },
                  { value: 'microscopy', label: 'Microscopy' },
                  { value: 'analytical', label: 'Analytical Chemistry' }
                ]}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Privacy Level</label>
              <Select
                value={filters.privacy_level}
                onChange={(e) => setFilters(prev => ({ ...prev, privacy_level: e.target.value }))}
                options={[
                  { value: '', label: 'All Privacy Levels' },
                  { value: 'personal', label: 'Only Me' },
                  { value: 'team', label: 'My Team' },
                  { value: 'lab', label: 'My Lab' },
                  { value: 'institution', label: 'My Institution' },
                  { value: 'global', label: 'Global' }
                ]}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Protocols Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredProtocols.map((protocol) => (
          <Card key={protocol.id} className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg font-semibold text-gray-900 line-clamp-2">
                    {protocol.title}
                  </CardTitle>
                  <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                    {protocol.description}
                  </p>
                </div>
                <div className="flex flex-col items-end space-y-1 ml-2">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(protocol.difficulty_level)}`}>
                    {protocol.difficulty_level}
                  </span>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getSafetyColor(protocol.safety_level)}`}>
                    {protocol.safety_level.replace('_', ' ')}
                  </span>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="pt-0">
              <div className="space-y-3">
                {/* Protocol Info */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Duration:</span>
                    <span className="ml-1 font-medium">{formatDuration(protocol.estimated_duration_minutes)}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Cost:</span>
                    <span className="ml-1 font-medium">${protocol.cost_per_sample}/sample</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Usage:</span>
                    <span className="ml-1 font-medium">{protocol.usage_count} times</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Success Rate:</span>
                    <span className="ml-1 font-medium">{protocol.success_rate.toFixed(1)}%</span>
                  </div>
                </div>

                {/* Status and Privacy */}
                <div className="flex items-center justify-between">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(protocol.status)}`}>
                    {protocol.status}
                  </span>
                  <span className="text-xs text-gray-500">
                    {protocol.privacy_level === 'personal' ? 'Only Me' :
                     protocol.privacy_level === 'team' ? 'My Team' :
                     protocol.privacy_level === 'lab' ? 'My Lab' :
                     protocol.privacy_level === 'institution' ? 'My Institution' : 'Global'}
                  </span>
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-1">
                  {protocol.tags.slice(0, 3).map((tag, index) => (
                    <span key={index} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      {tag}
                    </span>
                  ))}
                  {protocol.tags.length > 3 && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      +{protocol.tags.length - 3}
                    </span>
                  )}
                </div>

                {/* Rating */}
                <div className="flex items-center space-x-2">
                  <div className="flex items-center">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <svg
                        key={star}
                        className={`w-4 h-4 ${
                          star <= Math.round(protocol.average_rating)
                            ? 'text-yellow-400'
                            : 'text-gray-300'
                        }`}
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                  <span className="text-sm text-gray-600">
                    {protocol.average_rating.toFixed(1)} ({protocol.total_ratings} reviews)
                  </span>
                </div>

                {/* Actions */}
                <div className="flex space-x-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedProtocol(protocol);
                      setShowProtocolDetails(true);
                    }}
                    className="flex-1"
                  >
                    View Details
                  </Button>
                  <Button
                    size="sm"
                    className="bg-slate-800 hover:bg-slate-700 flex-1"
                    onClick={() => {
                      // Track usage
                      setProtocols(prev => prev.map(p => 
                        p.id === protocol.id 
                          ? { ...p, usage_count: p.usage_count + 1, last_used_at: new Date().toISOString() }
                          : p
                      ));
                    }}
                  >
                    Use Protocol
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
            <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No protocols found</h3>
            <p className="text-gray-600 mb-4">
              {filters.search || filters.protocol_type || filters.category || filters.privacy_level
                ? 'Try adjusting your filters or search terms.'
                : 'Get started by creating your first professional protocol.'}
            </p>
            <Button
              onClick={() => setShowCreateForm(true)}
              className="bg-slate-800 hover:bg-slate-700"
            >
              Create Protocol
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Create Protocol Form */}
      {showCreateForm && (
        <ProfessionalProtocolForm
          onSubmit={handleCreateProtocol}
          onCancel={() => setShowCreateForm(false)}
        />
      )}

      {/* Template Selection Modal */}
      {showTemplateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">Choose Protocol Template</h2>
                <button
                  onClick={() => setShowTemplateModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {templates.map((template) => (
                  <Card key={template.id} className="hover:shadow-lg transition-shadow cursor-pointer">
                    <CardHeader>
                      <CardTitle className="text-lg font-semibold text-gray-900">
                        {template.template_name}
                      </CardTitle>
                      <p className="text-sm text-gray-600 mt-1">
                        {template.description}
                      </p>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-sm">
                        <div>
                          <span className="text-gray-500">Type:</span>
                          <span className="ml-1 font-medium capitalize">{template.protocol_type.replace('_', ' ')}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Category:</span>
                          <span className="ml-1 font-medium capitalize">{template.category.replace('_', ' ')}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Used:</span>
                          <span className="ml-1 font-medium">{template.usage_count} times</span>
                        </div>
                      </div>
                      <Button
                        className="w-full mt-4 bg-slate-800 hover:bg-slate-700"
                        onClick={() => {
                          setSelectedTemplate(template);
                          setShowTemplateModal(false);
                          setShowCreateForm(true);
                        }}
                      >
                        Use This Template
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Protocol Details Modal */}
      {showProtocolDetails && selectedProtocol && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">{selectedProtocol.title}</h2>
                <button
                  onClick={() => setShowProtocolDetails(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
              <div className="space-y-6">
                {/* Basic Info */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Protocol Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <span className="text-gray-500">Objective:</span>
                      <p className="mt-1 text-gray-900">{selectedProtocol.objective}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Version:</span>
                      <p className="mt-1 text-gray-900">{selectedProtocol.version}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Duration:</span>
                      <p className="mt-1 text-gray-900">{formatDuration(selectedProtocol.estimated_duration_minutes)}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Cost per Sample:</span>
                      <p className="mt-1 text-gray-900">${selectedProtocol.cost_per_sample}</p>
                    </div>
                  </div>
                </div>

                {/* Procedure Steps */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Procedure Steps</h3>
                  <div className="space-y-3">
                    {selectedProtocol.procedure_steps.map((step, index) => (
                      <div key={index} className="flex items-start space-x-3 p-3 border border-gray-200 rounded-lg">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                          step.critical ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
                        }`}>
                          {step.step}
                        </div>
                        <div className="flex-1">
                          <p className="text-gray-900">{step.description}</p>
                          <div className="flex items-center space-x-4 mt-1 text-sm text-gray-500">
                            <span>Duration: {step.duration_minutes}m</span>
                            {step.temperature && <span>Temperature: {step.temperature}</span>}
                            {step.critical && <span className="text-red-600 font-medium">Critical Step</span>}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Expected Results */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Expected Results</h3>
                  <p className="text-gray-900">{selectedProtocol.expected_results}</p>
                </div>

                {/* References */}
                {selectedProtocol.literature_references.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Literature References</h3>
                    <ul className="list-disc list-inside space-y-1">
                      {selectedProtocol.literature_references.map((ref, index) => (
                        <li key={index} className="text-gray-900">{ref}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
            
            <div className="p-6 border-t border-gray-200 bg-gray-50">
              <div className="flex justify-end space-x-3">
                <Button
                  variant="outline"
                  onClick={() => setShowProtocolDetails(false)}
                >
                  Close
                </Button>
                <Button
                  className="bg-slate-800 hover:bg-slate-700"
                  onClick={() => {
                    // Track usage
                    setProtocols(prev => prev.map(p => 
                      p.id === selectedProtocol.id 
                        ? { ...p, usage_count: p.usage_count + 1, last_used_at: new Date().toISOString() }
                        : p
                    ));
                    setShowProtocolDetails(false);
                  }}
                >
                  Use This Protocol
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfessionalProtocolsPage;
