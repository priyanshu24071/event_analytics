const { 
    createApp, 
    getApps, 
    getApp, 
    updateApp, 
    deleteApp, 
    generateApiKey 
  } = require('../../api/controllers/app.controller');
  const { App, ApiKey } = require('../../db/models');
  
  // Mock dependencies
  jest.mock('../../db/models', () => ({
    App: {
      findAll: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      destroy: jest.fn()
    },
    ApiKey: {
      create: jest.fn(),
      findOne: jest.fn(),
      destroy: jest.fn()
    }
  }));
  
  jest.mock('../../utils/logger', () => ({
    info: jest.fn(),
    error: jest.fn()
  }));
  
  jest.mock('uuid', () => ({
    v4: jest.fn().mockReturnValue('mock-uuid')
  }));
  
  describe('App Controller', () => {
    let req, res, next;
    
    beforeEach(() => {
      req = {
        body: {},
        params: {},
        user: { id: 'testUserId' }
      };
      
      res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      
      next = jest.fn();
      
      // Reset all mocks
      jest.clearAllMocks();
    });
    
    describe('createApp', () => {
      test('should create a new app', async () => {
        // Setup
        req.body = {
          name: 'Test App',
          domain: 'test.com',
          type: 'website'
        };
        
        const mockApp = {
          id: 'app123',
          name: 'Test App',
          domain: 'test.com',
          type: 'website',
          userId: 'testUserId'
        };
        App.create.mockResolvedValue(mockApp);
        
        // Execute
        await createApp(req, res, next);
        
        // Assert
        expect(App.create).toHaveBeenCalledWith({
          name: 'Test App',
          domain: 'test.com',
          type: 'website',
          userId: 'testUserId'
        });
        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.json).toHaveBeenCalledWith({
          success: true,
          message: 'App created successfully',
          data: mockApp
        });
      });
    });
    
    describe('getApps', () => {
      test('should return all apps for the user', async () => {
        // Setup
        const mockApps = [
          { id: 'app1', name: 'App 1' },
          { id: 'app2', name: 'App 2' }
        ];
        App.findAll.mockResolvedValue(mockApps);
        
        // Execute
        await getApps(req, res, next);
        
        // Assert
        expect(App.findAll).toHaveBeenCalledWith({
          where: { userId: 'testUserId' }
        });
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
          success: true,
          data: mockApps
        });
      });
    });
    
    describe('getApp', () => {
      test('should return a specific app', async () => {
        // Setup
        req.params.id = 'app123';
        
        const mockApp = {
          id: 'app123',
          name: 'Test App',
          domain: 'test.com',
          type: 'website',
          userId: 'testUserId'
        };
        App.findOne.mockResolvedValue(mockApp);
        
        // Execute
        await getApp(req, res, next);
        
        // Assert
        expect(App.findOne).toHaveBeenCalledWith({
          where: { id: 'app123', userId: 'testUserId' }
        });
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
          success: true,
          data: mockApp
        });
      });
      
      test('should return 404 if app is not found', async () => {
        // Setup
        req.params.id = 'nonexistent';
        
        App.findOne.mockResolvedValue(null);
        
        // Execute
        await getApp(req, res, next);
        
        // Assert
        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({
          success: false,
          message: 'App not found'
        });
      });
    });
    
    describe('updateApp', () => {
      test('should update an app', async () => {
        // Setup
        req.params.id = 'app123';
        req.body = {
          name: 'Updated App',
          domain: 'updated.com'
        };
        
        App.findOne.mockResolvedValue({
          id: 'app123',
          userId: 'testUserId'
        });
        
        App.update.mockResolvedValue([1]);
        
        const updatedApp = {
          id: 'app123',
          name: 'Updated App',
          domain: 'updated.com',
          userId: 'testUserId'
        };
        App.findOne.mockResolvedValueOnce(updatedApp);
        
        // Execute
        await updateApp(req, res, next);
        
        // Assert
        expect(App.update).toHaveBeenCalledWith(
          { name: 'Updated App', domain: 'updated.com' },
          { where: { id: 'app123', userId: 'testUserId' } }
        );
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
          success: true,
          message: 'App updated successfully',
          data: updatedApp
        });
      });
      
      test('should return 404 if app is not found', async () => {
        // Setup
        req.params.id = 'nonexistent';
        req.body = {
          name: 'Updated App'
        };
        
        App.findOne.mockResolvedValue(null);
        
        // Execute
        await updateApp(req, res, next);
        
        // Assert
        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({
          success: false,
          message: 'App not found'
        });
        expect(App.update).not.toHaveBeenCalled();
      });
    });
    
    describe('deleteApp', () => {
      test('should delete an app', async () => {
        // Setup
        req.params.id = 'app123';
        
        App.findOne.mockResolvedValue({
          id: 'app123',
          userId: 'testUserId'
        });
        
        App.destroy.mockResolvedValue(1);
        
        // Execute
        await deleteApp(req, res, next);
        
        // Assert
        expect(App.destroy).toHaveBeenCalledWith({
          where: { id: 'app123', userId: 'testUserId' }
        });
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
          success: true,
          message: 'App deleted successfully'
        });
      });
      
      test('should return 404 if app is not found', async () => {
        // Setup
        req.params.id = 'nonexistent';
        
        App.findOne.mockResolvedValue(null);
        
        // Execute
        await deleteApp(req, res, next);
        
        // Assert
        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({
          success: false,
          message: 'App not found'
        });
        expect(App.destroy).not.toHaveBeenCalled();
      });
    });
    
    describe('generateApiKey', () => {
      test('should generate a new API key', async () => {
        // Setup
        req.params.id = 'app123';
        
        App.findOne.mockResolvedValue({
          id: 'app123',
          userId: 'testUserId'
        });
        
        ApiKey.findOne.mockResolvedValue({
          destroy: jest.fn().mockResolvedValue(true)
        });
        
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        const mockApiKey = {
          id: 'key123',
          key: 'api-key-123456',
          expiresAt: tomorrow
        };
        ApiKey.create.mockResolvedValue(mockApiKey);
        
        // Execute
        await generateApiKey(req, res, next);
        
        // Assert
        expect(ApiKey.create).toHaveBeenCalledWith({
          appId: 'app123',
          expiresAt: expect.any(Date)
        });
        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.json).toHaveBeenCalledWith({
          success: true,
          message: 'API key generated successfully',
          data: {
            key: 'api-key-123456',
            expiresAt: mockApiKey.expiresAt
          }
        });
      });
      
      test('should return 404 if app is not found', async () => {
        // Setup
        req.params.id = 'nonexistent';
        
        App.findOne.mockResolvedValue(null);
        
        // Execute
        await generateApiKey(req, res, next);
        
        // Assert
        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({
          success: false,
          message: 'App not found'
        });
        expect(ApiKey.create).not.toHaveBeenCalled();
      });
    });
  });