#!/bin/bash
set -e

# Configurações
SSH_PORT=9999
SSH_HOST="dokku@200.128.51.137"
LOCAL_BRANCH=$(git rev-parse --abbrev-ref HEAD)

# Target selection (default: main app)
TARGET=${1:-main}

case $TARGET in
  main|app)
    REMOTE="ssh://$SSH_HOST:$SSH_PORT/sistema-de-monitoria"
    APP_NAME="sistema-de-monitoria"
    ;;
  minio)
    REMOTE="ssh://$SSH_HOST:$SSH_PORT/sistema-de-monitoria-minio"
    APP_NAME="sistema-de-monitoria-minio"
    ;;
  *)
    echo "Usage: ./deploy.sh [main|minio]"
    echo "  main/app - Deploy main application (default)"
    echo "  minio    - Deploy minio service"
    exit 1
    ;;
esac

echo "Deploying '$LOCAL_BRANCH' to $APP_NAME ($REMOTE)"

GIT_SSH_COMMAND="ssh -p $SSH_PORT" git push -f "$REMOTE" "$LOCAL_BRANCH":master

echo "Deploy of '$LOCAL_BRANCH' to $APP_NAME completed"
