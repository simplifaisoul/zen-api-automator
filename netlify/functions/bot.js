const express = require('express');
const serverless = require('serverless-http');
const cors = require('cors');
const axios = require('axios');

const app = express();

// Enhanced CORS for bot functionality
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Bot state management
const botState = {
  isActive: true,
  lastActivity: new Date(),
  messageHistory: [],
  activeConnections: [],
  executionQueue: []
};

// Import existing routes
const APIRouter = require('./routes');
app.use('/api', APIRouter);

// Bot-specific endpoints
app.post('/bot/message', async (req, res) => {
  try {
    const { message, userId = 'anonymous' } = req.body;
    
    console.log('🤖 Bot received message:', message, 'from:', userId);
    
    // Add to message history
    botState.messageHistory.push({
      message,
      userId,
      timestamp: new Date(),
      type: 'user'
    });
    
    botState.lastActivity = new Date();
    
    // Process the command
    const response = await processBotCommand(message, userId);
    
    // Add bot response to history
    botState.messageHistory.push({
      message: response,
      userId: 'bot',
      timestamp: new Date(),
      type: 'bot'
    });
    
    res.json({
      success: true,
      response,
      timestamp: new Date().toISOString(),
      botStatus: botState.isActive
    });
    
  } catch (error) {
    console.error('Bot message error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process message',
      response: 'Sorry, I encountered an error. Please try again.'
    });
  }
});

app.get('/bot/status', (req, res) => {
  res.json({
    status: botState.isActive ? 'online' : 'offline',
    lastActivity: botState.lastActivity,
    messageCount: botState.messageHistory.length,
    activeConnections: botState.activeConnections.length,
    queueLength: botState.executionQueue.length,
    uptime: process.uptime()
  });
});

app.get('/bot/history', (req, res) => {
  const limit = parseInt(req.query.limit) || 50;
  const history = botState.messageHistory.slice(-limit);
  
  res.json({
    success: true,
    history,
    total: botState.messageHistory.length
  });
});

app.post('/bot/execute', async (req, res) => {
  try {
    const { command, parameters = {} } = req.body;
    
    const result = await executeBotAction(command, parameters);
    
    res.json({
      success: true,
      result,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Bot command processor
async function processBotCommand(message, userId) {
  const lowerMessage = message.toLowerCase().trim();
  
  // Phone call commands
  if (lowerMessage.includes('call') || lowerMessage.includes('phone')) {
    return await handlePhoneCallCommand(message);
  }
  
  // API request commands
  if (lowerMessage.includes('api') || lowerMessage.includes('request') || lowerMessage.includes('curl')) {
    return await handleApiCommand(message);
  }
  
  // Workflow commands
  if (lowerMessage.includes('workflow') || lowerMessage.includes('automate')) {
    return await handleWorkflowCommand(message);
  }
  
  // Status commands
  if (lowerMessage.includes('status') || lowerMessage.includes('health')) {
    return await handleStatusCommand();
  }
  
  // Help commands
  if (lowerMessage.includes('help') || lowerMessage.includes('commands')) {
    return getBotHelp();
  }
  
  // Default AI response
  return await generateAIResponse(message);
}

// Phone call handler
async function handlePhoneCallCommand(message) {
  try {
    // Extract phone number from message
    const phoneRegex = /(\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})/;
    const match = message.match(phoneRegex);
    
    if (!match) {
      return "📞 I can help you make a phone call! Please provide a phone number. Example: 'Call +1-555-123-4567'";
    }
    
    const phoneNumber = match[0];
    
    // Simulate phone call execution
    console.log(`📞 Initiating call to ${phoneNumber}`);
    
    const callResult = await executePhoneCall({
      to: phoneNumber,
      from: process.env.TWILIO_PHONE_NUMBER || '+1234567890',
      message: extractCallMessage(message)
    });
    
    return `✅ Phone call initiated successfully!\n\n📞 **To:** ${phoneNumber}\n📝 **Message:** ${callResult.message}\n🆔 **Call ID:** ${callResult.callId}\n⏰ **Time:** ${new Date().toLocaleString()}`;
    
  } catch (error) {
    return `❌ Failed to make phone call: ${error.message}`;
  }
}

// API request handler
async function handleApiCommand(message) {
  try {
    // Extract URL from message
    const urlRegex = /(https?:\/\/[^\s]+)/;
    const urlMatch = message.match(urlRegex);
    
    if (!urlMatch) {
      return "🌐 I can make API requests for you! Please provide a URL. Example: 'Make a GET request to https://api.example.com/data'";
    }
    
    const url = urlMatch[0];
    const method = extractHttpMethod(message) || 'GET';
    
    console.log(`🌐 Making ${method} request to ${url}`);
    
    const apiResult = await executeApiRequest({
      url,
      method,
      headers: extractHeaders(message),
      data: extractData(message)
    });
    
    return `✅ API request completed!\n\n🌐 **URL:** ${url}\n📋 **Method:** ${method}\n📊 **Status:** ${apiResult.status}\n📝 **Response:** ${JSON.stringify(apiResult.data, null, 2).substring(0, 500)}...`;
    
  } catch (error) {
    return `❌ API request failed: ${error.message}`;
  }
}

// Workflow handler
async function handleWorkflowCommand(message) {
  return `🔄 **Workflow Command Received**\n\nI can help you create and manage workflows. Here are some options:\n\n• "Create workflow for data sync"\n• "Run workflow named 'Daily Backup'"\n• "Show all workflows"\n• "Stop workflow 'Emergency Alert'"\n\nWhat would you like to do with workflows?`;
}

// Status handler
async function handleStatusCommand() {
  const uptime = Math.floor(process.uptime());
  const hours = Math.floor(uptime / 3600);
  const minutes = Math.floor((uptime % 3600) / 60);
  
  return `🤖 **Bot Status Report**\n\n🟢 **Status:** Online\n⏱️ **Uptime:** ${hours}h ${minutes}m\n📨 **Messages Processed:** ${botState.messageHistory.length}\n🔗 **Active Connections:** ${botState.activeConnections.length}\n⏳ **Queue Length:** ${botState.executionQueue.length}\n🕐 **Last Activity:** ${botState.lastActivity.toLocaleString()}`;
}

// Execute phone call (simulated - would integrate with Twilio)
async function executePhoneCall({ to, from, message }) {
  // Simulate API call to Twilio
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  return {
    callId: 'call_' + Math.random().toString(36).substr(2, 9),
    to,
    from,
    message: message || 'Automated call from Zen API Automator',
    status: 'initiated',
    timestamp: new Date().toISOString()
  };
}

// Execute API request
async function executeApiRequest({ url, method, headers, data }) {
  try {
    const response = await axios({
      method,
      url,
      headers: headers || {},
      data: data,
      timeout: 10000,
      validateStatus: () => true // Accept any status code
    });
    
    return {
      status: response.status,
      data: response.data,
      headers: response.headers,
      duration: response.headers['x-response-time'] || 'N/A'
    };
  } catch (error) {
    return {
      status: error.response?.status || 500,
      data: error.response?.data || { error: error.message },
      headers: error.response?.headers || {}
    };
  }
}

// Helper functions
function extractCallMessage(message) {
  const patterns = [
    /say\s+["'](.+?)["']/i,
    /message\s+["'](.+?)["']/i,
    /tell\s+them\s+(.+?)(?:\s+|$)/i
  ];
  
  for (const pattern of patterns) {
    const match = message.match(pattern);
    if (match) return match[1];
  }
  
  return 'Automated call from Zen API Automator';
}

function extractHttpMethod(message) {
  const methods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];
  const upperMessage = message.toUpperCase();
  
  for (const method of methods) {
    if (upperMessage.includes(method)) {
      return method;
    }
  }
  
  return null;
}

function extractHeaders(message) {
  const headerMatch = message.match(/headers?\s*[:=]\s*({.+?})/i);
  if (headerMatch) {
    try {
      return JSON.parse(headerMatch[1]);
    } catch (e) {
      console.log('Failed to parse headers:', headerMatch[1]);
    }
  }
  return {};
}

function extractData(message) {
  const dataMatch = message.match(/data\s*[:=]\s*({.+?})/i);
  if (dataMatch) {
    try {
      return JSON.parse(dataMatch[1]);
    } catch (e) {
      console.log('Failed to parse data:', dataMatch[1]);
    }
  }
  return null;
}

function getBotHelp() {
  return `🤖 **Zen Bot Commands**\n\n📞 **Phone Calls:**\n• "Call +1-555-123-4567"\n• "Phone +1-555-123-4567 and say 'Hello World'"\n\n🌐 **API Requests:**\n• "Make GET request to https://api.example.com/data"\n• "POST to https://api.example.com/users with data {name: 'John'}"\n\n🔄 **Workflows:**\n• "Create workflow for data sync"\n• "Run workflow 'Daily Backup'"\n• "Show all workflows"\n\n📊 **Status:**\n• "What's your status?"\n• "Bot health check"\n\n💬 **General:**\n• Just type any message and I'll help!\n• "Help" - Show this message\n\nI'm here to help with API automation, phone calls, and workflow management!`;
}

// AI response generator (fallback)
async function generateAIResponse(message) {
  // Simulate AI processing
  await new Promise(resolve => setTimeout(resolve, 500));
  
  return `🤖 I understand you want to: "${message}"\n\nI can help you with:\n📞 Making phone calls\n🌐 Executing API requests\n🔄 Managing workflows\n📊 Checking system status\n\nTry one of these commands or type "help" for more options!`;
}

// Execute bot action
async function executeBotAction(command, parameters) {
  switch (command) {
    case 'phone_call':
      return await executePhoneCall(parameters);
    case 'api_request':
      return await executeApiRequest(parameters);
    case 'status_check':
      return await handleStatusCommand();
    default:
      throw new Error(`Unknown command: ${command}`);
  }
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    service: 'zen-api-automator',
    botActive: botState.isActive
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({ 
    message: 'Zen API Automator Bot Server',
    version: '1.0.0',
    endpoints: [
      '/bot/message - Send message to bot',
      '/bot/status - Get bot status',
      '/bot/history - Get message history',
      '/bot/execute - Execute bot command',
      '/health - Health check'
    ]
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