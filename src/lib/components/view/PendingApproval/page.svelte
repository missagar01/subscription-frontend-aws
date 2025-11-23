<script lang="ts">
	import { onMount } from "svelte";
	import { Root as DialogRoot } from "$lib/components/ui/dialog";
	import ReviewForm from "./review-form.svelte";
	import DataTable from "$lib/components/element/DataTable.svelte";
	import * as Tabs from "$lib/components/ui/tabs";
	import { setContext } from "svelte";
	import { pendingApprovalColumns, approvalHistoryColumns } from "./columns";

	let open = $state(false);
	let selectedRow = $state(null);

	setContext(Symbol.for("dialog-state"), {
		get open() { return open; },
		set open(v) { open = v; },

		get selectedRow() { return selectedRow; },
		set selectedRow(v) { selectedRow = v; }
	});

	// ⭐ Make them reactive
	let pendingData = $state([]);
	let historyData = $state([]);

	onMount(async () => {

		// Load Pending
		const res1 = await fetch("http://localhost:5050/api/subscription-approval/pending");
		const pending = await res1.json();

		pendingData = pending.map((s) => ({
			subscriptionNo: s.subscription_no,
			companyName: s.company_name,
			subscriberName: s.subscriber_name,
			subscriptionName: s.subscription_name,
			price: s.price,
			frequency: s.frequency,
			requestedOn: new Date(s.actual_1 ?? s.timestamp),
			purpose: s.purpose
		}));

		// Load History
		const res2 = await fetch("http://localhost:5050/api/subscription-approval/history");
		const history = await res2.json();

		historyData = history.map((s) => ({
			approvalNo: s.approval_no,
			subscriptionNo: s.subscription_no,
			approvalStatus: s.approval_status,
			note: s.note,
			approvedBy: s.approved_by,
			requestedOn: new Date(s.requested_on),
			reviewedOn: new Date(s.timestamp)
		}));
	});
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
					<DataTable data={pendingData} columns={pendingApprovalColumns}/>
					<ReviewForm />
				</DialogRoot>
			</Tabs.Content>

			<Tabs.Content value="history">
				<DataTable data={historyData} columns={approvalHistoryColumns}/>
			</Tabs.Content>

		</div>
	</div>
</Tabs.Root>
