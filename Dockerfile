FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
RUN mkdir /app
WORKDIR /app

COPY . .

RUN npm i
RUN npm install
RUN npx prisma generate

RUN npx prisma db push
RUN npx prisma db seed

EXPOSE 5000

ENV PORT 5000


CMD ["npm", "start"]
