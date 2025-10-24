import React, { useState, useEffect } from 'react';
import Card, { CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import { 
  SearchIcon,
  PlusIcon,
  BuildingOfficeIcon,
  HeartIcon,
  AcademicCapIcon,
  BeakerIcon,
  GlobeIcon,
  UsersIcon,
  DocumentTextIcon,
  BarChartIcon,
  ClockIcon,
  CheckCircleIcon,
  AlertTriangleIcon,
  EyeIcon,
  ArrowDownTrayIcon,
  ShareIcon,
  TagIcon,
  MapPinIcon,
  PhoneIcon,
  EnvelopeIcon,
  CalendarIcon,
  DatabaseIcon,
  ShieldCheckIcon,
  StarIcon,
  HandshakeIcon,
  ClipboardDocumentCheckIcon,
  ScaleIcon,
  XMarkIcon,
  FilterIcon,
  InfoIcon
} from '../components/icons';

// Ethical Guidelines Interface
interface EthicalGuidelines {
  dataUsageTerms: string[];
  acknowledgmentRequired: boolean;
  coAuthorshipPolicy: 'mandatory' | 'negotiable' | 'not_required' | 'case_by_case';
  citationFormat: string;
  privacyCompliance: string[];
  consentLevel: 'full_consent' | 'opt_in' | 'anonymized' | 'public_data';
  commercialUse: 'allowed' | 'restricted' | 'prohibited';
  publicationRights: string;
}

// Types for the Research Data Bank
interface DataBankOrganization {
  id: string;
  name: string;
  type: 'research_lab' | 'hospital' | 'diagnostic_lab' | 'industry' | 'public_sector' | 'ngo' | 'individual';
  category: 'healthcare' | 'research' | 'industry' | 'government' | 'nonprofit' | 'academic';
  country: string;
  region: string;
  contactEmail: string;
  website?: string;
  description: string;
  specializations: string[];
  dataAvailable: DataOffer[];
  verified: boolean;
  rating: number;
  joinedDate: Date;
  lastActive: Date;
  ethicalGuidelines: EthicalGuidelines;
}

interface DataOffer {
  id: string;
  organizationId: string;
  title: string;
  description: string;
  dataType: 'clinical' | 'epidemiological' | 'genomic' | 'environmental' | 'social' | 'economic' | 'demographic';
  diseaseFocus?: string[];
  populationType: 'general' | 'pediatric' | 'adult' | 'elderly' | 'specific_condition';
  sampleSize?: number;
  geographicCoverage: string[];
  timePeriod: string;
  accessLevel: 'open' | 'restricted' | 'collaboration_required';
  requirements: string[];
  contactPerson: string;
  lastUpdated: Date;
  requestCount: number;
  ethicalGuidelines: EthicalGuidelines;
}

interface DataRequest {
  id: string;
  requesterId: string;
  requesterName: string;
  requesterInstitution: string;
  dataOfferId: string;
  purpose: string;
  methodology: string;
  timeline: string;
  collaborationProposed: boolean;
  status: 'pending' | 'approved' | 'rejected' | 'in_progress' | 'completed';
  submittedDate: Date;
  responseDate?: Date;
  notes?: string;
  acknowledgedTerms: boolean;
  proposedAcknowledgment: string;
  proposedCoAuthorship?: string;
  ethicsApprovalNumber?: string;
  irbApproval?: boolean;
}

const ResearchDataBankPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'databank'>('databank');
  const [organizations, setOrganizations] = useState<DataBankOrganization[]>([]);
  const [filteredOrgs, setFilteredOrgs] = useState<DataBankOrganization[]>([]);
  const [selectedOrg, setSelectedOrg] = useState<DataBankOrganization | null>(null);
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [showRegistrationForm, setShowRegistrationForm] = useState(false);
  const [showEthicsModal, setShowEthicsModal] = useState(false);
  const [selectedDataOffer, setSelectedDataOffer] = useState<DataOffer | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterCountry, setFilterCountry] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'name' | 'rating' | 'recent' | 'verified'>('verified');

  // Load mock data with ethical guidelines
  useEffect(() => {
    const defaultEthicalGuidelines: EthicalGuidelines = {
      dataUsageTerms: [
        'Data must be used for research purposes only',
        'Results must be published in peer-reviewed journals',
        'Data cannot be shared with third parties without permission'
      ],
      acknowledgmentRequired: true,
      coAuthorshipPolicy: 'case_by_case',
      citationFormat: 'Please cite: [Organization Name]. [Dataset Title]. [Year]. Available at: [URL]',
      privacyCompliance: ['GDPR', 'HIPAA', 'Local Data Protection Laws'],
      consentLevel: 'full_consent',
      commercialUse: 'restricted',
      publicationRights: 'Data contributor must be acknowledged and offered co-authorship on publications directly using the data'
    };

    const mockOrganizations: DataBankOrganization[] = [
      {
        id: '1',
        name: 'World Health Organization - Global HIV Research Initiative',
        type: 'public_sector',
        category: 'healthcare',
        country: 'Switzerland',
        region: 'Geneva',
        contactEmail: 'hiv.data@who.int',
        website: 'https://www.who.int/hiv',
        description: 'Leading global research initiative focused on HIV/AIDS prevalence, treatment, and prevention strategies across 150+ countries.',
        specializations: ['Epidemiology', 'HIV/AIDS Research', 'Public Health', 'Global Health'],
        dataAvailable: [
          {
            id: '1-1',
            organizationId: '1',
            title: 'Global HIV Prevalence Dataset 2000-2024',
            description: 'Comprehensive anonymized dataset covering HIV prevalence rates, demographics, risk factors, and treatment outcomes across 150 countries over 24 years.',
            dataType: 'epidemiological',
            diseaseFocus: ['HIV', 'AIDS'],
            populationType: 'general',
            sampleSize: 2500000,
            geographicCoverage: ['Global', '150 countries'],
            timePeriod: '2000-2024',
            accessLevel: 'restricted',
            requirements: ['Ethics approval', 'IRB clearance', 'Data use agreement', 'Research proposal review'],
            contactPerson: 'Dr. Meg Doherty',
            lastUpdated: new Date('2024-01-05'),
            requestCount: 156,
            ethicalGuidelines: {
              ...defaultEthicalGuidelines,
              coAuthorshipPolicy: 'mandatory',
              citationFormat: 'WHO Global HIV Research Initiative. Global HIV Prevalence Dataset 2000-2024. 2024. DOI: 10.WHO/HIV/2024.001',
              dataUsageTerms: [
                'Data must be used for non-commercial research purposes only',
                'Results must be shared with WHO before publication',
                'Data cannot be re-distributed or shared with third parties',
                'Annual progress reports required for long-term studies'
              ]
            }
          }
        ],
        verified: true,
        rating: 4.9,
        joinedDate: new Date('2023-01-01'),
        lastActive: new Date('2024-01-22'),
        ethicalGuidelines: defaultEthicalGuidelines
      },
      {
        id: '2',
        name: 'Johns Hopkins Bloomberg School of Public Health',
        type: 'research_lab',
        category: 'academic',
        country: 'United States',
        region: 'Maryland',
        contactEmail: 'databank@jhu.edu',
        website: 'https://publichealth.jhu.edu',
        description: 'Premier academic institution providing access to epidemiological and public health datasets for collaborative research.',
        specializations: ['Epidemiology', 'Biostatistics', 'Public Health', 'Disease Surveillance'],
        dataAvailable: [
          {
            id: '2-1',
            organizationId: '2',
            title: 'COVID-19 Global Case Tracking Data',
            description: 'Daily updated COVID-19 case data, mortality, vaccination rates, and variant tracking.',
            dataType: 'epidemiological',
            diseaseFocus: ['COVID-19', 'SARS-CoV-2'],
            populationType: 'general',
            sampleSize: 8000000000,
            geographicCoverage: ['Global', 'All countries'],
            timePeriod: '2020-2024',
            accessLevel: 'open',
            requirements: ['Registration', 'Data use agreement'],
            contactPerson: 'Dr. Jennifer Nuzzo',
            lastUpdated: new Date('2024-01-15'),
            requestCount: 3420,
            ethicalGuidelines: {
              ...defaultEthicalGuidelines,
              coAuthorshipPolicy: 'not_required',
              acknowledgmentRequired: true,
              consentLevel: 'public_data',
              commercialUse: 'allowed',
              citationFormat: 'Johns Hopkins University. COVID-19 Global Case Tracking Data. 2024. Available at: https://coronavirus.jhu.edu',
              dataUsageTerms: [
                'Attribution required in all publications',
                'Data is provided "as is" without warranty',
                'Users encouraged to report errors or suggest improvements'
              ]
            }
          }
        ],
        verified: true,
        rating: 4.8,
        joinedDate: new Date('2023-02-15'),
        lastActive: new Date('2024-01-20'),
        ethicalGuidelines: {
          ...defaultEthicalGuidelines,
          coAuthorshipPolicy: 'negotiable'
        }
      },
      {
        id: '3',
        name: 'National Cancer Institute',
        type: 'research_lab',
        category: 'research',
        country: 'United States',
        region: 'Maryland',
        contactEmail: 'nci.databank@nih.gov',
        website: 'https://www.cancer.gov',
        description: 'Comprehensive cancer research datasets including genomic data, clinical trials, and treatment outcomes.',
        specializations: ['Oncology', 'Genomics', 'Clinical Trials', 'Cancer Research'],
        dataAvailable: [
          {
            id: '3-1',
            organizationId: '3',
            title: 'Cancer Genome Atlas (TCGA) Data',
            description: 'Multi-omic cancer genomics data across 33 cancer types with clinical annotations.',
            dataType: 'genomic',
            diseaseFocus: ['Cancer', 'Multiple cancer types'],
            populationType: 'adult',
            sampleSize: 11000,
            geographicCoverage: ['United States', 'International collaborators'],
            timePeriod: '2006-2023',
            accessLevel: 'restricted',
            requirements: ['dbGaP authorization', 'Institutional certification', 'Ethics approval'],
            contactPerson: 'Dr. Louis Staudt',
            lastUpdated: new Date('2023-12-20'),
            requestCount: 892,
            ethicalGuidelines: {
              ...defaultEthicalGuidelines,
              coAuthorshipPolicy: 'case_by_case',
              consentLevel: 'full_consent',
              commercialUse: 'restricted',
              citationFormat: 'The Cancer Genome Atlas Research Network. [Specific publication]. Nature/Cell/etc. DOI: [...]',
              dataUsageTerms: [
                'Data access requires NIH dbGaP authorization',
                'Institutional certification required',
                'Publications must acknowledge TCGA Research Network',
                'Co-authorship negotiated for significant collaborative contributions',
                'Commercial use requires separate licensing agreement'
              ]
            }
          }
        ],
        verified: true,
        rating: 4.9,
        joinedDate: new Date('2023-01-10'),
        lastActive: new Date('2024-01-18'),
        ethicalGuidelines: {
          ...defaultEthicalGuidelines,
          coAuthorshipPolicy: 'mandatory',
          commercialUse: 'prohibited'
        }
      }
    ];
    setOrganizations(mockOrganizations);
    setFilteredOrgs(mockOrganizations);
  }, []);

  // Filter and sort organizations
  useEffect(() => {
    let filtered = organizations.filter(org => {
      const matchesSearch = org.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           org.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           org.specializations.some(spec => spec.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesType = filterType === 'all' || org.type === filterType;
      const matchesCategory = filterCategory === 'all' || org.category === filterCategory;
      const matchesCountry = filterCountry === 'all' || org.country === filterCountry;
      
      return matchesSearch && matchesType && matchesCategory && matchesCountry;
    });

    // Sort organizations
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'rating':
          return b.rating - a.rating;
        case 'recent':
          return b.lastActive.getTime() - a.lastActive.getTime();
        case 'verified':
          return (b.verified ? 1 : 0) - (a.verified ? 1 : 0);
        default:
          return 0;
      }
    });

    setFilteredOrgs(filtered);
  }, [organizations, searchTerm, filterType, filterCategory, filterCountry, sortBy]);

  const getOrgTypeIcon = (type: string) => {
    switch (type) {
      case 'research_lab': return <BeakerIcon className="w-5 h-5" />;
      case 'hospital': return <HeartIcon className="w-5 h-5" />;
      case 'diagnostic_lab': return <BarChartIcon className="w-5 h-5" />;
      case 'industry': return <BuildingOfficeIcon className="w-5 h-5" />;
      case 'public_sector': return <GlobeIcon className="w-5 h-5" />;
      case 'ngo': return <UsersIcon className="w-5 h-5" />;
      case 'individual': return <AcademicCapIcon className="w-5 h-5" />;
      default: return <BuildingOfficeIcon className="w-5 h-5" />;
    }
  };

  const getAccessLevelColor = (level: string) => {
    switch (level) {
      case 'open': return 'bg-green-100 text-green-800';
      case 'restricted': return 'bg-yellow-100 text-yellow-800';
      case 'collaboration_required': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCoAuthorshipBadge = (policy: string) => {
    switch (policy) {
      case 'mandatory': return <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">Co-authorship Required</span>;
      case 'negotiable': return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">Co-authorship Negotiable</span>;
      case 'case_by_case': return <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">Case-by-Case Basis</span>;
      case 'not_required': return <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">Acknowledgment Only</span>;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Hero Section */}
      <div className="bg-white text-gray-900 h-1/2 min-h-[300px] flex items-center">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-blue-100 rounded-full">
                <DatabaseIcon className="w-12 h-12 text-blue-600" />
              </div>
            </div>
            
            <h1 className="text-3xl md:text-4xl font-bold mb-3 text-gray-900">
              Research Data Bank
            </h1>
            
            <p className="text-lg md:text-xl text-gray-600 mb-6 max-w-2xl mx-auto">
              Accelerating scientific breakthroughs through ethical data sharing
            </p>
            
            <div className="flex flex-col sm:flex-row justify-center gap-3">
              <Button 
                onClick={() => setShowRegistrationForm(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 font-semibold shadow-lg border-0"
              >
                <PlusIcon className="w-4 h-4 mr-2" />
                Join the Network
              </Button>
              <Button 
                onClick={() => setShowEthicsModal(true)}
                className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 font-semibold border-0"
              >
                <InfoIcon className="w-4 h-4 mr-2" />
                Ethical Guidelines
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-gray-900 mb-3">How Research Data Bank Works</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            A transparent, ethical framework for sharing research data while protecting privacy and ensuring proper attribution
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <Card className="text-center">
            <CardContent className="p-6">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <BuildingOfficeIcon className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="font-semibold text-lg mb-2">1. Register</h3>
              <p className="text-sm text-gray-600">
                Organizations register and get verified with their data offerings and ethical guidelines
              </p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardContent className="p-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <SearchIcon className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="font-semibold text-lg mb-2">2. Search</h3>
              <p className="text-sm text-gray-600">
                Researchers search for relevant datasets by disease, geography, or research domain
              </p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardContent className="p-6">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <ClipboardDocumentCheckIcon className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="font-semibold text-lg mb-2">3. Request</h3>
              <p className="text-sm text-gray-600">
                Submit formal data requests with research proposals, ethics approval, and acknowledgment terms
              </p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardContent className="p-6">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <HandshakeIcon className="w-8 h-8 text-orange-600" />
              </div>
              <h3 className="font-semibold text-lg mb-2">4. Collaborate</h3>
              <p className="text-sm text-gray-600">
                Work together with data providers, ensure proper attribution, and advance research
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Ethical Guidelines Banner */}
        <Card className="bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200 mb-8">
          <CardContent className="p-6">
            <div className="flex items-start">
              <div className="p-3 bg-indigo-100 rounded-lg mr-4">
                <ScaleIcon className="w-8 h-8 text-indigo-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-gray-900 mb-2">Our Ethical Framework</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div className="flex items-start">
                    <CheckCircleIcon className="w-5 h-5 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                    <div>
                      <strong className="text-gray-900">Fair Attribution:</strong>
                      <span className="text-gray-700"> All data contributors must be acknowledged in publications</span>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <CheckCircleIcon className="w-5 h-5 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                    <div>
                      <strong className="text-gray-900">Co-Authorship Rights:</strong>
                      <span className="text-gray-700"> Data providers can negotiate co-authorship based on contribution level</span>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <CheckCircleIcon className="w-5 h-5 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                    <div>
                      <strong className="text-gray-900">Privacy Protection:</strong>
                      <span className="text-gray-700"> All data is anonymized and complies with GDPR, HIPAA, and local regulations</span>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <CheckCircleIcon className="w-5 h-5 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                    <div>
                      <strong className="text-gray-900">Transparent Terms:</strong>
                      <span className="text-gray-700"> Clear data use agreements and ethical guidelines for every dataset</span>
                    </div>
                  </div>
                </div>
                <Button 
                  onClick={() => setShowEthicsModal(true)}
                  variant="secondary"
                  className="mt-2"
                >
                  Read Full Ethical Guidelines
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            
            {/* Search */}
            <div className="lg:col-span-2">
              <div className="relative">
                <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  type="text"
                  placeholder="Search organizations, specializations, or diseases..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Type Filter */}
            <div>
              <Select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
              >
                <option value="all">All Types</option>
                <option value="research_lab">Research Labs</option>
                <option value="hospital">Hospitals</option>
                <option value="diagnostic_lab">Diagnostic Labs</option>
                <option value="industry">Industry</option>
                <option value="public_sector">Public Sector</option>
                <option value="ngo">NGOs</option>
                <option value="individual">Individual Researchers</option>
              </Select>
            </div>

            {/* Category Filter */}
            <div>
              <Select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
              >
                <option value="all">All Categories</option>
                <option value="healthcare">Healthcare</option>
                <option value="research">Research</option>
                <option value="industry">Industry</option>
                <option value="government">Government</option>
                <option value="nonprofit">Nonprofit</option>
                <option value="academic">Academic</option>
              </Select>
            </div>

          </div>

          {/* Country and Sort */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-4">
            <div>
              <Select
                value={filterCountry}
                onChange={(e) => setFilterCountry(e.target.value)}
              >
                <option value="all">All Countries</option>
                <option value="United States">United States</option>
                <option value="United Kingdom">United Kingdom</option>
                <option value="Switzerland">Switzerland</option>
                <option value="Germany">Germany</option>
                <option value="Canada">Canada</option>
                <option value="Australia">Australia</option>
              </Select>
            </div>

            <div>
              <Select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
              >
                <option value="verified">Sort by Verified</option>
                <option value="name">Sort by Name</option>
                <option value="rating">Sort by Rating</option>
                <option value="recent">Sort by Recently Active</option>
              </Select>
            </div>

            <div className="flex items-center text-sm text-gray-600">
              <FilterIcon className="w-4 h-4 mr-2" />
              {filteredOrgs.length} organization{filteredOrgs.length !== 1 ? 's' : ''} found
            </div>
          </div>
        </div>

        {/* Organizations List */}
        {filteredOrgs.length === 0 ? (
          <div className="text-center py-16">
            <DatabaseIcon className="w-20 h-20 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No organizations found</h3>
            <p className="text-gray-600">Try adjusting your search criteria or filters</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredOrgs.map(org => (
              <Card 
                key={org.id} 
                className="hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => setSelectedOrg(org)}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-start">
                      <div className="p-2 bg-blue-100 rounded-lg mr-3">
                        {getOrgTypeIcon(org.type)}
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg text-gray-900">{org.name}</h3>
                        <p className="text-sm text-gray-500">{org.region}, {org.country}</p>
                      </div>
                    </div>
                    {org.verified && (
                      <CheckCircleIcon className="w-6 h-6 text-green-500" title="Verified Organization" />
                    )}
                  </div>

                  <p className="text-sm text-gray-700 mb-3 line-clamp-2">{org.description}</p>

                  <div className="flex flex-wrap gap-2 mb-3">
                    {org.specializations.slice(0, 3).map((spec, idx) => (
                      <span key={idx} className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-full">
                        {spec}
                      </span>
                    ))}
                    {org.specializations.length > 3 && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                        +{org.specializations.length - 3} more
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-sm border-t border-gray-200 pt-3">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center">
                        <StarIcon className="w-4 h-4 text-yellow-400 mr-1" />
                        <span className="font-medium text-gray-900">{org.rating.toFixed(1)}</span>
                      </div>
                      <div className="flex items-center text-gray-600">
                        <DatabaseIcon className="w-4 h-4 mr-1" />
                        {org.dataAvailable.length} dataset{org.dataAvailable.length !== 1 ? 's' : ''}
                      </div>
                    </div>
                    {getCoAuthorshipBadge(org.ethicalGuidelines.coAuthorshipPolicy)}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Organization Detail Modal */}
      {selectedOrg && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">{selectedOrg.name}</h2>
              <button
                onClick={() => setSelectedOrg(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6">
              {/* Organization Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Organization Details</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center text-gray-600">
                      <BuildingOfficeIcon className="w-4 h-4 mr-2" />
                      Type: {selectedOrg.type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </div>
                    <div className="flex items-center text-gray-600">
                      <TagIcon className="w-4 h-4 mr-2" />
                      Category: {selectedOrg.category.replace(/\b\w/g, l => l.toUpperCase())}
                    </div>
                    <div className="flex items-center text-gray-600">
                      <MapPinIcon className="w-4 h-4 mr-2" />
                      Location: {selectedOrg.region}, {selectedOrg.country}
                    </div>
                    <div className="flex items-center text-gray-600">
                      <EnvelopeIcon className="w-4 h-4 mr-2" />
                      <a href={`mailto:${selectedOrg.contactEmail}`} className="text-blue-600 hover:underline">
                        {selectedOrg.contactEmail}
                      </a>
                    </div>
                    {selectedOrg.website && (
                      <div className="flex items-center text-gray-600">
                        <GlobeIcon className="w-4 h-4 mr-2" />
                        <a href={selectedOrg.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                          {selectedOrg.website}
                        </a>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Ethical Guidelines</h3>
                  <div className="space-y-2 text-sm">
                    <div>
                      <strong>Co-Authorship Policy:</strong>
                      <div className="mt-1">{getCoAuthorshipBadge(selectedOrg.ethicalGuidelines.coAuthorshipPolicy)}</div>
                    </div>
                    <div>
                      <strong>Acknowledgment:</strong>
                      <span className="ml-2">{selectedOrg.ethicalGuidelines.acknowledgmentRequired ? 'Required' : 'Optional'}</span>
                    </div>
                    <div>
                      <strong>Commercial Use:</strong>
                      <span className="ml-2 capitalize">{selectedOrg.ethicalGuidelines.commercialUse}</span>
                    </div>
                    <div>
                      <strong>Privacy Compliance:</strong>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {selectedOrg.ethicalGuidelines.privacyCompliance.map((comp, idx) => (
                          <span key={idx} className="px-2 py-0.5 bg-green-100 text-green-800 text-xs rounded">
                            {comp}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="mb-6">
                <h3 className="font-semibold text-gray-900 mb-2">About</h3>
                <p className="text-gray-700">{selectedOrg.description}</p>
              </div>

              {/* Specializations */}
              <div className="mb-6">
                <h3 className="font-semibold text-gray-900 mb-2">Specializations</h3>
                <div className="flex flex-wrap gap-2">
                  {selectedOrg.specializations.map((spec, idx) => (
                    <span key={idx} className="px-3 py-1 bg-purple-100 text-purple-800 text-sm rounded-full">
                      {spec}
                    </span>
                  ))}
                </div>
              </div>

              {/* Data Offerings */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Available Datasets ({selectedOrg.dataAvailable.length})</h3>
                <div className="space-y-4">
                  {selectedOrg.dataAvailable.map(dataOffer => (
                    <Card key={dataOffer.id} className="border border-gray-200">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-semibold text-gray-900">{dataOffer.title}</h4>
                          <span className={`px-2 py-1 text-xs rounded-full ${getAccessLevelColor(dataOffer.accessLevel)}`}>
                            {dataOffer.accessLevel.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700 mb-3">{dataOffer.description}</p>

                        <div className="grid grid-cols-2 gap-3 text-xs text-gray-600 mb-3">
                          <div><strong>Type:</strong> {dataOffer.dataType}</div>
                          <div><strong>Sample Size:</strong> {dataOffer.sampleSize?.toLocaleString() || 'N/A'}</div>
                          <div><strong>Period:</strong> {dataOffer.timePeriod}</div>
                          <div><strong>Requests:</strong> {dataOffer.requestCount}</div>
                        </div>

                        {/* Ethical Requirements for this Dataset */}
                        <div className="border-t border-gray-200 pt-3 mt-3">
                          <strong className="text-xs text-gray-700 block mb-2">Ethical Requirements:</strong>
                          <div className="flex flex-wrap gap-2 mb-2">
                            {getCoAuthorshipBadge(dataOffer.ethicalGuidelines.coAuthorshipPolicy)}
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                              {dataOffer.ethicalGuidelines.consentLevel.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </span>
                          </div>
                          <div className="text-xs text-gray-600 mb-3">
                            <strong>Citation Format:</strong>
                            <div className="mt-1 p-2 bg-gray-50 rounded text-xs font-mono">
                              {dataOffer.ethicalGuidelines.citationFormat}
                            </div>
                          </div>
                        </div>

                        <div className="flex justify-end">
                          <Button
                            onClick={() => {
                              setSelectedDataOffer(dataOffer);
                              setShowRequestForm(true);
                            }}
                            className="bg-blue-600 hover:bg-blue-700"
                          >
                            Request Data Access
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Ethics Information Modal */}
      {showEthicsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Ethical Guidelines & Best Practices</h2>
              <button
                onClick={() => setShowEthicsModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <section>
                <h3 className="text-xl font-semibold text-gray-900 mb-3 flex items-center">
                  <HandshakeIcon className="w-6 h-6 mr-2 text-blue-600" />
                  Co-Authorship & Attribution
                </h3>
                <div className="space-y-3 text-gray-700">
                  <p>
                    Research Data Bank recognizes that data collection and curation represents significant intellectual and practical contribution to research. Our co-authorship policies are designed to fairly recognize these contributions:
                  </p>
                  <div className="bg-blue-50 p-4 rounded-lg space-y-2">
                    <div>
                      <strong className="text-blue-900">Mandatory Co-Authorship:</strong>
                      <p className="text-sm">Data provider must be offered co-authorship on all publications using the dataset. Refusal requires written documentation.</p>
                    </div>
                    <div>
                      <strong className="text-blue-900">Negotiable Co-Authorship:</strong>
                      <p className="text-sm">Co-authorship discussed based on level of data contribution, support provided, and publication scope.</p>
                    </div>
                    <div>
                      <strong className="text-blue-900">Case-by-Case:</strong>
                      <p className="text-sm">Evaluated individually based on research context, data usage extent, and collaborative involvement.</p>
                    </div>
                    <div>
                      <strong className="text-blue-900">Acknowledgment Only:</strong>
                      <p className="text-sm">Formal acknowledgment required in publications, but co-authorship not mandatory.</p>
                    </div>
                  </div>
                </div>
              </section>

              <section>
                <h3 className="text-xl font-semibold text-gray-900 mb-3 flex items-center">
                  <ShieldCheckIcon className="w-6 h-6 mr-2 text-green-600" />
                  Privacy & Data Protection
                </h3>
                <div className="space-y-2 text-gray-700">
                  <p>All data shared through the Research Data Bank must comply with:</p>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li><strong>GDPR (EU General Data Protection Regulation):</strong> For European data subjects</li>
                    <li><strong>HIPAA (Health Insurance Portability and Accountability Act):</strong> For U.S. healthcare data</li>
                    <li><strong>Local Data Protection Laws:</strong> Country-specific regulations</li>
                    <li><strong>Institutional Review Board (IRB) Approval:</strong> Required for human subjects research</li>
                  </ul>
                  <div className="bg-green-50 p-4 rounded-lg mt-3">
                    <strong className="text-green-900">Data Anonymization Standards:</strong>
                    <ul className="text-sm list-disc list-inside ml-2 mt-2 space-y-1">
                      <li>Removal of 18 HIPAA identifiers for de-identification</li>
                      <li>K-anonymity principles for demographic data</li>
                      <li>Differential privacy techniques when appropriate</li>
                      <li>Secure data transfer and storage protocols</li>
                    </ul>
                  </div>
                </div>
              </section>

              <section>
                <h3 className="text-xl font-semibold text-gray-900 mb-3 flex items-center">
                  <ClipboardDocumentCheckIcon className="w-6 h-6 mr-2 text-purple-600" />
                  Data Request Process
                </h3>
                <div className="space-y-2 text-gray-700">
                  <p>To request data access, researchers must provide:</p>
                  <ol className="list-decimal list-inside space-y-2 ml-4">
                    <li><strong>Research Proposal:</strong> Clear objectives, methodology, and expected outcomes</li>
                    <li><strong>Ethics Approval:</strong> IRB or equivalent ethics committee approval for your institution</li>
                    <li><strong>Data Use Agreement:</strong> Signed commitment to ethical data use and citation practices</li>
                    <li><strong>Proposed Attribution:</strong> How you plan to acknowledge/cite the data provider</li>
                    <li><strong>Collaboration Statement:</strong> Whether you're proposing collaborative authorship</li>
                  </ol>
                </div>
              </section>

              <section>
                <h3 className="text-xl font-semibold text-gray-900 mb-3 flex items-center">
                  <ScaleIcon className="w-6 h-6 mr-2 text-indigo-600" />
                  Fair Use & Commercial Restrictions
                </h3>
                <div className="space-y-2 text-gray-700">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-green-50 p-3 rounded-lg">
                      <strong className="text-green-900 block mb-1">Allowed</strong>
                      <p className="text-sm">Non-commercial research, academic publications, open-source tools</p>
                    </div>
                    <div className="bg-yellow-50 p-3 rounded-lg">
                      <strong className="text-yellow-900 block mb-1">Restricted</strong>
                      <p className="text-sm">Commercial research requires licensing agreement, revenue sharing may apply</p>
                    </div>
                    <div className="bg-red-50 p-3 rounded-lg">
                      <strong className="text-red-900 block mb-1">Prohibited</strong>
                      <p className="text-sm">Reselling data, unauthorized redistribution, patient re-identification attempts</p>
                    </div>
                  </div>
                </div>
              </section>

              <section>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Contact & Dispute Resolution</h3>
                <div className="bg-gray-50 p-4 rounded-lg text-gray-700">
                  <p className="mb-2">
                    For questions about ethical guidelines or to report concerns:
                  </p>
                  <p className="text-sm">
                    <strong>Email:</strong> ethics@researchdatabank.org<br />
                    <strong>Review Committee:</strong> All disputes are reviewed by an independent ethics committee<br />
                    <strong>Response Time:</strong> Within 5 business days
                  </p>
                </div>
              </section>
            </div>
          </div>
        </div>
      )}

      {/* Data Request Form Modal - Enhanced with Ethics */}
      {showRequestForm && selectedDataOffer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Request Data Access</h2>
              <button
                onClick={() => {
                  setShowRequestForm(false);
                  setSelectedDataOffer(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <h3 className="font-semibold text-blue-900 mb-2">Dataset: {selectedDataOffer.title}</h3>
                <div className="text-sm text-blue-800 space-y-1">
                  <p><strong>Ethical Requirements:</strong></p>
                  <ul className="list-disc list-inside ml-4">
                    {selectedDataOffer.ethicalGuidelines.dataUsageTerms.map((term, idx) => (
                      <li key={idx}>{term}</li>
                    ))}
                  </ul>
                  <div className="mt-2">
                    {getCoAuthorshipBadge(selectedDataOffer.ethicalGuidelines.coAuthorshipPolicy)}
                  </div>
                </div>
              </div>

              <form className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Your Name *
                  </label>
                  <Input type="text" required placeholder="Dr. Jane Smith" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Your Institution *
                  </label>
                  <Input type="text" required placeholder="University of Research" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Your Email *
                  </label>
                  <Input type="email" required placeholder="jane.smith@university.edu" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Research Purpose * <span className="text-xs text-gray-500">(Describe your research objectives)</span>
                  </label>
                  <textarea
                    required
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="We aim to study the prevalence of HIV across different demographics to identify risk factors and inform public health interventions..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Methodology * <span className="text-xs text-gray-500">(Brief overview of your approach)</span>
                  </label>
                  <textarea
                    required
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Statistical analysis using R, multivariate regression models, controlling for confounding variables..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      IRB/Ethics Approval Number *
                    </label>
                    <Input type="text" required placeholder="IRB-2024-001234" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Expected Timeline *
                    </label>
                    <Input type="text" required placeholder="6 months" />
                  </div>
                </div>

                {selectedDataOffer.ethicalGuidelines.coAuthorshipPolicy !== 'not_required' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Proposed Co-Authorship Statement *
                    </label>
                    <textarea
                      required
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="We propose co-authorship for the data provider based on their substantial contribution to data collection and curation. We will involve them in manuscript review and welcome their input on data interpretation..."
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Proposed Acknowledgment/Citation *
                  </label>
                  <textarea
                    required
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder={selectedDataOffer.ethicalGuidelines.citationFormat}
                  />
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-start">
                    <input type="checkbox" required className="mt-1 mr-3" />
                    <label className="text-sm text-yellow-900">
                      <strong>I acknowledge and agree to the following terms: *</strong>
                      <ul className="list-disc list-inside mt-2 space-y-1 ml-2">
                        <li>I will use this data only for the stated research purpose</li>
                        <li>I will comply with all ethical guidelines and privacy regulations</li>
                        <li>I will provide proper attribution as specified</li>
                        <li>I will offer co-authorship as per the stated policy</li>
                        <li>I will not share or redistribute this data without permission</li>
                        <li>I will promptly report any data breaches or ethical concerns</li>
                      </ul>
                    </label>
                  </div>
                </div>

                <div className="flex justify-end gap-3">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => {
                      setShowRequestForm(false);
                      setSelectedDataOffer(null);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <ClipboardDocumentCheckIcon className="w-4 h-4 mr-2" />
                    Submit Request
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Organization Registration Form Modal */}
      {showRegistrationForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Register Your Organization</h2>
              <button
                onClick={() => setShowRegistrationForm(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <h3 className="font-semibold text-blue-900 mb-2">Join the Global Research Data Network</h3>
                <p className="text-sm text-blue-800">
                  Register your organization to share research data with the global scientific community. 
                  Help accelerate research breakthroughs while maintaining ethical standards.
                </p>
              </div>

              <form className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Organization Name *
                    </label>
                    <Input type="text" required placeholder="World Health Organization" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Organization Type *
                    </label>
                    <Select required>
                      <option value="">Select Type</option>
                      <option value="research_lab">Research Laboratory</option>
                      <option value="hospital">Hospital</option>
                      <option value="diagnostic_lab">Diagnostic Laboratory</option>
                      <option value="industry">Industry</option>
                      <option value="public_sector">Public Sector</option>
                      <option value="ngo">NGO</option>
                      <option value="individual">Individual Researcher</option>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Primary Research Category *
                    </label>
                    <Select required>
                      <option value="">Select Category</option>
                      <option value="healthcare">Healthcare</option>
                      <option value="research">Research</option>
                      <option value="industry">Industry</option>
                      <option value="government">Government</option>
                      <option value="nonprofit">Nonprofit</option>
                      <option value="academic">Academic</option>
                    </Select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Country *
                    </label>
                    <Input type="text" required placeholder="United States" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Region/State
                  </label>
                  <Input type="text" placeholder="California" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Contact Email *
                  </label>
                  <Input type="email" required placeholder="contact@organization.org" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Website
                  </label>
                  <Input type="url" placeholder="https://www.organization.org" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Organization Description *
                  </label>
                  <textarea
                    required
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Describe your organization's research focus, capabilities, and data offerings..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Research Specializations *
                  </label>
                  <textarea
                    required
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., Epidemiology, Genomics, Clinical Trials, Public Health"
                  />
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-start">
                    <input type="checkbox" required className="mt-1 mr-3" />
                    <label className="text-sm text-yellow-900">
                      <strong>I agree to the following terms: *</strong>
                      <ul className="list-disc list-inside mt-2 space-y-1 ml-2">
                        <li>My organization will share research data ethically and responsibly</li>
                        <li>We will comply with all privacy regulations (GDPR, HIPAA, etc.)</li>
                        <li>We will provide clear ethical guidelines for data usage</li>
                        <li>We will respond to data requests in a timely manner</li>
                        <li>We understand that our organization will be verified before approval</li>
                      </ul>
                    </label>
                  </div>
                </div>

                <div className="flex justify-end gap-3">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setShowRegistrationForm(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <PlusIcon className="w-4 h-4 mr-2" />
                    Submit Registration
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResearchDataBankPage;
