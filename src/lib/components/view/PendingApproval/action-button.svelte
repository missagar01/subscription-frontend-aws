<script lang="ts">
	import Button from "$lib/components/ui/button/button.svelte";
	import { getContext } from "svelte";
	import type { PendingApprovalData, ApprovalHistoryData } from "./columns";

	// ⭐ CORRECT WAY FOR RUNES MODE
	const { currentRow }: { currentRow: PendingApprovalData | ApprovalHistoryData } = $props();

	const dialogState = getContext(Symbol.for("dialog-state"));
</script>

<div class="flex justify-center">
	<Button
		onclick={() => {
			dialogState.selectedRow = currentRow;
			dialogState.open = true;
		}}
	>
		Review
	</Button>
</div>
