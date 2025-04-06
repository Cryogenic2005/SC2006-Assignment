const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

const hawkerRoutes = require('../../src/routes/hawkers');
const Hawker = require('../../src/models/Hawker');
const User = require('../../src/models/User');
const Stall = require('../../src/models/Stall');

const app = express();
app.use(express.json());
app.use('/api/hawkers', hawkerRoutes);

let testUser, testToken, testHawker;

beforeAll(async () => {
  await mongoose.connect(process.env.MONGO_URI);

  testUser = new User({
    name: 'Test User',
    email: 'hawker_test@example.com',
    password: 'testpass123',
    userType: 'customer' // ✅ valid enum
  });
  await testUser.save();

  const payload = { user: { id: testUser._id, userType: testUser.userType } };
  testToken = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });

  testHawker = new Hawker({
    name: 'Test Hawker',
    description: 'This is a test hawker.',
    location: {
      type: 'Point',
      coordinates: [103.851959, 1.290270],
      address: '123 Test Street, Singapore'
    },
    operatingHours: {
      monday: { open: '08:00', close: '20:00' },
      tuesday: { open: '08:00', close: '20:00' },
      wednesday: { open: '08:00', close: '20:00' },
      thursday: { open: '08:00', close: '20:00' },
      friday: { open: '08:00', close: '20:00' },
      saturday: { open: '08:00', close: '20:00' },
      sunday: { open: '08:00', close: '20:00' },
    }
  });

  await testHawker.save();
});

afterAll(async () => {
  await Hawker.deleteMany({ name: /Test/i });
  await User.deleteMany({ email: /hawker_test/i });
  await Stall.deleteMany({});
  await mongoose.connection.close();
});

describe('Hawker Routes', () => {
  it('GET /api/hawkers - should return all hawkers', async () => {
    const res = await request(app).get('/api/hawkers');
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.some(h => h.name === 'Test Hawker')).toBe(true);
  });

  it('GET /api/hawkers/:id - should return a hawker by ID', async () => {
    const res = await request(app).get(`/api/hawkers/${testHawker._id}`);
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('name', testHawker.name);
  });

  it('GET /api/hawkers/:id/stalls - should return stalls for a hawker', async () => {
    const res = await request(app).get(`/api/hawkers/${testHawker._id}/stalls`);
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('GET /api/hawkers/search/:query - should return matching hawkers', async () => {
    const res = await request(app).get('/api/hawkers/search/Test');
    expect(res.statusCode).toBe(200);
    expect(res.body.some(h => h.name.includes('Test'))).toBe(true);
  });

  it('GET /api/hawkers/nearby/:lat/:lng - should return nearby hawkers', async () => {
    const res = await request(app).get('/api/hawkers/nearby/1.290270/103.851959');
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});
