FROM node:22-alpine

WORKDIR /app

# Copy only package files first to leverage caching of npm install
COPY package.json package-lock.json* pnpm-lock.yaml* yarn.lock* ./
RUN npm install

# Source code comes from bind mount (./frontend:/app), so no need to COPY . here for dev

EXPOSE 5173

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "5173"]
