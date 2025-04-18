# Base image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copiar toda a base de código
COPY . .

# Instalar dependências no root do projeto
RUN npm install

# Instalar dependências do frontend
WORKDIR /app/apps/frontend
RUN npm install

# Construir o frontend
WORKDIR /app
RUN npm run build --workspace=@sistema-de-monitoria-ic/frontend

# Definir o diretório de trabalho para o frontend
WORKDIR /app/apps/frontend

# Expor a porta
EXPOSE 5000

# Iniciar o aplicativo
CMD ["npm", "run", "start"] 