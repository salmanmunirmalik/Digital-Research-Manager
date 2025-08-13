import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { 
  HelpRequest, 
  HelpResponse, 
  HelpCategory, 
  HelpSolution,
  HelpAttachment 
} from '../types';

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
            onMarkSolution={markAsSolution}
            showResponseForm={showResponseForm}
            onShowResponseForm={setShowResponseForm}
          />
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
