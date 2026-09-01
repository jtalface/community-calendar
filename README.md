José Alface

# Kids Activity Community Calendar MVP

A family-centered activity calendar for parents to manage kids' activities, trusted friend attendance, conflict warnings, carpools, and calendar exports.

## Stack

- React + TypeScript + Vite + Tailwind CSS
- Node.js + Express + TypeScript
- PostgreSQL + Prisma
- JWT auth
- REST API
- Vitest tests for conflict detection and carpool seat logic

## Project Structure

```text
apps/web        React app
apps/api        Express API, Prisma schema, seed, tests
packages/shared Shared TypeScript contracts
AUTOMATION.md   AI automation credit line
```

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create environment files:

```bash
cp .env.example apps/api/.env
cp .env.example apps/web/.env
```

3. Start Postgres and create a database named `kidcal`, or update `DATABASE_URL`.

4. Generate Prisma client, migrate, and seed:

```bash
npm run prisma:generate
npm run db:seed
```

For a fresh database, run the migration first:

```bash
cd apps/api
npx prisma migrate deploy
```

5. Run the app:

```bash
npm run dev
```

Web: http://localhost:5173  
API: http://localhost:4000/api/health

## Demo Login

Seed creates:

- Email: `alex.rivera@example.com`
- Password: `password123`

## Useful Scripts

```bash
npm run build
npm run lint
npm run test
npm run db:seed
```

## Mock Integrations

Calendar integrations are represented by `CalendarProvider` interfaces in the API. The current implementation seeds mock Google, Apple, and Outlook-style events and detects conflicts locally. Real OAuth and calendar sync can be added behind the same provider interface.

## Privacy Defaults

Children and activities default to private. Friend attendance only appears for shared activity attendance records, and sensitive address/contact fields are modeled separately for future encryption and permission checks.
