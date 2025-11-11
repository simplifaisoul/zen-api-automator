const express = require('express');
const router = express.Router();
const axios = require('axios');

router.get('/connections', async (req, res) => {
  try {
    const connections = [
      { id: '1', name: 'OpenAI API', type: 'ai', status: 'connected' },
      { id: '2', name: 'Twilio', type: 'communication', status: 'connected' },
      { id: '3', name: 'Stripe', type: 'payment', status: 'disconnected' },
      { id: '4', name: 'SendGrid', type: 'email', status: 'connected' }
    ];
    res.json(connections);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/test-connection', async (req, res) => {
  try {
    const { url, headers, method = 'GET' } = req.body;
    
    const response = await axios({
      method,
      url,
      headers: headers || {},
      timeout: 10000
    });
    
    res.json({
      success: true,
      status: response.status,
      responseTime: response.headers['x-response-time'] || 'N/A'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message,
      status: error.response?.status
    });
  }
});

router.post('/execute-curl', async (req, res) => {
  try {
    const { url, method, headers, data, timeout } = req.body;
    
    const response = await axios({
      method: method || 'GET',
      url,
      headers: headers || {},
      data,
      timeout: timeout || 30000
    });
    
    res.json({
      success: true,
      status: response.status,
      data: response.data,
      headers: response.headers
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message,
      status: error.response?.status
    });
  }
});

router.get('/workflows', async (req, res) => {
  try {
    const workflows = [
      {
        id: '1',
        name: 'Daily API Health Check',
        description: 'Checks status of all connected APIs',
        status: 'active',
        lastRun: new Date().toISOString()
      },
      {
        id: '2',
        name: 'Customer Onboarding',
        description: 'Automated customer setup process',
        status: 'inactive',
        lastRun: null
      }
    ];
    res.json(workflows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/workflows', async (req, res) => {
  try {
    const { name, description, steps } = req.body;
    const workflow = {
      id: Date.now().toString(),
      name,
      description,
      steps,
      status: 'inactive',
      createdAt: new Date().toISOString()
    };
    res.json(workflow);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;