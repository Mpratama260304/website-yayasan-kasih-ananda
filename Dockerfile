# ═══════════════════════════════════════════════════════════════════
# DOCKERFILE - PostgreSQL Backend
# ═══════════════════════════════════════════════════════════════════
# 
# FULL BACKEND REBUILD - NO localStorage, NO client-side persistence
# All data stored in PostgreSQL database via Prisma ORM
#
# ✅ PostgreSQL via Prisma
# ✅ Server-side sessions
# ✅ Self-contained
# ✅ PhalaCloud ready
# ═══════════════════════════════════════════════════════════════════

# ───────────────────────────────────────────────────────────────────
# STAGE 1: BUILD & DEPENDENCIES
# ───────────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

# Install build dependencies for native modules (sharp, prisma)
RUN apk add --no-cache python3 make g++ vips-dev openssl

WORKDIR /app

# Copy package files first (better layer caching)
COPY package*.json ./
COPY prisma ./prisma/

# Install ALL dependencies
RUN npm ci

# Generate Prisma client
RUN npx prisma generate

# Copy source code
COPY . .

# Build frontend (Vite)
RUN npm run build

# Prune devDependencies after build
RUN npm prune --omit=dev

# Re-generate Prisma client for production (just in case)
RUN npx prisma generate

# ───────────────────────────────────────────────────────────────────
# STAGE 2: PRODUCTION RUNTIME
# ───────────────────────────────────────────────────────────────────
FROM node:20-alpine AS production

# Install only runtime libs for sharp, openssl for Prisma, and su-exec for permission handling
RUN apk add --no-cache vips openssl su-exec

WORKDIR /app

# Copy pruned node_modules (production deps only with compiled sharp)
COPY --from=builder /app/node_modules ./node_modules

# Copy package files
COPY package*.json ./

# Copy Prisma files
COPY --from=builder /app/prisma ./prisma

# Copy server files (includes config.js)
COPY --from=builder /app/server ./server

# Copy built frontend
COPY --from=builder /app/dist ./dist

# Create uploads directory structure with correct permissions
# Ensure directories exist and are writable by node user
RUN mkdir -p /app/uploads/images /app/uploads/documents /app/uploads/archives /app/uploads/avatars \
    && chown -R node:node /app/uploads \
    && chmod -R 755 /app/uploads

# Change ownership for non-root user
RUN chown -R node:node /app

# Use non-root user for security
USER node

# ───────────────────────────────────────────────────────────────────
# RUNTIME CONFIGURATION
# ───────────────────────────────────────────────────────────────────

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

    # Start script that runs migrations then starts server
    CMD ["sh", "-c", "npx prisma migrate deploy && node server/server.js"]
    