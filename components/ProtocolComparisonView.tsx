/**
 * Protocol Comparison View
 * Side-by-side comparison of protocols with differences, recommendations, and troubleshooting
 */

import React, { useState, useEffect } from 'react';
import Card, { CardContent, CardHeader, CardTitle } from './ui/Card';
import Button from './ui/Button';
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  LightBulbIcon,
  WrenchScrewdriverIcon,
  MagnifyingGlassIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import axios from 'axios';

interface ProtocolComparisonViewProps {
  protocol1Id: string;
  protocol2Id: string;
  onClose: () => void;
}

const ProtocolComparisonView: React.FC<ProtocolComparisonViewProps> = ({
  protocol1Id,
  protocol2Id,
  onClose
}) => {
  const [comparison, setComparison] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'differences' | 'recommendations' | 'troubleshooting'>('overview');

  useEffect(() => {
    fetchComparison();
  }, [protocol1Id, protocol2Id]);

  const fetchComparison = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        '/api/protocol-comparison/compare',
        { protocol1Id, protocol2Id },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setComparison(response.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to compare protocols');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <Card className="w-full max-w-2xl">
          <CardContent className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Comparing protocols...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <Card className="w-full max-w-2xl">
          <CardContent className="p-8">
            <div className="text-center">
              <ExclamationTriangleIcon className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <p className="text-red-600 mb-4">{error}</p>
              <Button onClick={onClose}>Close</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!comparison) return null;

  const { protocol1, protocol2, similarities, differences, missingSteps, missingMaterials, recommendations, troubleshooting, overallScore } = comparison;

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-300';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      default: return 'bg-blue-100 text-blue-800 border-blue-300';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-7xl max-h-[95vh] overflow-hidden shadow-2xl my-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-2">Protocol Comparison</h2>
              <p className="text-blue-100">
                Similarity Score: <span className="font-bold text-white">{(overallScore * 100).toFixed(1)}%</span>
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 transition-colors"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 bg-gray-50">
          <div className="flex space-x-1 px-6">
            {[
              { id: 'overview', label: 'Overview', icon: MagnifyingGlassIcon },
              { id: 'differences', label: `Differences (${differences.length})`, icon: ExclamationTriangleIcon },
              { id: 'recommendations', label: 'Recommendations', icon: LightBulbIcon },
              { id: 'troubleshooting', label: 'Troubleshooting', icon: WrenchScrewdriverIcon }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-3 font-medium text-sm transition-colors border-b-2 ${
                  activeTab === tab.id
                    ? 'border-blue-600 text-blue-600 bg-white'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                <tab.icon className="w-4 h-4 inline mr-2" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(95vh-200px)]">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Protocol Cards Side by Side */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="border-2 border-blue-200">
                  <CardHeader className="bg-blue-50">
                    <CardTitle className="text-lg">Your Protocol</CardTitle>
                    <p className="text-sm text-gray-600">{protocol1.title}</p>
                  </CardHeader>
                  <CardContent className="p-4">
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Steps:</span>
                        <span className="font-semibold">{(protocol1.procedure || []).length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Success Rate:</span>
                        <span className="font-semibold">{protocol1.success_rate || 0}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Usage Count:</span>
                        <span className="font-semibold">{protocol1.usage_count || 0}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-2 border-indigo-200">
                  <CardHeader className="bg-indigo-50">
                    <CardTitle className="text-lg">Compared Protocol</CardTitle>
                    <p className="text-sm text-gray-600">{protocol2.title}</p>
                  </CardHeader>
                  <CardContent className="p-4">
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Steps:</span>
                        <span className="font-semibold">{(protocol2.procedure || []).length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Success Rate:</span>
                        <span className="font-semibold">{protocol2.success_rate || 0}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Usage Count:</span>
                        <span className="font-semibold">{protocol2.usage_count || 0}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Similarity Metrics */}
              <Card>
                <CardHeader>
                  <CardTitle>Similarity Metrics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {similarities.map((sim: any, idx: number) => (
                      <div key={idx}>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm font-medium text-gray-700 capitalize">
                            {sim.aspect}
                          </span>
                          <span className="text-sm font-semibold text-blue-600">
                            {(sim.similarity * 100).toFixed(0)}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full transition-all"
                            style={{ width: `${sim.similarity * 100}%` }}
                          />
                        </div>
                        <p className="text-xs text-gray-500 mt-1">{sim.details}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Quick Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                  <div className="text-2xl font-bold text-red-600">
                    {differences.filter((d: any) => d.severity === 'critical' || d.severity === 'high').length}
                  </div>
                  <div className="text-sm text-red-700">Critical Differences</div>
                </div>
                <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                  <div className="text-2xl font-bold text-orange-600">{missingSteps.length}</div>
                  <div className="text-sm text-orange-700">Missing Steps</div>
                </div>
                <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                  <div className="text-2xl font-bold text-yellow-600">{missingMaterials.length}</div>
                  <div className="text-sm text-yellow-700">Missing Materials</div>
                </div>
                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <div className="text-2xl font-bold text-green-600">{recommendations.length}</div>
                  <div className="text-sm text-green-700">Recommendations</div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'differences' && (
            <div className="space-y-4">
              {differences.map((diff: any, idx: number) => (
                <Card key={idx} className={`border-l-4 ${getSeverityColor(diff.severity).split(' ')[0].replace('bg-', 'border-')}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 rounded text-xs font-bold ${getSeverityColor(diff.severity)}`}>
                          {diff.severity.toUpperCase()}
                        </span>
                        <span className="text-sm font-medium text-gray-700">{diff.type.replace('_', ' ')}</span>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">{diff.location}</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-3 bg-blue-50 rounded border border-blue-200">
                        <div className="text-xs font-semibold text-blue-700 mb-1">Your Protocol</div>
                        <div className="text-sm text-gray-800">
                          {diff.protocol1Value || <span className="text-gray-400">Not present</span>}
                        </div>
                      </div>
                      <div className="p-3 bg-indigo-50 rounded border border-indigo-200">
                        <div className="text-xs font-semibold text-indigo-700 mb-1">Compared Protocol</div>
                        <div className="text-sm text-gray-800">
                          {diff.protocol2Value || <span className="text-gray-400">Not present</span>}
                        </div>
                      </div>
                    </div>
                    <p className="text-sm text-gray-700 mt-3">
                      <strong>Impact:</strong> {diff.impact}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {activeTab === 'recommendations' && (
            <div className="space-y-4">
              {recommendations.map((rec: string, idx: number) => (
                <Card key={idx} className="border-l-4 border-green-500">
                  <CardContent className="p-4">
                    <div className="flex items-start space-x-3">
                      <LightBulbIcon className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <p className="text-gray-800">{rec}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {missingSteps.length > 0 && (
                <Card className="border-l-4 border-orange-500">
                  <CardHeader>
                    <CardTitle className="text-lg">Missing Steps to Consider</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {missingSteps.map((step: any, idx: number) => (
                        <div key={idx} className="p-3 bg-orange-50 rounded border border-orange-200">
                          <div className="font-semibold text-gray-900 mb-1">
                            Step {step.suggestedPosition}: {step.step.title}
                          </div>
                          <p className="text-sm text-gray-700 mb-2">{step.step.description}</p>
                          <p className="text-xs text-orange-700">{step.reason}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
              {missingMaterials.length > 0 && (
                <Card className="border-l-4 border-yellow-500">
                  <CardHeader>
                    <CardTitle className="text-lg">Material Differences</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {missingMaterials.map((mat: any, idx: number) => (
                        <div key={idx} className="p-3 bg-yellow-50 rounded border border-yellow-200">
                          <div className="font-semibold text-gray-900 mb-1">{mat.material}</div>
                          <p className="text-sm text-gray-700">{mat.impact}</p>
                          {mat.alternative && (
                            <p className="text-xs text-blue-600 mt-1">
                              Alternative: {mat.alternative}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {activeTab === 'troubleshooting' && (
            <div className="space-y-4">
              {troubleshooting.length > 0 ? (
                troubleshooting.map((trouble: any, idx: number) => (
                  <Card key={idx} className="border-l-4 border-purple-500">
                    <CardContent className="p-4">
                      <div className="flex items-start space-x-3 mb-3">
                        <WrenchScrewdriverIcon className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900 mb-1">{trouble.issue}</h4>
                          <p className="text-sm text-gray-600 mb-2">
                            <strong>Likely Cause:</strong> {trouble.likelyCause}
                          </p>
                          <p className="text-sm text-gray-800 mb-2">
                            <strong>Solution:</strong> {trouble.solution}
                          </p>
                          {trouble.relatedDifferences && trouble.relatedDifferences.length > 0 && (
                            <div className="mt-2">
                              <p className="text-xs text-gray-500 mb-1">Related Differences:</p>
                              <div className="flex flex-wrap gap-1">
                                {trouble.relatedDifferences.map((diff: string, i: number) => (
                                  <span key={i} className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs">
                                    {diff}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                          <div className="mt-2 text-xs text-gray-500">
                            Confidence: {(trouble.confidence * 100).toFixed(0)}%
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Card>
                  <CardContent className="p-8 text-center">
                    <WrenchScrewdriverIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">
                      No specific troubleshooting insights available. Review the differences tab for potential issues.
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 border-t border-gray-200 p-4">
          <div className="flex justify-end">
            <Button onClick={onClose}>Close</Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProtocolComparisonView;

