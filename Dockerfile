# ============================================
# Stage 1 — Build the React/Vite frontend
# ============================================
FROM node:20-alpine AS frontend-build

WORKDIR /app

# Copy root package files (Vite config lives at project root)
COPY package.json package-lock.json vite.config.js index.html ./
COPY frontend/ ./frontend/

RUN npm ci
RUN npm run build

# ============================================
# Stage 2 — Run the Express backend + serve
#            the built frontend
# ============================================
FROM node:20-alpine AS production

WORKDIR /app

# Copy backend source and install its dependencies
COPY backend/package.json backend/package-lock.json ./
RUN npm ci --omit=dev

COPY backend/ ./

# Copy the Vite build output so Express can serve it
COPY --from=frontend-build /app/dist ./public

# Expose the backend port
ENV PORT=5000
EXPOSE 5000

# Health check — hit the API health endpoint
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:5000/api/health || exit 1

CMD ["node", "server.js"]
