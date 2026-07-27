import { fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import {
	getAllEndpoints,
	createEndpoint,
	updateEndpoint,
	deleteEndpoint
} from '$lib/server/db/endpoints';
import { pingEndpointById, pingUrl } from '$lib/server/ping';

export const load: PageServerLoad = async () => {
	const endpoints = await getAllEndpoints();
	
	// Stream ping results on page load
	const pingResults = Promise.all(
		endpoints.map(async (ep) => {
			const res = await pingUrl(ep.url);
			return { id: ep.id, ...res };
		})
	);

	return {
		endpoints,
		pingResults
	};
};

export const actions: Actions = {
	create: async ({ request }) => {
		const data = await request.formData();
		const name = data.get('name')?.toString().trim();
		const url = data.get('url')?.toString().trim();
		const group = data.get('group')?.toString().trim() ?? '';
		const intervalStr = data.get('interval')?.toString().trim();
		const interval = intervalStr ? parseInt(intervalStr, 10) : 60;

		if (!name || !url) {
			return fail(400, {
				action: 'create',
				error: 'Nama dan URL wajib diisi.'
			});
		}

		try {
			await createEndpoint({ name, url, group, interval });
			return { success: true, message: 'Endpoint berhasil ditambahkan' };
		} catch (err: unknown) {
			console.error('Failed to create endpoint:', err);
			return fail(500, {
				action: 'create',
				error: 'Gagal menyimpan endpoint ke database.'
			});
		}
	},

	update: async ({ request }) => {
		const data = await request.formData();
		const id = data.get('id')?.toString().trim();
		const name = data.get('name')?.toString().trim();
		const url = data.get('url')?.toString().trim();
		const group = data.get('group')?.toString().trim() ?? '';
		const intervalStr = data.get('interval')?.toString().trim();
		const interval = intervalStr ? parseInt(intervalStr, 10) : 60;

		if (!id || !name || !url) {
			return fail(400, {
				action: 'update',
				error: 'ID, Nama, dan URL wajib diisi.'
			});
		}

		try {
			await updateEndpoint(id, { name, url, group, interval });
			return { success: true, message: 'Endpoint berhasil diperbarui' };
		} catch (err: unknown) {
			console.error('Failed to update endpoint:', err);
			return fail(500, {
				action: 'update',
				error: 'Gagal mengedit endpoint.'
			});
		}
	},

	delete: async ({ request }) => {
		const data = await request.formData();
		const id = data.get('id')?.toString().trim();

		if (!id) {
			return fail(400, {
				action: 'delete',
				error: 'ID Endpoint tidak ditemukan.'
			});
		}

		try {
			await deleteEndpoint(id);
			return { success: true, message: 'Endpoint berhasil dihapus' };
		} catch (err: unknown) {
			console.error('Failed to delete endpoint:', err);
			return fail(500, {
				action: 'delete',
				error: 'Gagal menghapus endpoint.'
			});
		}
	},

	ping: async ({ request }) => {
		const data = await request.formData();
		const id = data.get('id')?.toString().trim();

		if (!id) {
			return fail(400, {
				action: 'ping',
				error: 'ID Endpoint tidak ditemukan.'
			});
		}

		try {
			const result = await pingEndpointById(id);
			if (!result) {
				return fail(404, {
					action: 'ping',
					error: 'Endpoint tidak ditemukan.'
				});
			}

			return {
				success: true,
				pingAction: true,
				id: id,
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
