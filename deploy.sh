#!/bin/bash
set -e

LOCAL_BRANCH=$(git rev-parse --abbrev-ref HEAD)
TARGET=${1:-main}

case $TARGET in
  main|app)
    APP_NAME="sistema-de-monitoria"
    ;;
  minio)
    APP_NAME="sistema-de-monitoria-minio"
    ;;
  *)
    echo "Usage: ./deploy.sh [main|minio]"
    echo "  main/app - Deploy main application (default)"
    echo "  minio    - Deploy minio service"
    exit 1
    ;;
esac

echo "Deploying '$LOCAL_BRANCH' to $APP_NAME"

git push -f dokku@app.ic.ufba.br:$APP_NAME "$LOCAL_BRANCH":main

echo "Deploy completed"
