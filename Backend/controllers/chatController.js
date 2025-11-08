const { orchestrateChat } = require('../services/agentOrchestrator'); 

function makeSessionIdFrom(req) {
  return req.body.sessionId || req.headers['x-session-id'] || (Date.now().toString(36) + Math.random().toString(36).slice(2,10));
}

const chatHandler = async (req, res) => {
  try {
    const body = req.body || {};
    const { message } = body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const sessionId = makeSessionIdFrom(req);
    const orchestratedResult = await orchestrateChat({ message, sessionId });

    res.json({ 
        intent: orchestratedResult.intent, 
        response: orchestratedResult.response, 
        sessionId: orchestratedResult.sessionId,
        offerKey: orchestratedResult.offerKey 
    });

  } catch (err) {
    console.error('Chat handler error:', err.message);
    res.status(500).json({ error: 'Server error', details: err.message }); 
  }
};

module.exports = { chatHandler };