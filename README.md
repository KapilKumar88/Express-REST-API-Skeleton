# Express REST API Skeleton

Production-ready Node.js/Express REST API boilerplate with JWT auth, refresh token rotation, email verification, and task management.

## Requirements

- Node.js >= 22
- MongoDB

## Setup

```bash
git clone <repo_url>
cd Express-REST-API-Skeleton
npm install
cp .env.example .env        # fill in MONGO_CONNECTION_STRING and MAIL_* values
node scripts/generate-secrets.js   # generates JWT_SECRET, JWT_REFRESH_TOKEN_SECRET, ENCRYPTION_SECRET
npm run start:dev
```

## Commands

| Command             | Description                           |
| ------------------- | ------------------------------------- |
| `npm run start:dev` | Start with nodemon (development)      |
| `npm start`         | Start without hot reload (production) |
| `npm test`          | Run Jest tests with coverage          |
| `npm run lint`      | Lint with ESLint                      |
| `npm run lint:fix`  | Lint and auto-fix                     |
| `npm run prettier`  | Format all files with Prettier        |

Run a single test file: `npx jest tests/auth.test.js`

## Environment Variables

| Variable                        | Required | Description                                                    |
| ------------------------------- | -------- | -------------------------------------------------------------- |
| `MONGO_CONNECTION_STRING`       | Yes      | MongoDB URI                                                    |
| `JWT_SECRET`                    | Yes      | JWT signing secret (≥ 32 chars)                                |
| `JWT_REFRESH_TOKEN_SECRET`      | Yes      | Refresh token secret (≥ 32 chars, must differ from JWT_SECRET) |
| `ENCRYPTION_SECRET`             | Yes      | AES-256 key — exactly 64 hex chars                             |
| `JWT_EXPIRE_TIME`               | No       | Access token TTL in minutes (default: 30)                      |
| `JWT_REFRESH_TOKEN_EXPIRE_TIME` | No       | Refresh token TTL in days (default: 90)                        |
| `MAX_LOGIN_ATTEMPTS`            | No       | Failed attempts before lockout (default: 5)                    |
| `LOCKOUT_MINUTES`               | No       | Lockout duration (default: 30)                                 |
| `MAIL_HOST`                     | Yes      | SMTP host                                                      |
| `MAIL_PORT`                     | Yes      | SMTP port                                                      |
| `MAIL_USERNAME`                 | Yes      | SMTP username                                                  |
| `MAIL_PASSWORD`                 | Yes      | SMTP password                                                  |
| `MAIL_FROM_ADDRESS`             | Yes      | From address                                                   |

Use `node scripts/generate-secrets.js --force` to regenerate secrets (invalidates all active sessions).

## API Endpoints

All routes are prefixed with `/api`. API docs available at `http://localhost:3000/api-docs`.

### Auth

| Method | Endpoint                         | Auth | Description                              |
| ------ | -------------------------------- | ---- | ---------------------------------------- |
| POST   | `/api/register`                  | No   | Register (always 200 — enumeration-safe) |
| POST   | `/api/verify-email`              | No   | Verify email with token                  |
| POST   | `/api/resend-email-verification` | No   | Resend verification email                |
| POST   | `/api/login`                     | No   | Login — returns access + refresh tokens  |
| POST   | `/api/token`                     | No   | Rotate refresh token                     |
| POST   | `/api/logout`                    | Yes  | Revoke all refresh tokens                |
| POST   | `/api/forgot-password`           | No   | Send password reset email (always 200)   |
| POST   | `/api/reset-password`            | No   | Reset password with token                |

### Tasks

All task routes require `Authorization: Bearer <token>`.

| Method | Endpoint         | Description |
| ------ | ---------------- | ----------- |
| GET    | `/api/tasks`     | List tasks  |
| POST   | `/api/tasks`     | Create task |
| GET    | `/api/tasks/:id` | Get task    |
| PUT    | `/api/tasks/:id` | Update task |
| DELETE | `/api/tasks/:id` | Delete task |

## Project Structure

```
├── config/          # JWT, mail, lockout config + env validation
├── controller/      # Request handlers
├── helpers/         # Shared utilities (validation, hashing, encryption, mail)
├── middlewares/     # isAuthenticated JWT middleware
├── models/          # Mongoose models (User, Task, RefreshToken, VerificationToken)
├── routes/          # Express routers
├── scripts/         # generate-secrets.js
├── services/        # Thin wrappers over models
├── tests/           # Jest test suites
├── utils/           # Audit logger
├── validationSchema/ # Joi schemas
└── views/           # EJS email templates
```

## Tech Stack

- **Framework:** Express 4
- **Database:** MongoDB via Mongoose
- **Auth:** JWT (access + refresh token rotation), bcryptjs
- **Validation:** Joi
- **Email:** Nodemailer + EJS templates
- **Logging:** Winston (daily rotate) + Morgan
- **Security:** Helmet, express-rate-limit, express-mongo-sanitize, AES-256-GCM encryption
- **Testing:** Jest + Supertest + mongodb-memory-server
- **Tooling:** ESLint, Prettier, Husky, lint-staged
