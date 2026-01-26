# Use nginx to serve the static build
FROM nginx:alpine

# Copy the built app to nginx html directory
COPY dist/ /usr/share/nginx/html/

# Copy nginx config for SPA routing
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 8080 (Cloud Run default)
EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]
