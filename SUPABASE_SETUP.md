# 🗄️ Supabase Integration Guide

This guide will help you integrate Supabase with your enhanced ResearchLabSync application.

## 🚀 Quick Start

### 1. Get Your Supabase Credentials

1. Go to [supabase.com](https://supabase.com) and sign in
2. Select your project (or create a new one)
3. Go to **Settings** → **API**
4. Copy your **Project URL** and **anon public** key

### 2. Update Environment Variables

Create or update your `.env` file:

```bash
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here

# Other existing variables...
PORT=5001
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
DB_PATH=./data/researchlab.db
GEMINI_API_KEY=your-gemini-api-key-here
```

### 3. Set Up Database Schema

1. In your Supabase dashboard, go to **SQL Editor**
2. Copy the entire contents of `supabase-schema.sql`
3. Paste and run the SQL script
4. Verify all tables are created successfully

## 🏗️ Database Schema Overview

### Core Tables

| Table | Purpose | Key Features |
|-------|---------|--------------|
| `users` | User management | Roles, expertise, status |
| `protocols` | Enhanced protocols | Categories, safety, validation |
| `protocol_steps` | Protocol steps | Calculators, quality control |
| `projects` | Research projects | Organization structure |
| `experiments` | Individual experiments | Project grouping |
| `notebook_entries` | Lab notebook | Rich content blocks |
| `inventory_items` | Lab supplies | Expiration, thresholds |
| `instruments` | Lab equipment | Booking system |
| `results` | Experimental results | Data analysis |
| `scratchpad_items` | Calculator history | User calculations |

### Enhanced Features

- **Protocol Categories**: 12 main categories with subcategories
- **Safety Management**: Risk levels, hazards, PPE, emergency procedures
- **Validation System**: Testing records, success rates, notes
- **Equipment Tracking**: Essential, optional, and shared equipment
- **Reagent Management**: Essential, optional, and alternatives
- **Time Estimates**: Preparation, execution, analysis, total
- **Publication Links**: DOI, journal, year, authors

## 🔐 Authentication Setup

### 1. Enable Email Auth

In Supabase dashboard:
1. Go to **Authentication** → **Providers**
2. Enable **Email** provider
3. Configure email templates if desired

### 2. Set Up Row Level Security (RLS)

The schema includes comprehensive RLS policies:

```sql
-- Users can view all users but only edit their own profile
CREATE POLICY "Users can view all users" ON users FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid() = id);

-- Protocols: Public protocols visible to all, private to owner only
CREATE POLICY "Protocols visible based on access" ON protocols FOR SELECT USING (
  access = 'Public' OR 
  access = 'Lab Only' OR 
  auth.uid() = author_id
);
```

### 3. Custom Claims (Optional)

For advanced role-based access:

```sql
-- Create function to set user role
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, username, email, role)
  VALUES (new.id, new.raw_user_meta_data->>'username', new.email, 'Research Assistant');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically create user profile
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
```

## 📊 Storage Setup

### 1. Create Storage Buckets

```sql
-- Create buckets for different file types
INSERT INTO storage.buckets (id, name, public) VALUES
  ('protocol-attachments', 'protocol-attachments', true),
  ('lab-notebook', 'lab-notebook', true),
  ('results-data', 'results-data', true);
```

### 2. Set Storage Policies

```sql
-- Allow authenticated users to upload files
CREATE POLICY "Authenticated users can upload files" ON storage.objects
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Allow public access to protocol attachments
CREATE POLICY "Public access to protocol attachments" ON storage.objects
  FOR SELECT USING (bucket_id = 'protocol-attachments');
```

## 🔄 Real-time Features

### 1. Enable Realtime

The schema includes real-time subscriptions for:

- **Protocols**: Live updates when protocols are modified
- **Inventory**: Real-time stock level changes
- **Bookings**: Live instrument availability

### 2. Usage Example

```typescript
import { SupabaseService } from '../services/supabase';

// Subscribe to protocol changes
const subscription = SupabaseService.subscribeToProtocols((payload) => {
  console.log('Protocol updated:', payload);
  
  if (payload.eventType === 'UPDATE') {
    // Refresh protocol data
    refreshProtocols();
  }
});

// Clean up subscription
return () => subscription.unsubscribe();
```

## 🧮 Calculator Integration

### 1. Scratchpad Storage

Calculations are automatically saved to Supabase:

```typescript
// Save calculation to scratchpad
await SupabaseService.saveScratchpadItem({
  user_id: currentUser.id,
  calculator_name: 'Molarity Calculator',
  inputs: { mass: 5.85, molecularWeight: 58.44, volume: 100 },
  result: { value: 1.0, unit: 'M' }
});
```

### 2. Calculation History

Retrieve user's calculation history:

```typescript
const scratchpadItems = await SupabaseService.getScratchpadItems(userId);
```

## 🚀 Migration from SQLite

### 1. Data Export

If you have existing SQLite data:

```bash
# Export SQLite data to CSV
sqlite3 data/researchlab.db ".mode csv" ".headers on" "SELECT * FROM protocols;" > protocols.csv
sqlite3 data/researchlab.db ".mode csv" ".headers on" "SELECT * FROM users;" > users.csv
```

### 2. Data Import

Use Supabase's import tools or create migration scripts:

```sql
-- Example: Import protocols
COPY protocols(title, description, tags, author_id, category, subcategory, difficulty)
FROM '/path/to/protocols.csv' DELIMITER ',' CSV HEADER;
```

## 🔧 Advanced Configuration

### 1. Custom Functions

The schema includes utility functions:

```sql
-- Auto-update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Calculate protocol ratings
CREATE OR REPLACE FUNCTION calculate_protocol_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE protocols 
  SET rating = (SELECT AVG(rating) FROM protocol_reviews WHERE protocol_id = NEW.protocol_id)
  WHERE id = NEW.protocol_id;
  RETURN NEW;
END;
$$ language 'plpgsql';
```

### 2. Performance Indexes

Optimized indexes for common queries:

```sql
-- Protocol search optimization
CREATE INDEX idx_protocols_category ON protocols(category);
CREATE INDEX idx_protocols_tags ON protocols USING GIN(tags);
CREATE INDEX idx_protocols_keywords ON protocols USING GIN(keywords);

-- Inventory optimization
CREATE INDEX idx_inventory_expiration ON inventory_items(expiration_date);
CREATE INDEX idx_inventory_low_stock ON inventory_items(quantity_value, low_stock_threshold);
```

## 🧪 Testing Your Setup

### 1. Test Authentication

```typescript
// Test sign up
const { data, error } = await SupabaseService.signUp(
  'test@example.com',
  'password123',
  { username: 'testuser', role: 'Research Assistant' }
);

// Test sign in
const { data, error } = await SupabaseService.signIn(
  'test@example.com',
  'password123'
);
```

### 2. Test Protocol Creation

```typescript
const protocol = await SupabaseService.createProtocol({
  title: 'Test Protocol',
  description: 'A test protocol for validation',
  category: 'Molecular Biology',
  subcategory: 'DNA/RNA Extraction',
  difficulty: 'Beginner',
  author_id: userId,
  estimatedTime: { preparation: 30, execution: 120, analysis: 60, total: 210 },
  equipment: { essential: ['Pipettes'], optional: [], shared: [] },
  reagents: { essential: [], optional: [], alternatives: [] },
  safety: { riskLevel: 'Low', hazards: [], ppe: [], emergencyProcedures: [], disposalRequirements: [] },
  validation: { testedBy: [], validationDate: new Date().toISOString().split('T')[0], successRate: 95, notes: '' }
});
```

## 🚨 Troubleshooting

### Common Issues

1. **RLS Policy Errors**
   - Ensure all tables have RLS enabled
   - Check policy syntax and conditions
   - Verify user authentication status

2. **Permission Denied**
   - Check bucket policies for storage
   - Verify table permissions
   - Ensure proper role assignments

3. **Real-time Not Working**
   - Enable realtime in database settings
   - Check subscription setup
   - Verify channel permissions

### Debug Queries

```sql
-- Check RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'protocols';

-- Check user permissions
SELECT grantee, privilege_type, table_name 
FROM information_schema.role_table_grants 
WHERE table_name = 'protocols';

-- Check realtime status
SELECT * FROM pg_replication_slots;
```

## 📚 Next Steps

1. **Customize Policies**: Adjust RLS policies for your lab's security requirements
2. **Add Functions**: Create custom database functions for complex operations
3. **Set Up Monitoring**: Configure Supabase analytics and monitoring
4. **Backup Strategy**: Set up automated backups and point-in-time recovery
5. **Performance Tuning**: Monitor query performance and add indexes as needed

## 🔗 Useful Links

- [Supabase Documentation](https://supabase.com/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [Real-time Subscriptions](https://supabase.com/docs/guides/realtime)

---

**Need Help?** Check the troubleshooting section or refer to the Supabase documentation for detailed guidance on any specific feature.
