# Builder Stage
FROM node:20-slim as builder

# Install pnpm and other package | Set PNPM_HOME
RUN npm install -g pnpm@8.5.0 typescript ts-node;\
  pnpm setup;\
  mkdir -p /usr/local/share/pnpm &&\
  export PNPM_HOME="/usr/local/share/pnpm" &&\
  export PATH="$PNPM_HOME:$PATH";\
  pnpm bin -g

# Set working directory
WORKDIR /app

# Copy required packages
COPY ./.npmrc ./.npmrc
COPY ./package.json ./package.json
COPY ./pnpm-lock.yaml ./pnpm-lock.yaml

# Install app dependencies
RUN pnpm install --frozen-lockfile --unsafe-perm

# Copy required files
COPY ./.eslintrc.js ./.eslintrc.js
COPY ./.prettierrc.js ./.prettierrc.js
COPY ./nest-cli.json ./nest-cli.json
COPY ./tsconfig.json ./tsconfig.json
COPY ./tsconfig.build.json ./tsconfig.build.json
COPY ./codegen.ts ./codegen.ts

# Copy app source
COPY ./src ./src

# Copy .env for production
COPY ./.env.prod ./.env

# Build app
RUN pnpm run codegen && pnpm run build

# Production Stage
FROM node:20-slim AS production

# Set node env to prod
ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

# Set Working Directory
WORKDIR /app

# Copy all from builder stage
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.env ./.env

# Set Working Directory
WORKDIR /app

# Run app
CMD node dist/src/main.js