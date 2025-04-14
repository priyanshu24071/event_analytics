const { User, App, ApiKey } = require('../../db/models');
const { v4: uuidv4 } = require('uuid');
const jwt = require('jsonwebtoken');
const config = require('../../config/config');
//const logger = require('../../utils/logger');

// Register a new app and generate API key
const register = async (req, res, next) => {
  try {
    const { name, domain, type } = req.body;
    const userId = req.user.id;
    
    // Create new app
    const app = await App.create({
      name,
      domain,
      type,
      UserId: userId
    });
    
    // Generate API key
    const apiKey = await ApiKey.create({
      AppId: app.id,
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year expiration
    });
    
    return res.status(201).json({
      success: true,
      data: {
        appId: app.id,
        apiKey: apiKey.key
      }
    });
  } catch (error) {
    logger.error('Error registering app:', error);
    next(error);
  }
};

// Get API key for an app
const getApiKey = async (req, res, next) => {
  try {
    const { appId } = req.query;
    const userId = req.user.id;
    
    // Verify app belongs to user
    const app = await App.findOne({
      where: {
        id: appId,
        UserId: userId
      }
    });
    
    if (!app) {
      return res.status(404).json({
        success: false,
        message: 'App not found or you do not have access'
      });
    }
    
    // Get active API key
    const apiKey = await ApiKey.findOne({
      where: {
        AppId: appId,
        isActive: true,
        expiresAt: {
          [db.Sequelize.Op.gt]: new Date()
        }
      }
    });
    
    if (!apiKey) {
      return res.status(404).json({
        success: false,
        message: 'No active API key found'
      });
    }
    
    return res.status(200).json({
      success: true,
      data: {
        apiKey: apiKey.key,
        expiresAt: apiKey.expiresAt
      }
    });
  } catch (error) {
    logger.error('Error getting API key:', error);
    next(error);
  }
};

// Revoke an API key
const revokeApiKey = async (req, res, next) => {
  try {
    const { appId } = req.body;
    const userId = req.user.id;
    
    // Verify app belongs to user
    const app = await App.findOne({
      where: {
        id: appId,
        UserId: userId
      }
    });
    
    if (!app) {
      return res.status(404).json({
        success: false,
        message: 'App not found or you do not have access'
      });
    }
    
    // Revoke all active API keys
    await ApiKey.update(
      { isActive: false },
      {
        where: {
          AppId: appId,
          isActive: true
        }
      }
    );
    
    return res.status(200).json({
      success: true,
      message: 'API key(s) revoked successfully'
    });
  } catch (error) {
    logger.error('Error revoking API key:', error);
    next(error);
  }
};

// Regenerate API key
const regenerateApiKey = async (req, res, next) => {
  try {
    const { appId } = req.body;
    const userId = req.user.id;
    
    // Verify app belongs to user
    const app = await App.findOne({
      where: {
        id: appId,
        UserId: userId
      }
    });
    
    if (!app) {
      return res.status(404).json({
        success: false,
        message: 'App not found or you do not have access'
      });
    }
    
    // Revoke old API keys
    await ApiKey.update(
      { isActive: false },
      {
        where: {
          AppId: appId,
          isActive: true
        }
      }
    );
    
    // Generate new API key
    const apiKey = await ApiKey.create({
      AppId: app.id,
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year expiration
    });
    
    return res.status(201).json({
      success: true,
      data: {
        apiKey: apiKey.key,
        expiresAt: apiKey.expiresAt
      }
    });
  } catch (error) {
    logger.error('Error regenerating API key:', error);
    next(error);
  }
};

module.exports = {
  register,
  getApiKey,
  revokeApiKey,
  regenerateApiKey
}; 