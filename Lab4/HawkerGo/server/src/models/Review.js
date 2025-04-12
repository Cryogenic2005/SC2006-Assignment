const mongoose = require('mongoose');

const ReviewSchema = new mongoose.Schema({
  stall: { type: mongoose.Schema.Types.ObjectId, ref: 'Stall', required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
  text: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Review', ReviewSchema);
