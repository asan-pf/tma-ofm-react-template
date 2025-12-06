# Frontend Dockerfile (multi-stage)
FROM node:22-alpine AS build
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies (use install to avoid lockfile requirement)
RUN npm install --quiet

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Serve with nginx
FROM nginx:alpine


# Remove default config
RUN rm /etc/nginx/conf.d/default.conf || true

# Copy built files to nginx
COPY --from=build /app/dist /usr/share/nginx/html

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
