FROM node:24.22.0-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
COPY examples ./examples
RUN npm ci && npm run build && npm prune --omit=dev

FROM node:24.22.0-alpine
ENV NODE_ENV=production HOST=0.0.0.0
WORKDIR /app
COPY --from=build --chown=node:node /app /app
USER node
CMD ["node", "examples/nestjs/dist/main.js"]
