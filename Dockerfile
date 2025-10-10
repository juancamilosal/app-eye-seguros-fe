# Etapa 1: Build de Angular
FROM node:22-alpine AS builder

WORKDIR /app

# Copiar archivos necesarios para instalar dependencias
COPY package.json package-lock.json ./

# Instalar dependencias (con devDependencies)
RUN npm ci

# Copiar el resto del código fuente
COPY . .

# Compilar la aplicación Angular (modo producción recomendado)
RUN npx ng build --configuration=production

# Etapa 2: Servir con NGINX
FROM nginx:alpine

# Limpiar html por defecto
RUN rm -rf /usr/share/nginx/html/*

# ⚠️ Ajustar esta ruta según tu build real
COPY --from=builder /app/dist/app-eye-seguros-fe/browser /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
