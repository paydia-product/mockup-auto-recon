// Server-side login handler — password never leaves the server
// Vercel Serverless Function

// Load from environment variables (set in Vercel Dashboard)
const CORRECT_HASH = process.env.PASSWORD_HASH || '203f0c2eab3114690255bd711f65a6745d46a36cf63d6f482873412101360f0e'; // fallback to !Paydia1 hash for local dev
const TOKEN_SECRET = process.env.TOKEN_SECRET || 'pyd_s3cR3t_k3y_r3c0n_2026!xZ9'; // fallback for local dev matching middleware.js

// Security check: ensure environment variables are configured
if (!process.env.PASSWORD_HASH || !process.env.TOKEN_SECRET) {
    console.warn('WARNING: PASSWORD_HASH or TOKEN_SECRET not configured in environment variables. Using development fallbacks.');
}

async function sha256(message) {
    const encoder = new TextEncoder();
    const data = encoder.encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

async function createToken() {
    const timestamp = Date.now().toString();
    // Generate random nonce (16 bytes = 32 hex chars) for additional security
    const randomBytes = new Uint8Array(16);
    crypto.getRandomValues(randomBytes);
    const nonce = Array.from(randomBytes).map(b => b.toString(16).padStart(2, '0')).join('');
    const payload = `${timestamp}.${nonce}`;
    const signature = await sha256(payload + ':' + TOKEN_SECRET);
    return payload + '.' + signature;
}

export async function verifyToken(token) {
    if (!token || typeof token !== 'string') return false;
    const parts = token.split('.');
    if (parts.length !== 3) return false;
    const [timestamp, nonce, signature] = parts;
    const payload = `${timestamp}.${nonce}`;
    const expectedSignature = await sha256(payload + ':' + TOKEN_SECRET);
    if (signature !== expectedSignature) return false;
    // Check token is not older than 24 hours
    const ts = parseInt(timestamp, 10);
    if (isNaN(ts)) return false;
    const age = Date.now() - ts;
    if (age > 86400000) return false; // 24 hours
    return true;
}

// Rate limiting storage (in-memory, resets on cold start)
const loginAttempts = new Map();
const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes

function checkRateLimit(ip) {
    const now = Date.now();
    const attempts = loginAttempts.get(ip) || [];

    // Remove old attempts outside lockout window
    const recentAttempts = attempts.filter(timestamp => now - timestamp < LOCKOUT_DURATION);

    if (recentAttempts.length >= MAX_ATTEMPTS) {
        return { allowed: false, remainingTime: Math.ceil((LOCKOUT_DURATION - (now - recentAttempts[0])) / 1000) };
    }

    return { allowed: true };
}

function recordAttempt(ip) {
    const now = Date.now();
    const attempts = loginAttempts.get(ip) || [];
    attempts.push(now);
    loginAttempts.set(ip, attempts);
}

export default async function handler(req, res) {
    // Only allow POST
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    res.setHeader('X-Content-Type-Options', 'nosniff');

    // Get client IP for rate limiting
    const clientIp = req.headers['x-forwarded-for']?.split(',')[0] || req.headers['x-real-ip'] || 'unknown';

    // Check rate limit
    const rateLimitCheck = checkRateLimit(clientIp);
    if (!rateLimitCheck.allowed) {
        return res.status(429).json({
            success: false,
            message: `Too many login attempts. Try again in ${rateLimitCheck.remainingTime} seconds.`
        });
    }

    try {
        const { password } = req.body || {};

        if (!password || typeof password !== 'string') {
            return res.status(400).json({ success: false, message: 'Password required' });
        }

        // Hash the password server-side
        const hashedInput = await sha256(password);

        if (hashedInput === CORRECT_HASH) {
            // Create signed token
            const token = await createToken();

            // Set HttpOnly, Secure cookie — cannot be read by JavaScript
            res.setHeader('Set-Cookie', [
                `dsh_auth=${token}; Path=/; Max-Age=86400; HttpOnly; Secure; SameSite=Strict`
            ]);

            return res.status(200).json({ success: true });
        } else {
            // Record failed attempt for rate limiting
            recordAttempt(clientIp);
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }
    } catch (err) {
        return res.status(500).json({ success: false, message: 'Server error' });
    }
}
