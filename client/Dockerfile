FROM node:20-alpine
WORKDIR /app
COPY client/src ./
RUN npm install -g http-server
EXPOSE 80
CMD ["http-server", "-p", "8080", "-c-1"]
