const { Sequelize } = require('sequelize');
const config = require('../../config/config');

const sequelize = new Sequelize(
  config.db.database,
  config.db.username,
  config.db.password,
  {
    host: config.db.host,
    port: config.db.port,
    dialect: config.db.dialect,
    logging: config.env === 'development' ? console.log : false,
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
);

// Models
const User = require('./user')(sequelize);
const App = require('./app')(sequelize);
const ApiKey = require('./apiKey')(sequelize);

// Associations
User.hasMany(App);
App.belongsTo(User);

App.hasMany(ApiKey);
ApiKey.belongsTo(App);


const db = {
  sequelize,
  Sequelize,
  User,
  App,
  ApiKey,
  
};

module.exports = db; 