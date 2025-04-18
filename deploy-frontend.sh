#!/bin/bash
set -e

# Configurações
TEMP_DIR=$(mktemp -d)
REMOTE="dokku@app.ic.ufba.br:sistema-de-monitoria"
SSH_PORT=2299

echo "Criando diretório temporário em $TEMP_DIR"

# Criando a estrutura correta para o Dockerfile
echo "Criando estrutura de diretórios"
mkdir -p $TEMP_DIR/apps/frontend
mkdir -p $TEMP_DIR/packages

# Copiando apenas arquivos necessários do frontend
echo "Copiando arquivos do frontend"
cp -r apps/frontend/* $TEMP_DIR/apps/frontend/
cp Dockerfile.frontend $TEMP_DIR/Dockerfile
cp package.json $TEMP_DIR/
cp package-lock.json $TEMP_DIR/ 2>/dev/null || true
cp turbo.json $TEMP_DIR/

# Inicializando git e fazendo commit
cd $TEMP_DIR
git init
git add .
git config --global user.email "deploy@ic.ufba.br"
git config --global user.name "Deploy Script"
git commit -m "Deploy frontend"

# Adicionando remote Dokku e fazendo push
echo "Configurando remote e fazendo push para Dokku"
git remote add dokku "ssh://dokku@app.ic.ufba.br:$SSH_PORT/sistema-de-monitoria"
GIT_SSH_COMMAND="ssh -p $SSH_PORT" git push -f dokku main:master

# Limpeza
echo "Fazendo limpeza"
cd -
rm -rf $TEMP_DIR

echo "Deploy frontend concluído" 