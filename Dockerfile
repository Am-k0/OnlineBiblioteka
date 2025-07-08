# Use Node.js base image
FROM node:22

# Set working directory
WORKDIR /app

# Enable corepack (for pnpm/yarn if needed)
RUN corepack enable

# Copy package files first (better caching)
COPY package.json package-lock.json ./

# Install dependencies (dev dependencies included)
RUN npm install

# Copy the rest of the app
COPY . .

# Expose the Nuxt dev server port (default: 3000)
EXPOSE 5174

# Start Nuxt in dev mode with HMR
CMD ["npm", "run", "dev"]