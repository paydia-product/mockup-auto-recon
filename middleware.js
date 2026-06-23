// Load from environment variables (set in Vercel Dashboard)
const TOKEN_SECRET = process.env.TOKEN_SECRET || 'pyd_s3cR3t_k3y_r3c0n_2026!xZ9'; // fallback for local dev

async function sha256(message) {
    const encoder = new TextEncoder();
    const data = encoder.encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

async function verifyToken(token) {
    if (!token || typeof token !== 'string') return false;
    const parts = token.split('.');
    // New format: timestamp.nonce.signature (3 parts)
    if (parts.length !== 3) return false;
    const [timestamp, nonce, signature] = parts;
    const payload = `${timestamp}.${nonce}`;
    const expectedSignature = await sha256(payload + ':' + TOKEN_SECRET);
    if (signature !== expectedSignature) return false;
    const ts = parseInt(timestamp, 10);
    if (isNaN(ts)) return false;
    const age = Date.now() - ts;
    if (age > 86400000) return false; // 24 hours
    return true;
}

function parseCookies(cookieHeader) {
    const cookies = {};
    if (!cookieHeader) return cookies;
    cookieHeader.split(';').forEach(c => {
        const [key, ...rest] = c.trim().split('=');
        if (key) cookies[key.trim()] = rest.join('=').trim();
    });
    return cookies;
}

export default async function middleware(request) {
    const url = new URL(request.url);

    // Allow API routes to pass through (they handle their own auth)
    if (url.pathname.startsWith('/api/')) {
        return;
    }

    // Allow only the login page and its required assets
    if (url.pathname === '/login.html') {
        return;
    }

    // Allow only specific public assets needed by login page (fonts loaded externally)
    // Block all .js, .css, .html etc for unauthenticated users
    const publicAssets = ['/favicon.ico'];
    if (publicAssets.includes(url.pathname)) {
        return;
    }

    // Check for our signed auth cookie
    const cookieHeader = request.headers.get('cookie') || '';
    const cookies = parseCookies(cookieHeader);
    const token = cookies['dsh_auth'];

    if (!token || !(await verifyToken(token))) {
        // For static assets requested by authenticated pages, also redirect
        // This prevents unauthenticated access to .js/.css files
        url.pathname = '/login.html';
        return Response.redirect(url, 302);
    }
}

export const config = {
    matcher: ['/((?!_next/static|_next/image).*)'],
};
