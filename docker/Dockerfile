FROM node:16-alpine

# Create app directory
WORKDIR /usr/src/app

# Install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy app source
COPY . .

# Expose port
EXPOSE 3000

# Start app
CMD ["node", "src/app.js"] 