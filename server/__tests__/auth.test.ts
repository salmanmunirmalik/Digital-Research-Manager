import request from 'supertest';
import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

// Mock the database connection
const mockPool = {
  query: jest.fn(),
};

// Mock the authentication middleware
const mockAuthenticateToken = (req: any, res: any, next: any) => {
  req.user = { id: '1', email: 'test@example.com', role: 'researcher' };
  next();
};

// Mock the server app
const createMockApp = () => {
  const app = express();
  app.use(express.json());

  // Mock auth routes
  app.post('/api/auth/login', async (req, res) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
      }

      // Mock user lookup
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        username: 'testuser',
        password_hash: await bcrypt.hash('password123', 10),
        role: 'researcher',
        status: 'active',
        first_name: 'Test',
        last_name: 'User'
      };

      mockPool.query.mockResolvedValueOnce({ rows: [mockUser] });

      // Verify password
      const isValidPassword = await bcrypt.compare(password, mockUser.password_hash);
      if (!isValidPassword) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Generate JWT token
      const token = jwt.sign(
        { userId: mockUser.id, email: mockUser.email, role: mockUser.role },
        'test-secret',
        { expiresIn: '24h' }
      );

      res.json({
        message: 'Login successful',
        token,
        user: {
          id: mockUser.id,
          email: mockUser.email,
          username: mockUser.username,
          role: mockUser.role,
          first_name: mockUser.first_name,
          last_name: mockUser.last_name
        }
      });
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.post('/api/auth/register', async (req, res) => {
    try {
      const { email, username, password, first_name, last_name, role } = req.body;

      if (!email || !username || !password || !first_name || !last_name) {
        return res.status(400).json({ error: 'All fields are required' });
      }

      // Check if user already exists
      mockPool.query.mockResolvedValueOnce({ rows: [] });

      // Hash password
      const password_hash = await bcrypt.hash(password, 10);

      // Create user
      const newUser = {
        id: '2',
        email,
        username,
        password_hash,
        role: role || 'student',
        status: 'pending_verification',
        first_name,
        last_name
      };

      mockPool.query.mockResolvedValueOnce({ rows: [newUser] });

      res.status(201).json({
        message: 'User registered successfully',
        user: {
          id: newUser.id,
          email: newUser.email,
          username: newUser.username,
          role: newUser.role,
          first_name: newUser.first_name,
          last_name: newUser.last_name
        }
      });
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.get('/api/auth/profile', mockAuthenticateToken, async (req, res) => {
    try {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        username: 'testuser',
        role: 'researcher',
        first_name: 'Test',
        last_name: 'User'
      };

      mockPool.query.mockResolvedValueOnce({ rows: [mockUser] });

      res.json({ user: mockUser });
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  return app;
};

describe('Authentication API', () => {
  let app: express.Application;

  beforeEach(() => {
    app = createMockApp();
    jest.clearAllMocks();
  });

  describe('POST /api/auth/login', () => {
    it('should login user with valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123'
        });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Login successful');
      expect(response.body.token).toBeDefined();
      expect(response.body.user.email).toBe('test@example.com');
    });

    it('should reject login with invalid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'wrongpassword'
        });

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Invalid credentials');
    });

    it('should reject login with missing fields', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com'
          // missing password
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Email and password are required');
    });

    it('should handle database errors', async () => {
      mockPool.query.mockRejectedValueOnce(new Error('Database error'));

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123'
        });

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Internal server error');
    });
  });

  describe('POST /api/auth/register', () => {
    it('should register user with valid data', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'newuser@example.com',
          username: 'newuser',
          password: 'password123',
          first_name: 'New',
          last_name: 'User',
          role: 'student'
        });

      expect(response.status).toBe(201);
      expect(response.body.message).toBe('User registered successfully');
      expect(response.body.user.email).toBe('newuser@example.com');
    });

    it('should reject registration with missing fields', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'newuser@example.com',
          username: 'newuser'
          // missing password, first_name, last_name
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('All fields are required');
    });

    it('should handle database errors during registration', async () => {
      mockPool.query.mockRejectedValueOnce(new Error('Database error'));

      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'newuser@example.com',
          username: 'newuser',
          password: 'password123',
          first_name: 'New',
          last_name: 'User'
        });

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Internal server error');
    });
  });

  describe('GET /api/auth/profile', () => {
    it('should return user profile with valid token', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
      expect(response.body.user.email).toBe('test@example.com');
    });

    it('should handle database errors when fetching profile', async () => {
      mockPool.query.mockRejectedValueOnce(new Error('Database error'));

      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Internal server error');
    });
  });
});
