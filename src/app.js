const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const passport = require('passport');
const config = require('./config/config');
const db = require('./db/models');
const logger = require('./utils/logger');
const routes = require('./api/routes');
const { errorHandler } = require('./api/middlewares/errorHandler');
const { setupGoogleStrategy } = require('./config/passport');
const swaggerConfig = require('./config/swagger');
require('dotenv').config();

// Initialize app
const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Initialize passport
app.use(passport.initialize());
setupGoogleStrategy();

// API routes
app.use('/api', routes);

// Swagger docs
app.use('/api-docs', swaggerConfig.serve, swaggerConfig.setup);

// Root route
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to Event Analytics API' });
});

// Error handler
app.use(errorHandler);

// Start server
const PORT = config.port || 3001;

db.sequelize.sync({ alter: true })
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
      console.log(`API Documentation available at http://localhost:${PORT}/api-docs`);
    });
  })
  .catch(err => {
    logger.error('Unable to connect to the database:', err);
  });

module.exports = app; 