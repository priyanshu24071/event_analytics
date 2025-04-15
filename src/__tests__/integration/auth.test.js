// src/__tests__/integration/auth.test.js
const request = require('supertest');
const { sequelize } = require('../../db/models');
const app = require('../../app');
const { User, App, ApiKey } = require('../../db/models');
const jwt = require('jsonwebtoken');
const config = require('../../config/config');
const { setupTestDatabase, closeTestDatabase } = require('./setup');

let token;
let userId;
let appId;

beforeAll(async () => {
  // Setup test database and create test user
  await setupTestDatabase();

  const user = await User.create({
    name: 'Test User',
    email: 'test@example.com',
    password: 'password123'
  });
  
  userId = user.id;
  token = jwt.sign({ id: user.id }, config.auth.jwtSecret, {
    expiresIn: config.auth.jwtExpiresIn
  });
});

afterAll(async () => {
    await closeTestDatabase();
});

describe('Auth API', () => {
  test('should register a new app and generate API key', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Test App',
        domain: 'test.com',
        type: 'website'
      });
    
    expect(res.statusCode).toEqual(201);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body.data).toHaveProperty('appId');
    expect(res.body.data).toHaveProperty('apiKey');
    
    appId = res.body.data.appId;
  });
  
  test('should get API key for app', async () => {
    const res = await request(app)
      .get(`/api/auth/api-key?appId=${appId}`)
      .set('Authorization', `Bearer ${token}`);
    
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body.data).toHaveProperty('apiKey');
    expect(res.body.data).toHaveProperty('expiresAt');
  });
  
  test('should revoke API key', async () => {
    const res = await request(app)
      .post('/api/auth/revoke')
      .set('Authorization', `Bearer ${token}`)
      .send({ appId });
    
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body).toHaveProperty('message', 'API key(s) revoked successfully');
    
    // Verify API key is actually revoked
    const apiKey = await ApiKey.findOne({ where: { appId } });
    expect(apiKey.isActive).toBe(false);
  });
  
  test('should regenerate API key', async () => {
    const res = await request(app)
      .post('/api/auth/regenerate')
      .set('Authorization', `Bearer ${token}`)
      .send({ appId });
    
    expect(res.statusCode).toEqual(201);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body.data).toHaveProperty('apiKey');
    expect(res.body.data).toHaveProperty('expiresAt');
    
    // Verify a new API key was created
    const apiKeys = await ApiKey.findAll({ where: { appId } });
    expect(apiKeys.length).toBeGreaterThan(1);
    
    // One should be active, others inactive
    const activeKeys = apiKeys.filter(key => key.isActive);
    expect(activeKeys.length).toBe(1);
  });
});