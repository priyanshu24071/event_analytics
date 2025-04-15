const { 
  getEventAnalytics, 
  getUserStats,
  collectEvent 
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
      between: 'between',
      gte: 'gte',
      lte: 'lte'
    }
  }
}));

jest.mock('../../config/redis', () => ({
  get: jest.fn(),
  set: jest.fn()
}));

describe('Analytics Controller', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      query: {},
      body: {},
      user: { id: 'user123' }
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    next = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getEventAnalytics', () => {
    test('should return analytics data for valid request', async () => {
      // Setup
      req.query = {
        appId: 'app123',
        startDate: '2024-01-01',
        endDate: '2024-01-31'
      };

      App.findOne.mockResolvedValue({ id: 'app123' });
      Event.findAll.mockResolvedValue([
        { date: '2024-01-01', type: 'page_view', count: '10' }
      ]);

      // Execute
      await getEventAnalytics(req, res, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: expect.any(Array)
      });
    });

    test('should return 403 if app does not belong to user', async () => {
      // Setup
      req.query = { appId: 'app123' };
      App.findOne.mockResolvedValue(null);

      // Execute
      await getEventAnalytics(req, res, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: expect.any(String)
      });
    });
  });

  describe('collectEvent', () => {
    test('should create event successfully', async () => {
      // Setup
      req.body = {
        event: 'page_view',
        url: 'https://example.com',
        device: 'desktop',
        ipAddress: '127.0.0.1',
        timestamp: new Date().toISOString()
      };
      req.app = { id: 'app123' };

      Event.create.mockResolvedValue({
        id: 'event123',
        ...req.body
      });

      // Execute
      await collectEvent(req, res, next);

      // Assert
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: expect.any(String)
      });
    });
  });
}); 