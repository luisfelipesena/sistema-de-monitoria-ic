# === Base Node Stage ===
FROM node:20-alpine AS base
WORKDIR /app

# === Development Dependencies Stage ===
# Install all dependencies needed for building
FROM base AS development-dependencies-env
COPY package.json package-lock.json* ./  # Copy root package files if they exist
COPY apps/backend/package.json apps/backend/package-lock.json* ./apps/backend/
WORKDIR /app/apps/backend
RUN npm install --ignore-scripts

# === Build Stage ===
# Build the backend application
FROM development-dependencies-env AS build-env
WORKDIR /app
# Copy the entire monorepo context
COPY . .
WORKDIR /app/apps/backend
# Explicitly build only the backend package using turbo filter
RUN npx turbo run build --filter=@sistema-de-monitoria-ic/backend

# === Production Dependencies Stage ===
# Install only production dependencies
FROM base AS production-dependencies-env
COPY package.json package-lock.json* ./ # Copy root package files if they exist
COPY apps/backend/package.json apps/backend/package-lock.json* ./apps/backend/
WORKDIR /app/apps/backend
RUN npm install --omit=dev --ignore-scripts

# === Production Stage ===
# Create the final production image
FROM node:20-alpine AS production
WORKDIR /app

# Copy production node_modules
COPY --from=production-dependencies-env /app/apps/backend/node_modules ./apps/backend/node_modules

# Copy built application code
COPY --from=build-env /app/apps/backend/dist ./apps/backend/dist

# Copy necessary package files for running
COPY apps/backend/package.json ./apps/backend/

WORKDIR /app/apps/backend

# Set environment variables if needed, e.g., PORT
# ENV NODE_ENV=production
# ENV PORT=3000

EXPOSE 5000

CMD ["npm", "run", "start"] 