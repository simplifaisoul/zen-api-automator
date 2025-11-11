const express = require('express');
const serverless = require('serverless-http');
const cors = require('cors');
const axios = require('axios');

const app = express();

app.use(cors());
app.use(express.json());

const APIRouter = require('./routes');
app.use('/.netlify/functions/api', APIRouter);

// Health check endpoint
app.get('/.netlify/functions/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

module.exports.handler = serverless(app);