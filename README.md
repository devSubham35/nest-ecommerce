# Nest E-commerce API

A small NestJS e-commerce backend. The project currently provides user
registration, login, JWT access tokens, rotating refresh tokens, logout, and
authenticated user endpoints.

## Stack

- NestJS 12
- PostgreSQL
- Prisma 7
- JWT authentication
- Jest

## Setup

Requirements: Node.js, Yarn, and PostgreSQL.

```bash
yarn install
cp .env.example .env
yarn prisma generate
yarn prisma migrate dev
```

Update `DATABASE_URL` and both JWT secrets in `.env` before starting the app.
The access and refresh secrets must be different.

## Run

```bash
# Development with file watching
yarn start:dev

# Production build
yarn build
yarn start:prod
```

The API listens on `http://localhost:3000` by default. All application routes
use the `/api/v1` prefix.

## API

| Method | Route | Authentication | Purpose |
| --- | --- | --- | --- |
| `GET` | `/api/v1` | Public | Health check |
| `POST` | `/api/v1/auth/sign-up` | Public | Create an account and issue tokens |
| `POST` | `/api/v1/auth/sign-in` | Public | Sign in and issue tokens |
| `POST` | `/api/v1/auth/refresh` | Public | Rotate a refresh token |
| `POST` | `/api/v1/auth/logout` | Public | Revoke a refresh-token family |
| `GET` | `/api/v1/users/profile` | Bearer token | Get the current user |
| `GET` | `/api/v1/users` | Bearer token | List users |

Send authenticated requests with this header:

```text
Authorization: Bearer <access-token>
```

Refresh tokens are single-use. Using an already rotated token revokes its
entire token family.

## Quality checks

```bash
yarn lint
yarn test --runInBand
yarn test:e2e --runInBand
yarn build
```

## Project layout

```text
src/auth/       authentication controller, service, DTOs, and guard
src/user/       user controller and database access
src/common/     shared decorators and security services
prisma/         schema, migrations, and Prisma module
test/           end-to-end tests
```
