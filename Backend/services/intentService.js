const { classifyIntent } = require('../utils/intentServer'); 

const detectUserIntent = async (message) => {
    const label = await classifyIntent(message);

    let intent;
    switch(label) {
        case 'loan_request':
        case 'kyc_check':
        case 'eligibility_check':
            intent = label; 
            break;
        case 'account_help':
            intent = 'account_help';
            break;
        case 'other':
            intent = 'other';
            break;
        default:
            intent = 'fallback'; 
    }

    return { intent };
};

module.exports = { detectUserIntent };