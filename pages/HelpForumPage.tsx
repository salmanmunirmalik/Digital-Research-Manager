import React, { useState, useEffect } from 'react';
import Card, { CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import { 
  HelpRequest, 
  HelpResponse, 
  HelpCategory, 
  HelpSolution,
  HelpAttachment 
} from '../types';

interface ExpertProfile {
  id: string;
  userId: string;
  userName: string;
  labName: string;
  institution: string;
  specialties: string[];
  verificationStatus: 'verified' | 'pending' | 'rejected';
  reputationScore: number;
  totalAnswers: number;
  acceptedAnswers: number;
  upvotesReceived: number;
  verificationDocuments: string[];
  verifiedAt?: Date;
  verifiedBy?: string;
}

interface ReputationTransaction {
  id: string;
  userId: string;
  type: 'answer_upvote' | 'solution_accepted' | 'expert_verification' | 'helpful_response';
  points: number;
  description: string;
  relatedId: string;
  createdAt: Date;
}

interface ExpertVerificationRequest {
  id: string;
  userId: string;
  userName: string;
  labName: string;
  institution: string;
  specialties: string[];
  documents: string[];
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: Date;
  reviewedAt?: Date;
  reviewedBy?: string;
  reviewNotes?: string;
}

const HelpForumPage: React.FC = () => {
  const [helpRequests, setHelpRequests] = useState<HelpRequest[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<HelpRequest[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<HelpRequest | null>(null);
  const [showNewRequestForm, setShowNewRequestForm] = useState(false);
  const [showResponseForm, setShowResponseForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<HelpCategory | 'All'>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'date' | 'urgency' | 'upvotes'>('date');

  // Expert verification and reputation states
  const [expertProfiles, setExpertProfiles] = useState<ExpertProfile[]>([]);
  const [reputationTransactions, setReputationTransactions] = useState<ReputationTransaction[]>([]);
  const [verificationRequests, setVerificationRequests] = useState<ExpertVerificationRequest[]>([]);
  const [showExpertPanel, setShowExpertPanel] = useState(false);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [showReputationModal, setShowReputationModal] = useState(false);
  const [selectedExpert, setSelectedExpert] = useState<ExpertProfile | null>(null);
  const [verificationForm, setVerificationForm] = useState({
    specialties: [''],
    documents: [''],
    institution: '',
    labName: ''
  });

  // Mock data for demonstration
  useEffect(() => {
    const mockRequests: HelpRequest[] = [
      {
        id: '1',
        title: 'PCR amplification not working - need help troubleshooting',
        description: 'I\'ve been trying to amplify a 500bp fragment but getting no bands. I\'ve checked the primer design and annealing temperatures. Any suggestions?',
        category: 'Protocol Issues',
        urgency: 'High',
        status: 'Open',
        authorId: 'user1',
        authorName: 'Dr. Sarah Chen',
        labId: 'lab1',
        visibility: 'Lab',
        tags: ['PCR', 'DNA amplification', 'troubleshooting'],
        attachments: [],
        createdAt: new Date('2024-08-10'),
        updatedAt: new Date('2024-08-10'),
        responses: [
          {
            id: 'resp1',
            requestId: '1',
            authorId: 'user2',
            authorName: 'Prof. Michael Rodriguez',
            content: 'Have you checked the MgCl2 concentration? Sometimes the buffer concentration can affect amplification efficiency.',
            isSolution: false,
            upvotes: 3,
            createdAt: new Date('2024-08-11'),
            attachments: []
          },
          {
            id: 'resp2',
            requestId: '1',
            authorId: 'user3',
            authorName: 'Dr. Emily Watson',
            content: 'I had the same issue last month. Try increasing the annealing temperature by 2-3°C and check if your template DNA is intact.',
            isSolution: true,
            upvotes: 7,
            createdAt: new Date('2024-08-12'),
            attachments: []
          }
        ],
        upvotes: 5,
        views: 23
      },
      {
        id: '2',
        title: 'Microscope calibration problem',
        description: 'Our confocal microscope seems to be out of calibration. The images are blurry and the scale bars are incorrect.',
        category: 'Equipment Problems',
        urgency: 'Medium',
        status: 'In Progress',
        authorId: 'user4',
        authorName: 'Dr. James Wilson',
        labId: 'lab2',
        visibility: 'Lab',
        tags: ['microscopy', 'calibration', 'confocal'],
        attachments: [],
        createdAt: new Date('2024-08-08'),
        updatedAt: new Date('2024-08-09'),
        responses: [
          {
            id: 'resp3',
            requestId: '2',
            authorId: 'user5',
            authorName: 'Lab Manager Lisa Park',
            content: 'I\'ve contacted the service technician. They should be here tomorrow to recalibrate the system.',
            isSolution: false,
            upvotes: 2,
            createdAt: new Date('2024-08-09'),
            attachments: []
          }
        ],
        upvotes: 2,
        views: 15
      },
      {
        id: '3',
        title: 'Statistical analysis for RNA-seq data',
        description: 'I need help choosing the right statistical test for my RNA-seq differential expression analysis. I have 3 biological replicates per condition.',
        category: 'Data Analysis',
        urgency: 'Medium',
        status: 'Open',
        authorId: 'user6',
        authorName: 'PhD Student Alex Thompson',
        labId: 'lab3',
        visibility: 'Global',
        tags: ['RNA-seq', 'statistics', 'differential expression', 'bioinformatics'],
        attachments: [],
        createdAt: new Date('2024-08-07'),
        updatedAt: new Date('2024-08-07'),
        responses: [],
        upvotes: 1,
        views: 8
      }
    ];

    setHelpRequests(mockRequests);
    setFilteredRequests(mockRequests);
  }, []);

  // Filter and sort requests
  useEffect(() => {
    let filtered = helpRequests.filter(request => {
      const matchesSearch = request.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           request.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           request.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesCategory = selectedCategory === 'All' || request.category === selectedCategory;
      const matchesStatus = selectedStatus === 'All' || request.status === selectedStatus;
      
      return matchesSearch && matchesCategory && matchesStatus;
    });

    // Sort requests
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'date':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'urgency':
          const urgencyOrder = { 'Critical': 4, 'High': 3, 'Medium': 2, 'Low': 1 };
          return urgencyOrder[b.urgency as keyof typeof urgencyOrder] - urgencyOrder[a.urgency as keyof typeof urgencyOrder];
        case 'upvotes':
          return b.upvotes - a.upvotes;
        default:
          return 0;
      }
    });

    setFilteredRequests(filtered);
  }, [helpRequests, searchTerm, selectedCategory, selectedStatus, sortBy]);

  const handleNewRequest = (request: Omit<HelpRequest, 'id' | 'createdAt' | 'updatedAt' | 'responses' | 'upvotes' | 'views'>) => {
    const newRequest: HelpRequest = {
      ...request,
      id: Date.now().toString(),
      createdAt: new Date(),
      updatedAt: new Date(),
      responses: [],
      upvotes: 0,
      views: 0
    };
    setHelpRequests(prev => [newRequest, ...prev]);
    setShowNewRequestForm(false);
  };

  const handleResponse = (requestId: string, response: Omit<HelpResponse, 'id' | 'createdAt'>) => {
    const newResponse: HelpResponse = {
      ...response,
      id: Date.now().toString(),
      createdAt: new Date()
    };

    setHelpRequests(prev => prev.map(req => 
      req.id === requestId 
        ? { ...req, responses: [...req.responses, newResponse] }
        : req
    ));
    setShowResponseForm(false);
  };

  const markAsSolution = (requestId: string, responseId: string) => {
    setHelpRequests(prev => prev.map(req => 
      req.id === requestId 
        ? {
            ...req,
            status: 'Resolved' as const,
            responses: req.responses.map(resp => ({
              ...resp,
              isSolution: resp.id === responseId
            })),
            resolvedAt: new Date()
          }
        : req
    ));
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'Critical': return 'text-red-600 bg-red-100';
      case 'High': return 'text-orange-600 bg-orange-100';
      case 'Medium': return 'text-yellow-600 bg-yellow-100';
      case 'Low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Open': return 'text-blue-600 bg-blue-100';
      case 'In Progress': return 'text-yellow-600 bg-yellow-100';
      case 'Resolved': return 'text-green-600 bg-green-100';
      case 'Closed': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  // Expert verification and reputation functions
  const loadExpertData = () => {
    // Mock expert profiles
    const mockExpertProfiles: ExpertProfile[] = [
      {
        id: '1',
        userId: 'user2',
        userName: 'Prof. Michael Rodriguez',
        labName: 'Molecular Biology Lab',
        institution: 'University Research Center',
        specialties: ['PCR', 'Molecular Biology', 'DNA Analysis'],
        verificationStatus: 'verified',
        reputationScore: 1250,
        totalAnswers: 45,
        acceptedAnswers: 38,
        upvotesReceived: 320,
        verificationDocuments: ['PhD Certificate', 'Publication List', 'Lab Affiliation'],
        verifiedAt: new Date('2024-01-15'),
        verifiedBy: 'admin1'
      },
      {
        id: '2',
        userId: 'user3',
        userName: 'Dr. Emily Watson',
        labName: 'Cell Biology Lab',
        institution: 'University Research Center',
        specialties: ['Cell Culture', 'Microscopy', 'Cell Biology'],
        verificationStatus: 'verified',
        reputationScore: 980,
        totalAnswers: 32,
        acceptedAnswers: 28,
        upvotesReceived: 245,
        verificationDocuments: ['PhD Certificate', 'Publication List', 'Lab Affiliation'],
        verifiedAt: new Date('2024-01-20'),
        verifiedBy: 'admin1'
      },
      {
        id: '3',
        userId: 'user5',
        userName: 'Lab Manager Lisa Park',
        labName: 'Equipment Management',
        institution: 'University Research Center',
        specialties: ['Equipment Maintenance', 'Calibration', 'Troubleshooting'],
        verificationStatus: 'verified',
        reputationScore: 750,
        totalAnswers: 28,
        acceptedAnswers: 22,
        upvotesReceived: 180,
        verificationDocuments: ['Technical Certification', 'Lab Affiliation'],
        verifiedAt: new Date('2024-02-01'),
        verifiedBy: 'admin2'
      },
      {
        id: '4',
        userId: 'user7',
        userName: 'Dr. Alex Chen',
        labName: 'Bioinformatics Lab',
        institution: 'University Research Center',
        specialties: ['RNA-seq', 'Statistics', 'Bioinformatics'],
        verificationStatus: 'pending',
        reputationScore: 450,
        totalAnswers: 15,
        acceptedAnswers: 12,
        upvotesReceived: 95,
        verificationDocuments: ['PhD Certificate', 'Publication List']
      }
    ];

    // Mock reputation transactions
    const mockReputationTransactions: ReputationTransaction[] = [
      {
        id: '1',
        userId: 'user2',
        type: 'solution_accepted',
        points: 50,
        description: 'Solution accepted for PCR troubleshooting',
        relatedId: 'resp2',
        createdAt: new Date('2024-08-12')
      },
      {
        id: '2',
        userId: 'user2',
        type: 'answer_upvote',
        points: 10,
        description: 'Answer upvoted for molecular biology question',
        relatedId: 'resp1',
        createdAt: new Date('2024-08-11')
      },
      {
        id: '3',
        userId: 'user3',
        type: 'solution_accepted',
        points: 50,
        description: 'Solution accepted for cell culture issue',
        relatedId: 'resp4',
        createdAt: new Date('2024-08-10')
      },
      {
        id: '4',
        userId: 'user2',
        type: 'expert_verification',
        points: 200,
        description: 'Expert verification approved',
        relatedId: 'verify1',
        createdAt: new Date('2024-01-15')
      }
    ];

    // Mock verification requests
    const mockVerificationRequests: ExpertVerificationRequest[] = [
      {
        id: '1',
        userId: 'user8',
        userName: 'Dr. Sarah Kim',
        labName: 'Immunology Lab',
        institution: 'University Research Center',
        specialties: ['Immunology', 'Flow Cytometry', 'Antibody Analysis'],
        documents: ['PhD Certificate', 'Publication List', 'Lab Affiliation'],
        status: 'pending',
        submittedAt: new Date('2024-08-15')
      },
      {
        id: '2',
        userId: 'user9',
        userName: 'Dr. James Wilson',
        labName: 'Analytical Chemistry Lab',
        institution: 'University Research Center',
        specialties: ['Analytical Chemistry', 'Mass Spectrometry', 'Chromatography'],
        documents: ['PhD Certificate', 'Publication List'],
        status: 'pending',
        submittedAt: new Date('2024-08-14')
      }
    ];

    setExpertProfiles(mockExpertProfiles);
    setReputationTransactions(mockReputationTransactions);
    setVerificationRequests(mockVerificationRequests);
  };

  const submitVerificationRequest = () => {
    const newRequest: ExpertVerificationRequest = {
      id: Date.now().toString(),
      userId: 'currentUser',
      userName: 'Current User',
      labName: verificationForm.labName,
      institution: verificationForm.institution,
      specialties: verificationForm.specialties.filter(s => s.trim()),
      documents: verificationForm.documents.filter(d => d.trim()),
      status: 'pending',
      submittedAt: new Date()
    };

    setVerificationRequests(prev => [...prev, newRequest]);
    setShowVerificationModal(false);
    setVerificationForm({
      specialties: [''],
      documents: [''],
      institution: '',
      labName: ''
    });
  };

  const approveVerificationRequest = (requestId: string) => {
    const request = verificationRequests.find(r => r.id === requestId);
    if (!request) return;

    // Update verification request
    setVerificationRequests(prev =>
      prev.map(r =>
        r.id === requestId
          ? { ...r, status: 'approved' as const, reviewedAt: new Date(), reviewedBy: 'currentAdmin' }
          : r
      )
    );

    // Create expert profile
    const newExpertProfile: ExpertProfile = {
      id: Date.now().toString(),
      userId: request.userId,
      userName: request.userName,
      labName: request.labName,
      institution: request.institution,
      specialties: request.specialties,
      verificationStatus: 'verified',
      reputationScore: 200, // Initial bonus for verification
      totalAnswers: 0,
      acceptedAnswers: 0,
      upvotesReceived: 0,
      verificationDocuments: request.documents,
      verifiedAt: new Date(),
      verifiedBy: 'currentAdmin'
    };

    setExpertProfiles(prev => [...prev, newExpertProfile]);

    // Add reputation transaction
    const reputationTransaction: ReputationTransaction = {
      id: Date.now().toString(),
      userId: request.userId,
      type: 'expert_verification',
      points: 200,
      description: 'Expert verification approved',
      relatedId: requestId,
      createdAt: new Date()
    };

    setReputationTransactions(prev => [...prev, reputationTransaction]);
  };

  const rejectVerificationRequest = (requestId: string, notes: string) => {
    setVerificationRequests(prev =>
      prev.map(r =>
        r.id === requestId
          ? { ...r, status: 'rejected' as const, reviewedAt: new Date(), reviewedBy: 'currentAdmin', reviewNotes: notes }
          : r
      )
    );
  };

  const upvoteResponse = (responseId: string, userId: string) => {
    // Update response upvotes
    setHelpRequests(prev =>
      prev.map(req => ({
        ...req,
        responses: req.responses.map(resp =>
          resp.id === responseId ? { ...resp, upvotes: resp.upvotes + 1 } : resp
        )
      }))
    );

    // Add reputation transaction
    const reputationTransaction: ReputationTransaction = {
      id: Date.now().toString(),
      userId: userId,
      type: 'answer_upvote',
      points: 10,
      description: 'Answer upvoted',
      relatedId: responseId,
      createdAt: new Date()
    };

    setReputationTransactions(prev => [...prev, reputationTransaction]);

    // Update expert profile if user is verified
    setExpertProfiles(prev =>
      prev.map(expert =>
        expert.userId === userId
          ? { ...expert, upvotesReceived: expert.upvotesReceived + 1, reputationScore: expert.reputationScore + 10 }
          : expert
      )
    );
  };

  const markSolutionAndAwardReputation = (requestId: string, responseId: string) => {
    const request = helpRequests.find(r => r.id === requestId);
    const response = request?.responses.find(r => r.id === responseId);
    
    if (!response) return;

    // Mark as solution
    markAsSolution(requestId, responseId);

    // Add reputation transaction for solution acceptance
    const reputationTransaction: ReputationTransaction = {
      id: Date.now().toString(),
      userId: response.authorId,
      type: 'solution_accepted',
      points: 50,
      description: 'Solution accepted',
      relatedId: responseId,
      createdAt: new Date()
    };

    setReputationTransactions(prev => [...prev, reputationTransaction]);

    // Update expert profile if user is verified
    setExpertProfiles(prev =>
      prev.map(expert =>
        expert.userId === response.authorId
          ? { 
              ...expert, 
              acceptedAnswers: expert.acceptedAnswers + 1, 
              reputationScore: expert.reputationScore + 50 
            }
          : expert
      )
    );
  };

  const getReputationLevel = (score: number): { level: string; color: string } => {
    if (score >= 1000) return { level: 'Expert', color: 'text-purple-600 bg-purple-100' };
    if (score >= 500) return { level: 'Advanced', color: 'text-blue-600 bg-blue-100' };
    if (score >= 200) return { level: 'Intermediate', color: 'text-green-600 bg-green-100' };
    return { level: 'Beginner', color: 'text-gray-600 bg-gray-100' };
  };

  // Load expert data on component mount
  useEffect(() => {
    loadExpertData();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Help Forum</h1>
          <p className="text-gray-600">
            Get help from your lab colleagues and the global science community. Share problems, 
            find solutions, and collaborate on research challenges.
          </p>
        </div>

        {/* Expert Verification & Reputation Panel */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Expert Community</h2>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowVerificationModal(true)}
                className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-4 py-2 rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all duration-200 flex items-center space-x-2"
              >
                <span>Apply for Expert Verification</span>
              </button>
              <button
                onClick={() => setShowExpertPanel(!showExpertPanel)}
                className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-2 rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-200 flex items-center space-x-2"
              >
                <span>View Experts</span>
                <span className="bg-white text-purple-600 text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {expertProfiles.filter(e => e.verificationStatus === 'verified').length}
                </span>
              </button>
            </div>
          </div>

          {/* Expert Panel */}
          {showExpertPanel && (
            <div className="space-y-6">
              {/* Verified Experts */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Verified Experts</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {expertProfiles.filter(expert => expert.verificationStatus === 'verified').map((expert) => {
                    const reputationLevel = getReputationLevel(expert.reputationScore);
                    return (
                      <div key={expert.id} className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900 mb-1">{expert.userName}</h4>
                            <p className="text-sm text-gray-600 mb-2">{expert.labName}</p>
                            <p className="text-xs text-gray-500 mb-2">{expert.institution}</p>
                            <div className="flex items-center space-x-2 mb-2">
                              <span className={`px-2 py-1 text-xs font-medium rounded-full ${reputationLevel.color}`}>
                                {reputationLevel.level}
                              </span>
                              <span className="text-xs text-gray-500">★ {expert.reputationScore}</span>
                            </div>
                          </div>
                          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                            <span className="text-green-600 text-xs font-bold">✓</span>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="text-xs text-gray-500">
                            <span className="font-medium">Specialties:</span>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {expert.specialties.map((specialty, index) => (
                                <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                                  {specialty}
                                </span>
                              ))}
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between text-xs text-gray-500">
                            <span>{expert.acceptedAnswers}/{expert.totalAnswers} solutions</span>
                            <span>{expert.upvotesReceived} upvotes</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Pending Verification Requests */}
              {verificationRequests.filter(req => req.status === 'pending').length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Pending Verification Requests</h3>
                  <div className="space-y-3">
                    {verificationRequests.filter(req => req.status === 'pending').map((request) => (
                      <div key={request.id} className="p-4 border border-yellow-200 bg-yellow-50 rounded-lg">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900 mb-1">{request.userName}</h4>
                            <p className="text-sm text-gray-600 mb-2">{request.labName} • {request.institution}</p>
                            <div className="flex flex-wrap gap-1 mb-2">
                              {request.specialties.map((specialty, index) => (
                                <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                                  {specialty}
                                </span>
                              ))}
                            </div>
                            <p className="text-xs text-gray-500">
                              Submitted: {request.submittedAt.toLocaleDateString()}
                            </p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => approveVerificationRequest(request.id)}
                              className="px-3 py-1 text-xs text-white bg-green-600 hover:bg-green-700 rounded transition-colors"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => rejectVerificationRequest(request.id, 'Insufficient documentation')}
                              className="px-3 py-1 text-xs text-white bg-red-600 hover:bg-red-700 rounded transition-colors"
                            >
                              Reject
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Reputation Leaderboard */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Reputation Leaderboard</h3>
                <div className="space-y-2">
                  {expertProfiles
                    .filter(expert => expert.verificationStatus === 'verified')
                    .sort((a, b) => b.reputationScore - a.reputationScore)
                    .slice(0, 5)
                    .map((expert, index) => {
                      const reputationLevel = getReputationLevel(expert.reputationScore);
                      return (
                        <div key={expert.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                              {index + 1}
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{expert.userName}</p>
                              <p className="text-sm text-gray-600">{expert.labName}</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${reputationLevel.color}`}>
                              {reputationLevel.level}
                            </span>
                            <span className="text-sm font-medium text-gray-900">{expert.reputationScore}</span>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-wrap gap-4 items-center justify-between">
            <div className="flex gap-4 flex-1">
              <Input
                placeholder="Search help requests..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-xs"
              />
              <Select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value as HelpCategory | 'All')}
                className="max-w-xs"
              >
                <option value="All">All Categories</option>
                <option value="Protocol Issues">Protocol Issues</option>
                <option value="Equipment Problems">Equipment Problems</option>
                <option value="Data Analysis">Data Analysis</option>
                <option value="Reagent Issues">Reagent Issues</option>
                <option value="Safety Concerns">Safety Concerns</option>
                <option value="Methodology">Methodology</option>
                <option value="Results Interpretation">Results Interpretation</option>
                <option value="General Lab Questions">General Lab Questions</option>
              </Select>
              <Select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="max-w-xs"
              >
                <option value="All">All Status</option>
                <option value="Open">Open</option>
                <option value="In Progress">In Progress</option>
                <option value="Resolved">Resolved</option>
                <option value="Closed">Closed</option>
              </Select>
            </div>
            <div className="flex gap-4">
              <Select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'date' | 'urgency' | 'upvotes')}
                className="max-w-xs"
              >
                <option value="date">Sort by Date</option>
                <option value="urgency">Sort by Urgency</option>
                <option value="upvotes">Sort by Upvotes</option>
              </Select>
              <Button onClick={() => setShowNewRequestForm(true)}>
                Ask for Help
              </Button>
            </div>
          </div>
        </div>

        {/* Help Requests List */}
        <div className="grid gap-6">
          {filteredRequests.map(request => (
            <Card key={request.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg mb-2 cursor-pointer hover:text-blue-600"
                               onClick={() => setSelectedRequest(request)}>
                      {request.title}
                    </CardTitle>
                    <div className="flex flex-wrap gap-2 mb-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getUrgencyColor(request.urgency)}`}>
                        {request.urgency}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                        {request.status}
                      </span>
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-600">
                        {request.category}
                      </span>
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-600">
                        {request.visibility}
                      </span>
                    </div>
                    <p className="text-gray-600 text-sm mb-3">{request.description}</p>
                    <div className="flex flex-wrap gap-2">
                      {request.tags.map(tag => (
                        <span key={tag} className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="text-right text-sm text-gray-500 ml-4">
                    <div>By {request.authorName}</div>
                    <div>{new Date(request.createdAt).toLocaleDateString()}</div>
                    <div className="flex items-center gap-4 mt-2">
                      <span>👁️ {request.views}</span>
                      <span>👍 {request.upvotes}</span>
                      <span>💬 {request.responses.length}</span>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center">
                  <Button 
                    variant="outline" 
                    onClick={() => setSelectedRequest(request)}
                    className="text-blue-600 border-blue-600 hover:bg-blue-50"
                  >
                    View Details & Respond
                  </Button>
                  {request.status === 'Open' && (
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setSelectedRequest(request);
                        setShowResponseForm(true);
                      }}
                      className="text-green-600 border-green-600 hover:bg-green-50"
                    >
                      Provide Solution
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* New Request Form Modal */}
        {showNewRequestForm && (
          <NewRequestForm 
            onSubmit={handleNewRequest}
            onCancel={() => setShowNewRequestForm(false)}
          />
        )}

        {/* Request Detail Modal */}
        {selectedRequest && (
          <RequestDetailModal
            request={selectedRequest}
            onClose={() => setSelectedRequest(null)}
            onResponse={handleResponse}
            onMarkSolution={markSolutionAndAwardReputation}
            showResponseForm={showResponseForm}
            onShowResponseForm={setShowResponseForm}
          />
        )}

        {/* Expert Verification Modal */}
        {showVerificationModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">Apply for Expert Verification</h3>
                  <button
                    onClick={() => setShowVerificationModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Institution</label>
                    <input
                      type="text"
                      value={verificationForm.institution}
                      onChange={(e) => setVerificationForm(prev => ({ ...prev, institution: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter your institution"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Lab Name</label>
                    <input
                      type="text"
                      value={verificationForm.labName}
                      onChange={(e) => setVerificationForm(prev => ({ ...prev, labName: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter your lab name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Research Specialties</label>
                    {verificationForm.specialties.map((specialty, index) => (
                      <div key={index} className="flex items-center space-x-2 mb-2">
                        <input
                          type="text"
                          value={specialty}
                          onChange={(e) => {
                            const newSpecialties = [...verificationForm.specialties];
                            newSpecialties[index] = e.target.value;
                            setVerificationForm(prev => ({ ...prev, specialties: newSpecialties }));
                          }}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Enter research specialty"
                        />
                        {verificationForm.specialties.length > 1 && (
                          <button
                            type="button"
                            onClick={() => {
                              const newSpecialties = verificationForm.specialties.filter((_, i) => i !== index);
                              setVerificationForm(prev => ({ ...prev, specialties: newSpecialties }));
                            }}
                            className="text-red-600 hover:text-red-700"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => setVerificationForm(prev => ({ ...prev, specialties: [...prev.specialties, ''] }))}
                      className="text-blue-600 hover:text-blue-700 text-sm"
                    >
                      + Add Specialty
                    </button>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Verification Documents</label>
                    {verificationForm.documents.map((document, index) => (
                      <div key={index} className="flex items-center space-x-2 mb-2">
                        <input
                          type="text"
                          value={document}
                          onChange={(e) => {
                            const newDocuments = [...verificationForm.documents];
                            newDocuments[index] = e.target.value;
                            setVerificationForm(prev => ({ ...prev, documents: newDocuments }));
                          }}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Document name (e.g., PhD Certificate, Publication List)"
                        />
                        {verificationForm.documents.length > 1 && (
                          <button
                            type="button"
                            onClick={() => {
                              const newDocuments = verificationForm.documents.filter((_, i) => i !== index);
                              setVerificationForm(prev => ({ ...prev, documents: newDocuments }));
                            }}
                            className="text-red-600 hover:text-red-700"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => setVerificationForm(prev => ({ ...prev, documents: [...prev.documents, ''] }))}
                      className="text-blue-600 hover:text-blue-700 text-sm"
                    >
                      + Add Document
                    </button>
                  </div>

                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-medium text-blue-900 mb-2">Verification Requirements</h4>
                    <ul className="text-sm text-blue-800 space-y-1">
                      <li>• PhD degree or equivalent research experience</li>
                      <li>• Published research in relevant fields</li>
                      <li>• Current affiliation with a research institution</li>
                      <li>• Demonstrated expertise in specified research areas</li>
                    </ul>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-6">
                  <button
                    onClick={() => setShowVerificationModal(false)}
                    className="px-4 py-2 text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={submitVerificationRequest}
                    className="px-4 py-2 text-sm text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
                  >
                    Submit Application
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// New Request Form Component
const NewRequestForm: React.FC<{
  onSubmit: (request: Omit<HelpRequest, 'id' | 'createdAt' | 'updatedAt' | 'responses' | 'upvotes' | 'views'>) => void;
  onCancel: () => void;
}> = ({ onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'Protocol Issues' as HelpCategory,
    urgency: 'Medium' as 'Low' | 'Medium' | 'High' | 'Critical',
    visibility: 'Lab' as 'Personal' | 'Lab' | 'Team' | 'Global',
    tags: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      authorId: 'currentUser',
      authorName: 'Current User',
      labId: 'currentLab',
      attachments: [],
      tags: formData.tags.split(',').map(tag => tag.trim()).filter(Boolean)
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-4">Ask for Help</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Brief description of your problem"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Detailed description of your problem, what you've tried, and what you need help with"
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={4}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <Select
                value={formData.category}
                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value as HelpCategory }))}
                required
              >
                <option value="Protocol Issues">Protocol Issues</option>
                <option value="Equipment Problems">Equipment Problems</option>
                <option value="Data Analysis">Data Analysis</option>
                <option value="Reagent Issues">Reagent Issues</option>
                <option value="Safety Concerns">Safety Concerns</option>
                <option value="Methodology">Methodology</option>
                <option value="Results Interpretation">Results Interpretation</option>
                <option value="General Lab Questions">General Lab Questions</option>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Urgency</label>
              <Select
                value={formData.urgency}
                onChange={(e) => setFormData(prev => ({ ...prev, urgency: e.target.value as any }))}
                required
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Critical">Critical</option>
              </Select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Visibility</label>
            <Select
              value={formData.visibility}
              onChange={(e) => setFormData(prev => ({ ...prev, visibility: e.target.value as any }))}
              required
            >
              <option value="Personal">Personal (Only you)</option>
              <option value="Lab">Lab (Lab members only)</option>
              <option value="Team">Team (Team members only)</option>
              <option value="Global">Global (Science community)</option>
            </Select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tags (comma-separated)</label>
            <Input
              value={formData.tags}
              onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))}
              placeholder="e.g., PCR, troubleshooting, DNA"
            />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit">
              Submit Request
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Request Detail Modal Component
const RequestDetailModal: React.FC<{
  request: HelpRequest;
  onClose: () => void;
  onResponse: (requestId: string, response: Omit<HelpResponse, 'id' | 'createdAt'>) => void;
  onMarkSolution: (requestId: string, responseId: string) => void;
  showResponseForm: boolean;
  onShowResponseForm: (show: boolean) => void;
}> = ({ request, onClose, onResponse, onMarkSolution, showResponseForm, onShowResponseForm }) => {
  const [responseText, setResponseText] = useState('');

  const handleSubmitResponse = (e: React.FormEvent) => {
    e.preventDefault();
    if (responseText.trim()) {
      onResponse(request.id, {
        requestId: request.id,
        authorId: 'currentUser',
        authorName: 'Current User',
        content: responseText.trim(),
        isSolution: false,
        upvotes: 0,
        attachments: []
      });
      setResponseText('');
      onShowResponseForm(false);
    }
  };

  const handleUpvote = (responseId: string, userId: string) => {
    // This would be passed down from the parent component
    // For now, we'll just show the upvote button
    console.log('Upvoting response:', responseId, 'for user:', userId);
  };

  const isExpert = (userId: string): boolean => {
    // Mock expert check - in real implementation, this would check against expert profiles
    return ['user2', 'user3', 'user5'].includes(userId);
  };

  const getExpertBadge = (userId: string) => {
    if (isExpert(userId)) {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <span className="w-2 h-2 bg-green-500 rounded-full mr-1"></span>
          Verified Expert
        </span>
      );
    }
    return null;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-2xl font-bold">{request.title}</h2>
          <Button variant="outline" onClick={onClose}>✕</Button>
        </div>

        {/* Request Details */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <div className="flex flex-wrap gap-2 mb-3">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getUrgencyColor(request.urgency)}`}>
              {request.urgency}
            </span>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
              {request.status}
            </span>
            <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-600">
              {request.category}
            </span>
            <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-600">
              {request.visibility}
            </span>
          </div>
          <p className="text-gray-700 mb-3">{request.description}</p>
          <div className="flex flex-wrap gap-2 mb-3">
            {request.tags.map(tag => (
              <span key={tag} className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                {tag}
              </span>
            ))}
          </div>
          <div className="text-sm text-gray-500">
            Asked by {request.authorName} on {new Date(request.createdAt).toLocaleDateString()}
          </div>
        </div>

        {/* Responses */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3">Responses ({request.responses.length})</h3>
          {request.responses.length === 0 ? (
            <p className="text-gray-500 italic">No responses yet. Be the first to help!</p>
          ) : (
            <div className="space-y-4">
              {request.responses.map(response => (
                <div key={response.id} className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex justify-between items-start mb-2">
                    <div className="font-medium">{response.authorName}</div>
                    <div className="text-sm text-gray-500">
                      {new Date(response.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <p className="text-gray-700 mb-3">{response.content}</p>
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-gray-500">👍 {response.upvotes}</span>
                    {!response.isSolution && request.status !== 'Resolved' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onMarkSolution(request.id, response.id)}
                        className="text-green-600 border-green-600 hover:bg-green-50"
                      >
                        Mark as Solution
                      </Button>
                    )}
                    {response.isSolution && (
                      <span className="px-2 py-1 bg-green-100 text-green-600 rounded text-xs font-medium">
                        ✓ Solution
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Response Form */}
        {showResponseForm && (
          <div className="p-4 border border-gray-200 rounded-lg">
            <h3 className="text-lg font-semibold mb-3">Provide a Response</h3>
            <form onSubmit={handleSubmitResponse} className="space-y-3">
              <textarea
                value={responseText}
                onChange={(e) => setResponseText(e.target.value)}
                placeholder="Share your knowledge, experience, or suggestions to help solve this problem..."
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={4}
                required
              />
              <div className="flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => onShowResponseForm(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  Submit Response
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* Action Buttons */}
        {!showResponseForm && request.status !== 'Resolved' && (
          <div className="flex justify-end">
            <Button onClick={() => onShowResponseForm(true)}>
              {request.responses.length === 0 ? 'Be the First to Help' : 'Add Response'}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

// Helper function for urgency colors (defined outside component)
const getUrgencyColor = (urgency: string) => {
  switch (urgency) {
    case 'Critical': return 'text-red-600 bg-red-100';
    case 'High': return 'text-orange-600 bg-orange-100';
    case 'Medium': return 'text-yellow-600 bg-yellow-100';
    case 'Low': return 'text-green-600 bg-green-100';
    default: return 'text-gray-600 bg-gray-100';
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'Open': return 'text-blue-600 bg-blue-100';
    case 'In Progress': return 'text-yellow-600 bg-yellow-100';
    case 'Resolved': return 'text-green-600 bg-green-100';
    case 'Closed': return 'text-gray-600 bg-gray-100';
    default: return 'text-gray-600 bg-gray-100';
  }
};

export default HelpForumPage;
