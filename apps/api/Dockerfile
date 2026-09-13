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

FROM base AS runner
RUN apk add --no-cache dumb-init openssl
WORKDIR /app
COPY --from=build /app ./

ENV NODE_ENV=production
ENV PORT=4000
EXPOSE 4000

ENTRYPOINT ["dumb-init", "--"]
CMD ["sh", "-c", "cd apps/api && npx prisma migrate deploy && node dist/main"]
