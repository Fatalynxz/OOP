# GrabEat Django + React App

This project combines the provided Vite React UI with a Python Django backend.
The backend uses an OOP structure: models represent restaurant domain objects,
repositories handle data access, services contain business actions, and
class-based views expose JSON APIs.

## Supabase setup

1. Create a Supabase project.
2. Open Project Settings -> Database -> Connection string -> URI.
3. Copy `.env.example` to `.env`.
4. Put the Supabase Postgres URI into `DATABASE_URL`.

## Backend

```bash
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py seed_demo
python manage.py runserver
```

API base URL: `http://127.0.0.1:8000/api`

Demo logins seeded by `seed_demo` use password `grabeat123`.

```text
cashier   cashier
kitchen   kitchen
manager   manager
admin     admin
```

## Frontend

```bash
npm install
npm run dev
```

Set `VITE_API_BASE_URL` in `.env` if the Django API runs somewhere else.

## One-click Windows run

Double-click `run_system.bat`, or run:

```powershell
.\run_system.bat
```

It cleans generated caches, applies migrations, and starts Django plus Vite.
