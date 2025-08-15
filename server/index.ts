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

// Middleware
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:5174', 
    'http://localhost:5175',
    process.env.FRONTEND_URL || 'http://localhost:5173'
  ],
  credentials: true
}));
app.use(express.json());

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production';

// Authentication Middleware
const authenticateToken = async (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    
    // Get user from database
    const result = await pool.query('SELECT * FROM users WHERE id = $1', [decoded.userId]);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'User not found' });
    }

    req.user = result.rows[0];
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid token' });
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
    `, [email, username, hashedPassword, first_name, last_name, role, 'pending_verification', false]);

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
    // Only principal researchers and admins can create labs
    if (!['admin', 'principal_researcher'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions to create labs' });
    }

    const { name, description, institution, department, contact_email, contact_phone, address } = req.body;

    // Validation
    if (!name || !institution || !department) {
      return res.status(400).json({ error: 'Lab name, institution, and department are required' });
    }

    // Create lab
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
    let query = `
      SELECT l.*, u.first_name, u.last_name, u.username as pi_name,
             (SELECT COUNT(*) FROM lab_members WHERE lab_id = l.id) as member_count
      FROM labs l
      JOIN users u ON l.principal_researcher_id = u.id
    `;

    // If not admin, only show labs where user is a member
    if (req.user.role !== 'admin') {
      query += `
        JOIN lab_members lm ON l.id = lm.lab_id
        WHERE lm.user_id = $1
      `;
    }

    query += ' ORDER BY l.created_at DESC';

    const params = req.user.role !== 'admin' ? [req.user.id] : [];
    const result = await pool.query(query, params);

    res.json({ labs: result.rows });
  } catch (error) {
    console.error('💥 Get labs error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/labs/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if user has access to this lab
    const memberCheck = await pool.query(`
      SELECT lm.role, lm.permissions FROM lab_members lm
      WHERE lm.lab_id = $1 AND lm.user_id = $2
    `, [id, req.user.id]);

    if (memberCheck.rows.length === 0 && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied to this lab' });
    }

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

    // Create lab notebook entry
    const result = await pool.query(`
      INSERT INTO lab_notebook_entries (
        title, content, entry_type, results, conclusions, 
        lab_id, project_id, author_id, privacy_level, tags
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `, [
      title, content, entry_type || 'experiment', results, conclusions,
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

app.delete('/api/lab-notebooks/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Get entry
    const entry = await pool.query(`
      SELECT * FROM lab_notebook_entries WHERE id = $1
    `, [id]);

    if (entry.rows.length === 0) {
      return res.status(404).json({ error: 'Lab notebook entry not found' });
    }

    // Check permissions (creator, lab PI, or admin)
    if (entry.rows[0].author_id !== req.user.id && req.user.role !== 'admin') {
      const labAccess = await pool.query(`
        SELECT role FROM lab_members 
        WHERE lab_id = $1 AND user_id = $2 AND role = 'principal_researcher'
      `, [entry.rows[0].lab_id, req.user.id]);

      if (labAccess.rows.length === 0) {
        return res.status(403).json({ error: 'Insufficient permissions to delete this entry' });
      }
    }

    // Soft delete (mark as inactive by setting lab_id to null)
    await pool.query(`
      UPDATE lab_notebook_entries SET lab_id = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = $1
    `, [id]);

    console.log('📓 Lab notebook entry deleted:', { entryId: id, deletedBy: req.user.username });

    res.json({ message: 'Lab notebook entry deleted successfully' });

  } catch (error) {
    console.error('💥 Delete lab notebook error:', error);
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

// Start server
const startServer = async () => {
  try {
    // Test database connection
    const client = await pool.connect();
    console.log('✅ Connected to PostgreSQL database');
    client.release();

    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
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
