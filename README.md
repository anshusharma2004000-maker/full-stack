# EXP-7

This repository contains only the application source folders:

- `frontend/` — frontend application
- `backend/` — backend application

## Before running

Install dependencies separately inside each project folder.

### Frontend
```bash
cd frontend
npm install
npm run dev
```

### Backend
Use the Maven wrapper if one is present, otherwise run with Maven:
```bash
cd backend
mvn spring-boot:run
```

Do not commit dependency/build folders such as `node_modules/` or `target/`.
