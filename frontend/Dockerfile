# Frontend image: build the Vite app, then serve the static files with nginx.
# Build context is the project root.

# ---- Stage 1: build ----
FROM node:24-alpine AS build

RUN npm install -g pnpm@11

WORKDIR /app

# Install dependencies first so this layer is cached until the lockfile changes
COPY frontend/package.json frontend/pnpm-lock.yaml frontend/pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

COPY frontend/ ./

# The API address is fixed at build time. It must be a URL the *browser* can
# reach (e.g. http://localhost:8000), not a Docker service name.
ARG VITE_API_URL=http://localhost:8000
ENV VITE_API_URL=$VITE_API_URL

RUN pnpm build

# ---- Stage 2: serve ----
FROM nginx:alpine

COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
