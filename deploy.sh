#!/bin/bash
set -e

# Configurações
REMOTE="ssh://dokku@app.ic.ufba.br:9999/sistema-de-monitoria" # Target Dokku app name
SSH_PORT=9999
# Optional: Specify the local branch to deploy, default to current branch
LOCAL_BRANCH=$(git rev-parse --abbrev-ref HEAD)

echo "Fazendo push do branch local '$LOCAL_BRANCH' para Dokku ($REMOTE)"

# Fazendo push direto do branch atual para o master do Dokku
# Use -f para forçar o push, sobrescrevendo o histórico no Dokku remote (comum para deploys)
GIT_SSH_COMMAND="ssh -p $SSH_PORT" git push -f "$REMOTE" "$LOCAL_BRANCH":master

echo "Deploy do branch '$LOCAL_BRANCH' concluído para $REMOTE" 