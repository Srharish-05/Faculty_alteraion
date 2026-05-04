# Faculty_alteraion

## Deploy On Render

1. Push this repo to GitHub.
2. In Render, create a new `Web Service` from this repository.
3. Use these settings:
	- Build Command: `npm install`
	- Start Command: `npm start`
4. Set environment variables in Render:
	- `MONGODB_URI`
	- `DATABASE_NAME=faculty_db`
	- `NODE_ENV=production`

## Keep Service Active Longer

Render free instances sleep after inactivity. To reduce sleep:

1. Set these environment variables in Render:
	- Optional: `ENABLE_SELF_PING=true` (force enable)
	- Optional: `AUTO_ENABLE_SELF_PING=true` (default already true)
	- `KEEP_ALIVE_URL=https://<your-render-service>.onrender.com`
	- Optional: `SELF_PING_INTERVAL_MS=300000` (5 minutes)
2. In production on Render, the app now auto-enables self-ping and pings `KEEP_ALIVE_URL/health` every 5 minutes by default.

### Important Note

Self-ping helps reduce idle shutdowns, but the only guaranteed always-on option is a paid Render instance (Starter or above).