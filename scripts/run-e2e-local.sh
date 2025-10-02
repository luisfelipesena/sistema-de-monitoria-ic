#!/bin/bash

# Script to run E2E tests locally, replicating CI pipeline
# This script mimics the GitHub Actions workflow for local development

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Starting Local E2E Test Pipeline${NC}"
echo "This script replicates the CI pipeline locally"
echo ""

# Check if .env.test exists
if [ ! -f .env.test ]; then
    echo -e "${YELLOW}⚠️  .env.test not found. Creating from .env.sample...${NC}"

    if [ -f .env.sample ]; then
        cp .env.sample .env.test
        echo -e "${GREEN}✅ Created .env.test from .env.sample${NC}"
        echo -e "${YELLOW}⚠️  Please update .env.test with your local test database credentials${NC}"
        echo ""
    else
        echo -e "${RED}❌ .env.sample not found. Please create .env.test manually${NC}"
        exit 1
    fi
fi

# Load test environment variables
export $(cat .env.test | grep -v '^#' | xargs)

# Ensure we're using test database
if [[ ! "$DATABASE_URL" =~ "_test" ]]; then
    echo -e "${RED}❌ DATABASE_URL must contain '_test' for safety${NC}"
    echo "Current DATABASE_URL: $DATABASE_URL"
    exit 1
fi

echo -e "${GREEN}✅ Using test database: $DATABASE_URL${NC}"
echo ""

# Step 1: Install dependencies
echo -e "${GREEN}📦 Step 1/7: Installing dependencies...${NC}"
npm ci
echo ""

# Step 2: Run linting
echo -e "${GREEN}🔍 Step 2/7: Running linting...${NC}"
npm run lint
echo ""

# Step 3: Run type checking
echo -e "${GREEN}📝 Step 3/7: Running type checking...${NC}"
npm run typecheck
echo ""

# Step 4: Build application
echo -e "${GREEN}🏗️  Step 4/7: Building application...${NC}"
npm run build
echo ""

# Step 5: Setup database
echo -e "${GREEN}🗄️  Step 5/7: Setting up test database...${NC}"
echo "Pushing database schema..."
npx drizzle-kit push --force

echo "Seeding test users..."
npm run seed:test-user || npm run seed:test-user:js
echo ""

# Step 6: Install Playwright browsers
echo -e "${GREEN}🌐 Step 6/7: Installing Playwright browsers...${NC}"
npm run test:e2e:install
echo ""

# Step 7: Start app and run E2E tests
echo -e "${GREEN}🎭 Step 7/7: Starting application and running E2E tests...${NC}"

# Kill any process on port 3000
echo "Killing any existing process on port 3000..."
lsof -ti:3000 | xargs kill -9 2>/dev/null || true

# Start the application in background
echo "Starting Next.js application..."
NODE_ENV=production npm run start &
APP_PID=$!

# Save PID to file for cleanup
echo $APP_PID > .app.pid

# Wait for application to be ready
echo "Waiting for application to be ready..."
timeout 60 bash -c 'until curl -f http://localhost:3000 2>/dev/null; do sleep 2; done' || {
    echo -e "${RED}❌ Application failed to start within 60 seconds${NC}"
    kill $APP_PID 2>/dev/null || true
    rm -f .app.pid
    exit 1
}

echo -e "${GREEN}✅ Application is ready!${NC}"
echo ""

# Run E2E tests
echo "Running Playwright E2E tests..."
npm run test:e2e || {
    E2E_EXIT_CODE=$?
    echo -e "${RED}❌ E2E tests failed${NC}"

    # Cleanup
    echo "Stopping application..."
    kill $APP_PID 2>/dev/null || true
    rm -f .app.pid

    exit $E2E_EXIT_CODE
}

# Cleanup
echo ""
echo "Stopping application..."
kill $APP_PID 2>/dev/null || true
rm -f .app.pid

echo ""
echo -e "${GREEN}✨ All E2E tests passed successfully!${NC}"
echo ""
echo -e "${GREEN}📊 Test Summary:${NC}"
echo "  ✅ Linting passed"
echo "  ✅ Type checking passed"
echo "  ✅ Build succeeded"
echo "  ✅ Database setup completed"
echo "  ✅ E2E tests passed"
echo ""
echo -e "${GREEN}🎉 Local E2E pipeline completed successfully!${NC}"
