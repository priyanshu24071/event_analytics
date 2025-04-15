const request = require('supertest');
const { sequelize } = require('../../db/models');
const app = require('../../app');
const { User, App } = require('../../db/models');
const jwt = require('jsonwebtoken');
const config = require('../../config/config');

let token;
let userId;
let appId;

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
});

afterAll(async () => {
  await sequelize.close();
});

describe('App API', () => {
  // Test create app
  test('should create an app', async () => {
    const res = await request(app)
      .post('/api/apps')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Test App',
        domain: 'test.com',
        type: 'website'
      });
    
    expect(res.statusCode).toEqual(201);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body.data).toHaveProperty('id');
    expect(res.body.data).toHaveProperty('name', 'Test App');
    
    appId = res.body.data.id;
  });
  
  // Test get apps
  test('should get all apps for user', async () => {
    const res = await request(app)
      .get('/api/apps')
      .set('Authorization', `Bearer ${token}`);
    
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('success', true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
    expect(res.body.data[0]).toHaveProperty('name', 'Test App');
  });
  
  // Test get app
  test('should get a single app', async () => {
    const res = await request(app)
      .get(`/api/apps/${appId}`)
      .set('Authorization', `Bearer ${token}`);
    
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body.data).toHaveProperty('id', appId);
    expect(res.body.data).toHaveProperty('name', 'Test App');
  });
  
  // Test update app
  test('should update an app', async () => {
    const res = await request(app)
      .put(`/api/apps/${appId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Updated App Name'
      });
    
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('success', true);
    
    // Verify the update
    const getRes = await request(app)
      .get(`/api/apps/${appId}`)
      .set('Authorization', `Bearer ${token}`);
    
    expect(getRes.body.data).toHaveProperty('name', 'Updated App Name');
  });
  
  // Test generate API key
  test('should generate an API key for an app', async () => {
    const res = await request(app)
      .post(`/api/apps/${appId}/api-key`)
      .set('Authorization', `Bearer ${token}`);
    
    expect(res.statusCode).toEqual(201);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body.data).toHaveProperty('key');
    expect(res.body.data).toHaveProperty('expiresAt');
  });
  
  // Test delete app
  test('should delete an app', async () => {
    const res = await request(app)
      .delete(`/api/apps/${appId}`)
      .set('Authorization', `Bearer ${token}`);
    
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('success', true);
    
    // Verify deletion
    const getRes = await request(app)
      .get(`/api/apps/${appId}`)
      .set('Authorization', `Bearer ${token}`);
    
    expect(getRes.statusCode).toEqual(404);
  });
});
