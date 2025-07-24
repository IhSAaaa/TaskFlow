# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copy shared package
COPY shared/ ./shared/

# Copy auth service files
COPY auth-service/package*.json ./
COPY auth-service/tsconfig.json ./

# Install all dependencies (including dev dependencies for TypeScript)
RUN npm install

# Copy source code
COPY auth-service/src/ ./src/

# Build the application
RUN npm run build

# Production stage
FROM node:18-alpine AS production

WORKDIR /app

# Copy shared package
COPY shared/ ./shared/

# Copy auth service files
COPY auth-service/package*.json ./

# Install only production dependencies
RUN npm install --omit=dev

# Copy built application from builder stage
COPY --from=builder /app/dist ./dist

# Expose port
EXPOSE 3001

# Install curl for health checks
RUN apk add --no-cache curl

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3001/health || exit 1

# Start the application
CMD ["npm", "start"] 