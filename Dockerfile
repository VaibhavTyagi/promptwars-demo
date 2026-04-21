# Build stage - React client
FROM node:20-alpine AS client-build
WORKDIR /app/client
COPY client/package*.json ./
RUN npm install
COPY client/ ./
RUN npm run build

# Production stage - Express server
FROM node:20-alpine
WORKDIR /app

# Copy server
COPY server/package*.json ./server/
RUN cd server && npm install --production

COPY server/ ./server/

# Copy client build output
COPY --from=client-build /app/client/dist ./client/dist

# Create data directory for SQLite
RUN mkdir -p server/data

# Initialize database
RUN cd server && node src/db/init.js && node src/db/seed.js

ENV NODE_ENV=production
ENV PORT=8080

EXPOSE 8080

CMD ["node", "server/src/index.js"]
