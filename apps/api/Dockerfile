FROM oven/bun:1.3-slim AS build
WORKDIR /app

COPY package.json bun.lock ./
COPY apps/api/package.json apps/api/
COPY packages/core/package.json packages/core/
COPY packages/mcp/package.json packages/mcp/
RUN bun install --frozen-lockfile --production

COPY packages/core/ packages/core/
COPY packages/mcp/ packages/mcp/
COPY apps/api/ apps/api/

FROM node:22-slim AS runtime
WORKDIR /app

COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/packages/core ./packages/core
COPY --from=build /app/packages/mcp ./packages/mcp
COPY --from=build /app/apps/api ./apps/api
COPY --from=build /app/package.json ./

ENV NODE_ENV=production
ENV PORT=3001

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://localhost:3001/health').then(r => process.exit(r.ok ? 0 : 1))"

CMD ["node", "--import", "tsx", "apps/api/src/index.ts"]
