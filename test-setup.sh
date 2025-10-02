#!/bin/bash

# Exit on error
set -e

echo "Setting up test environment..."

# Set environment
export DATABASE_URL=postgresql://postgres:postgres@localhost:5433/sistema_de_monitoria_ic_test
export NODE_ENV=test

# Apply schema to test database (auto-confirm)
echo "Applying database schema..."
echo "yes" | npm run drizzle:push

# Create test users
echo "Creating test users..."
npm run seed:test-user

echo "Test environment setup complete!"
echo "You can now run:"
echo "  npm run dev (in another terminal)"
echo "  npm run test:e2e"