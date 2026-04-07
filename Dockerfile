FROM node:20-alpine

WORKDIR /app

# Copie os arquivos necessários para instalar dependências
COPY package*.json ./

# Instale todas as dependências (inclusive de desenvolvimento) e limpe o cache
RUN npm install && npm cache clean --force

# Copie o restante do código
COPY . .

# Compile o projeto para produção
RUN npm run build

# Exponha a porta usada pelo server.ts
EXPOSE 4021


CMD ["npm", "run", "start"]