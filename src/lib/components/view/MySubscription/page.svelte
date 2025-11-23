<script lang="ts">
	import DataTable from "$lib/components/element/DataTable.svelte";
	import { subscriptionColumns, type SubscriptionData } from "./columns";
	import { useAuth } from "$lib/state/auth.svelte";

	let subscriptionDataRaw = $state<SubscriptionData[]>([]);
	let subscriptionData = $derived(subscriptionDataRaw);
	let loadingRaw = $state(true);
	let loading = $derived(loadingRaw);

	const authState = useAuth();
	// const API_BASE = import.meta.env.VITE_BACKEND_URL || "http://localhost:5050";
	const API_BASE = import.meta.env.VITE_API_BASE_URL;

	async function loadSubscriptions() {
		try {
			loadingRaw = true;

			const token = authState.token;
			if (!token) return;

			const res = await fetch(`${API_BASE}/mySubscriptions`, {
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${token}`,
				},
			});

			if (!res.ok) {
				console.error(await res.json());
				return;
			}

			const data = await res.json();
			if (!Array.isArray(data)) return;

			subscriptionDataRaw = data.map((s: any) => ({
				companyName: s.companyName,
				startDate: new Date(s.startDate),
				endDate: new Date(s.endDate),
				price: s.price,
				subscriberName: s.subscriberName,
				subscriptionName: s.subscriptionName,
				subscriptionNo: s.subscriptionNo,
				status: s.status,
			}));
		} finally {
			loadingRaw = false;
		}
	}

	$effect.pre(() => {
		loadSubscriptions();
	});
</script>

<div class="md:p-5 md:pt-0">
	<div class="bg-background p-5 rounded-md shadow-md">
		<DataTable
			columns={subscriptionColumns}
			data={subscriptionData}
			loading={loading}
			class="h-[84dvh] md:h-[79dvh]"
		/>
	</div>
</div>
