const http = require('http');
const https = require('https');

const ENABLE_SELF_PING = String(process.env.ENABLE_SELF_PING || '').toLowerCase() === 'true';
const AUTO_ENABLE_SELF_PING = String(process.env.AUTO_ENABLE_SELF_PING || 'true').toLowerCase() === 'true';
const IS_RENDER = Boolean(process.env.RENDER || process.env.RENDER_SERVICE_ID);
const IS_PRODUCTION = String(process.env.NODE_ENV || '').toLowerCase() === 'production';
const SELF_PING_ACTIVE = ENABLE_SELF_PING || (AUTO_ENABLE_SELF_PING && (IS_RENDER || IS_PRODUCTION));
const KEEP_ALIVE_URL = process.env.KEEP_ALIVE_URL || process.env.RENDER_EXTERNAL_URL || '';

const SELF_PING_INTERVAL_MS_RAW = Number(process.env.SELF_PING_INTERVAL_MS || 5 * 60 * 1000);
const SELF_PING_INTERVAL_MS_MIN = 60 * 1000;
const SELF_PING_INTERVAL_MS_MAX = 14 * 60 * 1000;
const SELF_PING_INTERVAL_MS = Number.isFinite(SELF_PING_INTERVAL_MS_RAW)
    ? Math.min(Math.max(SELF_PING_INTERVAL_MS_RAW, SELF_PING_INTERVAL_MS_MIN), SELF_PING_INTERVAL_MS_MAX)
    : 5 * 60 * 1000;

function pingUrl(urlString) {
    try {
        const target = new URL(urlString);
        const client = target.protocol === 'https:' ? https : http;

        const req = client.get(target, (res) => {
            res.resume();
            console.log(`💓 Self-ping ${target.pathname} -> ${res.statusCode}`);
        });

        req.on('error', (err) => {
            console.warn(`⚠️  Self-ping failed: ${err.message}`);
        });

        req.setTimeout(7000, () => {
            req.destroy(new Error('Self-ping timeout'));
        });
    } catch (error) {
        console.warn(`⚠️  Invalid KEEP_ALIVE_URL: ${error.message}`);
    }
}

function startKeepAlive() {
    if (!SELF_PING_ACTIVE) {
        console.log('ℹ️  Self-ping is disabled (set ENABLE_SELF_PING=true to enable).');
        return;
    }

    if (!KEEP_ALIVE_URL) {
        console.warn('⚠️  Self-ping is enabled but KEEP_ALIVE_URL/RENDER_EXTERNAL_URL is not set. Skipping self-ping.');
        return;
    }

    const healthUrl = KEEP_ALIVE_URL.replace(/\/$/, '') + '/health';
    console.log(`🔁 Self-ping enabled: ${healthUrl} every ${Math.floor(SELF_PING_INTERVAL_MS / 60000)} minute(s)`);

    setTimeout(() => pingUrl(healthUrl), 15 * 1000);
    setInterval(() => pingUrl(healthUrl), SELF_PING_INTERVAL_MS);
}

module.exports = startKeepAlive;
