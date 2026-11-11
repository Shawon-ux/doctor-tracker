FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
COPY client/package.json client/
RUN npm ci -w client
COPY client client
# The /api rewrite target is fixed at build time.
ARG API_URL=http://api:4000
ARG NEXT_PUBLIC_DEMO_LOGIN
ENV API_URL=$API_URL NEXT_PUBLIC_DEMO_LOGIN=$NEXT_PUBLIC_DEMO_LOGIN NEXT_TELEMETRY_DISABLED=1
RUN npm run build -w client

FROM node:20-alpine
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3000 HOSTNAME=0.0.0.0
WORKDIR /app
COPY --from=build /app/client/.next/standalone ./
COPY --from=build /app/client/.next/static client/.next/static
USER node
EXPOSE 3000
CMD ["node", "client/server.js"]
