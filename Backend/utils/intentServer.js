
require('dotenv').config();
const axios = require('axios');

const LOCAL_PYTHON_API = 'http://127.0.0.1:8000/classify-intent';

const classifyIntent = async (text) => {
  try {

    const response = await axios.post(
      LOCAL_PYTHON_API,
      {
        text: text 
      },
      {
        // Give the local model 60s to load/run if it's on a slow CPU
        timeout: 60000 
      }
    );

    // 3. GET THE INTENT FROM THE RESPONSE
    const label = response.data.intent;
    if (!label) {
      console.error('Local intent server returned an empty intent:', response.data);
      return 'unknown';
    }
    
    return label.toLowerCase();

  } catch (err) {
    console.error('Intent classification error (calling local Python):', err.message);
    if (err.code === 'ECONNREFUSED') {
      console.error('---');
      console.error('FATAL: Cannot connect to the Python AI server. Is it running?');
      console.error('Run: uvicorn server:app --reload --port 8000 (inside python-llm folder)');
      console.error('---');
    } else {
      console.error(err.response?.data || "");
    }
    return 'unknown';
  }
};

module.exports = { classifyIntent };