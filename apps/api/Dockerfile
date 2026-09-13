FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app

FROM base AS build
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json ./apps/api/
COPY apps/api/prisma ./apps/api/prisma/
RUN pnpm install --filter conversia-api... --frozen-lockfile
COPY apps/api ./apps/api
RUN cd apps/api && npx prisma generate && npx nest build
RUN pnpm deploy --filter conversia-api --prod /app/deployed
RUN cd apps/api && npx prisma generate --generator client 2>/dev/null; \
    cp -r /app/node_modules/.prisma /app/deployed/node_modules/.prisma 2>/dev/null || \
    cp -r /app/apps/api/node_modules/.prisma /app/deployed/node_modules/.prisma 2>/dev/null || true

FROM node:20-alpine AS runner
WORKDIR /app
RUN apk add --no-cache dumb-init openssl
COPY --from=build /app/deployed ./
COPY --from=build /app/apps/api/dist ./dist
COPY --from=build /app/apps/api/prisma ./prisma

ENV NODE_ENV=production
ENV PORT=4000
EXPOSE 4000

ENTRYPOINT ["dumb-init", "--"]
CMD ["sh", "-c", "npx prisma migrate deploy --schema ./prisma/schema.prisma && node dist/main"]
