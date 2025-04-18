# Base image
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Apenas necessário caso queira garantir uma versão específica do npm
RUN npm install -g npm@10.8.0

# Copy package files
COPY package.json package-lock.json* ./
COPY apps/frontend/package.json apps/frontend/package-lock.json* ./apps/frontend/

# Install dependencies without running scripts
WORKDIR /app
RUN npm ci --prefix apps/frontend --include-workspace-root --ignore-scripts

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