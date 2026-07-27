import { getEndpointById, updateEndpoint } from '$lib/server/db/endpoints';
import type { Endpoint } from '$lib/server/db/schema';

const PING_TIMEOUT_MS = 10_000;

export interface PingResult {
	status: 'healthy' | 'unhealthy';
	statusCode: number | null;
	durationMs: number | null;
	error: string | null;
}

/**
 * Ping a single URL and return its health result.
 */
export async function pingUrl(rawUrl: string): Promise<PingResult> {
	const start = Date.now();

	// Normalise URL if scheme is missing
	let url = rawUrl.trim();
	if (!url.startsWith('http://') && !url.startsWith('https://')) {
		url = 'https://' + url;
	}

	try {
		const controller = new AbortController();
		const timeout = setTimeout(() => controller.abort(), PING_TIMEOUT_MS);

		let response: Response;
		try {
			response = await fetch(url, {
				method: 'GET',
				signal: controller.signal,
				redirect: 'follow',
				headers: {
					'User-Agent': 'SystemMonitor/1.0 (health-check)'
				}
			});
		} finally {
			clearTimeout(timeout);
		}

		const durationMs = Date.now() - start;
		const isHealthy = response.status >= 200 && response.status < 400;

		return {
			status: isHealthy ? 'healthy' : 'unhealthy',
			statusCode: response.status,
			durationMs,
			error: null
		};
	} catch (err: unknown) {
		const durationMs = Date.now() - start;

		let errorMessage = 'Unknown error';
		if (err instanceof Error) {
			errorMessage = err.name === 'AbortError' ? 'Request timed out' : err.message;
		}

		return {
			status: 'unhealthy',
			statusCode: null,
			durationMs,
			error: errorMessage
		};
	}
}

/**
 * Ping a single endpoint stored in the DB and update its status and lastCheck.
 */
export async function pingEndpoint(endpoint: Endpoint): Promise<PingResult> {
	const result = await pingUrl(endpoint.url);

	await updateEndpoint(endpoint.id, {
		lastCheck: new Date().toISOString()
	});

	return result;
}

/**
 * Ping a single endpoint by its ID, fetching it from the DB first.
 */
export async function pingEndpointById(id: string): Promise<PingResult | null> {
	const endpoint = await getEndpointById(id);
	if (!endpoint) return null;

	return pingEndpoint(endpoint);
}

/**
 * Determine which endpoints are due for a ping check based on their interval.
 */
function isDue(endpoint: Endpoint): boolean {
	if (!endpoint.lastCheck) return true;
	const lastCheckMs = new Date(endpoint.lastCheck).getTime();
	const elapsedSeconds = (Date.now() - lastCheckMs) / 1000;
	return elapsedSeconds >= endpoint.interval;
}

/**
 * Ping all endpoints that are due for a check. Runs concurrently.
 */
export async function pingAllDueEndpoints(): Promise<void> {
	const { getAllEndpoints } = await import('$lib/server/db/endpoints');
	const endpoints = await getAllEndpoints();
	const due = endpoints.filter(isDue);

	if (due.length === 0) return;

	console.log(`[Ping] Checking ${due.length} due endpoint(s)...`);

	await Promise.allSettled(due.map((ep) => pingEndpoint(ep)));
}
