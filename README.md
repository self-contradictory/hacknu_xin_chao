# HackNU Xin Chao - Система управления вакансиями и заявками

Полнофункциональная веб-платформа для управления вакансиями, подачи заявок и автоматической оценки кандидатов с использованием ИИ.

## 🚀 Особенности

- **Frontend**: React + Vite с современным UI
- **Backend**: FastAPI с PostgreSQL
- **ИИ интеграция**: Google Gemini для анализа резюме и оценки кандидатов
- **Аутентификация**: JWT токены
- **Файловая обработка**: Загрузка и анализ PDF резюме
- **Система скоринга**: Автоматическая оценка соответствия кандидатов вакансиям

## 📋 Требования

### Системные требования
- Python 3.8+
- Node.js 16+
- PostgreSQL 12+
- Git

### API ключи
- Google AI API ключ (для Gemini)

## 🛠 Установка и настройка

### 1. Клонирование репозитория

```bash
git clone <repository-url>
cd hacknu_xin_chao
```

### 2. Настройка Backend

#### Установка зависимостей Python

```bash
cd backend
pip install -r requirements.txt
```

#### Настройка базы данных PostgreSQL

1. Установите PostgreSQL
2. Создайте базу данных:
```sql
CREATE DATABASE postgres;
CREATE USER postgres WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE postgres TO postgres;
```

#### Настройка переменных окружения

Создайте файл `.env` в папке `backend/`:

```env
# Сервер
HOST=0.0.0.0
PORT=8000
RELOAD=False

# Google AI API
GOOGLE_API_KEY=your_google_api_key_here
MODEL_NAME=gemini-2.5-flash-lite
LLM_PROVIDER=google

# База данных
DB_TYPE=postgresql+psycopg2
DB_NAME=postgres
DB_HOST=localhost
DB_USER=postgres
DB_PASSWORD=your_password
DB_PORT=5432
```

### 3. Настройка Frontend

#### Установка зависимостей Node.js

```bash
cd frontend
npm install
```

#### Настройка переменных окружения (опционально)

Создайте файл `.env` в папке `frontend/`:

```env
VITE_API_BASE=/api
```

## 🚀 Запуск проекта

### Вариант 1: Запуск в отдельных терминалах

#### Терминал 1 - Backend
```bash
cd backend
python main.py
```

#### Терминал 2 - Frontend
```bash
cd frontend
npm run dev
```

### Вариант 2: Запуск с помощью скриптов

#### Windows (PowerShell)
```powershell
# Backend
cd backend
Start-Process powershell -ArgumentList "-NoExit", "-Command", "python main.py"

# Frontend
cd frontend
Start-Process powershell -ArgumentList "-NoExit", "-Command", "npm run dev"
```

#### Linux/macOS
```bash
# Backend
cd backend && python main.py &

# Frontend
cd frontend && npm run dev &
```

## 🌐 Доступ к приложению

После запуска приложение будет доступно по адресам:

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API документация**: http://localhost:8000/docs

## 📁 Структура проекта

```
hacknu_xin_chao/
├── backend/                 # FastAPI backend
│   ├── api/                # API роутеры
│   │   ├── router.py       # Главный роутер
│   │   └── routers/        # Модульные роутеры
│   ├── core/               # Основные компоненты
│   │   ├── auth.py         # Аутентификация
│   │   ├── config.py       # Конфигурация
│   │   ├── db.py           # База данных
│   │   ├── llm.py          # ИИ интеграция
│   │   └── scoring.py      # Система скоринга
│   ├── models/             # SQLAlchemy модели
│   ├── services/           # Бизнес-логика
│   ├── main.py            # Точка входа
│   └── requirements.txt   # Python зависимости
├── frontend/              # React frontend
│   ├── src/
│   │   ├── components/    # React компоненты
│   │   ├── hooks/         # Custom hooks
│   │   ├── lib/           # Утилиты и API
│   │   ├── pages/         # Страницы
│   │   └── styles/        # Стили
│   ├── package.json       # Node.js зависимости
│   └── vite.config.js     # Vite конфигурация
└── README.md
```

## 🔧 Основные функции

### Для рекрутеров:
- Создание и управление вакансиями
- Просмотр заявок кандидатов
- Автоматическая оценка соответствия
- Фильтрация по баллам и рекомендациям

### Для кандидатов:
- Просмотр доступных вакансий
- Подача заявок с резюме
- Загрузка PDF файлов
- Отслеживание статуса заявок

### ИИ функции:
- Анализ текста резюме
- Оценка соответствия требованиям вакансии
- Генерация рекомендаций
- Детальная разбивка скоринга

## 🐛 Устранение неполадок

### Проблемы с базой данных
```bash
# Проверьте статус PostgreSQL
sudo systemctl status postgresql

# Перезапустите службу
sudo systemctl restart postgresql
```

### Проблемы с портами
- Backend по умолчанию использует порт 8000
- Frontend по умолчанию использует порт 3000
- Убедитесь, что порты свободны

### Проблемы с API ключом
- Проверьте правильность Google API ключа
- Убедитесь, что ключ имеет доступ к Gemini API

## 📝 API Endpoints

### Пользователи
- `POST /api/users/create` - Создание пользователя
- `POST /api/users/login` - Вход в систему
- `GET /api/users/fetch_by_id/{id}` - Получение пользователя

### Вакансии
- `GET /api/jobs/fetch_all` - Все вакансии
- `GET /api/jobs/fetch_by_id/{id}` - Вакансия по ID
- `POST /api/jobs/create` - Создание вакансии
- `GET /api/jobs/fetch_by_recruiter/{id}` - Вакансии рекрутера

### Заявки
- `POST /api/applications/create` - Создание заявки
- `GET /api/applications/fetch_all` - Все заявки
- `GET /api/applications/by_job/{id}` - Заявки по вакансии
- `POST /api/applications/{id}/score` - Оценка заявки

## 🤝 Вклад в проект

1. Форкните репозиторий
2. Создайте ветку для новой функции
3. Внесите изменения
4. Создайте Pull Request

## 📄 Лицензия

Этот проект создан в рамках HackNU и предназначен для образовательных целей.

## 📞 Поддержка

При возникновении проблем создайте Issue в репозитории или обратитесь к команде разработки.