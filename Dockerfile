FROM node:20-alpine

# Prisma (OpenSSL) on Alpine
RUN apk add --no-cache openssl

WORKDIR /app

COPY package*.json ./
# postinstall runs prisma generate — schema must exist before npm install
COPY prisma ./prisma/
RUN npm install

COPY . .

RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
