FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install --omit=dev

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY package*.json ./
COPY src ./src
EXPOSE 3000
CMD ["node", "src/index.js"]


# FROM node:20-alpine
# WORKDIR /app
# COPY package.json .
# RUN npm install
# COPY src ./src
# CMD ["node", "src/index.js"]
