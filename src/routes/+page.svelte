<script lang="ts">
	import { PUBLIC_APP_NAME } from "$env/static/public";
	import { enhance } from "$app/forms";
	import { invalidateAll } from "$app/navigation";
	import { onMount } from "svelte";
	import type { Endpoint } from "$lib/server/db/schema";
	import type { PingResult } from "$lib/server/ping";
	import { fade, scale } from "svelte/transition";
	import { cubicOut } from "svelte/easing";

	const pageTitle = "Dasbor";

	const numberFormatter = new Intl.NumberFormat("id-ID");

	let { data, form } = $props();

	let pingData = $state<Record<string, PingResult>>({});

	$effect(() => {
		if (data.pingResults) {
			data.pingResults
				.then((results) => {
					const newData = { ...pingData };
					for (const res of results) {
						newData[res.id] = res;
					}
					pingData = newData;
				})
				.catch(console.error);
		}
	});

	$effect(() => {
		if (form?.pingAction && form.success && form.id && form.pingResult) {
			pingData[form.id] = form.pingResult;
		}
	});

	// Search & Filter state
	let searchQuery = $state("");
	let selectedGroup = $state("Semua");

	// Modal states
	let isAddModalOpen = $state(false);
	let isEditModalOpen = $state(false);
	let isDeleteModalOpen = $state(false);
	let submitting = $state(false);

	// Selected endpoint for edit/delete
	let selectedEndpoint = $state<Endpoint | null>(null);

	// Per-endpoint pinging state (tracks IDs currently being pinged)
	let pingingIds = $state<Set<string>>(new Set());

	// Interval options configuration
	const intervalOptions = [
		{ value: 60, label: "1 menit" },
		{ value: 300, label: "5 menit" },
		{ value: 1800, label: "30 menit" },
		{ value: 3600, label: "1 jam" },
		{ value: 10800, label: "3 jam" },
		{ value: 21600, label: "6 jam" },
		{ value: 43200, label: "12 jam" },
		{ value: 86400, label: "24 jam" },
	];

	function formatInterval(seconds: number): string {
		const match = intervalOptions.find((opt) => opt.value === seconds);
		if (match) return match.label;
		if (seconds < 60) return `${seconds} detik`;
		if (seconds < 3600) return `${Math.floor(seconds / 60)} menit`;
		return `${Math.floor(seconds / 3600)} jam`;
	}

	// Available groups derived from current endpoints
	let availableGroups = $derived(() => {
		const groups = new Set(
			(data.endpoints ?? [])
				.map((ep: Endpoint) => ep.group)
				.filter(Boolean),
		);
		return ["Semua", ...Array.from(groups)];
	});

	// Filtered endpoints
	let filteredEndpoints = $derived(() => {
		if (!data.endpoints) return [];
		console.log(data);
		return data.endpoints.filter((ep: Endpoint) => {
			const matchesSearch =
				ep.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
				ep.url.toLowerCase().includes(searchQuery.toLowerCase()) ||
				ep.group.toLowerCase().includes(searchQuery.toLowerCase());

			const matchesGroup =
				selectedGroup === "Semua" || ep.group === selectedGroup;

			return matchesSearch && matchesGroup;
		});
	});

	function openEditModal(endpoint: Endpoint) {
		selectedEndpoint = endpoint;
		isEditModalOpen = true;
	}

	function openDeleteModal(endpoint: Endpoint) {
		selectedEndpoint = endpoint;
		isDeleteModalOpen = true;
	}

	function closeModals() {
		isAddModalOpen = false;
		isEditModalOpen = false;
		isDeleteModalOpen = false;
		selectedEndpoint = null;
	}

	// Auto-refresh page data every 30 seconds so live ping updates appear
	onMount(() => {
		const timer = setInterval(() => {
			invalidateAll();
		}, 30_000);
		return () => clearInterval(timer);
	});
</script>

<svelte:head>
	<title>{pageTitle} - {PUBLIC_APP_NAME}</title>
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
					P
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

			<button
				type="button"
				onclick={() => (isAddModalOpen = true)}
				class="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white text-sm font-medium transition duration-200 shadow-lg shadow-indigo-600/20 cursor-pointer self-start sm:self-auto"
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
						d="M12 4v16m8-8H4"
					></path>
				</svg>
				Tambah
			</button>
		</div>

		<!-- Form Error / Success Alert -->
		{#if form?.error}
			<div
				class="mb-6 p-4 rounded-xl bg-red-950/50 border border-red-800/60 text-red-300 text-sm flex items-center justify-between gap-3"
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

		<!-- Search & Filter Controls -->
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
					placeholder="Pencarian..."
					class="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 text-sm transition duration-200"
				/>
			</div>

			<!-- Filter Dropdown & Stats -->
			<div
				class="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end"
			>
				<select
					id="group-filter"
					bind:value={selectedGroup}
					class="bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-xl pl-3 pr-7 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 cursor-pointer min-w-30 max-w-1/2"
				>
					{#each availableGroups() as groupName (groupName)}
						<option value={groupName}>{groupName}</option>
					{/each}
				</select>

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
					{#if searchQuery || selectedGroup !== "Semua"}
						Tidak ada URL yang cocok dengan kata kunci atau filter
						yang kamu pilih
					{:else}
						Klik tombol <strong class="text-slate-400"
							>Tambah</strong
						> di atas untuk menambahkan URL target pertama kamu
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
							<!-- Top Row: Name & Status Pill -->
							<div
								class="flex items-start justify-between gap-3 mb-2"
							>
								<h3
									class="font-bold text-white text-base truncate tracking-tight"
									title={endpoint.name}
								>
									{endpoint.name}
								</h3>

								<!-- Status Pill -->
								{#if (pingData[endpoint.id]?.status ?? "pending") === "healthy"}
									<!-- <span
										class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium"
									>
										<span
											class="w-1.5 h-1.5 rounded-full bg-emerald-400"
										></span>
										Healthy
									</span> -->
								{:else if (pingData[endpoint.id]?.status ?? "pending") === "unhealthy"}
									<!-- <span
										class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium"
									>
										<span
											class="w-1.5 h-1.5 rounded-full bg-red-400"
										></span>
										Unhealthy
									</span> -->
								{:else}
									<span
										class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-medium"
									>
										<span
											class="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"
										></span>
										Pending
									</span>
								{/if}
							</div>

							<!-- Group & URL Subtitle -->
							<p
								class="text-xs text-slate-400 truncate mb-5 flex items-center gap-1.5"
							>
								{#if endpoint.group}
									<span
										class="text-indigo-400 font-medium bg-indigo-500/10 px-1.5 py-0.5 rounded text-[11px] uppercase tracking-wider max-w-full truncate"
										>{endpoint.group}</span
									>
									<span class="text-slate-600">•</span>
								{/if}
								<a
									href={endpoint.url}
									target="_blank"
									rel="noopener noreferrer"
									class="font-mono text-slate-400 truncate hover:underline"
									title={endpoint.url}
									>{endpoint.url
										.replace(/^https?:\/\//, "")
										.replace(/\/+$/, "")}</a
								>
							</p>

							<!-- Visualizer Bar (Simulated Uptime Bar matching reference UI) -->
							<div class="mb-4">
								<div
									class="flex items-center justify-between text-[11px] text-slate-500 mb-1.5"
								>
									<span
										>{endpoint.lastCheck
											? new Date(
													endpoint.lastCheck,
												).toLocaleTimeString()
											: "No manual check yet"}</span
									>
									<span class="font-mono text-slate-400"
										>Setiap {formatInterval(
											endpoint.interval,
										)}</span
									>
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

						<!-- Card Footer / Action Buttons -->
						<div
							class="pt-3 border-t border-slate-800/60 flex items-center justify-between gap-2 group"
						>
							<!-- Ping Now button -->
							<form
								action="?/ping"
								method="POST"
								use:enhance={() => {
									pingingIds = new Set([
										...pingingIds,
										endpoint.id,
									]);
									return async ({ update }) => {
										await update({ invalidateAll: true });
										pingingIds = new Set(
											[...pingingIds].filter(
												(id) => id !== endpoint.id,
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
									disabled={pingingIds.has(endpoint.id)}
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

							<div
								class="flex items-center gap-3 lg:gap-2 transition-opacity lg:opacity-0 group-hover:opacity-100"
							>
								<button
									type="button"
									onclick={() => openEditModal(endpoint)}
									class="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-medium transition duration-200 cursor-pointer flex items-center gap-1"
								>
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
											d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
										></path>
									</svg>
									<span class="hidden lg:block">Sunting</span>
								</button>

								<button
									type="button"
									onclick={() => openDeleteModal(endpoint)}
									class="px-2.5 py-1.5 rounded-lg bg-red-950/40 hover:bg-red-900/60 border border-red-900/50 text-red-400 hover:text-red-300 text-xs font-medium transition duration-200 cursor-pointer flex items-center gap-1"
								>
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
											d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
										></path>
									</svg>
									<span class="hidden lg:block">Hapus</span>
								</button>
							</div>
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</main>

	<!-- ADD ENDPOINT MODAL -->
	{#if isAddModalOpen}
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div
			class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm"
			onclick={(e) => e.target === e.currentTarget && closeModals()}
			transition:fade={{ duration: 200 }}
		>
			<div
				class="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl relative"
				transition:scale={{
					duration: 300,
					easing: cubicOut,
					start: 0.95,
				}}
			>
				<div class="flex items-center justify-between mb-8">
					<h2 class="text-lg font-bold text-white">Tambah Baru</h2>
					<button
						type="button"
						onclick={closeModals}
						aria-label="Tutup modal"
						class="text-slate-400 hover:text-white cursor-pointer"
					>
						<svg
							class="w-5 h-5"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M6 18L18 6M6 6l12 12"
							></path>
						</svg>
					</button>
				</div>

				<form
					action="?/create"
					method="POST"
					use:enhance={() => {
						submitting = true;
						return async ({ update }) => {
							submitting = false;
							closeModals();
							await update();
						};
					}}
					class="space-y-4"
				>
					<div>
						<label
							for="add-name"
							class="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5"
						>
							Judul
						</label>
						<input
							id="add-name"
							name="name"
							type="text"
							required
							placeholder="Contoh: Endpoint API"
							class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 placeholder:text-slate-600 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500"
						/>
					</div>

					<div>
						<label
							for="add-url"
							class="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5"
						>
							URL
						</label>
						<input
							id="add-url"
							name="url"
							type="url"
							required
							placeholder="Contoh: https://api.example.com/health"
							class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 placeholder:text-slate-600 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500"
						/>
					</div>

					<div class="grid grid-cols-2 gap-3">
						<div>
							<label
								for="add-group"
								class="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5"
							>
								Kategori
							</label>
							<input
								id="add-group"
								name="group"
								type="text"
								placeholder="Contoh: kantor, hiburan"
								class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 placeholder:text-slate-600 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500"
							/>
						</div>

						<div>
							<label
								for="add-interval"
								class="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5"
							>
								Interval
							</label>
							<select
								id="add-interval"
								name="interval"
								class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 cursor-pointer"
							>
								{#each intervalOptions as opt (opt.value)}
									<option value={opt.value}
										>{opt.label}</option
									>
								{/each}
							</select>
						</div>
					</div>

					<div
						class="flex items-center justify-end gap-3 pt-4 border-t border-slate-800 mt-6"
					>
						<button
							type="button"
							onclick={closeModals}
							class="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium transition cursor-pointer"
						>
							Batal
						</button>

						<button
							type="submit"
							disabled={submitting}
							class="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition shadow-lg shadow-indigo-600/20 cursor-pointer disabled:opacity-50"
						>
							{submitting ? "Menyimpan..." : "Simpan"}
						</button>
					</div>
				</form>
			</div>
		</div>
	{/if}

	<!-- EDIT ENDPOINT MODAL -->
	{#if isEditModalOpen && selectedEndpoint}
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div
			class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm"
			onclick={(e) => e.target === e.currentTarget && closeModals()}
			transition:fade={{ duration: 200 }}
		>
			<div
				class="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl relative"
				transition:scale={{
					duration: 300,
					easing: cubicOut,
					start: 0.95,
				}}
			>
				<div class="flex items-center justify-between mb-8">
					<h2 class="text-lg font-bold text-white">Sunting</h2>
					<button
						type="button"
						onclick={closeModals}
						aria-label="Tutup modal"
						class="text-slate-400 hover:text-white cursor-pointer"
					>
						<svg
							class="w-5 h-5"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M6 18L18 6M6 6l12 12"
							></path>
						</svg>
					</button>
				</div>

				<form
					action="?/update"
					method="POST"
					use:enhance={() => {
						submitting = true;
						return async ({ update, result }) => {
							submitting = false;
							if (result.type === "success" && selectedEndpoint) {
								delete pingData[selectedEndpoint.id];
							}
							closeModals();
							await update();
						};
					}}
					class="space-y-4"
				>
					<input
						type="hidden"
						name="id"
						value={selectedEndpoint.id}
					/>

					<div>
						<label
							for="edit-name"
							class="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5"
						>
							Judul
						</label>
						<input
							id="edit-name"
							name="name"
							type="text"
							required
							placeholder="Contoh: Endpoint API"
							value={selectedEndpoint.name}
							class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500"
						/>
					</div>

					<div>
						<label
							for="edit-url"
							class="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5"
						>
							URL
						</label>
						<input
							id="edit-url"
							name="url"
							type="url"
							required
							placeholder="Contoh: https://api.example.com/health"
							value={selectedEndpoint.url}
							class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500"
						/>
					</div>

					<div class="grid grid-cols-2 gap-3">
						<div>
							<label
								for="edit-group"
								class="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5"
							>
								Kategori
							</label>
							<input
								id="edit-group"
								name="group"
								type="text"
								placeholder="Contoh: kantor, hiburan"
								value={selectedEndpoint.group}
								class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500"
							/>
						</div>

						<div>
							<label
								for="edit-interval"
								class="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5"
							>
								Interval
							</label>
							<select
								id="edit-interval"
								name="interval"
								value={selectedEndpoint.interval}
								class="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 cursor-pointer"
							>
								{#each intervalOptions as opt (opt.value)}
									<option value={opt.value}
										>{opt.label}</option
									>
								{/each}
							</select>
						</div>
					</div>

					<div
						class="flex items-center justify-end gap-3 pt-4 border-t border-slate-800 mt-6"
					>
						<button
							type="button"
							onclick={closeModals}
							class="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium transition cursor-pointer"
						>
							Batal
						</button>

						<button
							type="submit"
							disabled={submitting}
							class="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition shadow-lg shadow-indigo-600/20 cursor-pointer disabled:opacity-50"
						>
							{submitting ? "Memperbarui..." : "Simpan"}
						</button>
					</div>
				</form>
			</div>
		</div>
	{/if}

	<!-- DELETE CONFIRMATION MODAL -->
	{#if isDeleteModalOpen && selectedEndpoint}
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div
			class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm"
			onclick={(e) => e.target === e.currentTarget && closeModals()}
			transition:fade={{ duration: 200 }}
		>
			<div
				class="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl relative text-center"
				transition:scale={{
					duration: 300,
					easing: cubicOut,
					start: 0.95,
				}}
			>
				<div
					class="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 mb-4"
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
							d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
						></path>
					</svg>
				</div>

				<h3 class="text-lg font-bold text-white mt-2 mb-4">Hapus</h3>
				<p class="text-slate-400 text-xs mb-8">
					Tindakan ini tidak dapat dibatalkan. Apakah kamu yakin ingin
					menghapus <strong class="text-slate-200"
						>{selectedEndpoint.name}</strong
					>?
				</p>

				<form
					action="?/delete"
					method="POST"
					use:enhance={() => {
						submitting = true;
						return async ({ update }) => {
							submitting = false;
							closeModals();
							await update();
						};
					}}
					class="flex items-center justify-center gap-3"
				>
					<input
						type="hidden"
						name="id"
						value={selectedEndpoint.id}
					/>

					<button
						type="button"
						onclick={closeModals}
						class="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium transition cursor-pointer"
					>
						Batal
					</button>

					<button
						type="submit"
						disabled={submitting}
						class="w-full py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-sm font-medium transition shadow-lg shadow-red-600/20 cursor-pointer disabled:opacity-50"
					>
						{submitting ? "Menghapus..." : "Hapus"}
					</button>
				</form>
			</div>
		</div>
	{/if}
</div>
