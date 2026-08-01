# 360° Virtual Tour Platform

An interactive, monorepo-based **360° Virtual Tour Platform** that enables users to create, customize, edit, and publish rich virtual tours with hotspots, custom audio, personalized avatars, and offline exports.

---

## 🏗️ Project Architecture

This project is structured as a monorepo powered by **Turborepo** and **pnpm** workspaces:

```
├── apps/
│   ├── web/              # Next.js frontend application (React, TailwindCSS)
│   ├── api/              # Node.js & Express API backend (Express, Prisma, media processors)
│   └── export-viewer/    # Standalone offline viewer for exported virtual tours (Vite)
├── packages/
│   └── shared/           # Shared types, Zod validation schemas, and common utilities
├── prisma/               # Database schema definitions and migrations
├── docker/               # Docker configuration files (e.g., Nginx, SSL)
└── docker-compose.yml    # Main Docker deployment configurations
```

---

## ⚙️ Prerequisites

Before getting started, make sure you have the following installed on your machine:
- **Node.js**: `v20.0.0` or higher
- **pnpm**: `v9.0.0` or higher (package manager)
- **PostgreSQL**: Local database instance (or run via Docker)
- **Docker & Docker Compose**: (Optional, for containerized environments)

---

## 🚀 Getting Started (Local Development)

### 1. Install Dependencies
Run the following command at the root of the workspace to install all dependencies for both applications and packages:
```bash
pnpm install
```

### 2. Configure Environment Variables
Copy the template env file to create your local configurations:
```bash
cp .env.example .env
```
Open the `.env` file and configure your database credentials, JWT secret, and port options:
- `DATABASE_URL`: Your PostgreSQL connection string.
- `JWT_SECRET`: Secure string used for signing authentication tokens.
- `API_PORT` / `CORS_ORIGIN`: API listener port (default `4000`) and client access URL (default `http://localhost:3000`).

### 3. Database Setup
Set up your database schemas and generate the Prisma Client using the following npm/pnpm scripts:
```bash
# Generate the Prisma Client locally
pnpm db:generate

# Push the schema changes directly to the database (or run pnpm db:migrate for migrations)
pnpm db:push

# Seed the database with the initial administrator account and dummy data
pnpm db:seed
```

### 4. Run Development Servers
Start all applications (`web`, `api`, `export-viewer`) concurrently in development mode:
```bash
pnpm dev
```
* The Next.js web application will be accessible at: `http://localhost:3000`
* The backend API server will be accessible at: `http://localhost:4000`

---

## 🐳 Docker Deployment

You can quickly deploy the database and applications using Docker.

* **Development mode (with local mounts):**
  ```bash
  pnpm docker:dev
  ```
* **Production mode (standalone built image):**
  ```bash
  pnpm docker:prod
  ```
* **Stop Docker containers:**
  ```bash
  pnpm docker:down
  ```

---

## 🛠️ Monorepo Scripts

Here is a list of other commands available at the root package:

| Command | Description |
| :--- | :--- |
| `pnpm build` | Build all projects in the Turborepo for production |
| `pnpm lint` | Run code quality checks (ESLint) across all projects |
| `pnpm typecheck` | Validate TypeScript compiler check across all packages |
| `pnpm db:studio` | Launch the Prisma Studio GUI database manager |
| `pnpm clean` | Wipe Turbo caches and delete all nested `node_modules` folders |
