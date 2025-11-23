<script lang="ts">
	import * as Dialog from "$lib/components/ui/dialog";
	import { getContext, createEventDispatcher } from "svelte";
	import type { PendingPaymentsData } from "./columns";

	import z from "zod";
	import { createForm } from "felte";
	import { validator } from "@felte/validator-zod";

	import { Input } from "$lib/components/ui/input";
	import { Label } from "$lib/components/ui/label";
	import { Button } from "$lib/components/ui/button";
	import * as RadioGroup from "$lib/components/ui/radio-group";
	import * as Tooltip from "$lib/components/ui/tooltip";

	import { cn } from "$lib/utils/cn";
	import { CreditCard, Landmark, Smartphone } from "@lucide/svelte";
	import Spinner from "$lib/components/element/Spinner.svelte";
	import { toast } from "svelte-sonner";

	const dispatch = createEventDispatcher();

	const dialogState: {
		selectedRow: PendingPaymentsData;
		open: boolean;
	} = getContext(Symbol.for("dialog-state"));

	/* -------------------------------------------
	   🔥 Direct API Call (NO external file)
	-------------------------------------------- */
	const API_BASE1 = import.meta.env.VITE_API_BASE_URL;
	const API_BASE = `${API_BASE1}/subscription-payment`;

	async function submitPayment(payload: any) {
		const res = await fetch(`${API_BASE}/submit`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(payload)
		});
		return await res.json();
	}

	/* -------------------------------------------
	   Form Schema
	-------------------------------------------- */
	const schema = z.object({
		price: z.string().min(1, "Price required"),
		paymentMethod: z.enum(["Credit Card", "Bank Transfer", "UPI"]),
		transactionId: z.string().optional(),
		startDate: z.coerce.date(),
		endDate: z.coerce.date(),
		insuranceDocument: z.any().optional()
	});

	let initialValues = {
		price: "",
		paymentMethod: undefined,
		transactionId: "",
		startDate: "",
		endDate: "",
		insuranceDocument: undefined
	};

	$effect(() => {
		if (dialogState.selectedRow) {
			initialValues.price = dialogState.selectedRow.price || "";
		}
	});

	const {
		form,
		setTouched,
		reset,
		setFields,
		data: formData,
		errors: formErrors,
		isSubmitting: formSubmitting
	} = createForm({
		extend: [validator({ schema })],
		initialValues,

		onSubmit: async (values) => {
			const payload = {
				subscriptionNo: dialogState.selectedRow.subscriptionNo,
				paymentMethod: values.paymentMethod,
				transactionId: values.transactionId,
				price: values.price,
				startDate: values.startDate,
				endDate: values.endDate,
				insuranceDocument: ""
			};

			const res = await submitPayment(payload);

			if (res.success) {
				toast.success("Payment submitted");

				dialogState.open = false;

				dispatch("refreshPending");
				dispatch("refreshHistory");
			} else {
				toast.error(res.error || "Failed");
			}
		}
	});
</script>

<Dialog.Content class="w-[1200px] max-h-[90vh] overflow-y-auto">
	<form use:form class="space-y-4">
		<Dialog.Header>
			<Dialog.Title>Payment for Subscription</Dialog.Title>
			<Dialog.Description>
				Subscription <strong>{dialogState.selectedRow.subscriptionNo}</strong>
			</Dialog.Description>
		</Dialog.Header>

		<!-- PRICE -->
		<div class="grid gap-2">
			<Label for="price">New Price *</Label>
			<Tooltip.Root disabled={!$formErrors.price}>
				<Tooltip.Trigger>
					<Input
						name="price"
						id="price"
						type="text"
						value={$formData.price}
					/>
				</Tooltip.Trigger>
				<Tooltip.Content>{$formErrors.price}</Tooltip.Content>
			</Tooltip.Root>
		</div>

		<!-- DATES -->
		<div class="grid grid-cols-2 gap-4">
			<div>
				<Label>Start Date *</Label>
				<Input name="startDate" type="date" />
			</div>

			<div>
				<Label>End Date *</Label>
				<Input name="endDate" type="date" />
			</div>
		</div>

		<!-- PAYMENT METHOD -->
		<div class="grid gap-2">
			<Label>Payment Method *</Label>

			<RadioGroup.Root
				name="paymentMethod"
				value={$formData.paymentMethod}
				onValueChange={(v) => { 
					$formData.paymentMethod = v; 
					setTouched("paymentMethod", true); 
				}}
				class="grid gap-2"
			>
				<div>
					<RadioGroup.Item id="cc" value="Credit Card" class="hidden" />
					<Label for="cc" class={cn("border p-2 rounded flex items-center gap-2", $formData.paymentMethod === "Credit Card" && "bg-primary/10")}>
						<CreditCard size={18}/> Credit Card
					</Label>
				</div>

				<div>
					<RadioGroup.Item id="bt" value="Bank Transfer" class="hidden" />
					<Label for="bt" class={cn("border p-2 rounded flex items-center gap-2", $formData.paymentMethod === "Bank Transfer" && "bg-primary/10")}>
						<Landmark size={18}/> Bank Transfer
					</Label>
				</div>

				<div>
					<RadioGroup.Item id="upi" value="UPI" class="hidden" />
					<Label for="upi" class={cn("border p-2 rounded flex items-center gap-2", $formData.paymentMethod === "UPI" && "bg-primary/10")}>
						<Smartphone size={18}/> UPI
					</Label>
				</div>
			</RadioGroup.Root>
		</div>

		<!-- TRANSACTION ID -->
		<div class="grid gap-2">
			<Label for="transactionId">Transaction ID</Label>
			<Input name="transactionId" id="transactionId" placeholder="Enter transaction ID" />
		</div>

		<Dialog.Footer>
			<Button class="w-full" type="submit" disabled={$formSubmitting}>
				{#if $formSubmitting}
					<Spinner /> Saving...
				{:else}
					Submit
				{/if}
			</Button>
		</Dialog.Footer>
	</form>
</Dialog.Content>
