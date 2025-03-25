const mongoose = require('mongoose');
const request = require('supertest');
const app = require('../app');
const Hawker = require('../models/Hawker');
const Crowd = require('../models/Crowd');
const User = require('../models/User');

describe('Crowd Controller', () => {
  let token;
  let hawkerId;
  let userId;

  beforeAll(async () => {
    // Setup test database connection
    await mongoose.connect(process.env.MONGO_URI_TEST);
    
    // Create test user and get auth token
    const user = await User.create({/* user data */});
    userId = user._id;
    token = generateAuthToken(user);
    
    // Create test hawker
    const hawker = await Hawker.create({/* hawker data */});
    hawkerId = hawker._id;
  });

  afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    // Clear crowd reports before each test
    await Crowd.deleteMany({});
  });

  test('Should return 404 when hawker not found (TC-WB-05)', async () => {
    const response = await request(app)
      .post('/api/crowds')
      .set('x-auth-token', token)
      .send({
        hawkerId: mongoose.Types.ObjectId(), // Invalid ID
        level: 'Medium'
      });
    
    expect(response.status).toBe(404);
    expect(response.body.msg).toBe('Hawker center not found');
  });

  // Additional tests...
});