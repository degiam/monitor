<p align="center">
  <a href="https://svelte.dev" target="_blank"><img src="https://upload.wikimedia.org/wikipedia/commons/1/1b/Svelte_Logo.svg" width="100" alt="Svelte Logo" style="margin: 30px 0px 20px 0px"></a>
</p>

<p align="center">
  <a href="https://github.com/sveltejs/svelte/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="License"></a>
  <a href="https://www.npmjs.com/package/svelte"><img src="https://img.shields.io/npm/v/svelte.svg?style=flat" alt="npm version"></a>
</p>

# Monitor (Pantau)

## Installation

1. Clone the repository and navigate into the project directory:
   ```bash
   git clone <repository-url>
   cd monitor
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Copy the example environment variables file and configure it:
   ```bash
   cp .env.example .env
   ```

4. Sync the database schema:
   ```bash
   npm run db:push
   ```

5. Start the development server:
   ```bash
   npm run dev
   ```

## Environment Variables

Before running the application, you need to configure the `.env` file. Here are the variables you need to fill:

- `PUBLIC_APP_NAME`: The name of the application (e.g., Pantau)
- `APP_PASSWORD`: The admin password for logging into the application
- `SESSION_SECRET`: A secret key used for session management (make sure this is long and secure)
- `PORT`: The port on which the server will run (default is `3000`)
- `HOST`: The host address to bind the server to (default is `0.0.0.0`)
- `DATABASE_URL`: The path to the SQLite database. 
  - For local development: `local.db`
  - For Docker production: `/data/monitor.db`

## Building for Production

To create a production version of your app:

```bash
npm run build
```

You can preview the production build with `npm run preview`.

## Deploying with Docker

You can easily deploy this application using Docker and Docker Compose. A `Dockerfile` and `docker-compose.yml` are provided.

1. Ensure your `.env` file is properly configured. Pay special attention to `DATABASE_URL=/data/monitor.db` for Docker deployment so the data persists in the Docker volume.
2. Build and start the container in detached mode:
   ```bash
   docker compose up -d --build
   ```

The application will be accessible at `http://localhost:3000` (or whichever port you specified in your `.env` file).

### Useful Docker Commands

- **View Logs**:
  ```bash
  docker compose logs -f
  ```
- **Stop the Container**:
  ```bash
  docker compose down
  ```
- **Restart the Container**:
  ```bash
  docker compose restart
  ```
