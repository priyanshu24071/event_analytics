const Joi = require('joi');

const validateCollectEvent = (req, res, next) => {
  const schema = Joi.object({
    event: Joi.string().required(),
    url: Joi.string().uri().required(),
    referrer: Joi.string().uri().allow('').optional(),
    device: Joi.string().required(),
    ipAddress: Joi.string().ip().required(),
    userId: Joi.string().optional(),
    timestamp: Joi.date().iso().required(),
    metadata: Joi.object({
      browser: Joi.string().optional(),
      os: Joi.string().optional(),
      screenSize: Joi.string().optional()
    }).optional()
  });
  
  const { error } = schema.validate(req.body);
  
  if (error) {
    return res.status(400).json({
      success: false,
      message: 'Validation Error',
      errors: error.details.map(err => ({ message: err.message }))
    });
  }
  
  next();
};

const validateEventSummary = (req, res, next) => {
  
  const schema = Joi.object({
    event: Joi.string().required(),
    startDate: Joi.date().iso().optional(),
    endDate: Joi.date().iso().optional(),
    app_id: Joi.string().uuid().optional()
  });
  
  const { error } = schema.validate(req.query);
  
  if (error) {
    return res.status(400).json({
      success: false,
      message: 'Validation Error',
      errors: error.details.map(err => ({ 
        message: err.message,
        path: err.path,
        value: err.context.value
      }))
    });
  }
  
  next();
};

const validateUserStats = (req, res, next) => {
  const schema = Joi.object({
    userId: Joi.string().required()
  });
  
  const { error } = schema.validate(req.query);
  
  if (error) {
    return res.status(400).json({
      success: false,
      message: 'Validation Error',
      errors: error.details.map(err => ({ message: err.message }))
    });
  }
  
  next();
};

module.exports = {
  validateCollectEvent,
  validateEventSummary,
  validateUserStats
}; 