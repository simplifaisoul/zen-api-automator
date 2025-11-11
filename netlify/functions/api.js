const express = require('express');
const serverless = require('serverless-http');
const cors = require('cors');

const app = express();

// CORS configuration
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Import routes
const APIRouter = require('./routes');
app.use('/api', APIRouter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    service: 'zen-api-automator'
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({ 
    message: 'Zen API Automator Serverless Functions',
    version: '1.0.0',
    endpoints: ['/api/health', '/api/connections', '/api/workflows', '/api/ai/chat']
  });
});

// Handle 404
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Handle errors
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

module.exports.handler = serverless(app);