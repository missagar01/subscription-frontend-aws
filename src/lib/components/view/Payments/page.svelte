<script lang="ts">
	import { Root as DialogRoot } from "$lib/components/ui/dialog";
	import * as Tabs from "$lib/components/ui/tabs";
	import { setContext, onMount } from "svelte";

	import ProcessForm from "./process-form.svelte";
	import DataTable from "$lib/components/element/DataTable.svelte";

	import {
		pendingPaymentsColumns,
		paymentHistoryColumns,
		type PendingPaymentsData,
		type paymentHistoryData
	} from "./columns";

	/* -------------------------------------------
	   🔥 Direct API Calls (NO external file)
	-------------------------------------------- */
	const API_BASE = "http://localhost:5050/api/subscription-payment";

	async function getPendingPayments() {
		const res = await fetch(`${API_BASE}/pending`);
		return await res.json();
	}

	async function getPaymentHistory() {
		const res = await fetch(`${API_BASE}/history`);
		return await res.json();
	}

	let open = $state(false);
	let selectedRow = $state<PendingPaymentsData>();

	let pendingData: PendingPaymentsData[] = $state([]);
	let historyData: paymentHistoryData[] = $state([]);

	let loadingPending = $state(true);
	let loadingHistory = $state(true);

	setContext(Symbol.for("dialog-state"), {
		get open() { return open; },
		set open(v) { open = v; },

		get selectedRow() { return selectedRow; },
		set selectedRow(v) { selectedRow = v; }
	});

	onMount(async () => {
		await loadPending();
		await loadHistory();
	});

async function loadPending() {
	loadingPending = true;

	const raw = await getPendingPayments();

	pendingData = raw.map((row: any) => ({
		subscriptionNo: row.subscription_no,
		company: row.company_name,
		subscriberName: row.subscriber_name,
		subscriptionName: row.subscription_name,
		purpose: row.purpose,
		price: row.price,
		frequency: row.frequency,
		approvedOn: row.actual_2 ? new Date(row.actual_2) : null
	}));

	loadingPending = false;
}

async function loadHistory() {
	loadingHistory = true;

	const rawHistory = await getPaymentHistory();

	historyData = rawHistory.map((row: any) => ({
		paymentDate: new Date(row.timestamp),
		subscriptionNo: row.subscription_no,
		subscriber: row.subscriber_name,
		company: row.company_name,
		paymentMode: row.payment_mode,
		transactionId: row.transaction_id,
		insuranceDocument: row.insurance_document,
		startDate: new Date(row.start_date)
	}));

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

			<!-- PENDING -->
			<Tabs.Content value="pending">
				<DialogRoot bind:open>
					<DataTable
						columns={pendingPaymentsColumns}
						data={pendingData}
						bind:loading={loadingPending}
					/>

					<ProcessForm 
						on:refreshPending={loadPending}
						on:refreshHistory={loadHistory}
					/>
				</DialogRoot>
			</Tabs.Content>

			<!-- HISTORY -->
			<Tabs.Content value="history">
				<DataTable
					columns={paymentHistoryColumns}
					data={historyData}
					bind:loading={loadingHistory}
				/>
			</Tabs.Content>

		</div>
	</div>
</Tabs.Root>
