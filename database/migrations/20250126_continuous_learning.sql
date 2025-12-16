/**
 * Continuous Learning System - Database Schema
 * Tasks 14, 16, 20-22: Enhanced RAG & Continuous Learning
 */

-- User AI Interactions (for learning from queries/responses)
CREATE TABLE IF NOT EXISTS user_ai_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  query TEXT NOT NULL,
  response TEXT,
  context JSONB,
  interaction_type VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_user_interactions FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_user_ai_interactions_user_id ON user_ai_interactions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_ai_interactions_created_at ON user_ai_interactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_ai_interactions_type ON user_ai_interactions(interaction_type);

-- User AI Feedback (for learning from user feedback)
CREATE TABLE IF NOT EXISTS user_ai_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  feedback_type VARCHAR(50) DEFAULT 'general',
  rating INTEGER CHECK (rating >= 0 AND rating <= 5),
  feedback_text TEXT,
  context JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_user_feedback FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_user_ai_feedback_user_id ON user_ai_feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_user_ai_feedback_rating ON user_ai_feedback(rating);
CREATE INDEX IF NOT EXISTS idx_user_ai_feedback_created_at ON user_ai_feedback(created_at DESC);

-- User AI Failures (Task 21: Failure learning mechanism)
CREATE TABLE IF NOT EXISTS user_ai_failures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  task_type VARCHAR(50) NOT NULL,
  error_message TEXT NOT NULL,
  context JSONB,
  correction TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_user_failures FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_user_ai_failures_user_id ON user_ai_failures(user_id);
CREATE INDEX IF NOT EXISTS idx_user_ai_failures_task_type ON user_ai_failures(task_type);
CREATE INDEX IF NOT EXISTS idx_user_ai_failures_created_at ON user_ai_failures(created_at DESC);

-- User AI Topics (extracted from interactions)
CREATE TABLE IF NOT EXISTS user_ai_topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  topic VARCHAR(100) NOT NULL,
  source VARCHAR(50),
  frequency INTEGER DEFAULT 1,
  last_seen TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_user_topics FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT unique_user_topic UNIQUE (user_id, topic)
);

CREATE INDEX IF NOT EXISTS idx_user_ai_topics_user_id ON user_ai_topics(user_id);
CREATE INDEX IF NOT EXISTS idx_user_ai_topics_frequency ON user_ai_topics(frequency DESC);
CREATE INDEX IF NOT EXISTS idx_user_ai_topics_last_seen ON user_ai_topics(last_seen DESC);

-- User AI Preferences (Task 22: User model update system)
CREATE TABLE IF NOT EXISTS user_ai_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  preference_type VARCHAR(50) NOT NULL,
  preference_value JSONB,
  weight DECIMAL(3, 2) DEFAULT 0.5 CHECK (weight >= 0 AND weight <= 1),
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_user_preferences FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT unique_user_preference UNIQUE (user_id, preference_type)
);

CREATE INDEX IF NOT EXISTS idx_user_ai_preferences_user_id ON user_ai_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_user_ai_preferences_weight ON user_ai_preferences(weight DESC);

-- User AI Failure Patterns (for avoiding repeated mistakes)
CREATE TABLE IF NOT EXISTS user_ai_failure_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  task_type VARCHAR(50) NOT NULL,
  error_pattern TEXT NOT NULL,
  correction TEXT,
  occurrence_count INTEGER DEFAULT 1,
  last_occurrence TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_user_failure_patterns FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT unique_failure_pattern UNIQUE (user_id, task_type, error_pattern)
);

CREATE INDEX IF NOT EXISTS idx_user_ai_failure_patterns_user_id ON user_ai_failure_patterns(user_id);
CREATE INDEX IF NOT EXISTS idx_user_ai_failure_patterns_occurrence ON user_ai_failure_patterns(occurrence_count DESC);

-- User AI Learning Statistics
CREATE TABLE IF NOT EXISTS user_ai_learning_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  event_type VARCHAR(50) NOT NULL,
  count INTEGER DEFAULT 1,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_user_learning_stats FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT unique_user_event_type UNIQUE (user_id, event_type)
);

CREATE INDEX IF NOT EXISTS idx_user_ai_learning_stats_user_id ON user_ai_learning_stats(user_id);
CREATE INDEX IF NOT EXISTS idx_user_ai_learning_stats_event_type ON user_ai_learning_stats(event_type);

-- Add triggers for automatic timestamp updates
CREATE OR REPLACE FUNCTION update_user_ai_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_updated = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_user_ai_preferences_updated_at_trigger ON user_ai_preferences;
CREATE TRIGGER update_user_ai_preferences_updated_at_trigger
  BEFORE UPDATE ON user_ai_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_user_ai_preferences_updated_at();

-- Add comment
COMMENT ON TABLE user_ai_interactions IS 'Stores user-AI interactions for learning patterns';
COMMENT ON TABLE user_ai_feedback IS 'Stores user feedback for preference learning';
COMMENT ON TABLE user_ai_failures IS 'Stores failure patterns for learning from mistakes';
COMMENT ON TABLE user_ai_topics IS 'Extracted topics from user interactions';
COMMENT ON TABLE user_ai_preferences IS 'User preferences learned from feedback';
COMMENT ON TABLE user_ai_failure_patterns IS 'Failure patterns to avoid repeating mistakes';
COMMENT ON TABLE user_ai_learning_stats IS 'Statistics on learning events';

