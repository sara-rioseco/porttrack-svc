# Use Node.js 22.17.1 LTS
FROM node:22.17.1-alpine

# Install curl for health checks
RUN apk add --no-cache curl

# Set working directory
WORKDIR /app

# Add a non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S porttrack -u 1001

# Copy package files first for better layer caching
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy application code
COPY app.js ./

# Create logs directory and set permissions
RUN mkdir -p /app/logs && chown -R porttrack:nodejs /app

# Switch to non-root user
USER porttrack

# Expose port
EXPOSE 8082

# Health check using curl
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:8082/health || exit 1

# Start the application
CMD ["node", "app.js"]