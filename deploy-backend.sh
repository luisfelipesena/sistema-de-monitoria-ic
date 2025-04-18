#!/bin/bash
set -e

echo "Deploying backend to Dokku..."

# Create a temporary directory
TEMP_DIR=$(mktemp -d)
CURRENT_DIR=$(pwd)

# Create the app structure
mkdir -p $TEMP_DIR/apps/backend
mkdir -p $TEMP_DIR/packages

# Copy necessary files
cp -r $CURRENT_DIR/apps/backend $TEMP_DIR/apps/
cp -r $CURRENT_DIR/packages $TEMP_DIR/
cp $CURRENT_DIR/package.json $TEMP_DIR/
cp $CURRENT_DIR/package-lock.json $TEMP_DIR/
cp $CURRENT_DIR/turbo.json $TEMP_DIR/
cp $CURRENT_DIR/Dockerfile.backend $TEMP_DIR/Dockerfile
cp $CURRENT_DIR/.dockerignore $TEMP_DIR/

# Move to the temporary directory
cd $TEMP_DIR

# Initialize git, add files, and commit
git init
git add .
git config --global user.email "deploy@example.com"
git config --global user.name "Dokku Deploy"
git commit -m "feat(backend): deploy to dokku"

# Add the dokku remote and push
git remote add dokku app.ic.ufba.br:sistema-de-monitoria-api
git push -f dokku main:main

# Clean up
cd $CURRENT_DIR
rm -rf $TEMP_DIR

echo "Backend deployment completed!" 