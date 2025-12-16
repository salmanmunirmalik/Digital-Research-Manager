/**
 * Recommendation System - Database Schema
 * Phase 1: Foundation for intelligent recommendations
 * 
 * This migration creates the foundational tables for tracking user behavior,
 * storing recommendations, and calculating item similarities.
 */

-- User Behavior Events Tracking
-- Tracks all user interactions with items (protocols, papers, services, etc.)
CREATE TABLE IF NOT EXISTS user_behavior_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Event details
  event_type VARCHAR(50) NOT NULL, -- view, fork, share, complete, rate, bookmark, download, etc.
  item_type VARCHAR(50) NOT NULL, -- protocol, paper, service, experiment, inventory, etc.
  item_id UUID NOT NULL,
  
  -- Additional context
  metadata JSONB DEFAULT '{}', -- Flexible storage for event-specific data
  session_id VARCHAR(255), -- Track user sessions
  referrer VARCHAR(255), -- Where did they come from
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_behavior_events_user_id ON user_behavior_events(user_id);
CREATE INDEX IF NOT EXISTS idx_user_behavior_events_item ON user_behavior_events(item_type, item_id);
CREATE INDEX IF NOT EXISTS idx_user_behavior_events_type ON user_behavior_events(event_type);
CREATE INDEX IF NOT EXISTS idx_user_behavior_events_created_at ON user_behavior_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_behavior_events_user_item ON user_behavior_events(user_id, item_type, item_id);

-- User Recommendations Storage
-- Stores recommendations shown to users and their feedback
CREATE TABLE IF NOT EXISTS user_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Recommendation details
  item_type VARCHAR(50) NOT NULL, -- protocol, paper, service, collaborator, etc.
  item_id UUID NOT NULL,
  recommendation_score DECIMAL(5,4) NOT NULL CHECK (recommendation_score >= 0 AND recommendation_score <= 1),
  
  -- Recommendation metadata
  recommendation_reason TEXT, -- Human-readable explanation
  algorithm_used VARCHAR(50), -- collaborative, content_based, hybrid, popularity, etc.
  context JSONB DEFAULT '{}', -- Context when recommendation was generated
  
  -- User interaction tracking
  shown_at TIMESTAMP WITH TIME ZONE, -- When recommendation was displayed
  clicked_at TIMESTAMP WITH TIME ZONE, -- When user clicked on it
  feedback VARCHAR(20) CHECK (feedback IN ('positive', 'negative', 'neutral', 'not_shown', 'dismissed')),
  feedback_notes TEXT, -- Optional user feedback text
  
  -- Ranking
  position INTEGER, -- Position in recommendation list (1, 2, 3, etc.)
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for recommendations
CREATE INDEX IF NOT EXISTS idx_user_recommendations_user_id ON user_recommendations(user_id);
CREATE INDEX IF NOT EXISTS idx_user_recommendations_item ON user_recommendations(item_type, item_id);
CREATE INDEX IF NOT EXISTS idx_user_recommendations_score ON user_recommendations(recommendation_score DESC);
CREATE INDEX IF NOT EXISTS idx_user_recommendations_shown ON user_recommendations(shown_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_recommendations_feedback ON user_recommendations(feedback);

-- Item Similarity Matrix
-- Pre-computed similarities between items for collaborative filtering
CREATE TABLE IF NOT EXISTS item_similarities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Item pair
  item_type VARCHAR(50) NOT NULL,
  item_id_1 UUID NOT NULL,
  item_id_2 UUID NOT NULL,
  
  -- Similarity metrics
  similarity_score DECIMAL(5,4) NOT NULL CHECK (similarity_score >= -1 AND similarity_score <= 1),
  calculation_method VARCHAR(50), -- cosine, jaccard, pearson, etc.
  
  -- Metadata
  sample_size INTEGER, -- Number of users/items used in calculation
  last_calculated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  -- Ensure uniqueness and prevent duplicates (A-B same as B-A)
  CONSTRAINT unique_item_pair UNIQUE (item_type, item_id_1, item_id_2),
  CONSTRAINT no_self_similarity CHECK (item_id_1 != item_id_2)
);

-- Indexes for similarities
CREATE INDEX IF NOT EXISTS idx_item_similarities_item1 ON item_similarities(item_type, item_id_1);
CREATE INDEX IF NOT EXISTS idx_item_similarities_item2 ON item_similarities(item_type, item_id_2);
CREATE INDEX IF NOT EXISTS idx_item_similarities_score ON item_similarities(similarity_score DESC);

-- User Recommendation Preferences
-- User-specific preferences for recommendation algorithms
CREATE TABLE IF NOT EXISTS user_recommendation_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Preference settings
  preference_type VARCHAR(50) NOT NULL, -- algorithm_preference, diversity_level, freshness_weight, etc.
  preference_value JSONB NOT NULL,
  
  -- Metadata
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE (user_id, preference_type)
);

CREATE INDEX IF NOT EXISTS idx_user_recommendation_preferences_user ON user_recommendation_preferences(user_id);

-- Recommendation Performance Metrics
-- Track recommendation system performance over time
CREATE TABLE IF NOT EXISTS recommendation_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Metrics period
  metric_date DATE NOT NULL,
  algorithm_used VARCHAR(50) NOT NULL,
  item_type VARCHAR(50) NOT NULL,
  
  -- Performance metrics
  total_recommendations INTEGER DEFAULT 0,
  total_shown INTEGER DEFAULT 0,
  total_clicked INTEGER DEFAULT 0,
  total_positive_feedback INTEGER DEFAULT 0,
  total_negative_feedback INTEGER DEFAULT 0,
  
  -- Calculated metrics
  click_through_rate DECIMAL(5,4), -- clicks / shown
  positive_feedback_rate DECIMAL(5,4), -- positive / shown
  average_score DECIMAL(5,4), -- Average recommendation score
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT unique_metric UNIQUE (metric_date, algorithm_used, item_type)
);

CREATE INDEX IF NOT EXISTS idx_recommendation_metrics_date ON recommendation_metrics(metric_date DESC);

-- Comments
COMMENT ON TABLE user_behavior_events IS 'Tracks all user interactions with platform items for recommendation learning';
COMMENT ON TABLE user_recommendations IS 'Stores recommendations shown to users and tracks their feedback';
COMMENT ON TABLE item_similarities IS 'Pre-computed similarity scores between items for fast collaborative filtering';
COMMENT ON TABLE user_recommendation_preferences IS 'User-specific preferences for recommendation algorithms';
COMMENT ON TABLE recommendation_metrics IS 'Performance metrics for recommendation system monitoring';

