# === Base Node Stage ===
FROM node:20-alpine AS base
WORKDIR /app

# === Development Dependencies Stage ===
# Install all dependencies needed for building
FROM base AS development-dependencies-env
COPY package.json package-lock.json* ./ # Copy root package files if they exist
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
RUN npm run build

# === Production Dependencies Stage ===
# Install only production dependencies (needed for vite preview)
FROM base AS production-dependencies-env
COPY package.json package-lock.json* ./ # Copy root package files if they exist
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

EXPOSE 3000 # Match the port in the start script

CMD ["npm", "run", "start"]