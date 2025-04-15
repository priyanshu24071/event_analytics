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
            createdAt: {
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
              enum: ['website', 'mobile']
            },
            createdAt: {
              type: 'string',
              format: 'date-time'
            },
            ApiKeys: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/ApiKey'
              }
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
            isActive: {
              type: 'boolean'
            },
            expiresAt: {
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
            type: {
              type: 'string'
            },
            name: {
              type: 'string'
            },
            data: {
              type: 'object'
            },
            timestamp: {
              type: 'string',
              format: 'date-time'
            },
            userId: {
              type: 'string'
            },
            sessionId: {
              type: 'string'
            },
            page: {
              type: 'string'
            }
          }
        }
      }
    }
  },
  apis: ['./src/api/controllers/*.js', './src/api/routes/*.js']
};

const specs = swaggerJsdoc(options);

module.exports = {
  serve: swaggerUi.serve,
  setup: swaggerUi.setup(specs)
}; 