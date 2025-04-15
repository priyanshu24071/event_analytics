const { 
    getEventAnalytics, 
    getAnalyticsSummary, 
    collectEvent, 
    getEventSummary, 
    getUserStats 
  } = require('../../api/controllers/analytics.controller');
  const { Event, App, sequelize } = require('../../db/models');
  const redisClient = require('../../config/redis');
  
  // Mock dependencies
  jest.mock('../../db/models', () => ({
    Event: {
      findAll: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      count: jest.fn()
    },
    App: {
      findOne: jest.fn()
    },
    sequelize: {
      fn: jest.fn(),
      col: jest.fn(),
      literal: jest.fn()
    },
    Sequelize: {
      Op: {
        gte: 'gte',
        lte: 'lte',
        between: 'between'
      }
    }
  }));
  
  jest.mock('../../config/redis', () => ({
    get: jest.fn(),
    set: jest.fn(),
    expire: jest.fn()
  }));
  
  jest.mock('../../utils/logger', () => ({
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn()
  }));
  
  describe('Analytics Controller', () => {
    let req, res, next;
    
    beforeEach(() => {
      req = {
        body: {},
        query: {},
        user: { id: 'testUserId' },
        app: { id: 'testAppId' }
      };
      
      res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      
      next = jest.fn();
      
      // Reset all mocks
      jest.clearAllMocks();
    });
    
    describe('collectEvent', () => {
      test('should create an event and return success response', async () => {
        // Setup
        req.body = {
          event: 'button_click',
          url: 'https://test.com/page',
          referrer: 'https://google.com',
          device: 'mobile',
          ipAddress: '192.168.1.1',
          timestamp: '2023-01-01T00:00:00Z',
          metadata: { browser: 'Chrome', os: 'Android' }
        };
        
        const mockEvent = {
          id: 'event123',
          metadata: { browser: 'Chrome', os: 'Android' },
          ipAddress: '192.168.1.1'
        };
        
        Event.create.mockResolvedValue(mockEvent);
        
        // Execute
        await collectEvent(req, res, next);
        
        // Assert
        expect(Event.create).toHaveBeenCalledWith({
          appId: 'testAppId',
          type: 'button_click',
          name: 'button_click',
          url: 'https://test.com/page',
          referrer: 'https://google.com',
          device: 'mobile',
          ipAddress: '192.168.1.1',
          userId: null,
          metadata: JSON.stringify({ browser: 'Chrome', os: 'Android' }),
          timestamp: expect.any(Date)
        });
        
        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.json).toHaveBeenCalledWith({
          success: true,
          message: 'Event recorded successfully'
        });
      });
  
      test('should handle errors', async () => {
        // Setup
        req.body = {
          event: 'button_click',
          url: 'https://test.com/page',
          device: 'mobile',
          ipAddress: '192.168.1.1',
          timestamp: '2023-01-01T00:00:00Z'
        };
        
        const error = new Error('Database error');
        Event.create.mockRejectedValue(error);
        
        // Execute
        await collectEvent(req, res, next);
        
        // Assert
        expect(next).toHaveBeenCalledWith(error);
      });
    });
    
    describe('getEventSummary', () => {
      test('should return event summary data', async () => {
        // Setup
        req.query = { 
          event: 'page_view',
          app_id: 'app123'
        };
        req.user = { id: 'user123' };
        
        App.findOne.mockResolvedValue({ id: 'app123', name: 'Test App' });
        redisClient.get.mockResolvedValue(null);
        Event.count.mockResolvedValueOnce(100); // Total count
        Event.count.mockResolvedValueOnce(50);  // Unique users
        
        const mockDevices = [
          { device: 'mobile', get: () => '60' },
          { device: 'desktop', get: () => '40' }
        ];
        Event.findAll.mockResolvedValue(mockDevices);
        
        // Execute
        await getEventSummary(req, res, next);
        
        // Assert
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
          success: true,
          data: {
            event: 'page_view',
            count: 100,
            uniqueUsers: 50,
            deviceData: {
              mobile: 60,
              desktop: 40
            }
          }
        });
      });
  
      test('should return cached data if available', async () => {
        // Setup
        req.query = { 
          event: 'page_view',
          app_id: 'app123'
        };
        req.user = { id: 'user123' };
        
        const cachedData = {
          success: true,
          data: {
            event: 'page_view',
            count: 100,
            uniqueUsers: 50,
            deviceData: {
              mobile: 60,
              desktop: 40
            }
          }
        };
        
        App.findOne.mockResolvedValue({ id: 'app123', name: 'Test App' });
        redisClient.get.mockResolvedValue(JSON.stringify(cachedData));
        
        // Execute
        await getEventSummary(req, res, next);
        
        // Assert
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(cachedData);
        expect(Event.count).not.toHaveBeenCalled(); // Database should not be called
      });
  
      test('should return 403 if app does not belong to user', async () => {
        // Setup
        req.query = { 
          event: 'page_view',
          app_id: 'app123'
        };
        req.user = { id: 'user123' };
        
        App.findOne.mockResolvedValue(null); // App not found or not belonging to user
        
        // Execute
        await getEventSummary(req, res, next);
        
        // Assert
        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json).toHaveBeenCalledWith({
          success: false,
          message: 'You do not have access to this app'
        });
      });
    });
    
    describe('getUserStats', () => {
      test('should return user stats when user has events', async () => {
        // Setup
        req.query = { userId: 'user123' };
        
        Event.count.mockResolvedValue(5);
        
        const mockEvent = {
          metadata: { browser: 'Chrome', os: 'iOS' },
          ipAddress: '192.168.1.1',
          device: 'mobile'
        };
        
        Event.findOne.mockResolvedValue(mockEvent);
        Event.findAll.mockResolvedValue([mockEvent]);
        
        // Execute
        await getUserStats(req, res, next);
        
        // Assert
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
          success: true,
          data: {
            userId: 'user123',
            totalEvents: 5,
            deviceDetails: {
              browser: 'Chrome',
              os: 'iOS'
            },
            ipAddress: '192.168.1.1'
          }
        });
      });
      
      test('should return 404 when user has no events', async () => {
        // Setup
        req.query = { userId: 'user123' };
        
        Event.count.mockResolvedValue(0);
        
        // Execute
        await getUserStats(req, res, next);
        
        // Assert
        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({
          success: false,
          message: 'No data found for this user'
        });
      });
  
      test('should handle null metadata', async () => {
        // Setup
        req.query = { userId: 'user123' };
        
        Event.count.mockResolvedValue(5);
        
        const mockEvent = {
          metadata: null,
          ipAddress: '192.168.1.1',
          device: 'mobile'
        };
        
        Event.findOne.mockResolvedValue(mockEvent);
        Event.findAll.mockResolvedValue([mockEvent]);
        
        // Execute
        await getUserStats(req, res, next);
        
        // Assert
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
          success: true,
          data: {
            userId: 'user123',
            totalEvents: 5,
            deviceDetails: {
              browser: 'Unknown',
              os: 'Unknown',
              device: 'mobile'
            },
            ipAddress: '192.168.1.1'
          }
        });
      });
    });
    
    describe('getAnalyticsSummary', () => {
      test('should return analytics summary data', async () => {
        // Setup
        req.query = { appId: 'app123' };
        req.user = { id: 'user123' };
        
        App.findOne.mockResolvedValue({ id: 'app123', name: 'Test App' });
        Event.count.mockResolvedValueOnce(100); // Total events
        Event.count.mockResolvedValueOnce(20);  // Today's events
        Event.count.mockResolvedValueOnce(80);  // Monthly events
        
        const mockEventTypes = [
          { type: 'page_view', get: () => '60' },
          { type: 'button_click', get: () => '40' }
        ];
        Event.findAll.mockResolvedValue(mockEventTypes);
        
        // Execute
        await getAnalyticsSummary(req, res, next);
        
        // Assert
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
          success: true,
          data: {
            totalEvents: 100,
            todayEvents: 20,
            monthlyEvents: 80,
            eventTypes: mockEventTypes
          }
        });
      });
    });
  });