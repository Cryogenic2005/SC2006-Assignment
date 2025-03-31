const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const jwt = require('jsonwebtoken');
const express = require('express');
const request = require('supertest');
const authMiddleware = require('../../src/middleware/auth');

const app = express();
app.use(express.json());

// Protected test route using auth middleware
app.get('/api/protected', authMiddleware, (req, res) => {
  res.json({ msg: 'Access granted', user: req.user });
});

describe('Auth Middleware', () => {
  it('should return 401 if no token is provided', async () => {
    const res = await request(app).get('/api/protected');
    expect(res.statusCode).toBe(401);
    expect(res.body.msg).toBe('No token, authorization denied');
  });

  it('should return 401 for an invalid token', async () => {
    const res = await request(app)
      .get('/api/protected')
      .set('x-auth-token', 'invalid-token');

    expect(res.statusCode).toBe(401);
    expect(res.body.msg).toBe('Token is not valid');
  });

  it('should call next() and respond with user for a valid token', async () => {
    const payload = {
      user: {
        id: 'test-user-id',
        userType: 'customer',
      },
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });

    const res = await request(app)
      .get('/api/protected')
      .set('x-auth-token', token);

    expect(res.statusCode).toBe(200);
    expect(res.body.msg).toBe('Access granted');
    expect(res.body.user).toEqual(payload.user);
  });
});
