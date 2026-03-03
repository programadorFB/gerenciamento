# ============================================
# Dockerfile - Frontend (Vite Production)
# ============================================

# -------- Build Stage --------
FROM node:20-alpine AS build

WORKDIR /app

# Copia package.json primeiro (melhora cache)
COPY package*.json ./

RUN npm install

# Copia o restante do projeto
COPY . .

# Recebe variável do docker-compose
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

# Build de produção
RUN npm run build

# -------- Runtime Stage (Nginx) --------
FROM nginx:alpine

# Remove config padrão
RUN rm -rf /etc/nginx/conf.d/default.conf

# Copia build
COPY --from=build /app/dist /usr/share/nginx/html

# Configuração customizada (SPA support)
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 84

CMD ["nginx", "-g", "daemon off;"]