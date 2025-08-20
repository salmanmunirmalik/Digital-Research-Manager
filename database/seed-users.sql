-- Seed users for authentication demo
-- Note: Passwords are hashed using bcrypt with salt rounds 10

-- Demo admin user (password: admin123)
INSERT INTO users (
  id, email, username, password_hash, first_name, last_name, role, status, email_verified, created_at
) VALUES (
  '550e8400-e29b-41d4-a716-446655440000',
  'admin@researchlab.com',
  'admin',
  '$2b$10$eRx/0l7WXFxGIwX65EdnWu.C.BADAcNCka4av0W1jhp6avU.IPEtS',
  'Admin',
  'User',
  'admin',
  'active',
  true,
  NOW()
) ON CONFLICT (email) DO NOTHING;

-- Demo Principal Investigator (password: pi123)
INSERT INTO users (
  id, email, username, password_hash, first_name, last_name, role, status, email_verified, created_at
) VALUES (
  '550e8400-e29b-41d4-a716-446655440001',
  'pi@researchlab.com',
  'pi_user',
  '$2b$10$ztFx9l8yfHOqkXN65/W5ROjyNHJ4rx.b6DPtWEPpLIdh8rmEh2pPu',
  'Dr. Jane',
  'Smith',
  'principal_researcher',
  'active',
  true,
  NOW()
) ON CONFLICT (email) DO NOTHING;

-- Demo Researcher (password: researcher123)
INSERT INTO users (
  id, email, username, password_hash, first_name, last_name, role, status, email_verified, created_at
) VALUES (
  '550e8400-e29b-41d4-a716-446655440002',
  'researcher@researchlab.com',
  'researcher',
  '$2b$10$waMGFXzSfAbLTHmKDBHQnuWErohGjjpQsogDhjZfNHREn0SdaMsvu',
  'John',
  'Doe',
  'researcher',
  'active',
  true,
  NOW()
) ON CONFLICT (email) DO NOTHING;

-- Demo Student (password: student123)
INSERT INTO users (
  id, email, username, password_hash, first_name, last_name, role, status, email_verified, created_at
) VALUES (
  '550e8400-e29b-41d4-a716-446655440003',
  'student@researchlab.com',
  'student',
  '$2b$10$RaX2ifSFhJs0c8wUkoNjMONtjxwfWFNFGzPS8xTnXpHvsaIr9QsqC',
  'Alice',
  'Johnson',
  'student',
  'active',
  true,
  NOW()
) ON CONFLICT (email) DO NOTHING;

-- Create a demo lab
INSERT INTO labs (
  id, name, description, institution, department, principal_researcher_id, created_at
) VALUES (
  '650e8400-e29b-41d4-a716-446655440000',
  'Demo Research Lab',
  'A demonstration laboratory for the research platform',
  'Demo University',
  'Computer Science',
  '550e8400-e29b-41d4-a716-446655440001',
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Add users to the demo lab
INSERT INTO lab_members (lab_id, user_id, role, permissions, joined_at) VALUES
  ('650e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440001', 'principal_researcher', '{}', NOW()),
  ('650e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440002', 'researcher', '{}', NOW()),
  ('650e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440003', 'student', '{}', NOW())
ON CONFLICT (lab_id, user_id) DO NOTHING;