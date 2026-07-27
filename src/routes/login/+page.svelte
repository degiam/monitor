<script lang="ts">
	import { PUBLIC_APP_NAME } from "$env/static/public";
	import { enhance } from "$app/forms";

	let { form } = $props();
	let loading = $state(false);

	const currentYear = new Date().getFullYear();
</script>

<svelte:head>
	<title>Login - {PUBLIC_APP_NAME}</title>
</svelte:head>

<div
	class="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 selection:bg-indigo-500 selection:text-white relative overflow-hidden"
>
	<!-- Background glow effects -->
	<div
		class="absolute -top-40 -left-40 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none"
	></div>
	<div
		class="absolute -bottom-40 -right-40 w-96 h-96 bg-violet-600/20 rounded-full blur-3xl pointer-events-none"
	></div>

	<div
		class="w-full max-w-md bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl p-8 shadow-2xl relative z-10"
	>
		<div class="text-center mb-8">
			<div
				class="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 mb-4 text-indigo-400"
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
					class="icon icon-tabler icons-tabler-outline icon-tabler-binoculars w-7 h-7"
					><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path
						d="M4 16a3 3 0 1 0 6 0a3 3 0 1 0 -6 0"
					/><path d="M14 16a3 3 0 1 0 6 0a3 3 0 1 0 -6 0" /><path
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
			<h1 class="text-2xl font-bold tracking-tight text-white">
				{PUBLIC_APP_NAME}
			</h1>
			<p class="text-slate-400 text-sm mt-1">Masuk ke admin panel</p>
		</div>

		{#if form?.error}
			<div
				class="mb-6 p-4 rounded-xl bg-red-950/50 border border-red-800/60 text-red-300 text-sm flex items-center gap-3"
			>
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
		{/if}

		<form
			method="POST"
			use:enhance={() => {
				loading = true;
				return async ({ update }) => {
					loading = false;
					await update();
				};
			}}
			class="space-y-5"
		>
			<div>
				<label
					for="password"
					class="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2"
				>
					Password
				</label>
				<input
					id="password"
					name="password"
					type="password"
					required
					placeholder="• • • • • • • •"
					class="w-full px-4 py-3 rounded-xl bg-slate-950/60 border border-slate-800 text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition duration-200 text-sm"
				/>
			</div>

			<button
				type="submit"
				disabled={loading}
				class="w-full py-3.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-medium text-sm shadow-lg shadow-indigo-600/25 transition duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer mt-2"
			>
				{#if loading}
					<svg
						class="animate-spin h-4 w-4 text-white"
						xmlns="http://www.w3.org/2000/svg"
						fill="none"
						viewBox="0 0 24 24"
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
					<span>Memproses...</span>
				{:else}
					<span>Masuk</span>
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
							d="M14 5l7 7m0 0l-7 7m7-7H3"
						></path>
					</svg>
				{/if}
			</button>
		</form>

		<div class="mt-8 pt-6 border-t border-slate-800/80 text-center">
			<p class="text-xs text-slate-500">
				Copyright &copy; {currentYear} - {PUBLIC_APP_NAME}
			</p>
		</div>
	</div>
</div>
