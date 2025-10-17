import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import dotenv from 'dotenv';
// Import routes
import marketRoutes from './routes/markets';
import profileRoutes from './routes/profiles';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors());
app.use(compression());
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/markets', marketRoutes);
app.use('/api/profiles', profileRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    services: {
      api: 'active',
      websocket: 'active'
    }
  });
});

// API health check for frontend
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'API is working', 
    timestamp: new Date().toISOString()
  });
});

// Simple test endpoint
app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'Test endpoint working',
    timestamp: new Date().toISOString()
  });
});

// Start server (only in development)
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`🚀 Polymarket Dashboard Server running on port ${PORT}`);
    console.log(`🔗 Health check: http://localhost:${PORT}/health`);
  });
}

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  console.log('Process terminated');
});

export { app };