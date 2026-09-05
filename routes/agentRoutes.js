const express = require('express');
const router = express.Router();

// In-memory store for the latest agent response
let latestData = null;

// POST /api/agent/receive — Receive JSON from test_api.sh
router.post('/receive', (req, res) => {
  latestData = {
    received_at: new Date().toISOString(),
    payload: req.body
  };
  console.log('✅ Agent data received:', JSON.stringify(latestData, null, 2).slice(0, 200) + '...');
  res.json({ success: true, message: 'Data received and stored' });
});

// GET /api/agent/latest — Frontend fetches the stored JSON
router.get('/latest', (req, res) => {
  if (!latestData) {
    return res.json({ success: false, message: 'No data received yet' });
  }
  res.json({ success: true, data: latestData });
});

module.exports = router;
