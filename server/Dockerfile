# Stage 1: Build
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json tsconfig.json ./
RUN npm ci
COPY src ./src
RUN npm run build

# Stage 2: Runtime
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup -g 1001 -S nodejs && adduser -S nestjs -u 1001
COPY package*.json ./
RUN npm ci --only=production
COPY --from=builder /app/dist ./dist
USER nestjs
EXPOSE 5000
CMD ["node", "dist/index.js"]
