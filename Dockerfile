FROM node:22-bookworm-slim AS base
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates && rm -rf /var/lib/apt/lists/*

FROM base AS dependencies
COPY package.json package-lock.json ./
COPY frontend/package.json ./frontend/package.json
COPY backend/package.json ./backend/package.json
COPY packages/contracts/package.json ./packages/contracts/package.json
RUN npm ci
COPY backend/prisma ./backend/prisma
RUN npm run generate

FROM dependencies AS source
COPY frontend ./frontend
COPY backend ./backend
COPY packages ./packages
COPY tests ./tests
COPY eslint.config.js .prettierrc.json .prettierignore ./

FROM source AS frontend-build
RUN npm run build --workspace frontend

FROM source AS backend-build
RUN npm run build --workspace backend

FROM source AS test
CMD ["sh", "-c", "npm run lint && npm run format:check && npm run typecheck && npm test && npm run test:smoke"]

FROM dependencies AS production-dependencies
RUN npm prune --omit=dev

FROM base AS production
ENV NODE_ENV=production
COPY --from=production-dependencies --chown=node:node /app/node_modules ./node_modules
COPY --from=production-dependencies --chown=node:node /app/package*.json ./
COPY --from=production-dependencies --chown=node:node /app/frontend/package.json ./frontend/package.json
COPY --from=production-dependencies --chown=node:node /app/backend/package.json ./backend/package.json
COPY --from=production-dependencies --chown=node:node /app/packages/contracts ./packages/contracts
COPY --from=backend-build --chown=node:node /app/backend/dist ./backend/dist
COPY --from=frontend-build --chown=node:node /app/frontend/dist ./frontend/dist
COPY --chown=node:node backend/prisma ./backend/prisma
COPY --chown=node:node backend/scripts/entrypoint.sh ./backend/scripts/entrypoint.sh
USER node
EXPOSE 3000
ENTRYPOINT ["sh", "backend/scripts/entrypoint.sh"]
