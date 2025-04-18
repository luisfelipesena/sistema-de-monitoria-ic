# Base image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json ./
COPY turbo.json ./
COPY apps/frontend/package.json ./apps/frontend/

# Install dependencies without running scripts
RUN npm install --prefix apps/frontend --ignore-scripts

# Copy application code
COPY . .

# Build only the frontend application
RUN npx turbo run build --filter=@sistema-de-monitoria-ic/frontend

# Set working directory to frontend app
WORKDIR /app/apps/frontend

# Expose port
EXPOSE 5000

# Start the application
CMD ["npm", "run", "start"] 