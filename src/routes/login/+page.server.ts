import { fail, redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { validatePassword, createSessionToken } from '$lib/server/auth';

export const load: PageServerLoad = async ({ locals }) => {
	if (locals.user) {
		throw redirect(303, '/');
	}
	return {};
};

export const actions: Actions = {
	default: async ({ request, cookies }) => {
		const data = await request.formData();
		const password = data.get('password')?.toString() || '';

		if (!password) {
			return fail(400, {
				error: 'Password wajib diisi.'
			});
		}

		const isValid = validatePassword(password);

		if (!isValid) {
			return fail(400, {
				error: 'Password salah.'
			});
		}

		const token = createSessionToken();

		cookies.set('session', token, {
			path: '/',
			httpOnly: true,
			sameSite: 'lax',
			maxAge: 60 * 60 * 24 * 7 // 1 week
		});

		throw redirect(303, '/');
	}
};
