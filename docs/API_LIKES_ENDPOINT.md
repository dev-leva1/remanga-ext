# API Endpoint для лайков на главы - remanga.org

## Найденный endpoint

**URL:** `https://api.remanga.org/api/activity/votes/`

**Метод:** `POST`

**Статус ответа:** `204 No Content` (успешная операция)

## Заголовки запроса

```
Content-Type: application/json
Authorization: Bearer {TOKEN}
```

Где `{TOKEN}` - токен из cookie `token=...`

## Тело запроса

```json
{
  "chapter_ids": [1926137]
}
```

**Формат:**
- `chapter_ids` - массив целых чисел (ID глав)
- Можно передавать как один ID, так и несколько одновременно

## Примеры запросов

### Поставить/снять лайк на одну главу

```bash
curl -X POST https://api.remanga.org/api/activity/votes/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"chapter_ids": [1926137]}'
```

### Поставить/снять лайки на несколько глав

```bash
curl -X POST https://api.remanga.org/api/activity/votes/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"chapter_ids": [1926137, 1926136, 1926134]}'
```

### JavaScript (fetch)

```javascript
fetch('https://api.remanga.org/api/activity/votes/', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_TOKEN'
  },
  body: JSON.stringify({
    chapter_ids: [1926137]
  })
})
.then(response => {
  if (response.status === 204) {
    console.log('Лайк успешно поставлен/снят');
  }
});
```

## Поведение

- **Toggle механизм:** Один и тот же запрос ставит лайк, если его нет, и снимает, если он уже есть
- **Ответ:** Пустое тело ответа со статусом 204
- **Обновление UI:** После запроса сайт делает GET запрос к `/api/v2/titles/chapters/` для обновления счетчиков

## Дополнительные заголовки (опциональные)

```
Referer: https://remanga.org/
Origin: https://remanga.org
User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36
Accept: */*
Accept-Language: ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7
```

## Связанные endpoints

### Получение информации о главах с данными о лайках

**URL:** `https://api.remanga.org/api/v2/titles/chapters/`

**Метод:** `GET`

**Параметры:**
- `branch_id` - ID ветки тайтла (обязательный)
- `user_data=1` - включить данные пользователя (лайки, просмотры)
- `ordering=-index` - сортировка по индексу (опционально)
- `page` - номер страницы (опционально)

**Пример запроса:**
```bash
curl "https://api.remanga.org/api/v2/titles/chapters/?branch_id=38715&user_data=1&ordering=-index&page=1" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Структура ответа:**
```json
{
  "next": 2,
  "previous": null,
  "results": [
    {
      "id": 1926137,
      "rated": true,
      "viewed": true,
      "score": 137,
      "chapter": "168",
      "tome": 3,
      "name": "",
      "is_bought": false,
      "is_free_today": false,
      "is_published": true,
      "is_paid": true,
      "price": "10.00",
      "upload_date": "2026-03-28T23:32:50.300712"
    }
  ]
}
```

**Ключевые поля:**
- `id` - ID главы (используется для лайков)
- `rated` - `true` если пользователь поставил лайк, `false` если нет
- `viewed` - `true` если глава просмотрена, `null` если нет
- `score` - количество лайков на главе

### Отметка просмотра главы

**URL:** `https://api.remanga.org/api/activity/views/`

**Метод:** `POST`

**Тело запроса:**
```json
{
  "chapter": CHAPTER_ID
}
```

## Примечания

1. Токен авторизации обязателен для всех запросов
2. API использует CORS с `Access-Control-Allow-Origin: https://remanga.org`
3. Кнопки лайков имеют атрибут `data-testid="like_btn_{chapter_id}"`
4. Endpoint `/api/activity/votes/` работает идемпотентно - повторный запрос снимает лайк
5. Поле `rated` в ответе `/api/v2/titles/chapters/` показывает статус лайка пользователя
6. После постановки/снятия лайка UI обновляется через GET запрос к `/api/v2/titles/chapters/`
