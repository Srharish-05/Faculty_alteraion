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
	- `ENABLE_SELF_PING=true`
	- `KEEP_ALIVE_URL=https://<your-render-service>.onrender.com`
	- Optional: `SELF_PING_INTERVAL_MS=840000`
2. The app will ping `KEEP_ALIVE_URL/health` every 14 minutes.

### Important Note

Self-ping helps reduce idle shutdowns, but the only guaranteed always-on option is a paid Render instance.