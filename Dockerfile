# Build stage
FROM node:24-alpine AS build

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production=false

# Copy source code
COPY . .

# Build the application
RUN npm run build:prod

# Production stage
FROM nginx:1.29-alpine

# Install wget for healthcheck
RUN apk add --no-cache wget

# Copy built application
COPY --from=build /app/dist/user-story-map/browser /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]