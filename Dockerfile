# Use the official Node.js image.
# https://hub.docker.com/_/node
FROM node:18

# Create and change to the app directory.
WORKDIR /usr/src/app

# Copy application dependency manifests to the container image.
COPY package*.json ./

# Copy environment variables file
COPY .env .env

# Install production dependencies.
# Install production dependencies.
ENV NODE_ENV=production
RUN npm install 



# Copy local code to the container image.
COPY . .

# Inform Docker that the container is listening on the specified port at runtime.
EXPOSE 3000

# Run the web service on container startup.
CMD ["node", "server.js"]
