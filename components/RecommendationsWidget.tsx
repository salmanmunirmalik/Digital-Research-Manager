/**
 * RecommendationsWidget - Reusable component for displaying recommendations
 * Supports protocols, papers, services, and other item types
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import Card, { CardContent, CardHeader, CardTitle } from './ui/Card';
import Button from './ui/Button';
import { SparklesIcon, XMarkIcon, HandThumbUpIcon, HandThumbDownIcon } from '@heroicons/react/24/outline';

export interface Recommendation {
  itemId: string;
  itemType: string;
  score: number;
  reason: string;
  algorithm: string;
  recommendationId?: string;
  metadata?: {
    title?: string;
    name?: string;
    category?: string;
    avgRating?: number;
    popularity?: number;
    [key: string]: any;
  };
}

interface RecommendationsWidgetProps {
  itemType: 'protocols' | 'papers' | 'services';
  title?: string;
  limit?: number;
  showFeedback?: boolean;
  onItemClick?: (itemId: string, itemType: string) => void;
  className?: string;
}

const RecommendationsWidget: React.FC<RecommendationsWidgetProps> = ({
  itemType,
  title,
  limit = 5,
  showFeedback = true,
  onItemClick,
  className = ''
}) => {
  const { token } = useAuth();
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [feedbackGiven, setFeedbackGiven] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchRecommendations();
  }, [itemType, limit]);

  const fetchRecommendations = async () => {
    try {
      setLoading(true);
      setError(null);

      const apiUrl = (import.meta as any).env?.VITE_API_URL || 'http://localhost:5002/api';
      const response = await axios.get(
        `${apiUrl}/recommendations/${itemType}?limit=${limit}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      setRecommendations(response.data.recommendations || []);
    } catch (err: any) {
      console.error('Error fetching recommendations:', err);
      setError(err.response?.data?.error || 'Failed to load recommendations');
    } finally {
      setLoading(false);
    }
  };

  const handleFeedback = async (recommendationId: string, feedback: 'positive' | 'negative' | 'dismissed') => {
    if (!recommendationId || feedbackGiven.has(recommendationId)) return;

    try {
      const apiUrl = (import.meta as any).env?.VITE_API_URL || 'http://localhost:5002/api';
      await axios.post(
        `${apiUrl}/recommendations/feedback`,
        {
          recommendationId,
          feedback,
          clicked: feedback === 'positive'
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      setFeedbackGiven(prev => new Set(prev).add(recommendationId));

      // Track the interaction
      if (feedback === 'positive') {
        const rec = recommendations.find(r => r.recommendationId === recommendationId);
        if (rec) {
          const apiUrl = (import.meta as any).env?.VITE_API_URL || 'http://localhost:5002/api';
          await axios.post(
            `${apiUrl}/recommendations/track`,
            {
              eventType: 'click',
              itemType: rec.itemType,
              itemId: rec.itemId,
              metadata: { from: 'recommendation_widget' }
            },
            {
              headers: {
                Authorization: `Bearer ${token}`
              }
            }
          );
        }
      }
    } catch (err) {
      console.error('Error submitting feedback:', err);
    }
  };

  const handleItemClick = (rec: Recommendation) => {
    // Track view event
    const apiUrl = (import.meta as any).env?.VITE_API_URL || 'http://localhost:5002/api';
    axios.post(
      `${apiUrl}/recommendations/track`,
      {
        eventType: 'view',
        itemType: rec.itemType,
        itemId: rec.itemId,
        metadata: { from: 'recommendation_widget' }
      },
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    ).catch(err => console.error('Error tracking view:', err));

    if (onItemClick) {
      onItemClick(rec.itemId, rec.itemType);
    }
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <SparklesIcon className="w-5 h-5 text-yellow-500" />
            {title || `Recommended ${itemType}`}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(limit)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-20 bg-gray-200 rounded-lg"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <SparklesIcon className="w-5 h-5 text-yellow-500" />
            {title || `Recommended ${itemType}`}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500">{error}</p>
        </CardContent>
      </Card>
    );
  }

  if (recommendations.length === 0) {
    return null; // Don't show widget if no recommendations
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <SparklesIcon className="w-5 h-5 text-yellow-500" />
          {title || `Recommended ${itemType}`}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {recommendations.map((rec) => (
            <div
              key={rec.itemId}
              className="border border-gray-200 rounded-lg p-4 hover:border-yellow-400 hover:shadow-md transition-all cursor-pointer group"
              onClick={() => handleItemClick(rec)}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-gray-900 group-hover:text-yellow-600 transition-colors line-clamp-2 mb-1">
                    {rec.metadata?.title || rec.metadata?.name || 'Untitled'}
                  </h4>
                  <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                    {rec.reason}
                  </p>
                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    {rec.metadata?.category && (
                      <span className="px-2 py-1 bg-gray-100 rounded">
                        {rec.metadata.category}
                      </span>
                    )}
                    {rec.metadata?.avgRating && (
                      <span className="flex items-center gap-1">
                        ⭐ {rec.metadata.avgRating.toFixed(1)}
                      </span>
                    )}
                    <span className="text-gray-400">
                      {Math.round(rec.score * 100)}% match
                    </span>
                  </div>
                </div>
                {showFeedback && rec.recommendationId && (
                  <div className="flex flex-col gap-1 flex-shrink-0">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleFeedback(rec.recommendationId!, 'positive');
                      }}
                      className="p-1 text-gray-400 hover:text-green-600 transition-colors"
                      title="Helpful"
                    >
                      <HandThumbUpIcon className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleFeedback(rec.recommendationId!, 'negative');
                      }}
                      className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                      title="Not helpful"
                    >
                      <HandThumbDownIcon className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default RecommendationsWidget;

