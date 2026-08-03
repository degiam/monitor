import { pingAndUpdateCache } from '$lib/server/ping';
import { getEndpoints } from '$lib/server/db/index';

declare global {
	var __pingSchedulerIntervals: NodeJS.Timeout[] | undefined;
}

/**
 * Konversi menit ke format waktu manusia (detik, menit, jam, hari, dll)
 */
function formatIntervalHuman(minutes: number): string {
	if (minutes < 1) return `${Math.round(minutes * 60)} detik`;
	if (minutes < 60) return `${parseFloat(minutes.toFixed(2))} menit`;

	const hours = minutes / 60;
	if (hours < 24) return `${parseFloat(hours.toFixed(2))} jam`;

	const days = hours / 24;
	if (days < 7) return `${parseFloat(days.toFixed(2))} hari`;

	if (days % 7 === 0 && days < 30) return `${days / 7} minggu`;
	if (days % 30 === 0 && days < 365) return `${days / 30} bulan`;
	if (days % 365 === 0) return `${days / 365} tahun`;

	if (days >= 365) return `${parseFloat((days / 365).toFixed(2))} tahun`;
	if (days >= 30) return `${parseFloat((days / 30).toFixed(2))} bulan`;
	if (days >= 7) return `${parseFloat((days / 7).toFixed(2))} minggu`;

	return `${parseFloat(days.toFixed(2))} hari`;
}

/**
 * Initialise the background ping scheduler (singleton — safe to call on every request).
 * Uses a global flag to clear previous intervals in development hot-reload.
 */
export function initScheduler(): void {
	if (globalThis.__pingSchedulerIntervals) {
		globalThis.__pingSchedulerIntervals.forEach(clearInterval);
	}

	globalThis.__pingSchedulerIntervals = [];

	const endpoints = getEndpoints();

	if (endpoints.length === 0) {
		console.log('[Scheduler] Tidak ada endpoint untuk dijadwalkan.');
		return;
	}

	console.log(`[Scheduler] Menjadwalkan ${endpoints.length} endpoint...`);

	for (const ep of endpoints) {
		// Konversi interval menit ke milidetik (minimal 1 detik agar aman)
		const intervalMs = Math.max(1000, ep.intervalMinutes * 60 * 1000);

		console.log(`[Scheduler] ${ep.url} setiap ${formatIntervalHuman(ep.intervalMinutes)}`);

		// Eksekusi segera saat pertama kali dijalankan agar cache tidak kosong
		pingAndUpdateCache(ep.url).catch((err) => {
			console.error(`[Scheduler] Initial ping error untuk ${ep.url}:`, err);
		});

		const intervalId = setInterval(async () => {
			try {
				await pingAndUpdateCache(ep.url);
			} catch (err) {
				console.error(`[Scheduler] Error saat ping ${ep.url}:`, err);
			}
		}, intervalMs);

		globalThis.__pingSchedulerIntervals.push(intervalId);
	}
}
