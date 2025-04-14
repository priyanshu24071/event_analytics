const { ApiKey, App } = require('../../db/models');

const validateApiKey = async (req, res, next) => {
  try {
    const apiKey = req.headers['x-api-key'];
    
    if (!apiKey) {
      return res.status(401).json({
        success: false,
        message: 'API key is required'
      });
    }
    
    // Validate API key
    const key = await ApiKey.findOne({
      where: {
        key: apiKey,
        isActive: true,
        expiresAt: {
          [db.Sequelize.Op.gt]: new Date()
        }
      },
      include: [{ model: App }]
    });
    
    if (!key) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired API key'
      });
    }
    
    // Attach app to request
    req.app = key.App;
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = { validateApiKey }; 