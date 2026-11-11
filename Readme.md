# Chat App

![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React_19-61DAFB?logo=react&logoColor=black)
![Node.js](https://img.shields.io/badge/Node.js-339933?logo=nodedotjs&logoColor=white)
![Express](https://img.shields.io/badge/Express-000000?logo=express&logoColor=white)
![Socket.IO](https://img.shields.io/badge/Socket.IO-010101?logo=socketdotio&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?logo=postgresql&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-2D3748?logo=prisma&logoColor=white)

A full-stack real-time chat application with JWT + Google OAuth authentication, persistent message history, and live typing indicators — built end-to-end (schema, API, WebSocket layer, UI) as a portfolio project.

> 🔗 **Live demo:** https://chat-for-everyone-app.netlify.app

## Tech Stack

**Backend**
- Node.js + TypeScript
- Express + Socket.IO
- Prisma ORM + PostgreSQL
- JWT authentication (access token + refresh token via httpOnly cookie)
- Resend (email activation, sent via HTTP API rather than SMTP)

**Frontend**
- React 19 + TypeScript
- Vite + Tailwind CSS
- Zustand (state management)
- Socket.IO client
- Axios + React Router

**Tooling**
- pnpm workspaces (monorepo)
- ESLint + Prettier
- Husky + lint-staged (pre-commit hooks)
- Docker (PostgreSQL)

## Features

- Register with email activation
- Login / logout with JWT (access token in memory, refresh token in httpOnly cookie)
- Session restore on page refresh
- Create, rename, delete chat rooms
- Persistent message history (last 50 messages per room)
- Real-time typing indicators
- Responsive dark UI

## Prerequisites

- [Node.js](https://nodejs.org/) v18+
- [pnpm](https://pnpm.io/) v8+
- [Docker](https://www.docker.com/) (for PostgreSQL)

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/IvanKovalyoff/Chat-app.git
cd Chat-app
```

### 2. Install dependencies

```bash
pnpm install
```

### 3. Configure environment variables

```bash
cp backend/.env.example backend/.env
```

Open `backend/.env` and fill in:

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_ACCESS_SECRET` | Secret for signing access tokens |
| `JWT_REFRESH_SECRET` | Secret for signing refresh tokens |
| `CLIENT_URL` | Frontend origin (`http://localhost:5173`) |
| `RESEND_API_KEY` | API key from your [Resend](https://resend.com) account |
| `EMAIL_FROM` | Sender address for activation emails |

> Create a free account at [resend.com](https://resend.com) to get an API key. Without a verified domain, use the sandbox sender `onboarding@resend.dev` — it only delivers to the email address you signed up to Resend with, which is fine for local development. To send activation emails to real users, verify a domain you own in the Resend dashboard and point `EMAIL_FROM` at an address on it (e.g. `no-reply@yourdomain.com`).

### 4. Start the database

```bash
docker compose up -d
```

### 5. Run database migrations

```bash
cd backend
pnpm migrate
```

When prompted, name the migration `init`.

### 6. Start the development servers

```bash
# From the project root — starts backend and frontend simultaneously
pnpm dev
```

| Service | URL |
|---|---|
| Frontend | http://localhost:5173 |
| Backend | http://localhost:3001 |

## Project Structure

```
chat-app/
├── backend/
│   ├── prisma/
│   │   └── schema.prisma       # Database models
│   └── src/
│       ├── api/                # Auth routes + controllers
│       ├── entity/             # Prisma repositories
│       ├── middlewares/        # JWT auth middleware
│       ├── services/           # Business logic
│       ├── socket/             # Socket.IO event handlers
│       └── utils/              # DB client, JWT, mailer
└── frontend/
    └── src/
        ├── api/                # Axios auth calls
        ├── components/         # Sidebar, ChatWindow, MessageList, etc.
        ├── pages/              # LoginPage, RegisterPage, ChatPage, etc.
        ├── store/              # Zustand stores (auth + chat)
        └── socket.ts           # Socket.IO client singleton
```

## Available Scripts

From the project root:

| Script | Description |
|---|---|
| `pnpm dev` | Start backend + frontend in development mode |
| `pnpm lint:backend` | Lint backend source files |
| `pnpm lint:frontend` | Lint frontend source files |
| `pnpm format` | Format all files with Prettier |

From `backend/`:

| Script | Description |
|---|---|
| `pnpm dev` | Start backend with hot reload |
| `pnpm migrate` | Run Prisma migrations |
| `pnpm generate` | Regenerate Prisma client |
| `pnpm build` | Compile TypeScript |

## Deployment (Netlify + Coolify)

Live: frontend at [chat.ivkoff.dev](https://chat.ivkoff.dev), API at `https://api-chat.ivkoff.dev`.

This is a pnpm workspace monorepo — the frontend and backend are deployed separately from the same repo. `netlify.toml` at the repo root encodes the frontend build config.

### Backend (Coolify on a self-hosted VPS)

- Source: GitHub App, branch `main` — every push redeploys automatically
- Build pack: Nixpacks, base directory: repo root (pnpm workspaces need the root `pnpm-lock.yaml`)
- Install command: `pnpm install --frozen-lockfile`
- Build command: `pnpm --filter backend run build`
- Start command: `pnpm --filter backend run migrate:deploy && pnpm --filter backend run start`
  - `prisma generate` runs automatically via `postinstall`
- Exposed port: `3001`; health check: `GET /health`
- Watch paths (so frontend-only changes don't rebuild the API): `backend/**`, `package.json`, `pnpm-lock.yaml`, `pnpm-workspace.yaml`
- Database: PostgreSQL 16 managed by Coolify on the same server (private network only), with daily backups to Cloudflare R2
- Environment variables (see `backend/.env.example`): `DATABASE_URL`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `JWT_ACCESS_EXPIRES_IN`, `JWT_REFRESH_EXPIRES_IN`, `PORT`, `SERVER_URL` (this backend's public URL), `CLIENT_URL` (the deployed frontend's public URL), `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `RESEND_API_KEY`, `EMAIL_FROM`, plus `NIXPACKS_NODE_VERSION=22` (build-time only)
  - Generate **fresh** `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` values for production — don't reuse local dev secrets
  - Email is sent via Resend's HTTP API rather than SMTP, since many hosts block or throttle outbound SMTP ports
- In Google Cloud Console, add `${SERVER_URL}/auth/google/callback` as an authorized redirect URI and `${CLIENT_URL}` as an authorized JavaScript origin

### Frontend (Netlify)

- Build command: `pnpm --filter frontend run build`
- Publish directory: `frontend/dist`
- Environment variable: `VITE_API_URL` — the backend's public URL (see `frontend/.env.example`); it is baked in at build time, so redeploy after changing it

Frontend and backend live on subdomains of the same site (`ivkoff.dev`), so the refresh-token cookie is first-party for the browser. It is still set with `SameSite=None; Secure`, which requires HTTPS on both ends.

## Author

**Ivan Kovalov** — Software Developer based in Poland

- GitHub: [github.com/IvanKovalyoff](https://github.com/IvanKovalyoff)
- LinkedIn: [linkedin.com/in/ivan-kovalov-197759348](https://www.linkedin.com/in/ivan-kovalov-197759348)
- Email: [kovalevivan420@gmail.com](mailto:kovalevivan420@gmail.com)

## License

MIT