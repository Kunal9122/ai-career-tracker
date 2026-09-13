const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

process.env.JWT_SECRET = 'test_secret';
process.env.NODE_ENV = 'test';
process.env.CLIENT_URL = 'http://localhost:5173';

let app;
let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  process.env.MONGO_URI = mongoServer.getUri();
  await mongoose.connect(process.env.MONGO_URI);
  app = require('../app');
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  await mongoServer.stop();
});

describe('Auth flows', () => {
  const credentials = { name: 'Test User', email: 'test@example.com', password: 'password123' };
  let token;

  it('registers a new user', async () => {
    const res = await request(app).post('/api/auth/register').send(credentials);
    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.password).toBeUndefined();
    expect(res.body.data.token).toBeDefined();
  });

  it('rejects duplicate registration', async () => {
    const res = await request(app).post('/api/auth/register').send(credentials);
    expect(res.statusCode).toBe(409);
    expect(res.body.success).toBe(false);
  });

  it('rejects registration with a weak password', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Weak', email: 'weak@example.com', password: '123' });
    expect(res.statusCode).toBe(400);
  });

  it('logs in with correct credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: credentials.email, password: credentials.password });
    expect(res.statusCode).toBe(200);
    expect(res.body.data.token).toBeDefined();
    token = res.body.data.token;
  });

  it('rejects login with wrong password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: credentials.email, password: 'wrongpassword' });
    expect(res.statusCode).toBe(401);
  });

  it('fetches current user with a valid token', async () => {
    const res = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.data.user.email).toBe(credentials.email);
  });

  it('rejects access without a token', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.statusCode).toBe(401);
  });

  it('updates profile fields', async () => {
    const res = await request(app)
      .put('/api/users/profile')
      .set('Authorization', `Bearer ${token}`)
      .send({ skills: ['React', 'Node.js'], location: 'Bangalore' });
    expect(res.statusCode).toBe(200);
    expect(res.body.data.user.skills).toContain('React');
  });
});
