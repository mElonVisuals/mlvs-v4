# syntax=docker/dockerfile:1
FROM node:20-alpine

WORKDIR /app

# Install deps first for better caching
COPY package*.json ./
RUN npm ci --omit=dev || npm install --production

# Copy source
COPY . .
RUN chmod +x scripts/entrypoint.sh

ENV NODE_ENV=production
ENV PORT=3005

EXPOSE 3005

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
	CMD node -e "fetch('http://localhost:'+ (process.env.PORT||3005) +'/api/status').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

# Start both processes; use separate Dokploy services if you want to scale independently.
ENTRYPOINT ["/bin/sh", "-c", "exec ./scripts/entrypoint.sh"]
