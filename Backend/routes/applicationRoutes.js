const express = require('express');
const router = express.Router();

const { getApplicationStatus } = require('../controllers/applicationController');
router.get('/status/:pan', getApplicationStatus);

module.exports = router;