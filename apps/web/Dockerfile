FROM node:22-alpine AS build
WORKDIR /app

COPY package*.json ./
COPY packages ./packages
COPY apps/web ./apps/web

RUN npm ci
RUN npm run build --workspace=@seethapaati/contracts
RUN npm run build --workspace=@seethapaati/web

FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production

COPY --from=build /app/package*.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/packages ./packages
COPY --from=build /app/apps/web ./apps/web

EXPOSE 3000
CMD ["npm", "run", "start", "--workspace=@seethapaati/web"]
