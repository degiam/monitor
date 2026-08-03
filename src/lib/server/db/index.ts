import { env } from '$env/dynamic/private';
import type { Endpoint } from './schema';

/**
 * Parse URL_INTERVAL env var menjadi array Endpoint.
 * Format: URL_INTERVAL=[domain.com,0.5],[domain.my.id,5],[sub.domain.com,60]
 */
export function getEndpoints(): Endpoint[] {
	const raw = env.URL_INTERVAL ?? '';
	const endpoints: Endpoint[] = [];

	// Parse pattern [url,interval]
	const regex = /\[([^,]+),([^\]]+)\]/g;
	let match;

	while ((match = regex.exec(raw)) !== null) {
		const url = match[1].trim();
		const interval = parseFloat(match[2].trim());

		if (url && !isNaN(interval)) {
			endpoints.push({
				id: url, // gunakan URL sebagai ID unik
				url,
				intervalMinutes: interval
			});
		}
	}

	return endpoints;
}
