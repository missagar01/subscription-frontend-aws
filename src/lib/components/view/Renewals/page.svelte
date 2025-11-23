<script lang="ts">
	import * as Tabs from "$lib/components/ui/tabs";
	import { Root as DialogRoot } from "$lib/components/ui/dialog";
	import DataTable from "$lib/components/element/DataTable.svelte";
	import { setContext, onMount } from "svelte";

	import {
		pendingRenewalColumns,
		renewalHistoryColumns,
		type PendingRenewalData,
		type RenewalHistoryData,
	} from "./columns";

	import RenewalForm from "./renewal-form.svelte";
	import { useAuth } from "$lib/state/auth.svelte";

	const authState = useAuth();

	let open = $state(false);
	let selectedRow = $state<PendingRenewalData>();

	/* ------------ Backend API ------------- */
	const API_BASE = "http://localhost:5050/api/subscription-renewal";

	async function fetchPendingRenewals() {
		const res = await fetch(`${API_BASE}/pending`);
		return await res.json();
	}

	async function fetchRenewalHistory() {
		const res = await fetch(`${API_BASE}/history`);
		return await res.json();
	}

	let pendingData: PendingRenewalData[] = $state([]);
	let historyData: RenewalHistoryData[] = $state([]);

	let loadingPending = $state(true);
	let loadingHistory = $state(true);

	setContext(Symbol.for("dialog-state"), {
		get open() {
			return open;
		},
		set open(value) {
			open = value;
		},
		get selectedRow() {
			return selectedRow;
		},
		set selectedRow(value) {
			selectedRow = value;
		},
	});

	onMount(async () => {
		await loadPending();
		await loadHistory();
	});

	async function loadPending() {
		loadingPending = true;

		const raw = await fetchPendingRenewals();

		// Map DB fields → PendingRenewalData
		pendingData = raw
			.filter((row: any) => {
				// same access rule: admin → all, others → only their subscriptions
				if (authState.user?.role === "admin") return true;
				return row.subscriber_name === authState.user?.username;
			})
			.map(
				(row: any): PendingRenewalData => ({
					companyName: row.company_name,
					endDate: row.end_date ? new Date(row.end_date) : new Date(),
					price: String(row.price ?? ""),
					frequency: row.frequency,
					subscriberName: row.subscriber_name,
					subscriptionName: row.subscription_name,
					subscriptionNo: row.subscription_no,
				}),
			);

		loadingPending = false;
	}

	async function loadHistory() {
		loadingHistory = true;

		const raw = await fetchRenewalHistory();

		historyData = raw
			.filter((row: any) => {
				if (authState.user?.role === "admin") return true;
				return row.subscriber_name === authState.user?.username;
			})
			.map(
				(row: any): RenewalHistoryData => ({
					companyName: row.company_name,
					frequency: row.frequency,
					price: String(row.price ?? ""),
					renewalDate: row.timestamp ? new Date(row.timestamp) : new Date(),
					renewalNo: row.renewal_no,
					renewalStatus: row.renewal_status,
					subscriberName: row.subscriber_name,
					subscriptionName: row.subscription_name,
					subscriptionNo: row.subscription_no,
				}),
			);

		loadingHistory = false;
	}
</script>

<Tabs.Root value="pending">
	<div class="px-5">
		<Tabs.List class="w-full">
			<Tabs.Trigger value="pending">Pending</Tabs.Trigger>
			<Tabs.Trigger value="history">History</Tabs.Trigger>
		</Tabs.List>
	</div>
	<div class="md:p-5 md:pt-0">
		<div class="bg-background p-5 rounded-md shadow-md">
			<Tabs.Content value="pending">
				<DialogRoot bind:open>
					<DataTable
						columns={pendingRenewalColumns}
						data={pendingData}
						bind:loading={loadingPending}
					/>
					<RenewalForm
						on:refreshPending={loadPending}
						on:refreshHistory={loadHistory}
					/>
				</DialogRoot>
			</Tabs.Content>
			<Tabs.Content value="history">
				<DataTable
					columns={renewalHistoryColumns}
					data={historyData}
					bind:loading={loadingHistory}
				/>
			</Tabs.Content>
		</div>
	</div>
</Tabs.Root>
