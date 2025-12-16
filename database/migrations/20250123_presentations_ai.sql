-- AI Presentation System Migration
-- Based on presentation-ai repository structure

-- Create presentation themes table FIRST (before presentations references it)
CREATE TABLE IF NOT EXISTS presentation_themes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    logo_url TEXT,
    is_public BOOLEAN DEFAULT false,
    is_system BOOLEAN DEFAULT false,
    theme_data JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create presentations table (after themes table)
CREATE TABLE IF NOT EXISTS presentations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    content JSONB NOT NULL DEFAULT '{}',
    theme_id VARCHAR(100) DEFAULT 'default',
    presentation_style VARCHAR(100),
    language VARCHAR(10) DEFAULT 'en-US',
    outline TEXT[],
    template_id VARCHAR(100),
    custom_theme_id UUID REFERENCES presentation_themes(id),
    is_public BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create presentation favorites table
CREATE TABLE IF NOT EXISTS presentation_favorites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    presentation_id UUID REFERENCES presentations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(presentation_id, user_id)
);

-- Create presentation shares table
CREATE TABLE IF NOT EXISTS presentation_shares (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    presentation_id UUID REFERENCES presentations(id) ON DELETE CASCADE,
    shared_by UUID REFERENCES users(id) ON DELETE CASCADE,
    shared_with UUID REFERENCES users(id) ON DELETE CASCADE,
    permission VARCHAR(20) DEFAULT 'view', -- 'view', 'edit', 'admin'
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(presentation_id, shared_with)
);

-- Create presentation analytics table
CREATE TABLE IF NOT EXISTS presentation_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    presentation_id UUID REFERENCES presentations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    action VARCHAR(50) NOT NULL, -- 'view', 'edit', 'share', 'export'
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_presentations_user_id ON presentations(user_id);
CREATE INDEX IF NOT EXISTS idx_presentations_created_at ON presentations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_presentations_is_public ON presentations(is_public);
CREATE INDEX IF NOT EXISTS idx_presentations_theme_id ON presentations(theme_id);
CREATE INDEX IF NOT EXISTS idx_presentation_themes_user_id ON presentation_themes(user_id);
CREATE INDEX IF NOT EXISTS idx_presentation_themes_is_public ON presentation_themes(is_public);
CREATE INDEX IF NOT EXISTS idx_presentation_favorites_user_id ON presentation_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_presentation_shares_presentation_id ON presentation_shares(presentation_id);
CREATE INDEX IF NOT EXISTS idx_presentation_analytics_presentation_id ON presentation_analytics(presentation_id);

-- Insert default system themes
INSERT INTO presentation_themes (id, name, description, is_system, is_public, theme_data) VALUES
(
    gen_random_uuid(),
    'Research Professional',
    'Clean, professional theme for research presentations',
    true,
    true,
    '{
        "colors": {
            "primary": "#2563eb",
            "secondary": "#64748b",
            "accent": "#0ea5e9",
            "background": "#ffffff",
            "text": "#1e293b",
            "textSecondary": "#64748b"
        },
        "fonts": {
            "heading": "Inter",
            "body": "Inter",
            "mono": "JetBrains Mono"
        },
        "spacing": {
            "small": "0.5rem",
            "medium": "1rem",
            "large": "2rem"
        },
        "borderRadius": "0.5rem"
    }'::jsonb
),
(
    gen_random_uuid(),
    'Academic Classic',
    'Traditional academic presentation style',
    true,
    true,
    '{
        "colors": {
            "primary": "#1e40af",
            "secondary": "#6b7280",
            "accent": "#dc2626",
            "background": "#ffffff",
            "text": "#111827",
            "textSecondary": "#6b7280"
        },
        "fonts": {
            "heading": "Times New Roman",
            "body": "Times New Roman",
            "mono": "Courier New"
        },
        "spacing": {
            "small": "0.375rem",
            "medium": "0.75rem",
            "large": "1.5rem"
        },
        "borderRadius": "0.25rem"
    }'::jsonb
),
(
    gen_random_uuid(),
    'Modern Scientific',
    'Contemporary design for scientific presentations',
    true,
    true,
    '{
        "colors": {
            "primary": "#7c3aed",
            "secondary": "#059669",
            "accent": "#dc2626",
            "background": "#ffffff",
            "text": "#0f172a",
            "textSecondary": "#475569"
        },
        "fonts": {
            "heading": "Poppins",
            "body": "Inter",
            "mono": "Fira Code"
        },
        "spacing": {
            "small": "0.5rem",
            "medium": "1rem",
            "large": "2rem"
        },
        "borderRadius": "0.75rem"
    }'::jsonb
);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_presentation_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_presentations_updated_at
    BEFORE UPDATE ON presentations
    FOR EACH ROW
    EXECUTE FUNCTION update_presentation_updated_at();

CREATE TRIGGER update_presentation_themes_updated_at
    BEFORE UPDATE ON presentation_themes
    FOR EACH ROW
    EXECUTE FUNCTION update_presentation_updated_at();

-- Grant permissions (adjust as needed for your setup)
-- GRANT SELECT, INSERT, UPDATE, DELETE ON presentations TO researchlab_user;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON presentation_themes TO researchlab_user;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON presentation_favorites TO researchlab_user;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON presentation_shares TO researchlab_user;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON presentation_analytics TO researchlab_user;
