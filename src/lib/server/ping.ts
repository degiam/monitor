const PING_TIMEOUT_MS = 10_000;

export interface PingResult {
	status: 'healthy' | 'unhealthy' | 'pending';
	statusCode: number | null;
	durationMs: number | null;
	error: string | null;
}

export type CachedPingResult = PingResult & { lastCheck: string };

// In-memory cache to store the latest results for the dashboard
export const pingResultsCache = new Map<string, CachedPingResult>();

// Event emitter untuk mengabari frontend secara realtime (SSE)
export type PingListener = (url: string, result: CachedPingResult) => void;
const listeners = new Set<PingListener>();

export function onPingUpdate(listener: PingListener): () => void {
	listeners.add(listener);
	return () => listeners.delete(listener);
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
 * Ping an endpoint and update the global cache.
 */
export async function pingAndUpdateCache(endpointUrl: string): Promise<PingResult> {
	const result = await pingUrl(endpointUrl);

	const emoji = result.status === 'healthy' ? '✅ Berhasil' : '❌ Gagal';
	console.log(`[Ping] ${endpointUrl} - ${emoji}`);

	const cachedResult: CachedPingResult = {
		...result,
		lastCheck: new Date().toISOString()
	};
	
	pingResultsCache.set(endpointUrl, cachedResult);
	
	// Beritahu semua listener (koneksi SSE browser) bahwa ada update
	for (const listener of listeners) {
		listener(endpointUrl, cachedResult);
	}
	
	return result;
}
