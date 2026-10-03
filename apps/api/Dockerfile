FROM node:22-alpine AS build
WORKDIR /app

COPY package*.json ./
COPY packages ./packages
COPY apps/api ./apps/api

RUN npm ci
RUN npm run build --workspace=@seethapaati/contracts
RUN npm run prisma:generate --workspace=@seethapaati/api
RUN npm run build --workspace=@seethapaati/api

FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production

COPY --from=build /app/package*.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/packages ./packages
COPY --from=build /app/apps/api ./apps/api

EXPOSE 4000
CMD ["sh", "-c", "npx prisma migrate deploy --schema apps/api/prisma/schema.prisma && node apps/api/dist/main.js"]
