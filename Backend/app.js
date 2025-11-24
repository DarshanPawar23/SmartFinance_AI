const express = require('express');
const cors = require('cors');
const chatRoutes = require('./routes/chatRoutes');
const kycRoutes = require('./routes/kycRoutes');
const applicationRoutes = require('./routes/applicationRoutes');
require('./config/db');

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' })); 
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(express.static('public'));

app.use('/api/chat', chatRoutes);
app.use('/api', kycRoutes);
app.use('/api/application', applicationRoutes);

module.exports = app;