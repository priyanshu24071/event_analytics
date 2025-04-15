// src/__tests__/integration/analytics.test.js
const request = require('supertest');
const { sequelize } = require('../../db/models');
const app = require('../../app');
const { User, App, ApiKey, Event } = require('../../db/models');
const jwt = require('jsonwebtoken');
const config = require('../../config/config');

let token;
let userId;
let appId;
let apiKey;

beforeAll(async () => {
  // Setup test database and create test user
  await sequelize.sync({ force: true });
  
  const user = await User.create({
    name: 'Test User',
    email: 'test@example.com',
    password: 'password123'
  });
  
  userId = user.id;
  token = jwt.sign({ id: user.id }, config.auth.jwtSecret, {
    expiresIn: config.auth.jwtExpiresIn
  });

  // Create a test app and API key
  const app = await App.create({
    name: 'Test App',
    domain: 'test.com',
    type: 'website',
    userId
  });
  
  appId = app.id;
  
  const apiKeyObj = await ApiKey.create({
    appId,
    expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
  });
  
  apiKey = apiKeyObj.key;
});

afterAll(async () => {
  await sequelize.close();
});

describe('Analytics API', () => {
  // Test event collection
  test('should collect an event', async () => {
    const res = await request(app)
      .post('/api/analytics/collect')
      .set('X-API-Key', apiKey)
      .send({
        event: 'page_view',
        url: 'https://test.com/home',
        referrer: 'https://google.com',
        device: 'desktop',
        ipAddress: '192.168.1.1',
        userId: '123',
        timestamp: new Date().toISOString(),
        metadata: {
          browser: 'Chrome',
          os: 'Windows',
          screenSize: '1920x1080'
        }
      });
    
    expect(res.statusCode).toEqual(201);
    expect(res.body).toHaveProperty('success', true);
    
    // Verify event was created in database
    const events = await Event.findAll({ where: { userId: '123' } });
    expect(events.length).toBeGreaterThan(0);
    expect(events[0].metadata).toHaveProperty('browser', 'Chrome');
  });
  
  // Test event summary
  test('should get event summary', async () => {
    const res = await request(app)
      .get(`/api/analytics/event-summary?event=page_view&app_id=${appId}`)
      .set('Authorization', `Bearer ${token}`);
    
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body.data).toHaveProperty('event', 'page_view');
    expect(res.body.data).toHaveProperty('count');
    expect(res.body.data).toHaveProperty('deviceData');
  });
  
  // Test user stats
  test('should get user stats', async () => {
    const res = await request(app)
      .get(`/api/analytics/user-stats?userId=123`)
      .set('Authorization', `Bearer ${token}`);
    
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body.data).toHaveProperty('userId', '123');
    expect(res.body.data).toHaveProperty('totalEvents');
    expect(res.body.data).toHaveProperty('deviceDetails');
  });
});