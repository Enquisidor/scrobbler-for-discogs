<<<<<<< HEAD
# Use nginx to serve the static build
FROM nginx:alpine

# Copy the built app to nginx html directory
COPY dist/ /usr/share/nginx/html/

# Copy nginx config for SPA routing
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 8080 (Cloud Run default)
EXPOSE 8080

=======
# Stage 1: Build the React application
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Stage 2: Serve the application with Nginx
FROM nginx:stable-alpine
COPY --from=build /app/build /usr/share/nginx/html
EXPOSE 80
>>>>>>> a74f72f0d94c604f549ee6d1ad8164f07db3a16e
CMD ["nginx", "-g", "daemon off;"]
