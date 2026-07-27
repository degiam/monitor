import { redirect, type Handle } from '@sveltejs/kit';
import { verifySessionToken } from '$lib/server/auth';
import { initScheduler } from '$lib/server/scheduler';

// Start the background ping scheduler once on server boot
initScheduler();

export const handle: Handle = async ({ event, resolve }) => {
	const sessionToken = event.cookies.get('session');
	const user = sessionToken ? verifySessionToken(sessionToken) : null;
	event.locals.user = user;

	const { pathname } = event.url;

	// Route protection
	if (!user && pathname !== '/login') {
		throw redirect(303, '/login');
	}

	if (user && pathname === '/login') {
		throw redirect(303, '/');
	}

	return resolve(event);
};
