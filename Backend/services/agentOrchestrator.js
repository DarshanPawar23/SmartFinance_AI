const { masterDecide } = require('../models/masterAgent');
const { handle: salesAgentHandle } = require('../models/salesAgent');
const { handleFallback } = require('../models/fallbackAgent');

const orchestrateChat = async ({ message, sessionId }) => {
    let agentResponse;
    const { agentType } = await masterDecide(message, sessionId);
    console.log(`[Orchestrator] Master decided on agent: ${agentType}`);

    switch (agentType) {
        case 'salesAgent':
            agentResponse = await salesAgentHandle({ sessionId, message });
            break;
        case 'fallbackAgent':
        default:
            agentResponse = await handleFallback({ sessionId, message });
            break;
    }

    return {
        intent: agentResponse.intent,
        response: agentResponse.response,
        sessionId: agentResponse.sessionId,
        routedTo: agentType,
        offerKey: agentResponse.offerKey 
    };
};

module.exports = { orchestrateChat };