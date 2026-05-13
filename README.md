# TaskFlow — Team Task Manager

A full-stack team task management app built with React, Node.js, Express, and MongoDB.

## Features
- 🔐 JWT Authentication (signup/login/refresh tokens)
- 📁 Project creation & team management
- ✅ Task CRUD with Kanban board
- 📊 Dashboard with stats & overdue detection
- 👥 Role-based access (Admin / Member)
- 🎨 Beautiful dark-mode UI

## Tech Stack
- **Frontend:** React 19, Vite, React Router, Axios, Lucide Icons
- **Backend:** Node.js, Express, Mongoose, JWT, Helmet, Rate Limiting
- **Database:** MongoDB Atlas

## Setup

### 1. Clone & Install
```bash
git clone <your-repo-url>
cd website
cd server && npm install
cd ../client && npm install
```

### 2. Configure Environment
```bash
cp server/.env.example server/.env
# Edit server/.env with your MongoDB URI and JWT secrets
```

### 3. Run Development
```bash
# Terminal 1 — Backend
cd server && npm run dev

# Terminal 2 — Frontend
cd client && npm run dev
```

### 4. Deploy to Railway
- Connect your GitHub repo
- Add server as a service (root dir: `server`)
- Add client build command and serve from server in production
- Set environment variables in Railway dashboard

## API Endpoints
| Method | Endpoint | Access |
|--------|----------|--------|
| POST | /api/auth/signup | Public |
| POST | /api/auth/login | Public |
| GET | /api/auth/me | Private |
| GET | /api/dashboard | Private |
| CRUD | /api/projects | Admin |
| CRUD | /api/tasks | Private |
| GET | /api/users | Admin |

## License
MIT
