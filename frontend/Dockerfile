FROM node:20-alpine

WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci --prefer-offline --no-audit || npm install
RUN npm rebuild esbuild || true
COPY . .

EXPOSE 3000
CMD ["npm", "run", "dev", "--", "--host"]
