const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

// Import routes
const authRoutes = require('./src/routes/auth');
const userRoutes = require('./src/routes/users');
const hawkerRoutes = require('./src/routes/hawkers');
const stallRoutes = require('./src/routes/stalls');
const orderRoutes = require('./src/routes/orders');
const queueRoutes = require('./src/routes/queues');
const loyaltyRoutes = require('./src/routes/loyalty');
const crowdRoutes = require('./src/routes/crowds');
const locationRoutes = require('./src/routes/location');


// Initialize app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/hawkers', hawkerRoutes);
app.use('/api/stalls', stallRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/queues', queueRoutes);
app.use('/api/loyalty', loyaltyRoutes);
app.use('/api/crowd', crowdRoutes);
app.use('/api/location', locationRoutes); 

// Services
const MLService = require('./src/services/mlService');
const SchedulerService = require('./src/services/scheduler');

// Health check route
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : {},
  });
});

// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI)
  .then(async () => {
    console.log('Connected to MongoDB');

    // Check ML service health
    try {
      const mlServiceHealthy = await MLService.checkHealth();
      console.log(`ML Service health check: ${mlServiceHealthy ? 'Healthy' : 'Unhealthy'}`);

      // Start scheduled tasks if ML service is healthy
      if (mlServiceHealthy) {
        SchedulerService.startTasks();
        console.log('Scheduled tasks started');
      }
    } catch (error) {
      console.warn('ML Service health check failed:', error.message);
    }

    // Start server
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });