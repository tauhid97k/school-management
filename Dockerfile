FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
RUN mkdir /app
WORKDIR /app

COPY . .
RUN npm i
RUN npm install -g npx
RUN npm install -g prisma


EXPOSE 5000

ENV PORT 5000
#CMD ["npm","start"]
