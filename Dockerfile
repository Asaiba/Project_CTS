FROM node:20-alpine

WORKDIR /app

COPY backend/package*.json ./
COPY backend/prisma ./prisma
RUN npm install && npx prisma generate

COPY backend/src ./src

EXPOSE 4000

CMD ["npm", "run", "start"]
