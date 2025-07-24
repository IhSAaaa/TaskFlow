FROM node:18-alpine

WORKDIR /app

# Copy shared package
COPY shared/ ./shared/

# Copy user service files
COPY user-service/package*.json ./
COPY user-service/tsconfig.json ./

# Install all dependencies (including dev dependencies for TypeScript)
RUN npm install

# Copy source code
COPY user-service/src/ ./src/

# Build the application
RUN npm run build

# Expose port
EXPOSE 3002

# Install curl for health checks
RUN apk add --no-cache curl

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3002/health || exit 1

# Start the application
CMD ["npm", "start"] 