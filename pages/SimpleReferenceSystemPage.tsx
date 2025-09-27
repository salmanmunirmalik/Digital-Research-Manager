// Simple Reference System - Frontend Component
// Couchsurfing-style reference collection with AI-generated letters

import React, { useState, useEffect } from 'react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';

interface Reference {
  id: string;
  reference_giver_id: string;
  giver_email: string;
  giver_first_name: string;
  giver_last_name: string;
  context_type: string;
  context_details: string;
  relationship_duration: string;
  working_relationship: string;
  reference_text: string;
  overall_rating: number;
  skills_mentioned: string[];
  is_verified: boolean;
  created_at: string;
}

interface JobApplication {
  id: string;
  job_title: string;
  company_name: string;
  ai_generated_letter: string;
  confidence_score: number;
  status: string;
  created_at: string;
}

const SimpleReferenceSystem: React.FC = () => {
  const [references, setReferences] = useState<Reference[]>([]);
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [activeTab, setActiveTab] = useState<'references' | 'applications' | 'add-reference' | 'generate-letter'>('references');
  const [loading, setLoading] = useState(false);

  // Add Reference Form State
  const [addReferenceForm, setAddReferenceForm] = useState({
    userEmail: '',
    contextType: 'colleague',
    contextDetails: '',
    relationshipDuration: '',
    workingRelationship: '',
    referenceText: '',
    overallRating: 5,
    skillsMentioned: [] as string[]
  });

  // Generate Letter Form State
  const [generateLetterForm, setGenerateLetterForm] = useState({
    jobTitle: '',
    companyName: '',
    jobDescription: '',
    requiredSkills: [] as string[],
    jobType: 'industry'
  });

  useEffect(() => {
    fetchReferences();
    fetchApplications();
  }, []);

  const fetchReferences = async () => {
    try {
      const response = await fetch('/api/simple-references/references');
      const data = await response.json();
      setReferences(data.references || []);
    } catch (error) {
      console.error('Error fetching references:', error);
    }
  };

  const fetchApplications = async () => {
    try {
      const response = await fetch('/api/simple-references/applications');
      const data = await response.json();
      setApplications(data.applications || []);
    } catch (error) {
      console.error('Error fetching applications:', error);
    }
  };

  const handleAddReference = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/simple-references/add-reference', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(addReferenceForm)
      });

      if (response.ok) {
        setAddReferenceForm({
          userEmail: '',
          contextType: 'colleague',
          contextDetails: '',
          relationshipDuration: '',
          workingRelationship: '',
          referenceText: '',
          overallRating: 5,
          skillsMentioned: []
        });
        fetchReferences();
        setActiveTab('references');
      }
    } catch (error) {
      console.error('Error adding reference:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateLetter = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/simple-references/generate-reference-letter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(generateLetterForm)
      });

      if (response.ok) {
        const data = await response.json();
        fetchApplications();
        setActiveTab('applications');
        // Show the generated letter
        alert(`AI Reference Letter Generated!\n\nConfidence Score: ${(data.confidenceScore * 100).toFixed(1)}%\n\nLetter:\n${data.aiGeneratedLetter}`);
      }
    } catch (error) {
      console.error('Error generating letter:', error);
    } finally {
      setLoading(false);
    }
  };

  const getContextIcon = (contextType: string) => {
    switch (contextType) {
      case 'conference': return '🎯';
      case 'colleague': return '👥';
      case 'professor': return '🎓';
      case 'boss': return '👔';
      case 'client': return '🤝';
      default: return '💼';
    }
  };

  const getRatingStars = (rating: number) => {
    return '⭐'.repeat(rating) + '☆'.repeat(5 - rating);
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Reference System</h1>
        <p className="text-gray-600">
          Collect references like Couchsurfing reviews, generate AI-powered reference letters for job applications
        </p>
      </div>

      {/* Navigation Tabs */}
      <div className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg">
        {[
          { id: 'references', label: 'My References', icon: '📝' },
          { id: 'applications', label: 'Job Applications', icon: '💼' },
          { id: 'add-reference', label: 'Add Reference', icon: '➕' },
          { id: 'generate-letter', label: 'Generate Letter', icon: '🤖' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <span className="mr-2">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* References Tab */}
      {activeTab === 'references' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">My References ({references.length})</h2>
            <Button onClick={() => setActiveTab('add-reference')} variant="primary">
              Add Reference
            </Button>
          </div>

          {references.length === 0 ? (
            <Card className="p-8 text-center">
              <div className="text-gray-500 mb-4">
                <div className="text-4xl mb-2">📝</div>
                <p>No references yet</p>
                <p className="text-sm">Start collecting references from colleagues, conference contacts, and collaborators</p>
              </div>
              <Button onClick={() => setActiveTab('add-reference')} variant="primary">
                Add Your First Reference
              </Button>
            </Card>
          ) : (
            <div className="grid gap-4">
              {references.map(reference => (
                <Card key={reference.id} className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">{getContextIcon(reference.context_type)}</span>
                      <div>
                        <h3 className="font-semibold">
                          {reference.giver_first_name} {reference.giver_last_name}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {reference.context_type} • {reference.context_details}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg">{getRatingStars(reference.overall_rating)}</div>
                      <div className="text-sm text-gray-500">
                        {reference.is_verified ? '✅ Verified' : '⏳ Pending'}
                      </div>
                    </div>
                  </div>

                  <p className="text-gray-700 mb-4">{reference.reference_text}</p>

                  {reference.skills_mentioned.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {reference.skills_mentioned.map(skill => (
                        <span key={skill} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                          {skill}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="text-sm text-gray-500">
                    Duration: {reference.relationship_duration} • 
                    Added: {new Date(reference.created_at).toLocaleDateString()}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Job Applications Tab */}
      {activeTab === 'applications' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Job Applications ({applications.length})</h2>
            <Button onClick={() => setActiveTab('generate-letter')} variant="primary">
              Generate New Letter
            </Button>
          </div>

          {applications.length === 0 ? (
            <Card className="p-8 text-center">
              <div className="text-gray-500 mb-4">
                <div className="text-4xl mb-2">💼</div>
                <p>No job applications yet</p>
                <p className="text-sm">Generate AI-powered reference letters for your job applications</p>
              </div>
              <Button onClick={() => setActiveTab('generate-letter')} variant="primary">
                Generate Your First Letter
              </Button>
            </Card>
          ) : (
            <div className="grid gap-4">
              {applications.map(application => (
                <Card key={application.id} className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-semibold text-lg">{application.job_title}</h3>
                      <p className="text-gray-600">{application.company_name}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-500">
                        Confidence: {(application.confidence_score * 100).toFixed(1)}%
                      </div>
                      <div className="text-sm text-gray-500">
                        Status: {application.status}
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg mb-4">
                    <h4 className="font-medium mb-2">AI-Generated Reference Letter:</h4>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">
                      {application.ai_generated_letter}
                    </p>
                  </div>

                  <div className="text-sm text-gray-500">
                    Generated: {new Date(application.created_at).toLocaleDateString()}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Add Reference Tab */}
      {activeTab === 'add-reference' && (
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-6">Add Reference</h2>
          
          <form onSubmit={handleAddReference} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                User Email
              </label>
              <input
                type="email"
                value={addReferenceForm.userEmail}
                onChange={(e) => setAddReferenceForm({...addReferenceForm, userEmail: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Context Type
                </label>
                <select
                  value={addReferenceForm.contextType}
                  onChange={(e) => setAddReferenceForm({...addReferenceForm, contextType: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="conference">Conference</option>
                  <option value="colleague">Colleague</option>
                  <option value="professor">Professor</option>
                  <option value="boss">Boss</option>
                  <option value="client">Client</option>
                  <option value="collaborator">Collaborator</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Overall Rating
                </label>
                <select
                  value={addReferenceForm.overallRating}
                  onChange={(e) => setAddReferenceForm({...addReferenceForm, overallRating: parseInt(e.target.value)})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value={5}>5 ⭐⭐⭐⭐⭐</option>
                  <option value={4}>4 ⭐⭐⭐⭐☆</option>
                  <option value={3}>3 ⭐⭐⭐☆☆</option>
                  <option value={2}>2 ⭐⭐☆☆☆</option>
                  <option value={1}>1 ⭐☆☆☆☆</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Context Details
              </label>
              <input
                type="text"
                value={addReferenceForm.contextDetails}
                onChange={(e) => setAddReferenceForm({...addReferenceForm, contextDetails: e.target.value})}
                placeholder="e.g., ICML 2023, Google Research, PhD Supervisor"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Relationship Duration
              </label>
              <input
                type="text"
                value={addReferenceForm.relationshipDuration}
                onChange={(e) => setAddReferenceForm({...addReferenceForm, relationshipDuration: e.target.value})}
                placeholder="e.g., 3 months, 2 years, 1 week"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Working Relationship
              </label>
              <textarea
                value={addReferenceForm.workingRelationship}
                onChange={(e) => setAddReferenceForm({...addReferenceForm, workingRelationship: e.target.value})}
                placeholder="Brief description of how you worked together"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reference Text
              </label>
              <textarea
                value={addReferenceForm.referenceText}
                onChange={(e) => setAddReferenceForm({...addReferenceForm, referenceText: e.target.value})}
                placeholder="Write your reference here..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={5}
                required
              />
            </div>

            <div className="flex justify-end space-x-4">
              <Button type="button" variant="secondary" onClick={() => setActiveTab('references')}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" disabled={loading}>
                {loading ? 'Adding...' : 'Add Reference'}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Generate Letter Tab */}
      {activeTab === 'generate-letter' && (
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-6">Generate AI Reference Letter</h2>
          
          <form onSubmit={handleGenerateLetter} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Job Title
                </label>
                <input
                  type="text"
                  value={generateLetterForm.jobTitle}
                  onChange={(e) => setGenerateLetterForm({...generateLetterForm, jobTitle: e.target.value})}
                  placeholder="e.g., Senior Data Scientist"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Company Name
                </label>
                <input
                  type="text"
                  value={generateLetterForm.companyName}
                  onChange={(e) => setGenerateLetterForm({...generateLetterForm, companyName: e.target.value})}
                  placeholder="e.g., Google, Microsoft"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Job Description
              </label>
              <textarea
                value={generateLetterForm.jobDescription}
                onChange={(e) => setGenerateLetterForm({...generateLetterForm, jobDescription: e.target.value})}
                placeholder="Paste the job description here..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={4}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Job Type
              </label>
              <select
                value={generateLetterForm.jobType}
                onChange={(e) => setGenerateLetterForm({...generateLetterForm, jobType: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="industry">Industry</option>
                <option value="academic">Academic</option>
                <option value="startup">Startup</option>
                <option value="government">Government</option>
                <option value="nonprofit">Non-profit</option>
              </select>
            </div>

            <div className="flex justify-end space-x-4">
              <Button type="button" variant="secondary" onClick={() => setActiveTab('applications')}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" disabled={loading}>
                {loading ? 'Generating...' : '🤖 Generate AI Letter'}
              </Button>
            </div>
          </form>
        </Card>
      )}
    </div>
  );
};

export default SimpleReferenceSystem;
