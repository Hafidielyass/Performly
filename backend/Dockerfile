# ---- deps ----
# glibc base (Prisma's musl/Apline engines require OpenSSL 1.1, which is no
# longer available on Alpine >= 3.20; Debian + OpenSSL 3 is fully supported)
FROM node:20-bookworm-slim AS deps
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends openssl python3 make g++ \
    && rm -rf /var/lib/apt/lists/*
COPY package.json package-lock.json* ./
COPY prisma ./prisma
RUN npm ci && npm cache clean --force

# ---- build ----
FROM node:20-bookworm-slim AS build
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends openssl \
    && rm -rf /var/lib/apt/lists/*
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
RUN npm run build
# Drop dev dependencies here (runner never compiles anything, and native
# modules like bcrypt keep the binaries already built for glibc in deps).
RUN npm prune --omit=dev --ignore-scripts

# ---- runner ----
FROM node:20-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN apt-get update && apt-get install -y --no-install-recommends wget ca-certificates openssl \
    && rm -rf /var/lib/apt/lists/*
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nestjs

# package.json is needed so `npm run start:deploy` (migrate + seed + serve) resolves
# here exactly as it does on a PaaS Node runtime.
COPY --chown=nestjs:nodejs package.json ./package.json
COPY --chown=nestjs:nodejs --from=build /app/node_modules ./node_modules
COPY --chown=nestjs:nodejs --from=build /app/dist ./dist
COPY --chown=nestjs:nodejs prisma ./prisma
COPY --chown=nestjs:nodejs assets ./assets
COPY --chown=nestjs:nodejs docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x ./docker-entrypoint.sh

USER nestjs

EXPOSE 3001
ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["node", "dist/main.js"]