const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Event Analytics API',
      version: '1.0.0',
      description: 'API documentation for Event Analytics platform',
      contact: {
        name: 'API Support',
        email: 'support@example.com'
      }
    },
    servers: [
      {
        url: 'http://localhost:3001/api',
        description: 'Development server'
      },
      {
        url: 'https://api.example.com/api',
        description: 'Production server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        },
        apiKeyAuth: {
          type: 'apiKey',
          in: 'header',
          name: 'x-api-key'
        }
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid'
            },
            name: {
              type: 'string'
            },
            email: {
              type: 'string',
              format: 'email'
            },
            password: {
              type: 'string',
              format: 'password'
            },
            createdAt: {
              type: 'string',
              format: 'date-time'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time'
            }
          }
        },
        App: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid'
            },
            name: {
              type: 'string'
            },
            domain: {
              type: 'string'
            },
            type: {
              type: 'string',
              enum: ['website', 'mobile', 'desktop']
            },
            userId: {
              type: 'string',
              format: 'uuid'
            },
            createdAt: {
              type: 'string',
              format: 'date-time'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time'
            }
          }
        },
        Event: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid'
            },
            appId: {
              type: 'string',
              format: 'uuid'
            },
            type: {
              type: 'string'
            },
            name: {
              type: 'string'
            },
            url: {
              type: 'string',
              format: 'uri'
            },
            referrer: {
              type: 'string',
              format: 'uri'
            },
            device: {
              type: 'string'
            },
            ipAddress: {
              type: 'string',
              format: 'ipv4'
            },
            userId: {
              type: 'string'
            },
            sessionId: {
              type: 'string'
            },
            page: {
              type: 'string'
            },
            metadata: {
              type: 'object',
              properties: {
                browser: {
                  type: 'string'
                },
                os: {
                  type: 'string'
                },
                screenSize: {
                  type: 'string'
                }
              }
            },
            timestamp: {
              type: 'string',
              format: 'date-time'
            },
            createdAt: {
              type: 'string',
              format: 'date-time'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time'
            }
          }
        },
        ApiKey: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid'
            },
            key: {
              type: 'string'
            },
            appId: {
              type: 'string',
              format: 'uuid'
            },
            isActive: {
              type: 'boolean'
            },
            expiresAt: {
              type: 'string',
              format: 'date-time'
            },
            createdAt: {
              type: 'string',
              format: 'date-time'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time'
            }
          }
        },
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false
            },
            message: {
              type: 'string'
            },
            errors: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  message: {
                    type: 'string'
                  }
                }
              }
            }
          }
        }
      },
      security: [
        {
          bearerAuth: []
        }
      ]
    }
  },
  apis: ['./src/api/routes/*.js', './src/api/controllers/*.js']
};

const specs = swaggerJsdoc(options);

module.exports = {
  serve: swaggerUi.serve,
  setup: swaggerUi.setup(specs, {
    explorer: true,
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'Event Analytics API Documentation'
  })
}; 
 