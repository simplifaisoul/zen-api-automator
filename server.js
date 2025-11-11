const express = require('express');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const APIRouter = require('./src/api/routes');
app.use('/api', APIRouter);

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  
  socket.on('execute-workflow', async (data) => {
    try {
      const result = await executeWorkflow(data);
      socket.emit('workflow-result', result);
    } catch (error) {
      socket.emit('workflow-error', { error: error.message });
    }
  });
  
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

async function executeWorkflow(workflow) {
  const results = [];
  
  for (const step of workflow.steps) {
    const result = await executeStep(step);
    results.push(result);
  }
  
  return results;
}

async function executeStep(step) {
  switch (step.type) {
    case 'curl':
      return await executeCurlRequest(step.config);
    case 'phone_call':
      return await analyzePhoneCall(step.config);
    case 'website':
      return await generateWebsite(step.config);
    default:
      throw new Error(`Unknown step type: ${step.type}`);
  }
}

async function executeCurlRequest(config) {
  const axios = require('axios');
  try {
    const response = await axios({
      method: config.method || 'GET',
      url: config.url,
      headers: config.headers || {},
      data: config.data,
      timeout: config.timeout || 30000
    });
    return {
      success: true,
      status: response.status,
      data: response.data,
      headers: response.headers
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      status: error.response?.status
    };
  }
}

async function analyzePhoneCall(config) {
  return {
    success: true,
    message: 'Phone call analysis simulated',
    phoneNumber: config.phoneNumber,
    analysis: 'Call quality: Good, Duration: 5:23'
  };
}

async function generateWebsite(config) {
  return {
    success: true,
    message: 'Website generation simulated',
    url: `https://${config.domain || 'generated-site.com'}`,
    template: config.template || 'modern'
  };
}

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Zen API Automator running on port ${PORT}`);
});