# UpStudy

Цей проект складається з двох основних частин:
- **Backend**: API на базі C# / .NET з використанням бази даних PostgreSQL (в Docker).
- **Frontend**: веб-застосунок на базі React / Next.js.

Нижче наведені інструкції щодо локального запуску обох частин проекту.

---

## 1. Запуск Backend (C# .NET)

### Попередні вимоги
- Встановлений [Docker Desktop](https://www.docker.com/products/docker-desktop/) (або просто Docker та docker-compose).
- Встановлений [.NET SDK](https://dotnet.microsoft.com/download) (відповідної версії для проекту).
- Ваше улюблене середовище розробки (наприклад, JetBrains Rider, Visual Studio або VS Code).

### Крок 1: Запуск бази даних
Проект використовує PostgreSQL, яка налаштована для запуску через Docker. У папці `backend/UpStudy` є файл `docker-compose.yml`.

1. Відкрийте термінал і перейдіть до папки з `docker-compose.yml`:
   ```bash
   cd backend/UpStudy
   ```
2. Запустіть базу даних та pgAdmin у фоновому режимі:
   ```bash
   docker-compose up -d
   ```
   *Примітка: База даних буде доступна на порту `5432`. pgAdmin (адмінка для БД) буде доступний за адресою `http://localhost:5050` (логін: admin@admin.com, пароль: root).*

### Крок 2: Запуск API
1. Перейдіть до папки проекту бекенду (де лежить файл `.csproj`):
   ```bash
   cd backend/UpStudy
   ```
2. Запустіть проект:
   ```bash
   dotnet run
   ```
   *(Або ви можете відкрити рішення `backend/UpStudy.sln` у вашому IDE і запустити його звідти)*.

API зазвичай запускається за адресою `http://localhost:5xxx` або `https://localhost:7xxx`. Точний порт можна знайти в логах консолі після запуску або в файлі `Properties/launchSettings.json`.

---

## 2. Запуск Frontend (Next.js)

### Попередні вимоги
- Встановлений [Node.js](https://nodejs.org/) (рекомендується остання LTS версія).

### Крок 1: Встановлення залежностей
1. Відкрийте новий термінал і перейдіть до папки фронтенду:
   ```bash
   cd frontend
   ```
2. Встановіть необхідні NPM-пакети:
   ```bash
   npm install
   ```

### Крок 2: Запуск сервера розробки
1. У тій самій папці `frontend` виконайте команду:
   ```bash
   npm run dev
   ```
2. Відкрийте браузер і перейдіть за адресою:
   [http://localhost:3000](http://localhost:3000)

Тепер ви можете редагувати файли в `frontend/app` і вони будуть автоматично оновлюватися в браузері.
