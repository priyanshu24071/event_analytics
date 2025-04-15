const { 
    register, 
    login, 
    resetPassword, 
    requestPasswordReset, 
    validateToken
  } = require('../../api/controllers/auth.controller');
  const { User } = require('../../db/models');
  const bcrypt = require('bcrypt');
  const jwt = require('jsonwebtoken');
  const config = require('../../config/config');
  
  // Mock dependencies
  jest.mock('../../db/models', () => ({
    User: {
      findOne: jest.fn(),
      create: jest.fn()
    }
  }));
  
  jest.mock('bcrypt', () => ({
    hash: jest.fn(),
    compare: jest.fn()
  }));
  
  jest.mock('jsonwebtoken', () => ({
    sign: jest.fn(),
    verify: jest.fn()
  }));
  
  jest.mock('../../utils/logger', () => ({
    info: jest.fn(),
    error: jest.fn()
  }));
  
  describe('Auth Controller', () => {
    let req, res, next;
    
    beforeEach(() => {
      req = {
        body: {},
        headers: {}
      };
      
      res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      
      next = jest.fn();
      
      // Reset all mocks
      jest.clearAllMocks();
    });
    
    describe('register', () => {
      test('should register new user successfully', async () => {
        // Setup
        req.body = {
          name: 'Test User',
          email: 'test@example.com',
          password: 'password123'
        };
        
        bcrypt.hash.mockResolvedValue('hashedPassword');
        User.create.mockResolvedValue({
          id: 'user123',
          ...req.body,
          password: 'hashedPassword'
        });
        
        // Execute
        await register(req, res, next);
        
        // Assert
        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.json).toHaveBeenCalledWith({
          success: true,
          message: expect.any(String),
          data: expect.objectContaining({
            id: expect.any(String),
            name: req.body.name,
            email: req.body.email
          })
        });
      });
      
      test('should return 400 if email already exists', async () => {
        // Setup
        req.body = {
          name: 'Test User',
          email: 'existing@example.com',
          password: 'password123'
        };
        
        User.findOne.mockResolvedValue({ id: 'existingUser' });
        
        // Execute
        await register(req, res, next);
        
        // Assert
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
          success: false,
          message: expect.any(String)
        });
      });
    });
    
    describe('login', () => {
      test('should login successfully with valid credentials', async () => {
        // Setup
        req.body = {
          email: 'test@example.com',
          password: 'password123'
        };
        
        User.findOne.mockResolvedValue({
          id: 'user123',
          email: req.body.email,
          password: 'hashedPassword'
        });
        
        bcrypt.compare.mockResolvedValue(true);
        
        // Execute
        await login(req, res, next);
        
        // Assert
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
          success: true,
          data: expect.objectContaining({
            token: expect.any(String)
          })
        });
      });
      
      test('should return 401 if user is not found', async () => {
        // Setup
        req.body = {
          email: 'nonexistent@example.com',
          password: 'password123'
        };
        
        User.findOne.mockResolvedValue(null);
        
        // Execute
        await login(req, res, next);
        
        // Assert
        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({
          success: false,
          message: 'Invalid credentials'
        });
        expect(bcrypt.compare).not.toHaveBeenCalled();
      });
      
      test('should return 401 if password is incorrect', async () => {
        // Setup
        req.body = {
          email: 'test@example.com',
          password: 'wrongpassword'
        };
        
        const mockUser = {
          id: 'user123',
          name: 'Test User',
          email: 'test@example.com',
          password: 'hashedPassword'
        };
        User.findOne.mockResolvedValue(mockUser);
        bcrypt.compare.mockResolvedValue(false);
        
        // Execute
        await login(req, res, next);
        
        // Assert
        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({
          success: false,
          message: 'Invalid credentials'
        });
        expect(jwt.sign).not.toHaveBeenCalled();
      });
    });
    
    describe('validateToken', () => {
      test('should return 200 if token is valid', async () => {
        // Setup
        req.headers = {
          authorization: 'Bearer valid-token'
        };
        
        jwt.verify.mockImplementation((token, secret, callback) => {
          callback(null, { id: 'user123' });
        });
        
        const mockUser = {
          id: 'user123',
          name: 'Test User',
          email: 'test@example.com'
        };
        User.findOne.mockResolvedValue(mockUser);
        
        // Execute
        await validateToken(req, res, next);
        
        // Assert
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
          success: true,
          data: {
            user: mockUser
          }
        });
      });
      
      test('should return 401 if token is invalid', async () => {
        // Setup
        req.headers = {
          authorization: 'Bearer invalid-token'
        };
        
        jwt.verify.mockImplementation((token, secret, callback) => {
          callback(new Error('Invalid token'), null);
        });
        
        // Execute
        await validateToken(req, res, next);
        
        // Assert
        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({
          success: false,
          message: 'Invalid token'
        });
      });
    });
  });