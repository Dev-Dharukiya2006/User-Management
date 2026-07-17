# User Management App

Simple full-stack user management system: React + Vite frontend, Express/Node backend, MySQL database, JWT authentication, and full CRUD on users.

## Features
- Register / Login (JWT-based, passwords hashed with bcrypt)
- View all users (table)
- Create user
- Edit user (name, email, password, role)
- Delete user
- Basic protected routes (must be logged in to see dashboard)

No advanced auth (no refresh tokens, no email verification, no role-based route guarding beyond a simple role field) — kept intentionally simple per requirements.

## Project Structure
```
user-management-app/
├── backend/
│   ├── config/db.js          # MySQL connection pool
│   ├── controllers/          # auth + user logic
│   ├── middleware/auth.js    # JWT verification
│   ├── routes/                # /api/auth, /api/users
│   ├── sql/schema.sql        # DB + table creation
│   ├── server.js
│   ├── package.json
│   └── .env.example
└── frontend/
    ├── src/
    │   ├── api/axios.js       # axios instance w/ auth header
    │   ├── context/AuthContext.jsx
    │   ├── components/        # UserTable, UserFormModal, ProtectedRoute
    │   ├── pages/              # Login, Register, Dashboard
    │   ├── App.jsx
    │   └── index.css
    ├── index.html
    ├── vite.config.js
    └── package.json
```

## Setup

### 1. Database
Make sure MySQL is running, then create the database and table:
```bash
mysql -u root -p < backend/sql/schema.sql
```

### 2. Backend
```bash
cd backend
cp .env.example .env
# edit .env with your MySQL credentials and a JWT secret
npm install
npm run dev      # requires nodemon (in devDependencies), or: npm start
```
Backend runs at `http://localhost:5000`.

### 3. Frontend
```bash
cd frontend
npm install
npm run dev
```
Frontend runs at `http://localhost:3000` and talks to the API at `http://localhost:5000/api` (see `src/api/axios.js` — change the `baseURL` if your backend runs elsewhere).

## Usage
1. Go to `http://localhost:3000/register` and create an account.
2. Log in.
3. On the dashboard, add / edit / delete users as needed.

## API Endpoints

| Method | Endpoint             | Auth required | Description          |
|--------|-----------------------|---------------|-----------------------|
| POST   | /api/auth/register    | No            | Register new user     |
| POST   | /api/auth/login       | No            | Login, returns JWT    |
| GET    | /api/users            | Yes           | List all users        |
| GET    | /api/users/:id        | Yes           | Get single user       |
| POST   | /api/users            | Yes           | Create user           |
| PUT    | /api/users/:id        | Yes           | Update user           |
| DELETE | /api/users/:id        | Yes           | Delete user           |

Send the JWT as: `Authorization: Bearer <token>`

## Notes
- Passwords are hashed with bcrypt before storing — never stored in plain text.
- This is a learning/starter project, not hardened for production (no rate limiting, no CSRF protection, no refresh tokens, no email verification).
