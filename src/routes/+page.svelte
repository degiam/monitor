<script lang="ts">
	import { PUBLIC_APP_NAME } from "$env/static/public";
	import { enhance } from "$app/forms";
	import { onMount } from "svelte";
	import type { Endpoint } from "$lib/server/db/schema";
	import type { PingResult } from "$lib/server/ping";
	import { fade } from "svelte/transition";

	const pageTitle = "Dasbor";

	const numberFormatter = new Intl.NumberFormat("id-ID");

	let { data, form } = $props();

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

	function getInitialPingData() {
		const init: Record<string, PingResult> = {};
		if (data.pingResults) {
			for (const res of data.pingResults) {
				init[res.id] = res as PingResult;
			}
		}
		return init;
	}

	let pingData = $state<Record<string, PingResult>>(getInitialPingData());

	$effect(() => {
		if (form?.pingAction && form.success && form.id && form.pingResult) {
			pingData[form.id] = form.pingResult;
		}
	});

	// Search & Filter state
	let searchQuery = $state("");

	// Per-endpoint pinging state (tracks IDs currently being pinged)
	let pingingIds = $state<Set<string>>(new Set());

	// Filtered endpoints
	let filteredEndpoints = $derived(() => {
		if (!data.endpoints) return [];
		return data.endpoints.filter((ep: Endpoint) => {
			return ep.url.toLowerCase().includes(searchQuery.toLowerCase());
		});
	});

	// Connect to Server-Sent Events for realtime reactivity
	onMount(() => {
		const evtSource = new EventSource("/api/events");

		evtSource.onmessage = (event) => {
			try {
				const result = JSON.parse(event.data);
				// Update pingData reactivity in Svelte 5
				pingData = {
					...pingData,
					[result.id]: result,
				};
			} catch (err) {
				console.error("Failed to parse SSE event", err);
			}
		};

		return () => {
			evtSource.close();
		};
	});
</script>

<svelte:head>
	<title>{PUBLIC_APP_NAME}</title>
</svelte:head>

<div
	class="min-h-screen bg-slate-950 text-slate-100 selection:bg-indigo-500 selection:text-white pb-20"
>
	<!-- Top Navigation Bar -->
	<header
		class="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md sticky top-0 z-40"
	>
		<div
			class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between"
		>
			<div class="flex items-center gap-3">
				<div
					class="w-9 h-9 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-bold"
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="24"
						height="24"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
						class="icon icon-tabler icons-tabler-outline icon-tabler-binoculars size-5"
						><path
							stroke="none"
							d="M0 0h24v24H0z"
							fill="none"
						/><path d="M4 16a3 3 0 1 0 6 0a3 3 0 1 0 -6 0" /><path
							d="M14 16a3 3 0 1 0 6 0a3 3 0 1 0 -6 0"
						/><path
							d="M16.346 9.17l-.729 -1.261c-.16 -.248 -1.056 -.203 -1.117 .091l-.177 1.38"
						/><path
							d="M19.761 14.813l-2.84 -5.133c-.189 -.31 -.592 -.68 -1.421 -.68c-.828 0 -1.5 .448 -1.5 1v6"
						/><path
							d="M7.654 9.17l.729 -1.261c.16 -.249 1.056 -.203 1.117 .091l.177 1.38"
						/><path
							d="M4.239 14.813l2.84 -5.133c.189 -.31 .592 -.68 1.421 -.68c.828 0 1.5 .448 1.5 1v6"
						/><path d="M10 12h4v2h-4l0 -2" /></svg
					>
				</div>
				<div
					class="font-semibold text-lg tracking-tight text-white block leading-none"
				>
					{PUBLIC_APP_NAME}
				</div>
			</div>

			<div class="flex items-center gap-4">
				<form action="/logout" method="POST">
					<button
						type="submit"
						class="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-medium transition duration-200 cursor-pointer flex items-center gap-1.5"
					>
						<svg
							class="w-3.5 h-3.5 text-slate-400"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
							></path>
						</svg>
						Keluar
					</button>
				</form>
			</div>
		</div>
	</header>

	<!-- Main Content Area -->
	<main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
		<!-- Section Header -->
		<div
			class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8"
		>
			<div>
				<h1 class="text-3xl font-bold text-white tracking-tight">
					{pageTitle}
				</h1>
				<p class="text-slate-400 text-sm mt-1">
					Pantau status situs web secara real-time
				</p>
			</div>
		</div>

		<!-- Form Error / Success Alert -->
		{#if form?.error}
			<div
				class="mb-6 p-4 rounded-xl bg-red-950/50 border border-red-800/60 text-red-300 text-sm flex items-center justify-between gap-3"
				transition:fade={{ duration: 200 }}
			>
				<div class="flex items-center gap-3">
					<svg
						class="w-5 h-5 text-red-400 shrink-0"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
						></path>
					</svg>
					<span>{form.error}</span>
				</div>
			</div>
		{/if}

		<!-- Search Controls -->
		<div
			class="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 mb-8 flex flex-col md:flex-row gap-4 items-center justify-between"
		>
			<!-- Search Bar -->
			<div class="relative w-full md:w-96">
				<div
					class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400"
				>
					<svg
						class="w-4 h-4"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
						></path>
					</svg>
				</div>
				<input
					type="text"
					bind:value={searchQuery}
					placeholder="Pencarian URL..."
					class="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 text-sm transition duration-200"
				/>
			</div>

			<!-- Stats -->
			<div
				class="text-xs text-slate-400 bg-slate-950 px-3 py-2 rounded-xl border border-slate-800 min-w-30 max-w-1/2 flex items-center justify-between gap-2"
			>
				Total <strong class="text-white"
					>{numberFormatter.format(
						filteredEndpoints().length,
					)}</strong
				>
			</div>
		</div>

		<!-- Endpoints Grid -->
		{#if filteredEndpoints().length === 0}
			<div
				class="bg-slate-900/30 border border-dashed border-slate-800 rounded-2xl p-12 text-center"
			>
				<div
					class="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-slate-800/50 text-slate-400 mb-3"
				>
					<svg
						class="w-6 h-6"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
						></path>
					</svg>
				</div>
				<h3 class="text-slate-200 font-medium text-base my-4">
					Belum Ada Data
				</h3>
				<p class="text-slate-500 text-sm mt-1 max-w-sm mx-auto">
					{#if searchQuery}
						Tidak ada URL yang cocok dengan kata kunci yang kamu
						masukkan
					{:else}
						Tambahkan URL ke variabel <code
							class="text-slate-400 bg-slate-800 px-1 py-0.5 rounded text-xs"
							>URL_INTERVAL</code
						>
						di file
						<code
							class="text-slate-400 bg-slate-800 px-1 py-0.5 rounded text-xs"
							>.env</code
						>
					{/if}
				</p>
			</div>
		{:else}
			<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
				{#each filteredEndpoints() as endpoint (endpoint.id)}
					<div
						class="bg-slate-900/60 border border-slate-800/90 rounded-2xl p-5 hover:border-slate-700/80 transition duration-200 flex flex-col justify-between group"
					>
						<div>
							<!-- URL Title & Status Pill -->
							<div
								class="flex items-start justify-between gap-3 mb-2"
							>
								<a
									href={endpoint.url.startsWith("http")
										? endpoint.url
										: "https://" + endpoint.url}
									target="_blank"
									rel="noopener noreferrer"
									class="line-clamp-1 hover:underline"
									title={endpoint.url}
								>
									<h3
										class="font-bold text-white"
										title={endpoint.url}
									>
										{endpoint.url
											.replace(/^https?:\/\//, "")
											.replace(/\/+$/, "")}
									</h3>
								</a>

								<!-- Ping Now button -->
								{#if (pingData[endpoint.id]?.status ?? "pending") !== "pending"}
									<form
										action="?/ping"
										method="POST"
										class="-my-1"
										use:enhance={() => {
											pingingIds = new Set([
												...pingingIds,
												endpoint.id,
											]);
											return async ({ update }) => {
												await update({
													invalidateAll: true,
												});
												pingingIds = new Set(
													[...pingingIds].filter(
														(id) =>
															id !== endpoint.id,
													),
												);
											};
										}}
									>
										<input
											type="hidden"
											name="id"
											value={endpoint.id}
										/>
										<button
											type="submit"
											disabled={pingingIds.has(
												endpoint.id,
											)}
											class="px-2.5 py-1.5 rounded-lg bg-indigo-950/50 hover:bg-indigo-900/60 border border-indigo-800/50 text-indigo-400 hover:text-indigo-300 text-xs font-medium transition duration-200 cursor-pointer flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
										>
											{#if pingingIds.has(endpoint.id)}
												<svg
													class="w-3.5 h-3.5 animate-spin"
													fill="none"
													viewBox="0 0 24 24"
													xmlns="http://www.w3.org/2000/svg"
												>
													<circle
														class="opacity-25"
														cx="12"
														cy="12"
														r="10"
														stroke="currentColor"
														stroke-width="4"
													></circle>
													<path
														class="opacity-75"
														fill="currentColor"
														d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
													></path>
												</svg>
											{:else}
												<svg
													class="w-3.5 h-3.5"
													fill="none"
													stroke="currentColor"
													viewBox="0 0 24 24"
												>
													<path
														stroke-linecap="round"
														stroke-linejoin="round"
														stroke-width="2"
														d="M13 10V3L4 14h7v7l9-11h-7z"
													></path>
												</svg>
											{/if}
											Ping
										</button>
									</form>
								{/if}
							</div>

							<!-- Visualizer Bar -->
							<div class="font-mono tracking-tight pt-1 mb-1">
								<div
									class="flex items-center justify-between text-[11px] text-slate-500 my-2"
								>
									{#if pingData[endpoint.id]?.durationMs === null}
										Memuat...
									{:else}
										<div>
											Tiap {formatIntervalHuman(
												endpoint.intervalMinutes,
											)}
										</div>
										<div
											class="flex items-center justify-between gap-3 ml-auto"
										>
											<span>
												{#if pingData[endpoint.id]?.durationMs != null}
													{pingData[endpoint.id]
														.durationMs} ms
												{/if}
											</span>

											{#if pingData[endpoint.id]?.statusCode}
												<span class="text-slate-400">
													HTTP {pingData[endpoint.id]
														.statusCode}
												</span>
											{/if}

											{#if pingData[endpoint.id]?.error}
												<span
													class="text-xs text-slate-400 capitalize truncate max-w-50"
													title={pingData[endpoint.id]
														.error ?? ""}
												>
													{pingData[endpoint.id]
														.error}
												</span>
											{/if}
										</div>
									{/if}
								</div>

								<!-- Mini Uptime Bars -->
								<div
									class="flex h-6 items-center gap-[2.5px] overflow-hidden"
								>
									{#each Array.from({ length: 32 }, (_, idx) => idx) as idx (idx)}
										<div
											class="h-full flex-1 rounded-sm transition duration-300
												{(pingData[endpoint.id]?.status ?? 'pending') === 'healthy'
												? 'bg-emerald-500/80'
												: (pingData[endpoint.id]
															?.status ??
															'pending') ===
													  'unhealthy'
													? 'bg-red-500/80'
													: 'bg-slate-700/50'}"
											style:opacity={0.4 +
												(idx / 32) * 0.6}
										></div>
									{/each}
								</div>
							</div>
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</main>
</div>
