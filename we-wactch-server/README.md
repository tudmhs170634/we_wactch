# We Watch 2.0 — Backend

A clean, production-ready NestJS backend scaffold for the We Watch 2.0 team project.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | NestJS 11 (TypeScript strict) |
| Database | PostgreSQL 16 |
| ORM | Prisma 7 |
| Cache / Pub-Sub | Redis 7 |
| Auth | JWT + bcrypt |
| Real-time | Socket.io |

---

## Quick Start

### 1. Prerequisites

- [Node.js 20+](https://nodejs.org/)
- [Docker Desktop](https://www.docker.com/products/docker-desktop/)

### 2. Environment

```bash
cp .env.example .env
# Edit .env with your values if needed
```

### 3. Start infrastructure (PostgreSQL + Redis)

```bash
npm run docker:up
# or: docker-compose up -d
```

### 4. Generate Prisma client

```bash
npm run prisma:generate
```

### 5. Run the dev server

```bash
npm run start:dev
```

API base: `http://localhost:3000/api/v1`

---

## Folder Structure

```
src/
├── modules/
│   ├── auth/              # Dev A — JWT auth (register, login)
│   │   ├── dto/
│   │   ├── interfaces/
│   │   ├── strategies/    # passport-jwt
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   └── auth.module.ts
│   ├── users/             # Dev A — user profile CRUD
│   ├── rooms/             # Dev B — watch room management
│   └── videos/            # Dev C — video queue per room
├── common/
│   ├── decorators/        # @CurrentUser(), @Public()
│   ├── guards/            # JwtAuthGuard (global)
│   ├── filters/           # AllExceptionsFilter (global)
│   ├── interceptors/      # TransformInterceptor (global)
│   └── utils/             # createResponse()
├── config/                # configuration.ts + interfaces
├── prisma/                # PrismaService + PrismaModule (global)
├── redis/                 # RedisService + RedisModule (global)
└── socket/                # AppGateway + SocketModule
prisma/
└── schema.prisma          # datasource + generator only (no models yet)
prisma.config.ts           # Prisma 7 config — DATABASE_URL
docker-compose.yml
.env.example
```

---

## Team Work Split

| Developer | Owns | Files |
|-----------|------|-------|
| **Dev A** | Auth + Users | `modules/auth/`, `modules/users/` |
| **Dev B** | Rooms + Socket | `modules/rooms/`, `socket/` |
| **Dev C** | Videos | `modules/videos/` |

### Rules to avoid conflicts

- **Never edit** `app.module.ts` without team discussion — it is the root wiring file.
- **Never import** `AuthModule` directly into feature modules; use `JwtAuthGuard` at the global level (already registered).
- **PrismaService** is globally available — inject it wherever needed, no re-import.
- **RedisService** is globally available — same as above.
- Keep your `TODO` comments until you implement the feature so teammates know what is pending.

---

## Global API Response Format

Every response follows this shape (enforced by `TransformInterceptor` + `AllExceptionsFilter`):

```json
{
  "success": true,
  "message": "Success",
  "data": { ... }
}
```

Error example:
```json
{
  "success": false,
  "message": "Unauthorized",
  "data": null
}
```

---

## Auth Flow (ready to implement)

1. `POST /api/v1/auth/register` — create user (stubbed, Dev A implements)
2. `POST /api/v1/auth/login` — returns `{ accessToken }` (stubbed, Dev A implements)
3. All other routes require `Authorization: Bearer <token>` header
4. Use `@Public()` decorator to opt a route out of JWT auth

---

## Prisma Usage

```bash
# Generate client after schema changes
npm run prisma:generate

# Create and apply a migration (when models are ready)
npm run prisma:migrate

# Open Prisma Studio
npm run prisma:studio
```

> ⚠️ **Do not add models to `schema.prisma` yet.** The team will design the schema together and add the `// TODO: define models later` models in a dedicated planning session.

---

## Socket Events (stub — Dev B implements)

| Event | Direction | Description |
|-------|-----------|-------------|
| `room:join` | Client → Server | Join a watch room |
| `room:leave` | Client → Server | Leave a watch room |
| `video:sync` | Client → Server | Broadcast play/pause/seek |

---

## Scripts

```bash
npm run start:dev        # development with hot reload
npm run build            # production build
npm run start:prod       # run compiled output
npm run prisma:generate  # generate Prisma client
npm run prisma:migrate   # run DB migrations
npm run prisma:studio    # Prisma GUI
npm run docker:up        # start PostgreSQL + Redis
npm run docker:down      # stop containers
npm run test             # unit tests
npm run test:cov         # coverage report
npm run lint             # lint + auto-fix
```
