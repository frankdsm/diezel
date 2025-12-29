# syntax=docker/dockerfile:1

# Build stage
FROM node:22-alpine AS builder

# Install pnpm
RUN corepack enable && corepack prepare pnpm@10.8.0 --activate

WORKDIR /app

# Copy all source files
COPY . .

# Install dependencies and build diezel, then reinstall to link binaries
RUN pnpm install --frozen-lockfile && \
    pnpm --filter diezel build && \
    pnpm install

# Build the docs app
RUN cd apps/docs && pnpm run build

# Production stage
FROM node:22-alpine AS runner

WORKDIR /app

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 diezel

# Copy built output
COPY --from=builder --chown=diezel:nodejs /app/apps/docs/.diezel/output ./

# Switch to non-root user
USER diezel

# Expose port
EXPOSE 3000

# Set environment variables
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000

# Start the server
CMD ["node", "server/index.mjs"]
