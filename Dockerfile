# ===============================
# 1️⃣ Build Stage (Bun)
# ===============================
FROM oven/bun:1.1-alpine AS build

WORKDIR /app

# Copy dependency files only
COPY package.json bun.lock ./

# Install deps
RUN bun install

# Copy ONLY source files (no node_modules)
COPY vite.config.* ./
COPY index.html ./
COPY src ./src
COPY public ./public

# Build Vite app
RUN bun run build

# ===============================
# 2️⃣ Production Stage (nginx)
# ===============================
FROM nginx:alpine

RUN rm /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/conf.d/default.conf

COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
