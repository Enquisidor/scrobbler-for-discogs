# Multi-stage Dockerfile for monorepo web app
# Build context should be repo root: docker build -f web/Dockerfile .

# Stage 1: Build the shared libs
FROM node:22-alpine AS libs-build
WORKDIR /app/libs
COPY libs/package*.json ./
RUN npm ci
COPY libs/ ./
RUN npm run build

# Stage 2: Build the web application
FROM node:22-alpine AS web-build
WORKDIR /app

# Copy built libs
COPY --from=libs-build /app/libs /app/libs

# Install web dependencies
WORKDIR /app/web
COPY web/package*.json ./
RUN npm ci

# Link the local libs package
RUN npm install ../libs

# Copy web source and build
COPY web/ ./
RUN npm run build

# Stage 3: Serve with nginx
FROM nginx:stable-alpine
COPY --from=web-build /app/web/dist /usr/share/nginx/html
COPY web/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]
