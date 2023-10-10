# --- Base Stage ---
FROM node:20-alpine as base

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

WORKDIR /usr/src/app

# Copy pnpm-lock.yaml and package.json and install dependencies
COPY package.json pnpm-lock.yaml ./

RUN corepack enable \
    && pnpm install

# --- Build Stage ---
FROM base AS build
COPY . .
RUN pnpm run build

# --- Runtime Stage ---
FROM node:20-alpine as runtime-stage

WORKDIR /usr/src/app

# Only copy over the built artifacts from the build stage and the necessary runtime dependencies
COPY --from=build /usr/src/app/dist ./
COPY --from=base /usr/src/app/node_modules ./node_modules
# COPY package.json ./

# Command to run the application
CMD ["node", "index.js"]