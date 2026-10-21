FROM node:22-alpine
WORKDIR /app

RUN apk add --no-cache openssl

COPY package.json ./
RUN npm install --omit=dev

COPY src ./src
COPY scripts ./scripts
COPY tests ./tests
COPY sql ./sql

EXPOSE 5000 5443

CMD ["node", "src/server.js"]
