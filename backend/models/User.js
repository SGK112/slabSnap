/**
 * User Model
 */

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: true,
    minlength: 6,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  userType: {
    type: String,
    enum: ['homeowner', 'contractor', 'supplier'],
    default: 'homeowner',
  },
  credits: {
    type: Number,
    default: 5, // Free credits on signup
  },
  adCredits: {
    type: Number,
    default: 0,
  },
  shopify: {
    connected: { type: Boolean, default: false },
    storeDomain: String,
    accessToken: String,
    scope: String,
    storeName: String,
    connectedAt: Date,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  lastLogin: Date,
});

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Remove password from JSON output
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.shopify?.accessToken;
  return obj;
};

export default mongoose.model('User', userSchema);
