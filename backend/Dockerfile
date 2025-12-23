FROM node:22-alpine
WORKDIR /backend

RUN apk add --no-cache curl
COPY package*.json ./
RUN npm install

COPY . .
EXPOSE 3000

CMD ["npm", "start"]
