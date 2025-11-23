<script lang="ts">
	import { Button } from "$lib/components/ui/button";
	import { Label } from "$lib/components/ui/label";
	import Spinner from "$lib/components/element/Spinner.svelte";
	import * as Tooltip from "$lib/components/ui/tooltip";
	import * as Dialog from "$lib/components/ui/dialog";
	import * as Select from "$lib/components/ui/select";
	import type { PendingRenewalData } from "./columns";
	import { getContext, createEventDispatcher } from "svelte";
	import { validator } from "@felte/validator-zod";
	import { createForm } from "felte";
	import { z } from "zod";
	import { toast } from "svelte-sonner";
	import { useAuth } from "$lib/state/auth.svelte";

	const authState = useAuth();
	const dispatch = createEventDispatcher();

	const dialogState: {
		selectedRow: PendingRenewalData;
		open: boolean;
	} = getContext(Symbol.for("dialog-state"));

	/* ----------------------------
	   Backend API base for renewal
	-----------------------------*/
	const API_BASE = "http://localhost:5050/api/subscription-renewal";

	async function submitRenewalToBackend(payload: any) {
		const res = await fetch(`${API_BASE}/submit`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(payload),
		});

		return await res.json();
	}

	const schema = z.object({
		renew: z.enum(["Renewed", "Not Renewed"]),
	});

	const {
		form,
		setTouched,
		data: formData,
		errors: formErrors,
		isSubmitting: formSubmitting,
	} = createForm<z.infer<typeof schema>>({
		extend: [validator({ schema })],
		initialValues: {
			renew: undefined,
		},
		onSubmit: async (values) => {
			try {
				const selected = dialogState.selectedRow;

				if (!selected) {
					toast.error("No subscription selected");
					return;
				}

				const payload = {
					subscription_no: selected.subscriptionNo,
					renewal_status: values.renew,
					approved_by: authState.user?.name || authState.user?.username || "System",
					price: parseFloat(selected.price),
				};

				const res = await submitRenewalToBackend(payload);

				if (!res.success) {
					toast.error(res.error || "Failed to renew subscription");
					return;
				}

				toast.success("Successfully renewed subscription");

				dialogState.open = false;

				// ask parent to reload pending + history tables
				dispatch("refreshPending");
				dispatch("refreshHistory");
			} catch (e: any) {
				console.error(e);
				toast.error("Something went wrong during renewal");
			}
		},
		onError: (e: any) => {
			console.log(e);
			toast.error(e?.message || "Validation error");
		},
	});

	const currencyFormatter = Intl.NumberFormat("en-IN", {
		style: "currency",
		currency: "INR",
	}).format;

	const dateFormatter = Intl.DateTimeFormat("en-IN", {
		dateStyle: "medium",
	}).format;
</script>

<Dialog.Content>
	<form use:form class="grid gap-4">
		<Dialog.Header>
			<Dialog.Title>Renew Subscription</Dialog.Title>
			<Dialog.Description>
				Subscription
				<span class="font-semibold">
					{dialogState.selectedRow.subscriptionNo}
				</span>
			</Dialog.Description>
		</Dialog.Header>

		<div class="grid sm:grid-cols-2 gap-4">
			<div class="grid gap-1">
				<p class="text-sm text-muted-foreground font-semibold">Company Name</p>
				<p>{dialogState.selectedRow.companyName}</p>
			</div>
			<div class="grid gap-1">
				<p class="text-sm text-muted-foreground font-semibold">
					Subscriber Name
				</p>
				<p>{dialogState.selectedRow.subscriberName}</p>
			</div>
			<div class="grid gap-1">
				<p class="text-sm text-muted-foreground font-semibold">
					Subscription Name
				</p>
				<p>{dialogState.selectedRow.subscriptionName}</p>
			</div>
			<div class="grid gap-1">
				<p class="text-sm text-muted-foreground font-semibold">Price</p>
				<p>{currencyFormatter(parseFloat(dialogState.selectedRow.price))}</p>
			</div>
			<div class="grid gap-1">
				<p class="text-sm text-muted-foreground font-semibold">Frequency</p>
				<p>{dialogState.selectedRow.frequency}</p>
			</div>
			<div class="grid gap-1">
				<p class="text-sm text-muted-foreground font-semibold">End Date</p>
				<p class="text-destructive">
					{dateFormatter(dialogState.selectedRow.endDate)}
				</p>
			</div>
		</div>

		<div class="grid gap-2">
			<Label>Review Subscription</Label>
			<Select.Root
				name="renew"
				type="single"
				bind:value={$formData.renew}
				onValueChange={() => setTouched("renew", true)}
			>
				<Tooltip.Root disabled={!$formErrors.renew}>
					<Tooltip.Trigger>
						<Select.Trigger
							aria-invalid={$formErrors.renew ? true : undefined}
							class="w-full"
						>
							{$formData.renew
								? $formData.renew
								: "Select renewal option"}
						</Select.Trigger>
					</Tooltip.Trigger>
					<Tooltip.Content>{$formErrors.renew}</Tooltip.Content>
				</Tooltip.Root>
				<Select.Content>
					<Select.Item value="Renewed">Renewed</Select.Item>
					<Select.Item value="Not Renewed">Not Renewed</Select.Item>
				</Select.Content>
			</Select.Root>
		</div>

		<Dialog.Footer>
			<Button class="w-full" type="submit" disabled={$formSubmitting}>
				{#if $formSubmitting}
					<Spinner /> Submitting
				{:else}
					Submit
				{/if}
			</Button>
		</Dialog.Footer>
	</form>
</Dialog.Content>
