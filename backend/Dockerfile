# Backend Dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies (including dev dependencies for hot-reload)
RUN apk add --no-cache curl \
  && npm install --quiet

# Copy source code
COPY . .

# Create directory for logs
RUN mkdir -p /app/logs

# Set environment variables (can be overridden by docker-compose)
ENV NODE_ENV=development
ENV PORT=3000

# Expose port
EXPOSE 3000

# Health check - use /health instead of /api/health
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

# Start the application with hot-reload in dev mode
CMD ["npm", "run", "dev"]
