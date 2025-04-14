const { DataTypes } = require('sequelize');
const jwt = require('jsonwebtoken');
const config = require('../../config/config');

module.exports = (sequelize) => {
  const User = sequelize.define('User', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true
      }
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    googleId: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true
    },
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    updatedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  });
  User.prototype.generateJWT = function() {
    return jwt.sign(
      { 
        id: this.id,
        email: this.email,
        name: this.name
      }, 
      config.auth.jwtSecret,
      { expiresIn: config.auth.jwtExpiresIn }
    );
  };
  return User;
}; 