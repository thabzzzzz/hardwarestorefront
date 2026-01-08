# Minimal dev / production workflow (forkable)

This document describes a minimal, clean setup you can fork for production while keeping a fast local developer loop.

Local development (recommended minimal):

- Backend (Laravel) options:
  - Quick (no Docker): run a local PHP + Composer environment and start the app server:

    ```bash
    # from project root
    cd app
    composer install
    php artisan migrate --seed   # only if you want sample data
    php artisan serve --host=0.0.0.0 --port=8080
    ```

  - Docker (if you prefer containers): use the repository `docker-compose.yml` (if present) or run a lightweight service that exposes port 8080 to host.

- Frontend (Next.js):
  - For local work, use a local API base URL. Create a file `frontend/.env.local` (do not commit) from `frontend/.env.example`:

    ```bash
    cp frontend/.env.example frontend/.env.local
    # then start dev server
    cd frontend
    npm install
    npm run dev
    ```

  - The app code uses `process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080'`, so when `NEXT_PUBLIC_API_BASE_URL` is not set, the frontend will call `http://localhost:8080`.

Production fork (minimal):

- Repository layout for a forked production deployment should contain:
  - A `docker-compose.prod.yml` (or Kubernetes manifests) that:
    - Builds the `app` image from your Dockerfile, installs PHP extensions, composer, etc.
    - Uses a managed Postgres service or `db` container with persistent volumes.
    - An `nginx` service using `nginx/default.conf` configured for your production hostnames.
    - Exposes only necessary ports (80/443) and keeps internal services private.

- Frontend production build:

  - Set `frontend/.env.production` (copy from `frontend/.env.production.example`) with `NEXT_PUBLIC_API_BASE_URL` set to your production API URL (https://api.yoursite.com).

  - Build and export the frontend static assets or run Next.js in production mode:

    ```bash
    cd frontend
    npm ci
    npm run build
    npm run start   # or export/static host depending on your choice
    ```

Notes and suggestions:

- Keep secrets out of the repo: commit only `*.example` env files. Use your CI/CD or server secret manager for real secrets.
- For local debugging, `php artisan serve` + `NEXT_PUBLIC_API_BASE_URL=http://localhost:8080` is the fastest path.
- If you want a small local docker-compose for dev that resembles prod, create `docker-compose.dev.yml` that maps app's port to `8080` for the host; keep `docker-compose.prod.yml` focused on production concerns (nginx, TLS, scaling) when forking.

If you want, I can:

- create a `docker-compose.dev.yml` template that exposes the backend on `localhost:8080` and uses a local Postgres volume; (added)
- or create a `frontend/.env.local` file for you now and start the Next dev server (if you want me to run it here).

Dev compose usage:

```bash
# Start dev stack (builds app then runs artisan dev server on host:8080)
docker compose -f docker-compose.dev.yml up --build

# Start frontend dev server locally (so it calls http://localhost:8080 for API):
cd frontend
npm install
npm run dev
```

Notes:
- `docker-compose.dev.yml` is intentionally minimal: it mounts your repository, exposes the Laravel dev server on `localhost:8080` and runs migrations optionally. Keep secret values out of source control and use `.env` files per environment.

