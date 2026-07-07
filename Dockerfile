# Stage 1: Build React/Vite app with Node 22+ (Vite 8 requires >=22.12.0)
FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --silent
COPY . .

# Pass build-time environment variables to Vite
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY

RUN npm run build

# Stage 2: Serve using Nginx
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
