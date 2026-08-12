const express = require('express');
const cors = require('cors');
const path = require('path');
const logger = require('./utils/logger');

// Express application instance
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static frontend dashboard
app.use(express.static(path.join(__dirname, '../public')));

// Request logging middleware
app.use((req, res, next) => {
  if (!req.path.startsWith('/api/logs') && !req.path.startsWith('/api/status')) {
    logger.info('http_server', `${req.method} ${req.path} - ${req.ip}`);
  }
  next();
});

// Container & system healthcheck
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'UP',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Mount Trigger Routes & User Profile Routes
const triggerRoutes = require('./routes/triggers');
const userProfileRoutes = require('./routes/user_profile');

app.use('/api', triggerRoutes);
app.use('/api', userProfileRoutes);

// Fallback route serving the control panel dashboard
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error('express_error_handler', `Unhandled Express Error: ${err.message}`);
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message
  });
});

// Start listening
app.listen(PORT, '0.0.0.0', () => {
  logger.info('app_init', `Fixly Target App running on http://0.0.0.0:${PORT}`);
  logger.info('app_init', `Writing system log stream to: ${logger.logFilePath}`);
});
