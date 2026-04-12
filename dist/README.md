# Remanga Extension Deploy

Деплой userscript через Nginx в Dokploy.

## Быстрый старт

1. **Создайте Git репозиторий из папки `dist`:**
   ```bash
   cd dist
   git init
   git add .
   git commit -m "Initial deploy"
   git remote add origin <your-repo-url>
   git push -u origin main
   ```

2. **В Dokploy:**
   - Создайте проект типа **Docker**
   - Укажите Git репозиторий
   - Настройте домен: `ext.nexee.ru`
   - Порт: `80`
   - Deploy

3. **Проверка:**
   ```bash
   curl https://ext.nexee.ru/remanga-extension.user.js
   ```

## Обновление

После изменений в коде:

```bash
# В корне проекта
npm run build

# Перейти в dist и закоммитить
cd dist
git add remanga-extension.user.js
git commit -m "Update to version X.X.X"
git push
```

Dokploy автоматически задеплоит обновление.
