import { pingAllDueEndpoints } from '$lib/server/ping';

const SCHEDULER_TICK_MS = 10_000; // Check every 10 seconds

declare global {
	var __pingSchedulerInterval: NodeJS.Timeout | undefined;
}

/**
 * Initialise the background ping scheduler (singleton — safe to call on every request).
 * Uses a global flag to clear previous intervals in development hot-reload.
 */
export function initScheduler(): void {
	if (globalThis.__pingSchedulerInterval) {
		clearInterval(globalThis.__pingSchedulerInterval);
	}

	console.log(`[Scheduler] Started — checking endpoints every ${SCHEDULER_TICK_MS / 1000}s`);

	globalThis.__pingSchedulerInterval = setInterval(async () => {
		try {
			await pingAllDueEndpoints();
		} catch (err) {
			console.error('[Scheduler] Error during scheduled ping:', err);
		}
	}, SCHEDULER_TICK_MS);
}
