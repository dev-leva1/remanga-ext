FROM node:20-alpine

WORKDIR /app

# Копирование package files
COPY package*.json ./

# Установка зависимостей
RUN npm ci --omit=dev

# Копирование исходников
COPY src ./src

# Переменные окружения
ENV NODE_ENV=production

# Запуск
CMD ["node", "src/index.js"]
