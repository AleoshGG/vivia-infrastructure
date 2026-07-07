# Etapa 1: Construcción (Build)
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .

# La config de Firebase está hardcodeada en src/core/notifications/ (valores
# públicos, los mismos que public/firebase-messaging-sw.js) — el build no
# necesita variables de entorno.
RUN npm run build

# Etapa 2: Imagen de ejecución (Runtime)
FROM nginx:1.27-alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
