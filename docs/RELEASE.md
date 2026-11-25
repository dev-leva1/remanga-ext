# Выпуск версий

[← Документация](README.md) · [CHANGELOG](../CHANGELOG.md) · [GitHub Releases](https://github.com/dev-leva1/remanga-ext/releases)

## Источник истины

- Версия userscript — `package.json`; lockfile должен соответствовать ей.
- История изменений — `CHANGELOG.md`. Сборщик синхронизирует её с заголовком userscript и лендингом.
- Git-тег `vX.Y.Z` фиксирует конкретный проверенный коммит.
- GitHub Release содержит заметки об изменениях и, для новых выпусков, может содержать готовый userscript.
- Feedback-bot имеет независимый package.json; не меняйте его версию автоматически при каждом выпуске userscript.

## Подготовка

1. Выберите следующую версию: PATCH для исправлений, MINOR для совместимых функций, MAJOR для несовместимых изменений.
2. Обновите версию в package.json и lockfile, например `npm version patch --no-git-tag-version` в отдельной ветке.
3. Добавьте секцию `## vX.Y.Z - Название` в верх CHANGELOG.md со списком изменений в формате `- ...`. Сохраняйте этот формат: его читает сборщик.
4. Выполните `npm ci`, `npm run lint`, `npm run build`, `node --check dist/remanga-extension.user.js` и [ручные проверки](DEVELOPER_GUIDE.md#проверки).
5. Убедитесь, что package.json, lockfile, metadata userscript и лендинг имеют одну версию. Включите сгенерированные файлы и changelog в PR. После ревью и merge используйте проверенный SHA из main.

## Публикация через GitHub CLI

Ниже — пример для **нового** выпуска. Замените версию и SHA фактическими значениями, запускайте из чистого локального checkout этого коммита. Не перемещайте существующие теги и не перезаписывайте релизы.

```bash
git switch main
git pull --ff-only
VERSION="$(node -p 'require("./package.json").version')"
SHA="$(git rev-parse HEAD)"
TAG="v$VERSION"

# Убедитесь, что тег не занят (если вывод не пуст, остановитесь).
git ls-remote --tags origin "refs/tags/$TAG"
# Подготовьте release-notes.md вне репозитория из секции CHANGELOG.
git tag "$TAG" "$SHA"
git push origin "refs/tags/$TAG"
gh release create "$TAG" dist/remanga-extension.user.js \
  --repo dev-leva1/remanga-ext --verify-tag \
  --title "$TAG" --notes-file /path/to/release-notes.md --latest
```

Проверьте страницу релиза, тег и файл asset. Для prerelease используйте отдельный тег и флаг `--prerelease`, не помечайте его latest. Если тег уже существует или публикация частично выполнена, сначала проверьте удалённый SHA и существующий релиз; не удаляйте и не передвигайте тег автоматически.

## Канал установки

GitHub Release не деплоит ext.nexee.ru. Отдельно разверните проверенный `dist/` по [инструкции](../dist/README.md) и убедитесь, что файл на сайте содержит нужную версию и обслуживается без устаревшего кэша.

## Исторические релизы

Версии v1.5.0–v1.8.0 восстановлены 25 ноября 2026 года из CHANGELOG и привязаны к историческим коммитам. Они не содержат отдельно загруженных assets; исходники и собранный userscript доступны в соответствующих тегах. Не переносите поздние изменения main в старые теги: выпускайте новую версию.
