/**
 * REMODELY.AI Backend Server
 * Secure API proxy and authentication for the mobile app
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

import pool, { initDatabase } from './db/index.js';
import authRoutes from './routes/auth.js';
import aiRoutes from './routes/ai.js';
import shopifyRoutes from './routes/shopify.js';
import contactRoutes from './routes/contact.js';
import subscriptionRoutes from './routes/subscriptions.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet());
app.use(cors({
  origin: true, // Reflect the request origin (allows all origins including null)
  credentials: true,
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: { error: 'Too many requests, please try again later.' },
});
app.use('/api/', limiter);

// Parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Logging
app.use(morgan('combined'));

// Connect to PostgreSQL
const connectDB = async () => {
  if (!process.env.DATABASE_URL) {
    console.log('⚠️ No DATABASE_URL - running without database');
    return;
  }

  try {
    // Test connection
    const client = await pool.connect();
    console.log('✅ PostgreSQL connected');
    client.release();

    // Initialize tables
    await initDatabase();
  } catch (error) {
    console.error('❌ PostgreSQL connection error:', error.message);
  }
};

// Health check
app.get('/', (req, res) => {
  res.json({
    name: 'Remodely.AI Backend',
    version: '1.0.0',
    status: 'healthy',
    timestamp: new Date().toISOString(),
  });
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/shopify', shopifyRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/subscriptions', subscriptionRoutes);

// Error handling
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Start server
const start = async () => {
  await connectDB();

  app.listen(PORT, () => {
    console.log(`
╔════════════════════════════════════════╗
║     REMODELY.AI Backend Server         ║
╠════════════════════════════════════════╣
║  Status:  🟢 Running                   ║
║  Port:    ${PORT}                           ║
║  Env:     ${process.env.NODE_ENV || 'development'}                  ║
╚════════════════════════════════════════╝
    `);
  });
};

start();
