
const errorHandler = (err, req, res, next) => {
  
  // Database validation errors
  if (err.name === 'SequelizeValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Validation Error',
      errors: err.errors.map(e => ({ field: e.path, message: e.message }))
    });
  }
  
  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }
  
  // Default error
  return res.status(500).json({
    success: false,
    message: 'Internal server error'
  });
};

module.exports = { errorHandler }; 