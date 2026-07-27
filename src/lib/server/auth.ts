import crypto from 'node:crypto';
import { env } from '$env/dynamic/private';

const SESSION_IDENTITY = 'authenticated_admin';

export function createSessionToken(): string {
	const secret = env.SESSION_SECRET || 'default_secret';
	const hmac = crypto.createHmac('sha256', secret);
	hmac.update(SESSION_IDENTITY);
	const signature = hmac.digest('hex');
	return `${SESSION_IDENTITY}:${signature}`;
}

export function verifySessionToken(token: string): { authenticated: boolean } | null {
	if (!token) return null;
	const parts = token.split(':');
	if (parts.length !== 2) return null;

	const expectedToken = createSessionToken();

	const tokenBuf = Buffer.from(token);
	const expectedBuf = Buffer.from(expectedToken);

	if (tokenBuf.length === expectedBuf.length && crypto.timingSafeEqual(tokenBuf, expectedBuf)) {
		return { authenticated: true };
	}
	return null;
}

export function validatePassword(passwordInput: string): boolean {
	const expectedPass = env.APP_PASSWORD || 'admin';

	const passBuf = Buffer.from(passwordInput);
	const expectedPassBuf = Buffer.from(expectedPass);

	return (
		passBuf.length === expectedPassBuf.length && crypto.timingSafeEqual(passBuf, expectedPassBuf)
	);
}
