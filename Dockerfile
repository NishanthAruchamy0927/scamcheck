FROM node:20-alpine

WORKDIR /app

# Copy project files
COPY . .

# Install dependencies and build
RUN npm run postinstall
RUN npm run build

# Set environment
ENV PORT=5001
ENV NODE_ENV=production
EXPOSE 5001

# Start the unified backend serving both API & Frontend
CMD ["node", "backend/dist/server.js"]
