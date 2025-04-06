const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');

const User = require('../../src/models/User');
const authController = require('../../src/controllers/authController');

const app = express();
app.use(express.json());

// Mount controller route
app.post('/api/auth/login', authController.login);

// Increase timeout for DB operations
jest.setTimeout(30000);

beforeAll(async () => {
  const dbUri = process.env.MONGO_URI;

  if (!dbUri) {
    throw new Error('MONGO_URI not found in .env');
  }

  await mongoose.connect(dbUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
});

afterAll(async () => {
  await mongoose.connection.close();
});

describe('Auth Controller - Login', () => {
  it('should login an existing user with correct credentials', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'TEST@gmail.com',
      password: 'TESTPASSWORD',
    });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('token');
    expect(res.body.user.email.toLowerCase()).toBe('test@gmail.com');
  });

  it('should fail login with incorrect password', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'TEST@gmail.com',
      password: 'wrongpassword',
    });

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('Invalid credentials');
  });

  it('should fail login with non-existent user', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'nouser@example.com',
      password: 'irrelevant',
    });

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe('Invalid credentials');
  });
});
