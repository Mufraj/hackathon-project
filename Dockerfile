FROM node:18-alpine

# Set working directory
WORKDIR /app

# Create log directories for Fixly SSH log parser
RUN mkdir -p /var/log/target_app /app/logs && \
    chmod -R 777 /var/log/target_app /app/logs

# Copy dependency files
COPY package*.json ./

# Install production dependencies
RUN npm ci --only=production || npm install --production

# Copy application source code
COPY . .

# Expose application port
EXPOSE 3000

# Set environment variables
ENV PORT=3000 \
    LOG_FILE=/var/log/target_app/app.log \
    NODE_ENV=production

# Health check
HEALTHCHECK --interval=10s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:3000/health || exit 1

# Command to run application
CMD ["node", "src/index.js"]
