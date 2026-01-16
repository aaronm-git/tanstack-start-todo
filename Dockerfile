FROM node:22-alpine AS build

WORKDIR /app

# Enable pnpm via Corepack
RUN corepack enable

# Install deps
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# Copy source
COPY . .

# Vite reads VITE_* envs at build time
ARG VITE_SENTRY_DSN
ENV VITE_SENTRY_DSN=$VITE_SENTRY_DSN

# Build the TanStack Start app
RUN pnpm build

# --- runtime ---
FROM node:22-alpine AS runtime
WORKDIR /app

RUN corepack enable

# Copy only what we need to run the built server
COPY --from=build /app/package.json /app/pnpm-lock.yaml ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/.output ./.output

ENV NODE_ENV=production
EXPOSE 3000

CMD ["pnpm", "start"]

