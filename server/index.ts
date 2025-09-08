import express from 'express';
import cors from 'cors';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import pool from '../database/config';
import { User, UserRole, UserStatus } from '../types';

const app = express();
const PORT = process.env.PORT || 5001;

// Extend Express Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

// --- CORS Setup for localhost + Render ---
const allowedOrigins: string[] = process.env.FRONTEND_URL
  ? process.env.FRONTEND_URL.split(',') // allow multiple URLs separated by commas
  : ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175'];

app.use(cors({
  origin: true, // Allow all origins for demo
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// --- JSON Body Parser ---
app.use(express.json());

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production';

// Authentication Middleware (JWT verification)
const authenticateToken = async (req: any, res: any, next: any) => {
  try {
    const authHeader = req.headers['authorization'] as string | undefined;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing or invalid Authorization header' });
    }
    const token = authHeader.split(' ')[1];
    
    // Demo token handling for testing
    if (token === 'demo-token-123') {
      // Use a demo user for testing
      req.user = {
        id: '550e8400-e29b-41d4-a716-446655440003',
        email: 'demo@researchlab.com',
        username: 'student',
        first_name: 'Demo',
        last_name: 'User',
        role: 'student',
        status: 'active',
        lab_id: '650e8400-e29b-41d4-a716-446655440000'
      };
      return next();
    }
    
    const payload: any = jwt.verify(token, JWT_SECRET);

    // Load user from DB
    const result = await pool.query(
      'SELECT id, email, username, first_name, last_name, role, status FROM users WHERE id = $1',
      [payload.userId]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'User not found' });
    }

    const user = result.rows[0];
    if (user.status !== 'active') {
      return res.status(403).json({ error: 'Account is not active' });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    database: 'PostgreSQL',
    environment: process.env.NODE_ENV || 'development'
  });
});

// API Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'API healthy', 
    timestamp: new Date().toISOString(),
    database: 'PostgreSQL'
  });
});

// Authentication Routes
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, username, password, first_name, last_name, role = 'student' } = req.body;

    // Validation
    if (!email || !username || !password || !first_name || !last_name) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Check if user already exists
    const existingUser = await pool.query(
      'SELECT id FROM users WHERE email = $1 OR username = $2',
      [email, username]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'User with this email or username already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const result = await pool.query(`
      INSERT INTO users (email, username, password_hash, first_name, last_name, role, status, email_verified)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id, email, username, first_name, last_name, role, status
    `, [email, username, hashedPassword, first_name, last_name, role, 'active', false]);

    const user = result.rows[0];

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.role,
        status: user.status
      },
      token
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    console.log('🔐 Login attempt:', { email: req.body.email, timestamp: new Date().toISOString() });
    
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      console.log('❌ Login failed: Missing credentials');
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find user
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1 OR username = $1',
      [email]
    );

    if (result.rows.length === 0) {
      console.log('❌ Login failed: User not found');
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = result.rows[0];
    console.log('👤 User found:', { username: user.username, role: user.role, status: user.status });

    // Check if user is active
    if (user.status !== 'active') {
      console.log('❌ Login failed: User not active');
      return res.status(401).json({ error: 'Account is not active. Please contact administrator.' });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      console.log('❌ Login failed: Invalid password');
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    console.log('✅ Password verified successfully');

    // Update last login
    await pool.query(
      'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
      [user.id]
    );

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    console.log('🎉 Login successful:', { username: user.username, role: user.role });

    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.role,
        status: user.status
      },
      token
    });

  } catch (error) {
    console.error('💥 Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Logout (stateless JWT - client should discard token)
app.post('/api/auth/logout', authenticateToken, async (req, res) => {
  try {
    return res.json({ message: 'Logged out' });
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Protected route example
app.get('/api/auth/me', authenticateToken, async (req, res) => {
  try {
    const user = req.user;
    
    // Remove sensitive information
    const { password_hash, ...safeUser } = user;
    
    res.json({
      user: safeUser
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Profile endpoints
app.get('/api/auth/profile', authenticateToken, async (req, res) => {
  try {
    return res.json({ user: req.user });
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error' });
  }
});

app.put('/api/auth/profile', authenticateToken, async (req, res) => {
  try {
    const { first_name, last_name, email } = req.body;
    const result = await pool.query(
      `UPDATE users SET first_name = COALESCE($1, first_name), last_name = COALESCE($2, last_name), email = COALESCE($3, email), updated_at = CURRENT_TIMESTAMP
       WHERE id = $4 RETURNING id, email, username, first_name, last_name, role, status`,
      [first_name, last_name, email, req.user.id]
    );
    return res.json({ user: result.rows[0] });
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error' });
  }
});

app.put('/api/auth/change-password', authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Both current and new passwords are required' });
    }
    const result = await pool.query('SELECT password_hash FROM users WHERE id = $1', [req.user.id]);
    const user = result.rows[0];
    const isValid = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid current password' });
    }
    const newHash = await bcrypt.hash(newPassword, 10);
    await pool.query('UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [newHash, req.user.id]);
    return res.json({ message: 'Password updated successfully' });
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// User Management Routes
app.get('/api/users', authenticateToken, async (req, res) => {
  try {
    // Only admins and principal researchers can view all users
    if (!['admin', 'principal_researcher'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    const result = await pool.query(`
      SELECT id, email, username, first_name, last_name, role, status, created_at, last_login
      FROM users
      ORDER BY created_at DESC
    `);

    res.json({ users: result.rows });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Lab Management Routes
app.post('/api/labs', authenticateToken, async (req, res) => {
  try {
    // Demo mode - bypass permission checks
    // req.user is provided by the bypass middleware

    const { name, description, institution, department, contact_email, contact_phone, address } = req.body;

    // Validation
    if (!name || !institution || !department) {
      return res.status(400).json({ error: 'Lab name, institution, and department are required' });
    }

    // Create lab with demo user ID
    const result = await pool.query(`
      INSERT INTO labs (name, description, institution, department, principal_researcher_id, contact_email, contact_phone, address)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `, [name, description, institution, department, req.user.id, contact_email, contact_phone, address]);

    const lab = result.rows[0];

    // Add creator as lab member with principal researcher role
    await pool.query(`
      INSERT INTO lab_members (lab_id, user_id, role, permissions)
      VALUES ($1, $2, $3, $4)
    `, [lab.id, req.user.id, 'principal_researcher', '{}']);

    console.log('🏢 Lab created:', { labId: lab.id, name: lab.name, creator: req.user.username });

    res.status(201).json({
      message: 'Lab created successfully',
      lab
    });

  } catch (error) {
    console.error('💥 Lab creation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/labs', authenticateToken, async (req, res) => {
  try {
    // Demo mode - show all labs
    const query = `
      SELECT l.*, u.first_name, u.last_name, u.username as pi_name,
             (SELECT COUNT(*) FROM lab_members WHERE lab_id = l.id) as member_count
      FROM labs l
      JOIN users u ON l.principal_researcher_id = u.id
      ORDER BY l.created_at DESC
    `;

    const result = await pool.query(query);

    res.json({ labs: result.rows });
  } catch (error) {
    console.error('💥 Get labs error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/labs/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Demo mode - bypass access checks

    // Get lab details
    const labResult = await pool.query(`
      SELECT l.*, u.first_name, u.last_name, u.username as pi_name
      FROM labs l
      JOIN users u ON l.principal_researcher_id = u.id
      WHERE l.id = $1
    `, [id]);

    if (labResult.rows.length === 0) {
      return res.status(404).json({ error: 'Lab not found' });
    }

    const lab = labResult.rows[0];

    // Get lab members
    const membersResult = await pool.query(`
      SELECT lm.*, u.first_name, u.last_name, u.username, u.email, u.role as user_role
      FROM lab_members lm
      JOIN users u ON lm.user_id = u.id
      WHERE lm.lab_id = $1
      ORDER BY lm.joined_at ASC
    `, [id]);

    res.json({
      lab,
      members: membersResult.rows
    });

  } catch (error) {
    console.error('💥 Get lab error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/labs/:id/members', authenticateToken, async (req, res) => {
  try {
    const { id: labId } = req.params;
    const { user_id, role, permissions = {} } = req.body;

    // Check if user has permission to add members (PI or admin)
    const memberCheck = await pool.query(`
      SELECT role FROM lab_members 
      WHERE lab_id = $1 AND user_id = $2
    `, [labId, req.user.id]);

    if (memberCheck.rows.length === 0 || 
        !['principal_researcher', 'admin'].includes(memberCheck.rows[0].role)) {
      return res.status(403).json({ error: 'Insufficient permissions to add members' });
    }

    // Check if user exists
    const userCheck = await pool.query('SELECT id, username FROM users WHERE id = $1', [user_id]);
    if (userCheck.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if user is already a member
    const existingMember = await pool.query(`
      SELECT id FROM lab_members WHERE lab_id = $1 AND user_id = $2
    `, [labId, user_id]);

    if (existingMember.rows.length > 0) {
      return res.status(400).json({ error: 'User is already a member of this lab' });
    }

    // Add member
    await pool.query(`
      INSERT INTO lab_members (lab_id, user_id, role, permissions)
      VALUES ($1, $2, $3, $4)
    `, [labId, user_id, role, JSON.stringify(permissions)]);

    console.log('👥 Lab member added:', { labId, userId: user_id, role, addedBy: req.user.username });

    res.status(201).json({
      message: 'Member added successfully',
      member: {
        lab_id: labId,
        user_id,
        role,
        permissions
      }
    });

  } catch (error) {
    console.error('💥 Add member error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.put('/api/labs/:id/members/:userId', authenticateToken, async (req, res) => {
  try {
    const { id: labId, userId } = req.params;
    const { role, permissions } = req.body;

    // Check if user has permission to modify members (PI or admin)
    const memberCheck = await pool.query(`
      SELECT role FROM lab_members 
      WHERE lab_id = $1 AND user_id = $2
    `, [labId, req.user.id]);

    if (memberCheck.rows.length === 0 || 
        !['principal_researcher', 'admin'].includes(memberCheck.rows[0].role)) {
      return res.status(403).json({ error: 'Insufficient permissions to modify members' });
    }

    // Update member
    const result = await pool.query(`
      UPDATE lab_members 
      SET role = $1, permissions = $2, updated_at = CURRENT_TIMESTAMP
      WHERE lab_id = $3 AND user_id = $4
      RETURNING *
    `, [role, JSON.stringify(permissions), labId, userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Lab member not found' });
    }

    console.log('👥 Lab member updated:', { labId, userId, role, updatedBy: req.user.username });

    res.json({
      message: 'Member updated successfully',
      member: result.rows[0]
    });

  } catch (error) {
    console.error('💥 Update member error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete('/api/labs/:id/members/:userId', authenticateToken, async (req, res) => {
  try {
    const { id: labId, userId } = req.params;

    // Check if user has permission to remove members (PI or admin)
    const memberCheck = await pool.query(`
      SELECT role FROM lab_members 
      WHERE lab_id = $1 AND user_id = $2
    `, [labId, req.user.id]);

    if (memberCheck.rows.length === 0 || 
        !['principal_researcher', 'admin'].includes(memberCheck.rows[0].role)) {
      return res.status(403).json({ error: 'Insufficient permissions to remove members' });
    }

    // Prevent removing the principal researcher
    const labCheck = await pool.query('SELECT principal_researcher_id FROM labs WHERE id = $1', [labId]);
    if (labCheck.rows[0].principal_researcher_id === userId) {
      return res.status(400).json({ error: 'Cannot remove the principal researcher from the lab' });
    }

    // Remove member
    const result = await pool.query(`
      DELETE FROM lab_members 
      WHERE lab_id = $1 AND user_id = $2
      RETURNING *
    `, [labId, userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Lab member not found' });
    }

    console.log('👥 Lab member removed:', { labId, userId, removedBy: req.user.username });

    res.json({
      message: 'Member removed successfully',
      member: result.rows[0]
    });

  } catch (error) {
    console.error('💥 Remove member error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.put('/api/labs/:id', authenticateToken, async (req, res) => {
  try {
    const { id: labId } = req.params;
    const { name, description, institution, department, contact_email, contact_phone, address } = req.body;

    // Check if user has permission to edit lab (PI or admin)
    const memberCheck = await pool.query(`
      SELECT role FROM lab_members 
      WHERE lab_id = $1 AND user_id = $2
    `, [labId, req.user.id]);

    if (memberCheck.rows.length === 0 || 
        !['principal_researcher', 'admin'].includes(memberCheck.rows[0].role)) {
      return res.status(403).json({ error: 'Insufficient permissions to edit lab' });
    }

    // Update lab
    const result = await pool.query(`
      UPDATE labs 
      SET name = $1, description = $2, institution = $3, department = $4, 
          contact_email = $5, contact_phone = $6, address = $7, updated_at = CURRENT_TIMESTAMP
      WHERE id = $8
      RETURNING *
    `, [name, description, institution, department, contact_email, contact_phone, address, labId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Lab not found' });
    }

    console.log('🏢 Lab updated:', { labId, name, updatedBy: req.user.username });

    res.json({
      message: 'Lab updated successfully',
      lab: result.rows[0]
    });

  } catch (error) {
    console.error('💥 Update lab error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Protocol Management Routes
app.post('/api/protocols', authenticateToken, async (req, res) => {
  try {
    const { 
      title, 
      description, 
      category, 
      difficulty_level, 
      estimated_duration, 
      materials, 
      content, 
      safety_notes, 
      tags, 
      lab_id,
      privacy_level = 'lab'
    } = req.body;

    // Validation
    if (!title || !content || !lab_id) {
      return res.status(400).json({ error: 'Title, content, and lab_id are required' });
    }

    // Check if user has access to the lab
    const labAccess = await pool.query(`
      SELECT role FROM lab_members WHERE lab_id = $1 AND user_id = $2
    `, [lab_id, req.user.id]);

    if (labAccess.rows.length === 0 && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied to this lab' });
    }

    // Create protocol
    const result = await pool.query(`
      INSERT INTO protocols (
        title, description, category, difficulty_level, estimated_duration, 
        materials, content, safety_notes, tags, lab_id, 
        author_id, privacy_level, is_approved
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *
    `, [
      title, description, category, difficulty_level, estimated_duration,
      materials || [], content, safety_notes, tags || [], lab_id,
      req.user.id, privacy_level, true
    ]);

    const protocol = result.rows[0];

    // Create initial sharing record with the lab
    try {
      await pool.query(`
        INSERT INTO protocol_sharing (protocol_id, shared_with_lab_id, permission_level)
        VALUES ($1, $2, $3)
      `, [protocol.id, lab_id, 'full_access']);
    } catch (shareError) {
      console.log('⚠️ Sharing record creation failed, but protocol was created:', shareError);
    }

    console.log('📋 Protocol created:', { protocolId: protocol.id, title: protocol.title, creator: req.user.username });

    res.status(201).json({
      message: 'Protocol created successfully',
      protocol
    });

  } catch (error) {
    console.error('💥 Protocol creation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/protocols', authenticateToken, async (req, res) => {
  try {
    const { lab_id, category, difficulty, search, privacy } = req.query;
    
    let query = `
      SELECT p.*, u.first_name, u.last_name, u.username as creator_name,
             l.name as lab_name, l.institution,
             (SELECT COUNT(*) FROM protocol_sharing WHERE protocol_id = p.id) as share_count
      FROM protocols p
      JOIN users u ON p.author_id = u.id
      LEFT JOIN labs l ON p.lab_id = l.id
      WHERE p.is_approved = true
    `;

    const params: any[] = [];
    let paramCount = 0;

    // Filter by lab
    if (lab_id) {
      paramCount++;
      query += ` AND p.lab_id = $${paramCount}`;
      params.push(lab_id);
    }

    // Filter by category
    if (category) {
      paramCount++;
      query += ` AND p.category = $${paramCount}`;
      params.push(category);
    }

    // Filter by difficulty
    if (difficulty) {
      paramCount++;
      query += ` AND p.difficulty_level = $${paramCount}`;
      params.push(difficulty);
    }

    // Search in title and description
    if (search) {
      paramCount++;
      query += ` AND (p.title ILIKE $${paramCount} OR p.description ILIKE $${paramCount})`;
      params.push(`%${search}%`);
    }

    // Filter by privacy level
    if (privacy) {
      paramCount++;
      query += ` AND p.privacy_level = $${paramCount}`;
      params.push(privacy);
    }

    // If not admin, only show protocols from labs where user is a member or public protocols
    if (req.user.role !== 'admin') {
      paramCount++;
      query += ` AND (p.privacy_level = 'public' OR p.lab_id IN (
        SELECT lab_id FROM lab_members WHERE user_id = $${paramCount}
      ))`;
      params.push(req.user.id);
    }

    query += ' ORDER BY p.created_at DESC';

    const result = await pool.query(query, params);

    res.json({ protocols: result.rows });
  } catch (error) {
    console.error('💥 Get protocols error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/protocols/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Get protocol details
    const protocolResult = await pool.query(`
      SELECT p.*, u.first_name, u.last_name, u.username as creator_name,
             l.name as lab_name, l.institution
      FROM protocols p
      JOIN users u ON p.author_id = u.id
      LEFT JOIN labs l ON p.lab_id = l.id
      WHERE p.id = $1 AND p.is_approved = true
    `, [id]);

    if (protocolResult.rows.length === 0) {
      return res.status(404).json({ error: 'Protocol not found' });
    }

    const protocol = protocolResult.rows[0];

    // Check access permissions
    if (protocol.privacy_level !== 'public') {
      const labAccess = await pool.query(`
        SELECT role FROM lab_members WHERE lab_id = $1 AND user_id = $2
      `, [protocol.lab_id, req.user.id]);

      if (labAccess.rows.length === 0 && req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Access denied to this protocol' });
      }
    }

    // Get sharing information
    const sharingResult = await pool.query(`
      SELECT ps.*, l.name as lab_name, u.first_name, u.last_name, u.username
      FROM protocol_sharing ps
      LEFT JOIN labs l ON ps.shared_with_lab_id = l.id
      LEFT JOIN users u ON ps.shared_with_user_id = u.id
      WHERE ps.protocol_id = $1
    `, [id]);

    res.json({
      protocol,
      sharing: sharingResult.rows
    });

  } catch (error) {
    console.error('💥 Get protocol error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.put('/api/protocols/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      title, description, category, difficulty_level, estimated_duration, 
      materials, content, safety_notes, tags, privacy_level 
    } = req.body;

    // Get current protocol
    const currentProtocol = await pool.query(`
      SELECT * FROM protocols WHERE id = $1
    `, [id]);

    if (currentProtocol.rows.length === 0) {
      return res.status(404).json({ error: 'Protocol not found' });
    }

    const protocol = currentProtocol.rows[0];

    // Check permissions (creator, lab PI, or admin)
    if (protocol.author_id !== req.user.id && req.user.role !== 'admin') {
      const labAccess = await pool.query(`
        SELECT role FROM lab_members 
        WHERE lab_id = $1 AND user_id = $2 AND role = 'principal_researcher'
      `, [protocol.lab_id, req.user.id]);

      if (labAccess.rows.length === 0) {
        return res.status(403).json({ error: 'Insufficient permissions to edit this protocol' });
      }
    }

    // Update protocol
    const result = await pool.query(`
      UPDATE protocols 
      SET title = $1, description = $2, category = $3, difficulty_level = $4,
          estimated_duration = $5, materials = $6, content = $7, safety_notes = $8,
          tags = $9, privacy_level = $10, updated_at = CURRENT_TIMESTAMP
      WHERE id = $11
      RETURNING *
    `, [
      title, description, category, difficulty_level, estimated_duration,
      materials || [], content, safety_notes, tags || [], privacy_level, id
    ]);

    console.log('📋 Protocol updated:', { protocolId: id, title, updatedBy: req.user.username });

    res.json({
      message: 'Protocol updated successfully',
      protocol: result.rows[0]
    });

  } catch (error) {
    console.error('💥 Update protocol error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete('/api/protocols/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Get protocol
    const protocol = await pool.query(`
      SELECT * FROM protocols WHERE id = $1
    `, [id]);

    if (protocol.rows.length === 0) {
      return res.status(404).json({ error: 'Protocol not found' });
    }

    // Check permissions (creator, lab PI, or admin)
    if (protocol.rows[0].author_id !== req.user.id && req.user.role !== 'admin') {
      const labAccess = await pool.query(`
        SELECT role FROM lab_members 
        WHERE lab_id = $1 AND user_id = $2 AND role = 'principal_researcher'
      `, [protocol.rows[0].lab_id, req.user.id]);

      if (labAccess.rows.length === 0) {
        return res.status(403).json({ error: 'Insufficient permissions to delete this protocol' });
      }
    }

    // Soft delete (mark as not approved)
    await pool.query(`
      UPDATE protocols SET is_approved = false, updated_at = CURRENT_TIMESTAMP WHERE id = $1
    `, [id]);

    console.log('📋 Protocol deleted:', { protocolId: id, deletedBy: req.user.username });

    res.json({ message: 'Protocol deleted successfully' });

  } catch (error) {
    console.error('💥 Delete protocol error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/protocols/:id/share', authenticateToken, async (req, res) => {
  try {
    const { id: protocolId } = req.params;
    const { shared_with_user_id, shared_with_lab_id, permission_level } = req.body;

    // Get protocol
    const protocol = await pool.query(`
      SELECT * FROM protocols WHERE id = $1
    `, [protocolId]);

    if (protocol.rows.length === 0) {
      return res.status(404).json({ error: 'Protocol not found' });
    }

    // Check permissions (creator, lab PI, or admin)
    if (protocol.rows[0].author_id !== req.user.id && req.user.role !== 'admin') {
      const labAccess = await pool.query(`
        SELECT role FROM lab_members 
        WHERE lab_id = $1 AND user_id = $2 AND role = 'principal_researcher'
      `, [protocol.rows[0].lab_id, req.user.id]);

      if (labAccess.rows.length === 0) {
        return res.status(403).json({ error: 'Insufficient permissions to share this protocol' });
      }
    }

    // Check if sharing already exists
    const existingShare = await pool.query(`
      SELECT * FROM protocol_sharing 
      WHERE protocol_id = $1 AND (
        (shared_with_user_id = $2 AND $2 IS NOT NULL) OR 
        (shared_with_lab_id = $3 AND $3 IS NOT NULL)
      )
    `, [protocolId, shared_with_user_id, shared_with_lab_id]);

    if (existingShare.rows.length > 0) {
      // Update existing share
      await pool.query(`
        UPDATE protocol_sharing 
        SET permission_level = $1, updated_at = CURRENT_TIMESTAMP
        WHERE protocol_id = $2 AND (
          (shared_with_user_id = $3 AND $3 IS NOT NULL) OR 
          (shared_with_lab_id = $4 AND $4 IS NOT NULL)
        )
      `, [permission_level, protocolId, shared_with_user_id, shared_with_lab_id]);
    } else {
      // Create new share
      await pool.query(`
        INSERT INTO protocol_sharing (protocol_id, shared_with_user_id, shared_with_lab_id, permission_level)
        VALUES ($1, $2, $3, $4)
      `, [protocolId, shared_with_user_id, shared_with_lab_id, permission_level]);
    }

    console.log('📋 Protocol shared:', { protocolId, sharedWithUser: shared_with_user_id, sharedWithLab: shared_with_lab_id, permissionLevel: permission_level, sharedBy: req.user.username });

    res.json({ message: 'Protocol shared successfully' });

  } catch (error) {
    console.error('💥 Share protocol error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/protocols/categories', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT DISTINCT category FROM protocols 
      WHERE is_approved = true AND category IS NOT NULL
      ORDER BY category
    `);

    res.json({ categories: result.rows.map(row => row.category) });
  } catch (error) {
    console.error('💥 Get categories error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Lab Notebook Management Routes
app.post('/api/lab-notebooks', authenticateToken, async (req, res) => {
  try {
    const { 
      title, 
      content, 
      entry_type, 
      objectives, 
      methodology, 
      results, 
      conclusions, 
      next_steps,
      lab_id,
      project_id,
      tags,
      privacy_level = 'lab',
      status = 'in_progress'
    } = req.body;

    // Validation
    if (!title || !content || !lab_id) {
      return res.status(400).json({ error: 'Title, content, and lab_id are required' });
    }

    // Check if user has access to the lab
    const labAccess = await pool.query(`
      SELECT role FROM lab_members WHERE lab_id = $1 AND user_id = $2
    `, [lab_id, req.user.id]);

    if (labAccess.rows.length === 0 && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied to this lab' });
    }

    // Create lab notebook entry - only insert fields that exist in the database
    const result = await pool.query(`
      INSERT INTO lab_notebook_entries (
        title, content, entry_type, results, conclusions, next_steps,
        lab_id, project_id, author_id, privacy_level, tags
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
    `, [
      title, content, entry_type || 'experiment', results || '', conclusions || '', next_steps || '',
      lab_id, project_id, req.user.id, privacy_level, tags || []
    ]);

    const entry = result.rows[0];

    console.log('📓 Lab notebook entry created:', { entryId: entry.id, title: entry.title, creator: req.user.username });

    res.status(201).json({
      message: 'Lab notebook entry created successfully',
      entry
    });

  } catch (error) {
    console.error('💥 Lab notebook creation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/lab-notebooks', authenticateToken, async (req, res) => {
  try {
    const { lab_id, project_id, entry_type, search, tags, privacy } = req.query;
    
    let query = `
      SELECT e.*, u.first_name, u.last_name, u.username as creator_name,
             l.name as lab_name, l.institution
      FROM lab_notebook_entries e
      JOIN users u ON e.author_id = u.id
      LEFT JOIN labs l ON e.lab_id = l.id
      WHERE e.lab_id IS NOT NULL
    `;

    const params: any[] = [];
    let paramCount = 0;

    // Filter by lab
    if (lab_id) {
      paramCount++;
      query += ` AND e.lab_id = $${paramCount}`;
      params.push(lab_id);
    }

    // Filter by entry type
    if (entry_type) {
      paramCount++;
      query += ` AND e.entry_type = $${paramCount}`;
      params.push(entry_type);
    }

    // Search in title and content
    if (search) {
      paramCount++;
      query += ` AND (e.title ILIKE $${paramCount} OR e.content ILIKE $${paramCount})`;
      params.push(`%${search}%`);
    }

    // If not admin, only show entries from labs where user is a member or public entries
    if (req.user.role !== 'admin') {
      paramCount++;
      query += ` AND (e.privacy_level = 'public' OR e.lab_id IN (
        SELECT lab_id FROM lab_members WHERE user_id = $${paramCount}
      ))`;
      params.push(req.user.id);
    }

    query += ' ORDER BY e.created_at DESC';

    console.log('🔍 Lab notebook query:', query);
    console.log('🔍 Lab notebook params:', params);

    const result = await pool.query(query, params);

    res.json({ entries: result.rows });
  } catch (error) {
    console.error('💥 Get lab notebooks error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/lab-notebooks/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Get entry details
    const entryResult = await pool.query(`
      SELECT e.*, u.first_name, u.last_name, u.username as creator_name,
             l.name as lab_name, l.institution
      FROM lab_notebook_entries e
      JOIN users u ON e.author_id = u.id
      LEFT JOIN labs l ON e.lab_id = l.id
      WHERE e.id = $1
    `, [id]);

    if (entryResult.rows.length === 0) {
      return res.status(404).json({ error: 'Lab notebook entry not found' });
    }

    const entry = entryResult.rows[0];

    // Check access permissions
    if (entry.privacy_level !== 'public') {
      const labAccess = await pool.query(`
        SELECT role FROM lab_members WHERE lab_id = $1 AND user_id = $2
      `, [entry.lab_id, req.user.id]);

      if (labAccess.rows.length === 0 && req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Access denied to this entry' });
      }
    }

    res.json({
      entry,
      related_data: []
    });

  } catch (error) {
    console.error('💥 Get lab notebook error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.put('/api/lab-notebooks/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      title, content, entry_type, results, conclusions, 
      tags, privacy_level 
    } = req.body;

    // Get current entry
    const currentEntry = await pool.query(`
      SELECT * FROM lab_notebook_entries WHERE id = $1
    `, [id]);

    if (currentEntry.rows.length === 0) {
      return res.status(404).json({ error: 'Lab notebook entry not found' });
    }

    const entry = currentEntry.rows[0];

    // Check permissions (creator, lab PI, or admin)
    if (entry.author_id !== req.user.id && req.user.role !== 'admin') {
      const labAccess = await pool.query(`
        SELECT role FROM lab_members 
        WHERE lab_id = $1 AND user_id = $2 AND role = 'principal_researcher'
      `, [entry.lab_id, req.user.id]);

      if (labAccess.rows.length === 0) {
        return res.status(403).json({ error: 'Insufficient permissions to edit this entry' });
      }
    }

    // Update entry
    const result = await pool.query(`
      UPDATE lab_notebook_entries 
      SET title = $1, content = $2, entry_type = $3, results = $4,
          conclusions = $5, tags = $6, privacy_level = $7, updated_at = CURRENT_TIMESTAMP
      WHERE id = $8
      RETURNING *
    `, [
      title, content, entry_type, results, conclusions,
      tags || [], privacy_level, id
    ]);

    console.log('📓 Lab notebook entry updated:', { entryId: id, title, updatedBy: req.user.username });

    res.json({
      message: 'Lab notebook entry updated successfully',
      entry: result.rows[0]
    });

  } catch (error) {
    console.error('💥 Update lab notebook error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


// Share lab notebook entry with individual users
app.post('/api/lab-notebooks/:id/share', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { user_id, access_level } = req.body;

    // Check if entry exists
    const entryResult = await pool.query(`
      SELECT * FROM lab_notebook_entries WHERE id = $1
    `, [id]);

    if (entryResult.rows.length === 0) {
      return res.status(404).json({ error: 'Lab notebook entry not found' });
    }

    const entry = entryResult.rows[0];

    // Check permissions (creator, lab PI, or admin)
    if (entry.author_id !== req.user.id && req.user.role !== 'admin') {
      const labAccess = await pool.query(`
        SELECT role FROM lab_members 
        WHERE lab_id = $1 AND user_id = $2 AND role = 'principal_researcher'
      `, [entry.lab_id, req.user.id]);

      if (labAccess.rows.length === 0) {
        return res.status(403).json({ error: 'Insufficient permissions to share this entry' });
      }
    }

    // Get current collaborators or initialize empty array
    const currentCollaborators = entry.collaborators || [];
    
    // Add new user to collaborators if not already present
    if (!currentCollaborators.includes(user_id)) {
      currentCollaborators.push(user_id);
    }

    // Update entry with new collaborators
    await pool.query(`
      UPDATE lab_notebook_entries 
      SET collaborators = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
    `, [currentCollaborators]);

    // Get user details for logging
    const userResult = await pool.query(`
      SELECT username, first_name, last_name FROM users WHERE id = $1
    `, [user_id]);

    const userName = userResult.rows[0]?.username || 'Unknown User';

    console.log('🔗 Lab notebook entry shared:', { 
      entryId: id, 
      userId: user_id, 
      userName: userName,
      accessLevel: access_level, 
      sharedBy: req.user.username 
    });

    res.json({ 
      message: 'Entry shared successfully',
      shared_with: userName,
      access_level 
    });

  } catch (error) {
    console.error('💥 Share lab notebook error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get lab members for the current user's lab
app.get('/api/lab-members', authenticateToken, async (req, res) => {
  try {
    // Get the user's lab membership
    const userLab = await pool.query(`
      SELECT lm.lab_id, l.name as lab_name, l.institution
      FROM lab_members lm
      JOIN labs l ON lm.lab_id = l.id
      WHERE lm.user_id = $1 AND lm.is_active = true
      LIMIT 1
    `, [req.user.id]);

    if (userLab.rows.length === 0) {
      return res.json({ members: [] });
    }

    const labId = userLab.rows[0].lab_id;

    // Get all lab members with user details
    const membersResult = await pool.query(`
      SELECT 
        lm.id,
        lm.user_id,
        lm.role,
        lm.joined_at,
        lm.permissions,
        u.username,
        u.first_name,
        u.last_name,
        u.email,
        u.avatar_url
      FROM lab_members lm
      JOIN users u ON lm.user_id = u.id
      WHERE lm.lab_id = $1 AND lm.is_active = true
      ORDER BY 
        CASE lm.role
          WHEN 'principal_researcher' THEN 1
          WHEN 'co_supervisor' THEN 2
          WHEN 'researcher' THEN 3
          WHEN 'student' THEN 4
          ELSE 5
        END,
        u.first_name, u.last_name
    `, [labId]);

    res.json({ 
      members: membersResult.rows,
      lab: {
        id: labId,
        name: userLab.rows[0].lab_name,
        institution: userLab.rows[0].institution
      }
    });

  } catch (error) {
    console.error('💥 Get lab members error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/lab-notebooks/:id/comments', authenticateToken, async (req, res) => {
  try {
    const { id: entryId } = req.params;
    const { comment_text, parent_comment_id } = req.body;

    // Check if entry exists and user has access
    const entryAccess = await pool.query(`
      SELECT e.id, e.privacy_level, e.lab_id
      FROM lab_notebook_entries e
      WHERE e.id = $1 AND e.id IS NOT NULL
    `, [entryId]);

    if (entryAccess.rows.length === 0) {
      return res.status(404).json({ error: 'Lab notebook entry not found' });
    }

    const entry = entryAccess.rows[0];

    // Check access permissions
    if (entry.privacy_level !== 'public') {
      const labAccess = await pool.query(`
        SELECT role FROM lab_members WHERE lab_id = $1 AND user_id = $2
      `, [entry.lab_id, req.user.id]);

      if (labAccess.rows.length === 0 && req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Access denied to this entry' });
      }
    }

    // Create comment
    const result = await pool.query(`
      INSERT INTO lab_notebook_comments (
        entry_id, user_id, comment_text, parent_comment_id
      )
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `, [entryId, req.user.id, comment_text, parent_comment_id || null]);

    console.log('💬 Comment added to lab notebook:', { entryId, commentId: result.rows[0].id, user: req.user.username });

    res.status(201).json({
      message: 'Comment added successfully',
      comment: result.rows[0]
    });

  } catch (error) {
    console.error('💥 Add comment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/lab-notebooks/:id/comments', authenticateToken, async (req, res) => {
  try {
    const { id: entryId } = req.params;

    // Get comments for the entry
    const result = await pool.query(`
      SELECT c.*, u.first_name, u.last_name, u.username
      FROM lab_notebook_comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.entry_id = $1 AND c.id IS NOT NULL
      ORDER BY c.created_at ASC
    `, [entryId]);

    res.json({ comments: result.rows });
  } catch (error) {
    console.error('💥 Get comments error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/lab-notebooks/entry-types', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT DISTINCT entry_type FROM lab_notebook_entries 
      WHERE entry_type IS NOT NULL AND entry_type != ''
      ORDER BY entry_type
    `);

    res.json({ entry_types: result.rows.map(row => row.entry_type) });
  } catch (error) {
    console.error('💥 Get entry types error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/lab-notebooks/statistics', authenticateToken, async (req, res) => {
  try {
    const { lab_id, user_id, time_period } = req.query;
    
    let whereClause = 'WHERE e.id IS NOT NULL';
    const params: any[] = [];
    let paramCount = 0;

    if (lab_id) {
      paramCount++;
      whereClause += ` AND e.lab_id = $${paramCount}`;
      params.push(lab_id);
    }

    if (user_id) {
      paramCount++;
      whereClause += ` AND e.author_id = $${paramCount}`;
      params.push(user_id);
    }

    if (time_period === 'week') {
      whereClause += ` AND e.created_at >= NOW() - INTERVAL '7 days'`;
    } else if (time_period === 'month') {
      whereClause += ` AND e.created_at >= NOW() - INTERVAL '30 days'`;
    } else if (time_period === 'year') {
      whereClause += ` AND e.created_at >= NOW() - INTERVAL '365 days'`;
    }

    // Get total entries
    const totalResult = await pool.query(`
      SELECT COUNT(*) as total FROM lab_notebook_entries e ${whereClause}
    `, params);

    // Get entries by entry type
    const typeResult = await pool.query(`
      SELECT entry_type, COUNT(*) as count 
      FROM lab_notebook_entries e ${whereClause}
      GROUP BY entry_type
      ORDER BY count DESC
      LIMIT 5
    `, params);

    res.json({
      total_entries: parseInt(totalResult.rows[0].total),
      by_entry_type: typeResult.rows
    });

  } catch (error) {
    console.error('💥 Get statistics error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Inventory Management Routes
app.post('/api/inventory', authenticateToken, async (req, res) => {
  try {
    const { 
      name, 
      description, 
      category, 
      quantity, 
      unit, 
      min_quantity, 
      location, 
      lab_id,
      supplier,
      supplier_contact,
      expiry_date,
      cost_per_unit,
      storage_conditions,
      notes
    } = req.body;

    // Validation
    if (!name || !category || !lab_id) {
      return res.status(400).json({ error: 'Name, category, and lab_id are required' });
    }

    // Check if user has access to the lab
    const labAccess = await pool.query(`
      SELECT role FROM lab_members WHERE lab_id = $1 AND user_id = $2
    `, [lab_id, req.user.id]);

    if (labAccess.rows.length === 0 && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied to this lab' });
    }

    // Create inventory item
    const result = await pool.query(`
      INSERT INTO inventory_items (
        name, description, category, quantity, unit, min_quantity,
        location, lab_id, supplier, supplier_contact, expiry_date, cost_per_unit,
        storage_conditions, notes
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING *
    `, [
      name, description, category, quantity || 0, unit, min_quantity || 0,
      location, lab_id, supplier, supplier_contact, expiry_date, cost_per_unit,
      storage_conditions, notes
    ]);

    const item = result.rows[0];

    console.log('📦 Inventory item created:', { itemId: item.id, name: item.name, creator: req.user.username });

    res.status(201).json({
      message: 'Inventory item created successfully',
      item
    });

  } catch (error) {
    console.error('💥 Inventory creation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/inventory', authenticateToken, async (req, res) => {
  try {
    const { lab_id, category, search, low_stock, expired } = req.query;
    
    let query = `
      SELECT i.*, l.name as lab_name
      FROM inventory_items i
      JOIN labs l ON i.lab_id = l.id
      WHERE 1=1
    `;

    const params: any[] = [];
    let paramCount = 0;

    // Filter by lab
    if (lab_id) {
      paramCount++;
      query += ` AND i.lab_id = $${paramCount}`;
      params.push(lab_id);
    }

    // Filter by category
    if (category) {
      paramCount++;
      query += ` AND i.category = $${paramCount}`;
      params.push(category);
    }

    // Search in name and description
    if (search) {
      paramCount++;
      query += ` AND (i.name ILIKE $${paramCount} OR i.description ILIKE $${paramCount})`;
      params.push(`%${search}%`);
    }

    // Filter low stock items
    if (low_stock === 'true') {
      query += ` AND i.quantity <= i.min_quantity`;
    }

    // Filter expired items
    if (expired === 'true') {
      query += ` AND i.expiry_date < CURRENT_DATE`;
    }

    // If not admin, only show items from labs where user is a member
    if (req.user.role !== 'admin') {
      paramCount++;
      query += ` AND i.lab_id IN (
        SELECT lab_id FROM lab_members WHERE user_id = $${paramCount}
      )`;
      params.push(req.user.id);
    }

    query += ' ORDER BY i.name ASC';

    const result = await pool.query(query, params);

    res.json({ items: result.rows });
  } catch (error) {
    console.error('💥 Get inventory error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.put('/api/inventory/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      name, description, category, quantity, unit, min_quantity,
      location, supplier, supplier_contact, expiry_date, cost_per_unit, storage_conditions, notes
    } = req.body;

    // Get current item
    const currentItem = await pool.query(`
      SELECT * FROM inventory_items WHERE id = $1
    `, [id]);

    if (currentItem.rows.length === 0) {
      return res.status(404).json({ error: 'Inventory item not found' });
    }

    const item = currentItem.rows[0];

    // Check permissions (lab PI or admin)
    if (req.user.role !== 'admin') {
      const labAccess = await pool.query(`
        SELECT role FROM lab_members 
        WHERE lab_id = $1 AND user_id = $2 AND role = 'principal_researcher'
      `, [item.lab_id, req.user.id]);

      if (labAccess.rows.length === 0) {
        return res.status(403).json({ error: 'Insufficient permissions to edit this item' });
      }
    }

    // Update item
    const result = await pool.query(`
      UPDATE inventory_items 
      SET name = $1, description = $2, category = $3, quantity = $4,
          unit = $5, min_quantity = $6, location = $7, supplier = $8,
          supplier_contact = $9, expiry_date = $10, cost_per_unit = $11, 
          storage_conditions = $12, notes = $13, updated_at = CURRENT_TIMESTAMP
      WHERE id = $14
      RETURNING *
    `, [
      name, description, category, quantity, unit, min_quantity || 0,
      location, supplier, supplier_contact, expiry_date, cost_per_unit, storage_conditions, notes, id
    ]);

    console.log('📦 Inventory item updated:', { itemId: id, name, updatedBy: req.user.username });

    res.json({
      message: 'Inventory item updated successfully',
      item: result.rows[0]
    });

  } catch (error) {
    console.error('💥 Update inventory error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete('/api/inventory/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Get item
    const item = await pool.query(`
      SELECT * FROM inventory_items WHERE id = $1
    `, [id]);

    if (item.rows.length === 0) {
      return res.status(404).json({ error: 'Inventory item not found' });
    }

    // Check permissions (lab PI or admin)
    if (req.user.role !== 'admin') {
      const labAccess = await pool.query(`
        SELECT role FROM lab_members 
        WHERE lab_id = $1 AND user_id = $2 AND role = 'principal_researcher'
      `, [item.rows[0].lab_id, req.user.id]);

      if (labAccess.rows.length === 0) {
        return res.status(403).json({ error: 'Insufficient permissions to delete this item' });
      }
    }

    // Hard delete (since there's no is_active column)
    await pool.query(`
      DELETE FROM inventory_items WHERE id = $1
    `, [id]);

    console.log('📦 Inventory item deleted:', { itemId: id, deletedBy: req.user.username });

    res.json({ message: 'Inventory item deleted successfully' });

  } catch (error) {
    console.error('💥 Delete inventory error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/inventory/:id/transactions', authenticateToken, async (req, res) => {
  try {
    const { id: itemId } = req.params;
    const { transaction_type, quantity, notes, recipient_user_id } = req.body;

    // Validation
    if (!transaction_type || !quantity) {
      return res.status(400).json({ error: 'Transaction type and quantity are required' });
    }

    // Get item
    const item = await pool.query(`
      SELECT * FROM inventory_items WHERE id = $1
    `, [itemId]);

    if (item.rows.length === 0) {
      return res.status(404).json({ error: 'Inventory item not found' });
    }

    const currentItem = item.rows[0];

    // Check access permissions
    const labAccess = await pool.query(`
      SELECT role FROM lab_members WHERE lab_id = $1 AND user_id = $2
    `, [currentItem.lab_id, req.user.id]);

    if (labAccess.rows.length === 0 && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied to this item' });
    }

    // Calculate new quantity
    let newQuantity = currentItem.quantity;
    if (transaction_type === 'add') {
      newQuantity += quantity;
    } else if (transaction_type === 'remove') {
      if (newQuantity < quantity) {
        return res.status(400).json({ error: 'Insufficient quantity available' });
      }
      newQuantity -= quantity;
    }

    // Update item quantity
    await pool.query(`
      UPDATE inventory_items SET quantity = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2
    `, [newQuantity, itemId]);

    // Note: We don't have inventory_transactions table, so we'll just log this
    console.log('📦 Inventory transaction recorded:', { 
      itemId, transactionType: transaction_type, quantity, user: req.user.username, newQuantity 
    });

    res.status(201).json({
      message: 'Transaction recorded successfully',
      new_quantity: newQuantity
    });

  } catch (error) {
    console.error('💥 Inventory transaction error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/inventory/categories', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT DISTINCT category FROM inventory_items 
      WHERE category IS NOT NULL AND category != ''
      ORDER BY category
    `);

    res.json({ categories: result.rows.map(row => row.category) });
  } catch (error) {
    console.error('💥 Get inventory categories error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Instrument Management Routes
app.post('/api/instruments', authenticateToken, async (req, res) => {
  try {
    const { 
      name, 
      description, 
      category, 
      model, 
      serial_number, 
      lab_id,
      location,
      status = 'available',
      manufacturer,
      purchase_date,
      warranty_expiry,
      calibration_due_date,
      maintenance_notes,
      user_manual_url
    } = req.body;

    // Validation
    if (!name || !category || !lab_id) {
      return res.status(400).json({ error: 'Name, category, and lab_id are required' });
    }

    // Check if user has access to the lab
    const labAccess = await pool.query(`
      SELECT role FROM lab_members WHERE lab_id = $1 AND user_id = $2
    `, [lab_id, req.user.id]);

    if (labAccess.rows.length === 0 && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied to this lab' });
    }

    // Create instrument
    const result = await pool.query(`
      INSERT INTO instruments (
        name, description, category, model, serial_number, lab_id,
        location, status, manufacturer, purchase_date, warranty_expiry,
        calibration_due_date, maintenance_notes, user_manual_url
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING *
    `, [
      name, description, category, model, serial_number, lab_id,
      location, status, manufacturer, purchase_date, warranty_expiry,
      calibration_due_date, maintenance_notes, user_manual_url
    ]);

    const instrument = result.rows[0];

    console.log('🔬 Instrument created:', { instrumentId: instrument.id, name: instrument.name, creator: req.user.username });

    res.status(201).json({
      message: 'Instrument created successfully',
      instrument
    });

  } catch (error) {
    console.error('💥 Instrument creation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/instruments', authenticateToken, async (req, res) => {
  try {
    const { lab_id, category, status, search } = req.query;
    
    let query = `
      SELECT i.*, l.name as lab_name
      FROM instruments i
      JOIN labs l ON i.lab_id = l.id
      WHERE 1=1
    `;

    const params: any[] = [];
    let paramCount = 0;

    // Filter by lab
    if (lab_id) {
      paramCount++;
      query += ` AND i.lab_id = $${paramCount}`;
      params.push(lab_id);
    }

    // Filter by category
    if (category) {
      paramCount++;
      query += ` AND i.category = $${paramCount}`;
      params.push(category);
    }

    // Filter by status
    if (status) {
      paramCount++;
      query += ` AND i.status = $${paramCount}`;
      params.push(status);
    }

    // Search in name and description
    if (search) {
      paramCount++;
      query += ` AND (i.name ILIKE $${paramCount} OR i.description ILIKE $${paramCount})`;
      params.push(`%${search}%`);
    }

    // If not admin, only show instruments from labs where user is a member
    if (req.user.role !== 'admin') {
      paramCount++;
      query += ` AND i.lab_id IN (
        SELECT lab_id FROM lab_members WHERE user_id = $${paramCount}
      )`;
      params.push(req.user.id);
    }

    query += ' ORDER BY i.name ASC';

    const result = await pool.query(query, params);

    res.json({ instruments: result.rows });
  } catch (error) {
    console.error('💥 Get instruments error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/instruments/:id/bookings', authenticateToken, async (req, res) => {
  try {
    const { id: instrumentId } = req.params;
    const { start_time, end_time, purpose, notes } = req.body;

    // Validation
    if (!start_time || !end_time || !purpose) {
      return res.status(400).json({ error: 'Start time, end time, and purpose are required' });
    }

    // Check if instrument exists and is available
    const instrument = await pool.query(`
      SELECT * FROM instruments WHERE id = $1
    `, [instrumentId]);

    if (instrument.rows.length === 0) {
      return res.status(404).json({ error: 'Instrument not found' });
    }

    if (instrument.rows[0].status !== 'available') {
      return res.status(400).json({ error: 'Instrument is not available for booking' });
    }

    // Check for conflicting bookings
    const conflictingBookings = await pool.query(`
      SELECT * FROM instrument_bookings 
      WHERE instrument_id = $1
      AND (
        (start_time <= $2 AND end_time >= $2) OR
        (start_time <= $3 AND end_time >= $3) OR
        (start_time >= $2 AND end_time <= $3)
      )
    `, [instrumentId, start_time, end_time]);

    if (conflictingBookings.rows.length > 0) {
      return res.status(400).json({ error: 'Time slot conflicts with existing booking' });
    }

    // Create booking
    const result = await pool.query(`
      INSERT INTO instrument_bookings (
        instrument_id, user_id, start_time, end_time, purpose, notes
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `, [instrumentId, req.user.id, start_time, end_time, purpose, notes]);

    // Update instrument status to booked
    await pool.query(`
      UPDATE instruments SET status = 'booked', updated_at = CURRENT_TIMESTAMP WHERE id = $1
    `, [instrumentId]);

    console.log('🔬 Instrument booking created:', { 
      instrumentId, bookingId: result.rows[0].id, user: req.user.username 
    });

    res.status(201).json({
      message: 'Booking created successfully',
      booking: result.rows[0]
    });

  } catch (error) {
    console.error('💥 Instrument booking error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/instruments/:id/bookings', authenticateToken, async (req, res) => {
  try {
    const { id: instrumentId } = req.params;
    const { start_date, end_date } = req.query;

    let query = `
      SELECT b.*, u.first_name, u.last_name, u.username
      FROM instrument_bookings b
      JOIN users u ON b.user_id = u.id
      WHERE b.instrument_id = $1
    `;

    const params: any[] = [instrumentId];
    let paramCount = 1;

    if (start_date) {
      paramCount++;
      query += ` AND b.start_time >= $${paramCount}`;
      params.push(start_date);
    }

    if (end_date) {
      paramCount++;
      query += ` AND b.end_time <= $${paramCount}`;
      params.push(end_date);
    }

    query += ' ORDER BY b.start_time ASC';

    const result = await pool.query(query, params);

    res.json({ bookings: result.rows });
  } catch (error) {
    console.error('💥 Get instrument bookings error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/instruments/categories', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT DISTINCT category FROM instruments 
      WHERE category IS NOT NULL AND category != ''
      ORDER BY category
    `);

    res.json({ categories: result.rows.map(row => row.category) });
  } catch (error) {
    console.error('💥 Get instrument categories error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ===== RESOURCE EXCHANGE (SUPPLIES) =====
app.post('/api/exchange/requests', authenticateToken, async (req, res) => {
  try {
    const {
      item_name,
      category,
      quantity,
      unit,
      urgency = 'normal',
      needed_by,
      location_preference = 'institution',
      notes,
      lab_id,
      requester_lab_id
    } = req.body;

    // Accept both lab_id and requester_lab_id for compatibility
    const finalLabId = lab_id || requester_lab_id;

    if (!item_name || !finalLabId) {
      return res.status(400).json({ error: 'item_name and lab_id are required' });
    }

    const result = await pool.query(`
      INSERT INTO resource_exchange_requests (
        requester_lab_id, requester_user_id, item_name, category, quantity, unit,
        urgency, needed_by, location_preference, notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `, [finalLabId, req.user.id, item_name, category, quantity, unit, urgency, needed_by, location_preference, notes]);

    res.status(201).json({ request: result.rows[0] });
  } catch (error) {
    console.error('Create exchange request error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/exchange/requests', authenticateToken, async (req, res) => {
  try {
    const { status, search, institution, scope } = req.query as any;

    let query = `
      SELECT r.*, l.name as requester_lab_name, l.institution
      FROM resource_exchange_requests r
      JOIN labs l ON r.requester_lab_id = l.id
      WHERE 1=1
    `;
    const params: any[] = [];
    let p = 0;

    if (status) { p++; query += ` AND r.status = $${p}`; params.push(status); }
    if (search) { p++; query += ` AND (r.item_name ILIKE $${p} OR r.category ILIKE $${p})`; params.push(`%${search}%`); }
    if (institution) { p++; query += ` AND l.institution ILIKE $${p}`; params.push(`%${institution}%`); }
    if (scope) { p++; query += ` AND r.location_preference = $${p}`; params.push(scope); }

    query += ' ORDER BY r.created_at DESC';

    const result = await pool.query(query, params);
    res.json({ requests: result.rows });
  } catch (error) {
    console.error('Get exchange requests error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.put('/api/exchange/requests/:id/status', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const allowed = ['open','matched','fulfilled','cancelled'];
    if (!allowed.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    const result = await pool.query(`
      UPDATE resource_exchange_requests
      SET status = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING *
    `, [status, id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Request not found' });
    res.json({ request: result.rows[0] });
  } catch (error) {
    console.error('Update exchange request status error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/exchange/requests/:id/offers', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity, unit, message } = req.body;

    const reqCheck = await pool.query('SELECT id FROM resource_exchange_requests WHERE id = $1', [id]);
    if (reqCheck.rows.length === 0) return res.status(404).json({ error: 'Request not found' });

    // Determine provider lab from current user's active membership
    const labRes = await pool.query(`
      SELECT lab_id FROM lab_members WHERE user_id = $1 AND is_active = true LIMIT 1
    `, [req.user.id]);
    if (labRes.rows.length === 0) return res.status(400).json({ error: 'No active lab membership for provider' });
    const providerLabId = labRes.rows[0].lab_id;

    const result = await pool.query(`
      INSERT INTO resource_exchange_offers (
        request_id, provider_lab_id, provider_user_id, quantity, unit, message
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `, [id, providerLabId, req.user.id, quantity, unit, message]);

    res.status(201).json({ offer: result.rows[0] });
  } catch (error) {
    console.error('Create exchange offer error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/exchange/offers', authenticateToken, async (req, res) => {
  try {
    const { request_id } = req.query as any;
    let query = `
      SELECT o.*, l.name as provider_lab_name
      FROM resource_exchange_offers o
      JOIN labs l ON o.provider_lab_id = l.id
      WHERE 1=1
    `;
    const params: any[] = [];
    let p = 0;
    if (request_id) { p++; query += ` AND o.request_id = $${p}`; params.push(request_id); }
    query += ' ORDER BY o.created_at DESC';
    const result = await pool.query(query, params);
    res.json({ offers: result.rows });
  } catch (error) {
    console.error('Get exchange offers error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.put('/api/exchange/offers/:id/status', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const allowed = ['pending','accepted','declined','fulfilled','withdrawn'];
    if (!allowed.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    const result = await pool.query(`
      UPDATE resource_exchange_offers
      SET status = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING *
    `, [status, id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Offer not found' });
    res.json({ offer: result.rows[0] });
  } catch (error) {
    console.error('Update exchange offer status error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ===== SHARED INSTRUMENTS DIRECTORY =====
app.post('/api/instruments/:id/share', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { sharing_scope = 'institution', access_policy, external_contact_email, is_shared = true } = req.body;

    const existing = await pool.query('SELECT id FROM shared_instruments WHERE instrument_id = $1', [id]);
    if (existing.rows.length > 0) {
      const result = await pool.query(`
        UPDATE shared_instruments
        SET sharing_scope = $1, access_policy = $2, external_contact_email = $3, is_shared = $4, updated_at = CURRENT_TIMESTAMP
        WHERE instrument_id = $5
        RETURNING *
      `, [sharing_scope, access_policy, external_contact_email, is_shared, id]);
      return res.json({ shared: result.rows[0] });
    } else {
      const result = await pool.query(`
        INSERT INTO shared_instruments (instrument_id, sharing_scope, access_policy, external_contact_email, is_shared)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `, [id, sharing_scope, access_policy, external_contact_email, is_shared]);
      return res.status(201).json({ shared: result.rows[0] });
    }
  } catch (error) {
    console.error('Share instrument error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/instruments/shared', authenticateToken, async (req, res) => {
  try {
    const { scope, institution, availability = 'available', search } = req.query as any;
    let query = `
      SELECT i.*, l.name as lab_name, l.institution, s.sharing_scope, s.access_policy, s.external_contact_email
      FROM shared_instruments s
      JOIN instruments i ON s.instrument_id = i.id
      JOIN labs l ON i.lab_id = l.id
      WHERE s.is_shared = true
    `;
    const params: any[] = [];
    let p = 0;
    if (scope) { p++; query += ` AND s.sharing_scope = $${p}`; params.push(scope); }
    if (institution) { p++; query += ` AND l.institution ILIKE $${p}`; params.push(`%${institution}%`); }
    if (availability) { p++; query += ` AND i.status = $${p}`; params.push(availability); }
    if (search) { p++; query += ` AND (i.name ILIKE $${p} OR i.category ILIKE $${p})`; params.push(`%${search}%`); }
    query += ' ORDER BY i.name ASC';
    const result = await pool.query(query, params);
    res.json({ instruments: result.rows });
  } catch (error) {
    console.error('Get shared instruments error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ===== INSTRUMENT BOOKINGS =====
app.post('/api/instruments/:id/book', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      booking_date,
      start_time,
      end_time,
      duration_minutes,
      purpose,
      research_project,
      urgency = 'normal',
      notes
    } = req.body;

    if (!booking_date || !start_time || !end_time || !duration_minutes || !purpose) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Check if instrument is available for the requested time
    const conflictCheck = await pool.query(`
      SELECT id FROM instrument_bookings 
      WHERE instrument_id = $1 
      AND booking_date = $2 
      AND status IN ('pending', 'approved')
      AND (
        (start_time <= $3 AND end_time > $3) OR
        (start_time < $4 AND end_time >= $4) OR
        (start_time >= $3 AND end_time <= $4)
      )
    `, [id, booking_date, start_time, end_time]);

    if (conflictCheck.rows.length > 0) {
      return res.status(409).json({ error: 'Time slot conflicts with existing booking' });
    }

    // Check if instrument is unavailable (maintenance, etc.)
    const unavailableCheck = await pool.query(`
      SELECT id FROM instrument_unavailable_periods 
      WHERE instrument_id = $1 
      AND start_datetime::date <= $2 
      AND end_datetime::date >= $2
    `, [id, booking_date]);

    if (unavailableCheck.rows.length > 0) {
      return res.status(409).json({ error: 'Instrument unavailable on requested date' });
    }

    const result = await pool.query(`
      INSERT INTO instrument_bookings (
        instrument_id, user_id, lab_id, booking_date, start_time, end_time,
        duration_minutes, purpose, research_project, urgency, notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
    `, [id, req.user.id, req.user.lab_id || 'c8ace470-5e21-4d3b-ab95-da6084311657', booking_date, start_time, end_time, duration_minutes, purpose, research_project, urgency, notes]);

    res.status(201).json({ booking: result.rows[0] });
  } catch (error) {
    console.error('Create instrument booking error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/instruments/:id/bookings', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { date, status } = req.query as any;

    let query = `
      SELECT b.*, u.username, u.first_name, u.last_name, l.name as lab_name
      FROM instrument_bookings b
      JOIN users u ON b.user_id = u.id
      JOIN labs l ON b.lab_id = l.id
      WHERE b.instrument_id = $1
    `;
    const params: any[] = [id];
    let p = 1;

    if (date) { p++; query += ` AND b.booking_date = $${p}`; params.push(date); }
    if (status) { p++; query += ` AND b.status = $${p}`; params.push(status); }

    query += ' ORDER BY b.booking_date DESC, b.start_time ASC';

    const result = await pool.query(query, params);
    res.json({ bookings: result.rows });
  } catch (error) {
    console.error('Get instrument bookings error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/instruments/:id/availability', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { date } = req.query as any;

    if (!date) {
      return res.status(400).json({ error: 'Date parameter required' });
    }

    // Get available time slots for the instrument on the specified date
    const dayOfWeek = new Date(date).getDay();
    
    const slotsResult = await pool.query(`
      SELECT * FROM instrument_booking_slots 
      WHERE instrument_id = $1 AND day_of_week = $2 AND is_active = true
    `, [id, dayOfWeek]);

    if (slotsResult.rows.length === 0) {
      return res.json({ available_slots: [], unavailable_periods: [] });
    }

    const slot = slotsResult.rows[0];
    const startTime = slot.start_time;
    const endTime = slot.end_time;
    const slotDuration = slot.slot_duration_minutes;

    // Generate time slots
    const availableSlots = [];
    let currentTime = new Date(`2000-01-01 ${startTime}`);
    const endDateTime = new Date(`2000-01-01 ${endTime}`);

    while (currentTime < endDateTime) {
      const slotStart = currentTime.toTimeString().slice(0, 5);
      const slotEnd = new Date(currentTime.getTime() + slotDuration * 60000).toTimeString().slice(0, 5);
      
      if (new Date(`2000-01-01 ${slotEnd}`) <= endDateTime) {
        availableSlots.push({
          start_time: slotStart,
          end_time: slotEnd,
          duration_minutes: slotDuration
        });
      }
      
      currentTime = new Date(currentTime.getTime() + slotDuration * 60000);
    }

    // Get existing bookings for the date
    const bookingsResult = await pool.query(`
      SELECT start_time, end_time FROM instrument_bookings 
      WHERE instrument_id = $1 AND booking_date = $2 AND status IN ('pending', 'approved')
      ORDER BY start_time
    `, [id, date]);

    // Get unavailable periods
    const unavailableResult = await pool.query(`
      SELECT start_datetime, end_datetime, reason FROM instrument_unavailable_periods 
      WHERE instrument_id = $1 AND start_datetime::date <= $2 AND end_datetime::date >= $2
    `, [id, date]);

    res.json({
      available_slots: availableSlots,
      existing_bookings: bookingsResult.rows,
      unavailable_periods: unavailableResult.rows
    });
  } catch (error) {
    console.error('Get instrument availability error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.put('/api/bookings/:id/status', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, rejection_reason } = req.body;

    if (!['approved', 'rejected', 'cancelled', 'completed'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const updateData: any = { status };
    if (status === 'approved') {
      updateData.approved_by = req.user.id;
      updateData.approved_at = new Date();
    } else if (status === 'rejected' && rejection_reason) {
      updateData.rejection_reason = rejection_reason;
    }

    const result = await pool.query(`
      UPDATE instrument_bookings 
      SET ${Object.keys(updateData).map((key, index) => `${key} = $${index + 2}`).join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `, [id, ...Object.values(updateData)]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    res.json({ booking: result.rows[0] });
  } catch (error) {
    console.error('Update booking status error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/bookings/my', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT b.*, i.name as instrument_name, i.category, l.name as lab_name
      FROM instrument_bookings b
      JOIN instruments i ON b.instrument_id = i.id
      JOIN labs l ON b.lab_id = l.id
      WHERE b.user_id = $1
      ORDER BY b.booking_date DESC, b.start_time ASC
    `, [req.user.id]);

    res.json({ bookings: result.rows });
  } catch (error) {
    console.error('Get my bookings error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
// ===== LAB NOTEBOOK ROUTES =====

// Get all lab notebook entries with filters
app.get('/api/lab-notebooks', authenticateToken, async (req, res) => {
  try {
    const {
      lab_id,
      entry_type,
      status,
      priority,
      search,
      privacy_level,
      limit = 50,
      offset = 0
    } = req.query;

    let query = `
      SELECT 
        e.*,
        CONCAT(u.first_name, ' ', u.last_name) as creator_name,
        l.name as lab_name,
        l.institution
      FROM lab_notebook_entries e
      INNER JOIN users u ON e.author_id = u.id
      INNER JOIN labs l ON e.lab_id = l.id
      WHERE 1=1
    `;

    const params: any[] = [];
    let paramCount = 0;

    if (lab_id) {
      paramCount++;
      query += ` AND e.lab_id = $${paramCount}`;
      params.push(lab_id);
    }

    if (entry_type) {
      paramCount++;
      query += ` AND e.entry_type = $${paramCount}`;
      params.push(entry_type);
    }

    if (status) {
      paramCount++;
      query += ` AND e.status = $${paramCount}`;
      params.push(status);
    }

    if (priority) {
      paramCount++;
      query += ` AND e.priority = $${paramCount}`;
      params.push(priority);
    }

    if (privacy_level) {
      paramCount++;
      query += ` AND e.privacy_level = $${paramCount}`;
      params.push(privacy_level);
    }

    if (search) {
      paramCount++;
      query += ` AND (
        e.title ILIKE $${paramCount} OR 
        e.content ILIKE $${paramCount} OR 
        e.objectives ILIKE $${paramCount} OR 
        e.methodology ILIKE $${paramCount} OR 
        e.results ILIKE $${paramCount} OR 
        e.conclusions ILIKE $${paramCount}
      )`;
      params.push(`%${search}%`);
    }

    // Add pagination
    paramCount++;
    query += ` ORDER BY e.created_at DESC LIMIT $${paramCount}`;
    params.push(limit);

    paramCount++;
    query += ` OFFSET $${paramCount}`;
    params.push(offset);

    const result = await pool.query(query, params);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching lab notebook entries:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get a specific lab notebook entry
app.get('/api/lab-notebooks/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const query = `
      SELECT 
        e.*,
        CONCAT(u.first_name, ' ', u.last_name) as creator_name,
        l.name as lab_name,
        l.institution
      FROM lab_notebook_entries e
      INNER JOIN users u ON e.author_id = u.id
      INNER JOIN labs l ON e.lab_id = l.id
      WHERE e.id = $1
    `;

    const result = await pool.query(query, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Entry not found' });
    }

    // Get comments
    const commentsQuery = `
      SELECT 
        c.*,
        CONCAT(u.first_name, ' ', u.last_name) as first_name,
        u.username
      FROM lab_notebook_comments c
      INNER JOIN users u ON c.user_id = u.id
      WHERE c.entry_id = $1
      ORDER BY c.created_at ASC
    `;
    const commentsResult = await pool.query(commentsQuery, [id]);

    // Get milestones
    const milestonesQuery = `
      SELECT * FROM lab_notebook_milestones
      WHERE entry_id = $1
      ORDER BY due_date ASC
    `;
    const milestonesResult = await pool.query(milestonesQuery, [id]);

    // Get attachments
    const attachmentsQuery = `
      SELECT 
        a.*,
        CONCAT(u.first_name, ' ', u.last_name) as uploaded_by_name
      FROM lab_notebook_attachments a
      INNER JOIN users u ON a.uploaded_by = u.id
      WHERE a.entry_id = $1
      ORDER BY a.created_at DESC
    `;
    const attachmentsResult = await pool.query(attachmentsQuery, [id]);

    const entry = result.rows[0];
    entry.comments = commentsResult.rows;
    entry.milestones = milestonesResult.rows;
    entry.attachments = attachmentsResult.rows;

    res.json(entry);
  } catch (error) {
    console.error('Error fetching lab notebook entry:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create a new lab notebook entry
app.post('/api/lab-notebooks', authenticateToken, async (req, res) => {
  try {
    const {
      title,
      content,
      entry_type,
      status,
      priority,
      objectives,
      methodology,
      results,
      conclusions,
      next_steps,
      lab_id,
      project_id,
      tags,
      privacy_level,
      estimated_duration,
      cost,
      equipment_used,
      materials_used,
      safety_notes,
      references,
      collaborators
    } = req.body;

    const userId = (req as any).user.id;

    const query = `
      INSERT INTO lab_notebook_entries (
        title, content, entry_type, status, priority, objectives, methodology,
        results, conclusions, next_steps, lab_id, project_id, tags, privacy_level,
        author_id, estimated_duration, cost, equipment_used, materials_used,
        safety_notes, references, collaborators
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22)
      RETURNING *
    `;

    const values = [
      title,
      content,
      entry_type,
      status,
      priority,
      objectives,
      methodology,
      results,
      conclusions,
      next_steps,
      lab_id,
      project_id,
      tags || [],
      privacy_level,
      userId,
      estimated_duration || 0,
      cost || 0,
      equipment_used || [],
      materials_used || [],
      safety_notes,
      references || [],
      collaborators || []
    ];

    const result = await pool.query(query, values);
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating lab notebook entry:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update a lab notebook entry
app.put('/api/lab-notebooks/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user.id;

    // Check if user can edit this entry
    const checkQuery = `
      SELECT author_id, privacy_level, lab_id FROM lab_notebook_entries WHERE id = $1
    `;
    const checkResult = await pool.query(checkQuery, [id]);
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Entry not found' });
    }

    const entry = checkResult.rows[0];
    
    // Only author or lab admin can edit
    if (entry.author_id !== userId) {
      return res.status(403).json({ error: 'Not authorized to edit this entry' });
    }

    const {
      title,
      content,
      entry_type,
      status,
      priority,
      objectives,
      methodology,
      results,
      conclusions,
      next_steps,
      lab_id,
      project_id,
      tags,
      privacy_level,
      estimated_duration,
      cost,
      equipment_used,
      materials_used,
      safety_notes,
      references,
      collaborators
    } = req.body;

    const query = `
      UPDATE lab_notebook_entries SET
        title = $1, content = $2, entry_type = $3, status = $4, priority = $5,
        objectives = $6, methodology = $7, results = $8, conclusions = $9,
        next_steps = $10, lab_id = $11, project_id = $12, tags = $13,
        privacy_level = $14, estimated_duration = $15, cost = $16,
        equipment_used = $17, materials_used = $18, safety_notes = $19,
        references = $20, collaborators = $21, updated_at = CURRENT_TIMESTAMP
      WHERE id = $22
      RETURNING *
    `;

    const values = [
      title,
      content,
      entry_type,
      status,
      priority,
      objectives,
      methodology,
      results,
      conclusions,
      next_steps,
      lab_id,
      project_id,
      tags || [],
      privacy_level,
      estimated_duration || 0,
      cost || 0,
      equipment_used || [],
      materials_used || [],
      safety_notes,
      references || [],
      collaborators || [],
      id
    ];

    const result = await pool.query(query, values);
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating lab notebook entry:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete a lab notebook entry
app.delete('/api/lab-notebooks/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user.id;

    // Check if user can delete this entry
    const checkQuery = `
      SELECT author_id, privacy_level, lab_id FROM lab_notebook_entries WHERE id = $1
    `;
    const checkResult = await pool.query(checkQuery, [id]);
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Entry not found' });
    }

    const entry = checkResult.rows[0];
    
    // Only author or lab admin can delete
    if (entry.author_id !== userId) {
      return res.status(403).json({ error: 'Not authorized to delete this entry' });
    }

    // Delete the entry (cascade will handle related data)
    await pool.query('DELETE FROM lab_notebook_entries WHERE id = $1', [id]);

    res.json({ message: 'Entry deleted successfully' });
  } catch (error) {
    console.error('Error deleting lab notebook entry:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get labs for the lab notebook
app.get('/api/labs', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT l.*, i.name as institution_name
      FROM labs l
      INNER JOIN institutions i ON l.institution_id = i.id
      ORDER BY l.name ASC
    `);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching labs:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Health check endpoint for Render
app.get('/api/health', async (req, res) => {
  try {
    // Test database connection
    const client = await pool.connect();
    await client.query('SELECT 1');
    client.release();
    
    res.status(200).json({ 
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: 'connected',
      environment: process.env.NODE_ENV || 'development'
    });
  } catch (error) {
    console.error('Health check failed:', error);
    res.status(503).json({ 
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      database: 'disconnected',
      error: 'Database connection failed'
    });
  }
});

// --- DATA & RESULTS ROUTES ---

// Get all results for a lab
app.get('/api/data/results', authenticateToken, async (req, res) => {
  try {
    const { lab_id, data_type, search, tags, date_from, date_to } = req.query;
    const userId = (req as any).user.id;

    let query = `
      SELECT r.*, u.username, u.first_name, u.last_name, l.name as lab_name
      FROM results r
      JOIN users u ON r.author_id = u.id
      JOIN labs l ON r.lab_id = l.id
      WHERE r.lab_id = $1
    `;
    
    const queryParams = [lab_id];
    let paramCount = 1;

    if (data_type) {
      paramCount++;
      query += ` AND r.data_type = $${paramCount}`;
      queryParams.push(data_type);
    }

    if (search) {
      paramCount++;
      query += ` AND (r.title ILIKE $${paramCount} OR r.summary ILIKE $${paramCount})`;
      queryParams.push(`%${search}%`);
    }

    if (tags && Array.isArray(tags)) {
      paramCount++;
      query += ` AND r.tags && $${paramCount}`;
      queryParams.push(tags);
    }

    if (date_from) {
      paramCount++;
      query += ` AND r.created_at >= $${paramCount}`;
      queryParams.push(date_from);
    }

    if (date_to) {
      paramCount++;
      query += ` AND r.created_at <= $${paramCount}`;
      queryParams.push(date_to);
    }

    query += ` ORDER BY r.created_at DESC`;

    const result = await pool.query(query, queryParams);
    res.json({ results: result.rows });
  } catch (error) {
    console.error('Error fetching results:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get a specific result
app.get('/api/data/results/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user.id;

    const result = await pool.query(`
      SELECT r.*, u.username, u.first_name, u.last_name, l.name as lab_name
      FROM results r
      JOIN users u ON r.author_id = u.id
      JOIN labs l ON r.lab_id = l.id
      WHERE r.id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Result not found' });
    }

    res.json({ result: result.rows[0] });
  } catch (error) {
    console.error('Error fetching result:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create a new result
app.post('/api/data/results', authenticateToken, async (req, res) => {
  try {
    const {
      title,
      summary,
      data_type,
      data_format,
      data_content,
      tags,
      privacy_level,
      lab_id,
      project_id,
      source,
      notebook_entry_id
    } = req.body;

    const userId = (req as any).user.id;

    // Validate required fields
    if (!title || !summary || !data_type || !data_format || !data_content || !lab_id) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const result = await pool.query(`
      INSERT INTO results (
        title, summary, author_id, lab_id, project_id, data_type, 
        data_format, data_content, tags, privacy_level, source, notebook_entry_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *
    `, [
      title, summary, userId, lab_id, project_id, data_type,
      data_format, data_content, tags || [], privacy_level || 'lab', source || 'manual', notebook_entry_id
    ]);

    res.status(201).json({ result: result.rows[0] });
  } catch (error) {
    console.error('Error creating result:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update a result
app.put('/api/data/results/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      summary,
      data_type,
      data_format,
      data_content,
      tags,
      privacy_level
    } = req.body;

    const userId = (req as any).user.id;

    // Check if user owns the result or has permission
    const ownershipCheck = await pool.query(`
      SELECT author_id, lab_id FROM results WHERE id = $1
    `, [id]);

    if (ownershipCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Result not found' });
    }

    const result = ownershipCheck.rows[0];
    if (result.author_id !== userId) {
      // Check if user is lab member with edit permissions
      const labMemberCheck = await pool.query(`
        SELECT role FROM lab_members WHERE lab_id = $1 AND user_id = $2
      `, [result.lab_id, userId]);

      if (labMemberCheck.rows.length === 0 || !['principal_researcher', 'co_supervisor'].includes(labMemberCheck.rows[0].role)) {
        return res.status(403).json({ error: 'Insufficient permissions' });
      }
    }

    const updateResult = await pool.query(`
      UPDATE results SET
        title = COALESCE($1, title),
        summary = COALESCE($2, summary),
        data_type = COALESCE($3, data_type),
        data_format = COALESCE($4, data_format),
        data_content = JSONB_SET(data_content, '{updated_at}', to_jsonb(CURRENT_TIMESTAMP)),
        tags = COALESCE($5, tags),
        privacy_level = COALESCE($6, privacy_level),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $7
      RETURNING *
    `, [title, summary, data_type, data_format, tags, privacy_level, id]);

    res.json({ result: updateResult.rows[0] });
  } catch (error) {
    console.error('Error updating result:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete a result
app.delete('/api/data/results/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user.id;

    // Check ownership
    const ownershipCheck = await pool.query(`
      SELECT author_id, lab_id FROM results WHERE id = $1
    `, [id]);

    if (ownershipCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Result not found' });
    }

    const result = ownershipCheck.rows[0];
    if (result.author_id !== userId) {
      // Check if user is lab member with delete permissions
      const labMemberCheck = await pool.query(`
        SELECT role FROM lab_members WHERE lab_id = $1 AND user_id = $2
      `, [result.lab_id, userId]);

      if (labMemberCheck.rows.length === 0 || !['principal_researcher'].includes(labMemberCheck.rows[0].role)) {
        return res.status(403).json({ error: 'Insufficient permissions' });
      }
    }

    await pool.query('DELETE FROM results WHERE id = $1', [id]);
    res.json({ message: 'Result deleted successfully' });
  } catch (error) {
    console.error('Error deleting result:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get data templates
app.get('/api/data/templates', authenticateToken, async (req, res) => {
  try {
    const { lab_id, category, is_public } = req.query;
    const userId = (req as any).user.id;

    let query = `
      SELECT dt.*, u.username, u.first_name, u.last_name
      FROM data_templates dt
      JOIN users u ON dt.created_by = u.id
      WHERE (dt.lab_id = $1 OR dt.is_public = true)
    `;
    
    const queryParams: any[] = [lab_id];
    let paramCount = 1;

    if (category) {
      paramCount++;
      query += ` AND dt.category = $${paramCount}`;
      queryParams.push(category);
    }

    if (is_public !== undefined) {
      paramCount++;
      query += ` AND dt.is_public = $${paramCount}`;
      queryParams.push(is_public === 'true');
    }

    query += ` ORDER BY dt.created_at DESC`;

    const result = await pool.query(query, queryParams);
    res.json({ templates: result.rows });
  } catch (error) {
    console.error('Error fetching templates:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create a data template
app.post('/api/data/templates', authenticateToken, async (req, res) => {
  try {
    const {
      name,
      description,
      category,
      fields,
      lab_id,
      is_public
    } = req.body;

    const userId = (req as any).user.id;

    if (!name || !category || !fields || !lab_id) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const result = await pool.query(`
      INSERT INTO data_templates (
        name, description, category, fields, created_by, lab_id, is_public
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `, [name, description, category, fields, userId, lab_id, is_public || false]);

    res.status(201).json({ template: result.rows[0] });
  } catch (error) {
    console.error('Error creating template:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get results statistics
app.get('/api/data/results/stats/overview', authenticateToken, async (req, res) => {
  try {
    const { lab_id } = req.query;
    const userId = (req as any).user.id;

    const stats = await pool.query(`
      SELECT 
        COUNT(*) as total_results,
        COUNT(CASE WHEN created_at >= CURRENT_DATE - INTERVAL '30 days' THEN 1 END) as this_month,
        COUNT(CASE WHEN data_type = 'experiment' THEN 1 END) as experiments,
        COUNT(CASE WHEN data_type = 'observation' THEN 1 END) as observations,
        COUNT(CASE WHEN data_type = 'measurement' THEN 1 END) as measurements,
        COUNT(CASE WHEN source = 'manual' THEN 1 END) as manual_entries,
        COUNT(CASE WHEN source = 'import' THEN 1 END) as imports
      FROM results 
      WHERE lab_id = $1
    `, [lab_id]);

    res.json({ stats: stats.rows[0] });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// --- RESEARCH DASHBOARD ROUTES ---

// Research Projects Management
app.get('/api/research/projects', authenticateToken, async (req, res) => {
  try {
    const { lab_id, status, priority } = req.query;
    const userId = (req as any).user.id;

    let query = `
      SELECT p.*, 
             u.first_name || ' ' || u.last_name as lead_researcher_name,
             COUNT(pm.id) as milestone_count,
             COUNT(CASE WHEN pm.completed = true THEN 1 END) as completed_milestones
      FROM projects p
      JOIN users u ON p.lead_researcher_id = u.id
      LEFT JOIN project_milestones pm ON p.id = pm.project_id
      WHERE p.lab_id = $1
    `;
    
    const queryParams = [lab_id];
    let paramCount = 1;

    if (status) {
      paramCount++;
      query += ` AND p.status = $${paramCount}`;
      queryParams.push(status);
    }

    if (priority) {
      paramCount++;
      query += ` AND p.priority = $${paramCount}`;
      queryParams.push(priority);
    }

    query += ` GROUP BY p.id, u.first_name, u.last_name ORDER BY p.created_at DESC`;

    const result = await pool.query(query, queryParams);
    res.json({ projects: result.rows });
  } catch (error) {
    console.error('Error fetching research projects:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Research Deadlines Management
app.get('/api/research/deadlines', authenticateToken, async (req, res) => {
  try {
    const { lab_id, priority, status, type } = req.query;
    const userId = (req as any).user.id;

    let query = `
      SELECT rd.*, 
             u.first_name || ' ' || u.last_name as assigned_to_name,
             p.title as project_title
      FROM research_deadlines rd
      LEFT JOIN users u ON rd.assigned_to = u.id
      LEFT JOIN projects p ON rd.related_project_id = p.id
      WHERE rd.related_lab_id = $1
    `;
    
    const queryParams = [lab_id];
    let paramCount = 1;

    if (priority) {
      paramCount++;
      query += ` AND rd.priority = $${paramCount}`;
      queryParams.push(priority);
    }

    if (status) {
      paramCount++;
      query += ` AND rd.status = $${paramCount}`;
      queryParams.push(status);
    }

    if (type) {
      paramCount++;
      query += ` AND rd.deadline_type = $${paramCount}`;
      queryParams.push(type);
    }

    query += ` ORDER BY rd.deadline_date ASC`;

    const result = await pool.query(query, queryParams);
    res.json({ deadlines: result.rows });
  } catch (error) {
    console.error('Error fetching research deadlines:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Research Activities Feed
app.get('/api/research/activities', authenticateToken, async (req, res) => {
  try {
    const { lab_id, type, limit = 50 } = req.query;
    const userId = (req as any).user.id;

    let query = `
      SELECT ra.*, 
             u.first_name || ' ' || u.last_name as user_name,
             p.title as project_title
      FROM research_activities ra
      JOIN users u ON ra.user_id = u.id
      LEFT JOIN projects p ON ra.project_id = p.id
      WHERE ra.lab_id = $1
    `;
    
    const queryParams = [lab_id];
    let paramCount = 1;

    if (type) {
      paramCount++;
      query += ` AND ra.activity_type = $${paramCount}`;
      queryParams.push(type);
    }

    query += ` ORDER BY ra.created_at DESC LIMIT $${paramCount + 1}`;
    queryParams.push(parseInt(limit as string));

    const result = await pool.query(query, queryParams);
    res.json({ activities: result.rows });
  } catch (error) {
    console.error('Error fetching research activities:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Research Insights Management
app.get('/api/research/insights', authenticateToken, async (req, res) => {
  try {
    const { lab_id, priority, category, user_id } = req.query;
    const userId = (req as any).user.id;

    let query = `
      SELECT ri.*, 
             u.first_name || ' ' || u.last_name as user_name,
             p.title as project_title
      FROM research_insights ri
      LEFT JOIN users u ON ri.user_id = u.id
      LEFT JOIN projects p ON ri.project_id = p.id
      WHERE ri.lab_id = $1 AND (ri.user_id IS NULL OR ri.user_id = $2)
    `;
    
    const queryParams = [lab_id, userId];
    let paramCount = 2;

    if (priority) {
      paramCount++;
      query += ` AND ri.priority = $${paramCount}`;
      queryParams.push(priority);
    }

    if (category) {
      paramCount++;
      query += ` AND ri.category = $${paramCount}`;
      queryParams.push(category);
    }

    query += ` ORDER BY ri.priority DESC, ri.created_at DESC`;

    const result = await pool.query(query, queryParams);
    res.json({ insights: result.rows });
  } catch (error) {
    console.error('Error fetching research insights:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Research Metrics Calculation
app.get('/api/research/metrics', authenticateToken, async (req, res) => {
  try {
    const { lab_id } = req.query;
    const userId = (req as any).user.id;

    // Use the database function to calculate metrics
    const result = await pool.query('SELECT calculate_research_metrics($1) as metrics', [lab_id]);
    const metrics = result.rows[0].metrics;

    res.json({ metrics });
  } catch (error) {
    console.error('Error calculating research metrics:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Research Collaborations Management
app.get('/api/research/collaborations', authenticateToken, async (req, res) => {
  try {
    const { lab_id, status, type } = req.query;
    const userId = (req as any).user.id;

    let query = `
      SELECT rc.*, 
             u.first_name || ' ' || u.last_name as lead_researcher_name,
             COUNT(cp.id) as partner_count
      FROM research_collaborations rc
      JOIN users u ON rc.lead_researcher_id = u.id
      LEFT JOIN collaboration_partners cp ON rc.id = cp.collaboration_id
      WHERE rc.lab_id = $1
    `;
    
    const queryParams = [lab_id];
    let paramCount = 1;

    if (status) {
      paramCount++;
      query += ` AND rc.status = $${paramCount}`;
      queryParams.push(status);
    }

    if (type) {
      paramCount++;
      query += ` AND rc.collaboration_type = $${paramCount}`;
      queryParams.push(type);
    }

    query += ` GROUP BY rc.id, u.first_name, u.last_name ORDER BY rc.created_at DESC`;

    const result = await pool.query(query, queryParams);
    res.json({ collaborations: result.rows });
  } catch (error) {
    console.error('Error fetching research collaborations:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ==============================================
// RESEARCHER PORTFOLIO ROUTES
// ==============================================

// Test route
app.get('/api/researcher-portfolio/test', (req, res) => {
  res.json({ message: 'Researcher portfolio API is working!' });
});

// Get researcher profile
app.get('/api/researcher-portfolio/profiles/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const result = await pool.query(`
      SELECT rp.*, u.first_name, u.last_name, u.email, u.role
      FROM researcher_profiles rp
      JOIN users u ON rp.user_id = u.id
      WHERE rp.user_id = $1
    `, [userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    res.json({ profile: result.rows[0] });
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// Get researcher publications
app.get('/api/researcher-portfolio/publications/:researcherId', async (req, res) => {
  try {
    const { researcherId } = req.params;
    
    const result = await pool.query(`
      SELECT * FROM researcher_publications 
      WHERE researcher_id = $1 
      ORDER BY publication_date DESC
    `, [researcherId]);

    res.json({ publications: result.rows });
  } catch (error) {
    console.error('Error fetching publications:', error);
    res.status(500).json({ error: 'Failed to fetch publications' });
  }
});

// Find potential co-supervisors
app.post('/api/researcher-portfolio/matching/find-supervisors', authenticateToken, async (req, res) => {
  try {
    const { research_interests, research_domains, max_results = 10 } = req.body;
    const student_id = req.user.id;

    // Get student profile
    const studentProfile = await pool.query(`
      SELECT research_interests, research_domains FROM researcher_profiles 
      WHERE user_id = $1
    `, [student_id]);

    const studentInterests = studentProfile.rows[0]?.research_interests || research_interests || [];
    const studentDomains = studentProfile.rows[0]?.research_domains || research_domains || [];

    // Find matching supervisors
    const result = await pool.query(`
      SELECT 
        u.id, u.first_name, u.last_name, u.email,
        rp.institution, rp.position, rp.research_interests, rp.research_domains,
        rp.expertise_areas, rp.availability_status, rp.max_students, rp.current_students,
        rp.total_publications, rp.total_citations, rp.h_index,
        calculate_research_compatibility($1, rp.research_domains, rp.research_interests) as compatibility_score
      FROM users u
      JOIN researcher_profiles rp ON u.id = rp.user_id
      WHERE u.role IN ('principal_researcher', 'co_supervisor')
        AND rp.availability_status = 'available'
        AND rp.current_students < rp.max_students
      ORDER BY compatibility_score DESC
      LIMIT $2
    `, [JSON.stringify(studentInterests), parseInt(max_results)]);

    res.json({ 
      supervisors: result.rows,
      studentProfile: {
        interests: studentInterests,
        domains: studentDomains
      }
    });
  } catch (error) {
    console.error('Error finding supervisors:', error);
    res.status(500).json({ error: 'Failed to find supervisors' });
  }
});

// Get exchange opportunities
app.get('/api/researcher-portfolio/exchange/opportunities', async (req, res) => {
  try {
    const { domain, status = 'active', limit = 20 } = req.query;
    
    let sql = `
      SELECT 
        reo.*, 
        u.first_name, u.last_name, u.email as host_email,
        l.name as lab_name, l.institution
      FROM research_exchange_opportunities reo
      JOIN users u ON reo.host_researcher_id = u.id
      JOIN labs l ON reo.host_lab_id = l.id
      WHERE reo.status = $1
    `;
    const params: any[] = [status];
    let paramCount = 1;

    if (domain) {
      paramCount++;
      sql += ` AND $${paramCount} = ANY(reo.research_domains)`;
      params.push(domain);
    }

    sql += ` ORDER BY reo.created_at DESC LIMIT $${paramCount + 1}`;
    params.push(parseInt(limit as string));

    const result = await pool.query(sql, params);
    res.json({ opportunities: result.rows });
  } catch (error) {
    console.error('Error fetching exchange opportunities:', error);
    res.status(500).json({ error: 'Failed to fetch exchange opportunities' });
  }
});

// ==============================================
// CROSS-ENTITY INTEGRATION ROUTES
// ==============================================

// Import cross-entity integration routes
import crossEntityIntegrationRoutes from './routes/crossEntityIntegration';

app.use('/api/cross-entity', crossEntityIntegrationRoutes);

// Cross-Entity Analytics Endpoint
app.get('/api/cross-entity/analytics/workflow', authenticateToken, async (req, res) => {
  try {
    const { labId, timeRange } = req.query;
    const userId = (req as any).user.id;

    // Calculate workflow analytics
    const analytics = await Promise.all([
      // Total notebook entries
      pool.query(`
        SELECT COUNT(*) as count 
        FROM lab_notebook_entries 
        WHERE lab_id = $1
        ${timeRange ? `AND created_at >= NOW() - INTERVAL '${timeRange} days'` : ''}
      `, [labId]),
      
      // Total protocols
      pool.query(`
        SELECT COUNT(*) as count 
        FROM protocols 
        WHERE lab_id = $1
        ${timeRange ? `AND created_at >= NOW() - INTERVAL '${timeRange} days'` : ''}
      `, [labId]),
      
      // Total results
      pool.query(`
        SELECT COUNT(*) as count 
        FROM results 
        WHERE lab_id = $1
        ${timeRange ? `AND created_at >= NOW() - INTERVAL '${timeRange} days'` : ''}
      `, [labId]),
      
      // Total bookings
      pool.query(`
        SELECT COUNT(*) as count 
        FROM instrument_bookings 
        WHERE lab_id = $1
        ${timeRange ? `AND created_at >= NOW() - INTERVAL '${timeRange} days'` : ''}
      `, [labId]),
      
      // Total relationships (mock - would need actual relationship table)
      pool.query(`
        SELECT COUNT(*) as count 
        FROM lab_notebook_entries 
        WHERE lab_id = $1 AND related_protocols IS NOT NULL
        ${timeRange ? `AND created_at >= NOW() - INTERVAL '${timeRange} days'` : ''}
      `, [labId])
    ]);

    const workflowAnalytics = {
      totalNotebookEntries: parseInt(analytics[0].rows[0].count),
      totalProtocols: parseInt(analytics[1].rows[0].count),
      totalResults: parseInt(analytics[2].rows[0].count),
      totalBookings: parseInt(analytics[3].rows[0].count),
      totalRelationships: parseInt(analytics[4].rows[0].count),
      syncStatusCounts: {
        'synced': parseInt(analytics[0].rows[0].count),
        'pending': 0,
        'failed': 0,
        'conflict': 0
      }
    };

    res.json(workflowAnalytics);
  } catch (error) {
    console.error('Error fetching workflow analytics:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Start server
const startServer = async () => {
  try {
    // Test database connection
    const client = await pool.connect();
    console.log('✅ Connected to PostgreSQL database');
    client.release();

    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log('📱 Frontend URL: http://localhost:5173');
      console.log('🔧 API URL: http://localhost:5001/api');
      console.log('🗄️  Database: PostgreSQL');

      // Add researcher portfolio test route
      app.get('/api/researcher-portfolio/test', (req, res) => {
        res.json({ message: 'Researcher portfolio API is working!' });
      });
      console.log(`📱 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);
      console.log(`🔧 API URL: http://localhost:${PORT}/api`);
      console.log(`🗄️  Database: PostgreSQL`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
