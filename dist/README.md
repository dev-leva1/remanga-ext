# Развёртывание лендинга и userscript

[← Документация](../docs/README.md) · [Выпуск версий](../docs/RELEASE.md)

Папка `dist/` содержит статический сайт, собранный userscript и Dockerfile для Nginx. Файлы в этой папке отслеживаются основным репозиторием. Создавать вложенный Git-репозиторий не требуется.

## Подготовка

Из корня репозитория на проверенном release-коммите:

```bash
npm ci
npm run build
node --check dist/remanga-extension.user.js
git diff --check
```

Убедитесь, что собранные файлы соответствуют проверенному выпуску. Деплой и публикация GitHub Release — разные операции.

## Локальная проверка контейнера

```bash
docker build -t remanga-ext:local dist
docker run --rm -p 127.0.0.1:8080:80 remanga-ext:local
```

В отдельном терминале:

```bash
curl -fsS -H 'Host: ext.nexee.ru' http://127.0.0.1:8080/
curl -fsS -H 'Host: ext.nexee.ru' http://127.0.0.1:8080/remanga-extension.user.js | head -n 16
```

Nginx использует виртуальный хост `ext.nexee.ru`; запросы без соответствующего Host получают 404. Для собственного домена измените конфигурацию Dockerfile, URL установки/обновлений и метаданные лендинга в рамках отдельного согласованного изменения.

## Dokploy

- Используйте основной Git-репозиторий и выбранный проверенный commit/tag.
- Укажите Dockerfile `dist/Dockerfile` и контекст сборки `dist/`.
- Настройте порт контейнера 80, домен и HTTPS через reverse proxy.
- Запустите deploy только после проверки содержимого выпуска.

## После развёртывания

```bash
curl -fsS https://ext.nexee.ru/remanga-extension.user.js | head -n 16
curl -fsSI https://ext.nexee.ru/remanga-extension.user.js
```

Проверьте номер версии, доступность лендинга и политику кэширования userscript. Для отката разверните предыдущий проверенный образ/коммит; не передвигайте исторические Git-теги.
