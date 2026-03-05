FROM node:20 AS frontend-builder

WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm ci

COPY frontend/ ./
RUN npm run build

FROM node:20 AS backend-builder

WORKDIR /app/backend

COPY backend/package*.json ./
RUN npm ci

COPY backend/ ./
RUN npx prisma generate

FROM node:20

WORKDIR /app/backend

COPY --from=backend-builder /app/backend ./
COPY --from=frontend-builder /app/frontend/dist /app/frontend/dist

EXPOSE 4000

CMD ["npm", "start"]
