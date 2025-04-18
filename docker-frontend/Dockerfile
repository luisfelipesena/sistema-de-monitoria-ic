# === Base Node Stage ===
FROM node:20-alpine AS base
WORKDIR /app
# Garantir uma versão específica do npm para evitar problemas de compatibilidade
RUN npm install -g npm@10.8.0

# === Development Dependencies Stage ===
# Install all dependencies needed for building
FROM base AS development-dependencies-env
# Copy root package files if they exist
COPY package.json package-lock.json* ./
COPY apps/frontend/package.json apps/frontend/package-lock.json* ./apps/frontend/
WORKDIR /app/apps/frontend
RUN npm install --ignore-scripts

# === Build Stage ===
# Build the frontend application
FROM development-dependencies-env AS build-env
WORKDIR /app
# Copy the entire monorepo context first
COPY . .
# Ensure backend shared types are available for the build
# The path resolution in tsconfig should handle the rest
WORKDIR /app/apps/frontend
# Explicitly build only the frontend package using turbo filter
RUN npx turbo run build --filter=@sistema-de-monitoria-ic/frontend

# === Production Dependencies Stage ===
# Install only production dependencies (needed for vite preview)
FROM base AS production-dependencies-env
# Copy root package files if they exist
COPY package.json package-lock.json* ./
COPY apps/frontend/package.json apps/frontend/package-lock.json* ./apps/frontend/
WORKDIR /app/apps/frontend
# Need vite for preview, so install all deps, but could optimize later
# if preview server has minimal deps
RUN npm install --ignore-scripts

# === Production Stage ===
# Create the final production image
FROM node:20-alpine AS production
WORKDIR /app

# Copy production node_modules
COPY --from=production-dependencies-env /app/apps/frontend/node_modules ./apps/frontend/node_modules

# Copy built application code
COPY --from=build-env /app/apps/frontend/dist ./apps/frontend/dist

# Copy necessary package files for running
COPY apps/frontend/package.json ./apps/frontend/

WORKDIR /app/apps/frontend

# Set environment variables if needed
# ENV NODE_ENV=production
# ENV VITE_API_URL=http://your-backend-url

EXPOSE 5000

CMD ["npm", "run", "start"] 