import type { PageServerLoad, Actions } from './$types';
import { getEndpoints } from '$lib/server/db/index';
import { pingAndUpdateCache, pingResultsCache } from '$lib/server/ping';
import { fail } from '@sveltejs/kit';

export const load: PageServerLoad = async () => {
	const endpoints = getEndpoints();

	// Ambil dari cache, jangan ping ulang
	const pingResults = endpoints.map((ep) => {
		const cached = pingResultsCache.get(ep.url);
		return {
			id: ep.id,
			status: cached?.status ?? 'pending',
			statusCode: cached?.statusCode ?? null,
			durationMs: cached?.durationMs ?? null,
			error: cached?.error ?? null,
			lastCheck: cached?.lastCheck ?? null
		};
	});

	return {
		endpoints,
		pingResults
	};
};

export const actions: Actions = {
	ping: async ({ request }) => {
		const data = await request.formData();
		const id = data.get('id')?.toString().trim();

		if (!id) {
			return fail(400, {
				action: 'ping',
				error: 'ID Endpoint tidak ditemukan.'
			});
		}

		const endpoints = getEndpoints();
		const endpoint = endpoints.find((ep) => ep.id === id);

		if (!endpoint) {
			return fail(404, {
				action: 'ping',
				error: 'Endpoint tidak ditemukan.'
			});
		}

		try {
			const result = await pingAndUpdateCache(endpoint.url);
			return {
				success: true,
				pingAction: true,
				id,
				pingResult: {
					status: result.status,
					statusCode: result.statusCode,
					durationMs: result.durationMs,
					error: result.error
				}
			};
		} catch (err: unknown) {
			console.error('Failed to ping endpoint:', err);
			return fail(500, {
				action: 'ping',
				error: 'Gagal melakukan ping.'
			});
		}
	}
};
