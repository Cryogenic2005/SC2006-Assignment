const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

const authRoutes = require('../../src/routes/auth');
const User = require('../../src/models/User');

const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);

let testToken;
let testUser;

beforeAll(async () => {
  await mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  // Create a test user manually
  testUser = new User({
    name: 'Route Tester',
    email: 'route_test@gmail.com',
    password: 'routepass',
    userType: 'customer',
  });

  await testUser.save();

  const payload = { user: { id: testUser.id, userType: testUser.userType } };
  testToken = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });
});

afterAll(async () => {
  await User.deleteMany({ email: /route_test/i });
  await mongoose.connection.close();
});

describe('Auth Routes', () => {
  it('POST /register - should create a new user', async () => {
    const uniqueEmail = `testuser_${Date.now()}@example.com`;

    const res = await request(app).post('/api/auth/register').send({
      name: 'New User',
      email: uniqueEmail,
      password: 'newpassword',
      userType: 'customer',
    });

    if (res.statusCode !== 200) {
      console.log('Register response body:', res.body);
    }

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('token');
    expect(res.body.user.email.toLowerCase()).toBe(uniqueEmail.toLowerCase());
  });

  it('POST /login - should login existing user', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'route_test@gmail.com',
      password: 'routepass',
    });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('token');
    expect(res.body.user.email.toLowerCase()).toBe('route_test@gmail.com');
  });

  it('GET /user - should return user if token is valid', async () => {
    const res = await request(app)
      .get('/api/auth/user')
      .set('x-auth-token', testToken);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('email');
    expect(res.body.email.toLowerCase()).toBe('route_test@gmail.com');
  });

  it('GET /user - should return 401 if no token', async () => {
    const res = await request(app).get('/api/auth/user');
    expect(res.statusCode).toBe(401);
    expect(res.body.msg).toBe('No token, authorization denied');
  });
});
