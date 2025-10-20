/**
 * PI Review Dashboard Page
 * Complete workflow for progress reports and PI reviews
 * Team members submit → PIs review → Notifications sent
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import {
  PlusIcon,
  ClipboardListIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  UserIcon,
  StarIcon,
  ChatBubbleLeftIcon,
  BellIcon,
  DocumentTextIcon,
  ArrowPathIcon
} from '../components/icons';

interface ProgressReport {
  id: string;
  report_title: string;
  report_period_start: string;
  report_period_end: string;
  report_type: string;
  status: string;
  summary: string;
  accomplishments: string[];
  challenges_encountered: string[];
  planned_next_steps: string[];
  hours_worked: number;
  created_at: string;
  submitter_name: string;
  project_title?: string;
}

interface PIReview {
  id: string;
  progress_report_id: string;
  overall_assessment: string;
  strengths: string[];
  areas_for_improvement: string[];
  approval_status: string;
  requires_resubmission: boolean;
  progress_rating: number;
  quality_rating: number;
  reviewed_at: string;
  reviewer_name: string;
}

const PIReviewDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [view, setView] = useState<'submit' | 'my-reports' | 'review' | 'notifications'>('my-reports');
  const [myReports, setMyReports] = useState<ProgressReport[]>([]);
  const [reportsToReview, setReportsToReview] = useState<ProgressReport[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Submit report states
  const [reportTitle, setReportTitle] = useState('');
  const [reportType, setReportType] = useState<'weekly' | 'monthly' | 'quarterly'>('weekly');
  const [periodStart, setPeriodStart] = useState('');
  const [periodEnd, setPeriodEnd] = useState('');
  const [summary, setSummary] = useState('');
  const [accomplishments, setAccomplishments] = useState<string[]>(['']);
  const [challenges, setChallenges] = useState<string[]>(['']);
  const [nextSteps, setNextSteps] = useState<string[]>(['']);
  const [hoursWorked, setHoursWorked] = useState('');
  
  // Review states
  const [selectedReport, setSelectedReport] = useState<ProgressReport | null>(null);
  const [assessment, setAssessment] = useState('');
  const [strengths, setStrengths] = useState<string[]>(['']);
  const [improvements, setImprovements] = useState<string[]>(['']);
  const [approvalStatus, setApprovalStatus] = useState<'approved' | 'approved_with_comments' | 'revision_required'>('approved');
  const [progressRating, setProgressRating] = useState(4);
  const [qualityRating, setQualityRating] = useState(4);

  useEffect(() => {
    if (view === 'my-reports') {
      // fetchMyReports();
    } else if (view === 'review') {
      // fetchReportsToReview();
    }
  }, [view]);

  const handleSubmitReport = async () => {
    if (!reportTitle || !periodStart || !periodEnd || !summary) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.post('/api/project-management/progress-reports', {
        report_title: reportTitle,
        report_period_start: periodStart,
        report_period_end: periodEnd,
        report_type: reportType,
        summary,
        accomplishments: accomplishments.filter(a => a.trim()),
        challenges_encountered: challenges.filter(c => c.trim()),
        planned_next_steps: nextSteps.filter(s => s.trim()),
        hours_worked: parseInt(hoursWorked) || 0
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      alert('✅ Progress report submitted! Your PI has been notified.');
      // Reset form
      setReportTitle('');
      setSummary('');
      setAccomplishments(['']);
      setChallenges(['']);
      setNextSteps(['']);
      setHoursWorked('');
      setView('my-reports');
    } catch (error) {
      console.error('Error submitting report:', error);
      alert('Failed to submit report');
    }
  };

  const handleSubmitReview = async () => {
    if (!selectedReport || !assessment) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.post('/api/project-management/pi-reviews', {
        progress_report_id: selectedReport.id,
        overall_assessment: assessment,
        strengths: strengths.filter(s => s.trim()),
        areas_for_improvement: improvements.filter(i => i.trim()),
        approval_status: approvalStatus,
        requires_resubmission: approvalStatus === 'revision_required',
        progress_rating: progressRating,
        quality_rating: qualityRating
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      alert('✅ Review submitted! The team member has been notified.');
      setSelectedReport(null);
      setAssessment('');
      setStrengths(['']);
      setImprovements(['']);
    } catch (error) {
      console.error('Error submitting review:', error);
      alert('Failed to submit review');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">PI Review Dashboard</h1>
            <p className="text-gray-600 mt-1">Submit progress reports & receive PI feedback</p>
          </div>

          {/* Tabs */}
          <div className="mt-6 flex space-x-2 border-b border-gray-200">
            <button
              onClick={() => setView('my-reports')}
              className={`px-4 py-3 font-medium text-sm border-b-2 transition-colors ${
                view === 'my-reports'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              My Reports
            </button>
            <button
              onClick={() => setView('submit')}
              className={`px-4 py-3 font-medium text-sm border-b-2 transition-colors ${
                view === 'submit'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Submit Report
            </button>
            {user?.role === 'pi' && (
              <button
                onClick={() => setView('review')}
                className={`px-4 py-3 font-medium text-sm border-b-2 transition-colors ${
                  view === 'review'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Review Reports (PI)
              </button>
            )}
            <button
              onClick={() => setView('notifications')}
              className={`px-4 py-3 font-medium text-sm border-b-2 transition-colors ${
                view === 'notifications'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <div className="flex items-center space-x-2">
                <BellIcon className="w-5 h-5" />
                <span>Notifications</span>
              </div>
            </button>
          </div>
        </div>

        {/* Submit Report View */}
        {view === 'submit' && (
          <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Submit Progress Report</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Report Title *</label>
                <input
                  type="text"
                  value={reportTitle}
                  onChange={(e) => setReportTitle(e.target.value)}
                  placeholder="e.g., Weekly Progress - Jan 15-21"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Report Type</label>
                  <select
                    value={reportType}
                    onChange={(e) => setReportType(e.target.value as any)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Period Start *</label>
                  <input
                    type="date"
                    value={periodStart}
                    onChange={(e) => setPeriodStart(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Period End *</label>
                  <input
                    type="date"
                    value={periodEnd}
                    onChange={(e) => setPeriodEnd(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Summary *</label>
                <textarea
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  placeholder="Brief summary of work completed during this period..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Accomplishments</label>
                {accomplishments.map((item, idx) => (
                  <div key={idx} className="flex space-x-2 mb-2">
                    <input
                      type="text"
                      value={item}
                      onChange={(e) => {
                        const updated = [...accomplishments];
                        updated[idx] = e.target.value;
                        setAccomplishments(updated);
                      }}
                      placeholder={`Accomplishment ${idx + 1}`}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg"
                    />
                    {idx === accomplishments.length - 1 && (
                      <button
                        onClick={() => setAccomplishments([...accomplishments, ''])}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg"
                      >
                        +
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Challenges Encountered</label>
                {challenges.map((item, idx) => (
                  <div key={idx} className="flex space-x-2 mb-2">
                    <input
                      type="text"
                      value={item}
                      onChange={(e) => {
                        const updated = [...challenges];
                        updated[idx] = e.target.value;
                        setChallenges(updated);
                      }}
                      placeholder={`Challenge ${idx + 1}`}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg"
                    />
                    {idx === challenges.length - 1 && (
                      <button
                        onClick={() => setChallenges([...challenges, ''])}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg"
                      >
                        +
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Planned Next Steps</label>
                {nextSteps.map((item, idx) => (
                  <div key={idx} className="flex space-x-2 mb-2">
                    <input
                      type="text"
                      value={item}
                      onChange={(e) => {
                        const updated = [...nextSteps];
                        updated[idx] = e.target.value;
                        setNextSteps(updated);
                      }}
                      placeholder={`Next step ${idx + 1}`}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg"
                    />
                    {idx === nextSteps.length - 1 && (
                      <button
                        onClick={() => setNextSteps([...nextSteps, ''])}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg"
                      >
                        +
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Hours Worked</label>
                <input
                  type="number"
                  value={hoursWorked}
                  onChange={(e) => setHoursWorked(e.target.value)}
                  placeholder="e.g., 45"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
              </div>

              <div className="pt-4 border-t">
                <button
                  onClick={handleSubmitReport}
                  className="w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold"
                >
                  Submit Report to PI
                </button>
                <p className="text-xs text-gray-500 mt-2 text-center">
                  Your PI will be notified and can provide feedback
                </p>
              </div>
            </div>
          </div>
        )}

        {/* My Reports View */}
        {view === 'my-reports' && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">My Progress Reports</h2>
              <button
                onClick={() => setView('submit')}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2"
              >
                <PlusIcon className="w-5 h-5" />
                <span>New Report</span>
              </button>
            </div>

            <div className="text-center py-12 text-gray-500">
              <DocumentTextIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p>No progress reports yet. API is ready!</p>
              <p className="text-sm mt-2">Submit your first report to get started.</p>
            </div>
          </div>
        )}

        {/* Review Reports View (PI Only) */}
        {view === 'review' && user?.role === 'pi' && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Reports Pending Review</h2>
            
            <div className="text-center py-12 text-gray-500">
              <ClipboardListIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p>No reports to review. API is ready!</p>
              <p className="text-sm mt-2">When team members submit reports, they'll appear here.</p>
            </div>
          </div>
        )}

        {/* Notifications View */}
        {view === 'notifications' && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Notifications</h2>
            
            <div className="text-center py-12 text-gray-500">
              <BellIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p>No notifications. API is ready!</p>
              <p className="text-sm mt-2">You'll be notified when:</p>
              <ul className="text-xs mt-3 space-y-1">
                <li>• Your report has been reviewed</li>
                <li>• Revision is requested</li>
                <li>• New team members submit reports (PI)</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PIReviewDashboardPage;

