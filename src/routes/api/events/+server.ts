import { onPingUpdate, pingResultsCache } from '$lib/server/ping';

export function GET() {
	let unsubscribe: () => void;

	const stream = new ReadableStream({
		start(controller) {
			// Kirim data cache saat ini secara langsung ketika koneksi dibuat
			for (const [url, result] of pingResultsCache.entries()) {
				const payload = JSON.stringify({ id: url, ...result });
				controller.enqueue(`data: ${payload}\n\n`);
			}

			// Listen jika ada perubahan hasil ping (Background Scheduler / Manual Ping)
			unsubscribe = onPingUpdate((url, result) => {
				const payload = JSON.stringify({ id: url, ...result });
				try {
					controller.enqueue(`data: ${payload}\n\n`);
				} catch (err) {
					console.log(err)
					// Jika koneksi sudah terputus
					unsubscribe();
				}
			});
		},
		cancel() {
			if (unsubscribe) unsubscribe();
		}
	});

	return new Response(stream, {
		headers: {
			'Content-Type': 'text/event-stream',
			'Cache-Control': 'no-cache',
			'Connection': 'keep-alive'
		}
	});
}
