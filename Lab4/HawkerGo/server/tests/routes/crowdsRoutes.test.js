const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

const crowdRoutes = require('../../src/routes/crowds');
const User = require('../../src/models/User');
const Hawker = require('../../src/models/Hawker');
const Crowd = require('../../src/models/Crowd');

const app = express();
app.use(express.json());
app.use('/api/crowds', crowdRoutes);

let testUser;
let testToken;
let testHawker;

beforeAll(async () => {
  await mongoose.connect(process.env.MONGO_URI);

  testUser = new User({
    name: 'Crowd Tester',
    email: 'crowd_test@example.com',
    password: 'crowdpass',
    userType: 'customer',
  });
  await testUser.save();

  const payload = { user: { id: testUser.id, userType: testUser.userType } };
  testToken = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });

  testHawker = new Hawker({
    name: 'Test Hawker',
    location: {
      type: 'Point',
      coordinates: [103.851959, 1.290270], // longitude, latitude
      address: 'Test Address',
    },
  });
  await testHawker.save();
});

afterAll(async () => {
  await Crowd.deleteMany({ hawker: testHawker._id });
  await User.deleteMany({ email: /crowd_test/i });
  await Hawker.deleteMany({ name: /Test Hawker/i });
  await mongoose.connection.close();
});

describe('Crowd Routes', () => {
  it('POST /api/crowds - should report a crowd level (authorized)', async () => {
    const res = await request(app)
      .post('/api/crowds')
      .set('x-auth-token', testToken)
      .send({
        hawkerId: testHawker._id.toString(),
        level: 'Medium',
      });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('msg', 'Crowd level reported successfully');
  });

  it('POST /api/crowds - should fail without token', async () => {
    const res = await request(app)
      .post('/api/crowds')
      .send({
        hawkerId: testHawker._id.toString(),
        level: 'High',
      });

    expect(res.statusCode).toBe(401);
    expect(res.body.msg).toBe('No token, authorization denied');
  });

  it('GET /api/crowds/:hawkerId - should return crowd level', async () => {
    const res = await request(app).get(`/api/crowds/${testHawker._id}`);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('level');
    expect(res.body).toHaveProperty('validated');
    expect(res.body).toHaveProperty('message');
  });
});
