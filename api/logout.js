// Server-side logout handler — clears HttpOnly cookie
export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // Clear the auth cookie with same attributes
    res.setHeader('Set-Cookie', [
        `dsh_auth=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Strict`
    ]);

    return res.status(200).json({ success: true });
}
