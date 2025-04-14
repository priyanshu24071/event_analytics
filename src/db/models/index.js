const { Sequelize } = require('sequelize');
const config = require('../../config/config');

// Determine the environment and get the corresponding configuration
const env = process.env.NODE_ENV || 'development';
const dbConfig = config[env];

// Initialize Sequelize with the correct configuration
const sequelize = new Sequelize(
  dbConfig.database,
  dbConfig.username,
  dbConfig.password,
  {
    host: dbConfig.host,
    port: dbConfig.port,
    dialect: dbConfig.dialect,
    logging: env === 'development' ? console.log : false,
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
);

// Import models
const User = require('./user')(sequelize);
const App = require('./app')(sequelize);
const ApiKey = require('./apiKey')(sequelize);

// Define associations
User.hasMany(App, { foreignKey: 'userId' });
App.belongsTo(User, { foreignKey: 'userId' });

App.hasMany(ApiKey, { foreignKey: 'appId' });
ApiKey.belongsTo(App, { foreignKey: 'appId' });

// Export the db object
const db = {
  sequelize,
  Sequelize,
  User,
  App,
  ApiKey
};

module.exports = db;