# BrainPort

Платформа обмена учебными материалами между преподавателями и студентами. Frontend на **HTML, CSS, JavaScript**; данные и авторизация — **Supabase**.

## Первый запуск (обязательно)

1. Откройте [Supabase Dashboard](https://supabase.com/dashboard) → ваш проект.
2. **SQL Editor** → вставьте и выполните содержимое файла `supabase/schema.sql`.
   - Если проект уже был развёрнут ранее, дополнительно выполните `supabase/migration_groups.sql`.
3. **Storage** → создайте bucket `materials` (private).
4. В **Storage → Policies** разрешите authenticated пользователям `insert` и `select` для bucket `materials`.
5. **Authentication → Providers** → включите Email.

## Регистрация и вход

- Откройте `index.html` в браузере (или через Live Server).
- Вкладка **Регистрация** — создайте аккаунт (преподаватель или студент).
- Вкладка **Вход** — email или логин (без `@` подставится домен `brainport.edu`).

Пример: логин `brainport` → `brainport@brainport.edu`.

## Публикация на GitHub Pages

1. Создайте репозиторий на GitHub и **загрузите всю папку проекта** (обязательно: `index.html`, `app.html`, `css/`, `js/`).
2. **Settings → Pages** → Source: ветка `main` (или `master`), папка **`/ (root)`**.
3. Откройте сайт по **правильному адресу**:
   - репозиторий `BrainPort` у пользователя `BadBo` → `https://badbo.github.io/BrainPort/`
   - отдельный репозиторий `brainport.github.io` → `https://brainport.github.io/`
4. В корне репозитория должен быть файл **`.nojekyll`** (уже есть в проекте) — иначе GitHub может «ломать» статический сайт.
5. В Supabase: **Authentication → URL Configuration** добавьте адрес сайта в **Site URL** и **Redirect URLs** (например `https://badbo.github.io/BrainPort/`).

Если видите почти пустую белую страницу с одной строкой — чаще всего открыт **не тот URL**, на GitHub лежит только README, или не загружены `css/` и `js/`.

## Запуск локально

Двойной клик по `index.html` или:

```bash
npx serve .
```

Для загрузки файлов в Storage лучше открывать через `http://localhost`, а не `file://`.

## Возможности

- Регистрация и вход через Supabase Auth
- Каталог материалов с поиском и фильтром
- Загрузка файлов (преподаватель) в Supabase Storage с выбором целевой группы
- Изоляция материалов по группам (студенты видят только свою группу)
- Фильтрация каталога по группам для преподавателя
- Уведомления студентам выбранной группы о новых материалах
- Адаптивный интерфейс для ПК и телефона

## Структура

```
Папка/
├── index.html          — вход и регистрация
├── app.html            — приложение
├── css/main.css
├── js/config.js        — URL и ключ Supabase
├── js/api.js           — работа с БД
├── js/storage.js       — сессия в браузере
├── js/app.js           — интерфейс
└── supabase/schema.sql — схема БД
```

## Конфигурация

Параметры в `js/config.js`:

- `SUPABASE_URL`
- `SUPABASE_KEY` (publishable key)
