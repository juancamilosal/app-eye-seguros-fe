# ===============================
# Etapa 1: Build de Angular
# ===============================
FROM node:20-alpine AS builder

# Crear y establecer el directorio de trabajo
WORKDIR /app

# Copiar archivos de dependencias primero (para aprovechar la cache de Docker)
COPY package*.json ./

# Instalar dependencias (incluye dev para build)
RUN npm ci

# Copiar el resto del código fuente
COPY . .

# Compilar la aplicación Angular (producción por defecto)
RUN npx ng build --configuration production

# ===============================
# Etapa 2: Servir con NGINX
# ===============================
FROM nginx:alpine

# Limpiar contenido por defecto de NGINX
RUN rm -rf /usr/share/nginx/html/*

# Copiar los archivos compilados desde la etapa de build
COPY --from=builder /app/dist/app-eye-seguros-fe/browser /usr/share/nginx/html

# (Opcional) Copiar configuración personalizada de NGINX para SPA (Angular routing)
# COPY nginx.conf /etc/nginx/conf.d/default.conf

# Exponer el puerto 80
EXPOSE 80

# Iniciar NGINX
CMD ["nginx", "-g", "daemon off;"]
