# Use the official Node.js runtime as a parent image with slim variant for better compatibility
FROM node:18-slim

# Set the working directory in the container
WORKDIR /app

# Install necessary system dependencies for building native modules
RUN apt-get update && \
    apt-get install -y python3 make g++ && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Copy package.json and package-lock.json (if available)
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy the rest of the application code
COPY . .

# Build the Next.js application
ENV ESLINT_NO_DEV_ERRORS=true
ENV CI=false
RUN npm run build

# Expose the port the app runs on
EXPOSE 3000

# Start the application
CMD ["npm", "start"]
