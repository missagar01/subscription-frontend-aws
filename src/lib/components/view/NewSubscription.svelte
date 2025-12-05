<script lang="ts">
	import { Label } from "$lib/components/ui/label";
	import { Button } from "$lib/components/ui/button";
	import { Input } from "$lib/components/ui/input";
	import { Textarea } from "$lib/components/ui/textarea";
	import * as Select from "$lib/components/ui/select";
	import * as Tooltip from "$lib/components/ui/tooltip";
	import Spinner from "$lib/components/element/Spinner.svelte";

	import { createForm } from "felte";
	import { validator } from "@felte/validator-zod";
	import { z } from "zod";
	import { useSheets } from "$lib/state/sheets.svelte";
	import { toast } from "svelte-sonner";
	import { useAuth } from "$lib/state/auth.svelte";

	import { onMount } from "svelte";

	let sheetState = useSheets();
	let authState = useAuth();
	let newSubscriptionNo = "";
	let isDataLoaded = $state(false);
	let companyNames = $state<string[]>([]);
	let users = $state<Array<{ username: string; name: string }>>([]);

	const API = import.meta.env.VITE_API_BASE_URL;
	const API1 = "http://localhost:5050"

	// ⭐ Fetch subscription number from backend and load necessary data
	onMount(async () => {
		try {
			// Fetch subscription number
			const res = await fetch(`${API}/subscription/generate-number`);
			const data = await res.json();
			newSubscriptionNo = data.subscriptionNo;

			// ⭐ Load company names and users
			await Promise.all([
				// Load company names from master
				(async () => {
					try {
						const response = await fetch(`${API1}/master`);
						const masterData = await response.json();
						companyNames = masterData.companyName || [];
					} catch (error) {
						console.error("Failed to load company names:", error);
					}
				})(),
				
				// Load users for admin dropdown
				(async () => {
					try {
						const response = await fetch(`${API1}/users1`);
						const userData = await response.json();
						users = userData.data || [];
					} catch (error) {
						console.error("Failed to load users:", error);
					}
				})()
			]);
			
			isDataLoaded = true;
		} catch (error) {
			console.error("Failed to initialize form:", error);
			toast.error("Failed to load form data");
		}
	});

	const schema = z.object({
		companyName: z.string().min(1, "Please enter company name"),
		subscriberName: z.string().min(1, "Please enter subscriber name"),
		subscriptionName: z.string().min(1, "Please enter subscription name"),
		price: z.preprocess(
			(val) => Number(val),
			z.number().gt(0, "The price should at least be 0"),
		),
		frequency: z.enum(
			["Monthly", "Annually", "Quarterly", "Semi-Annually"],
			"Please select a valid option",
		),
		purpose: z.string().min(1, "Please enter the purpose"),
	});

	const {
		form,
		setFields,
		setTouched,
		errors,
		data,
		isSubmitting,
		reset,
	} =
		createForm<z.infer<typeof schema>>({
			extend: [validator({ schema })],

			onSubmit: async ({
				companyName,
				frequency,
				price,
				purpose,
				subscriberName: subName,
				subscriptionName,
			}) => {
				let subscriberName = subName;

				if (authState.user && authState.user?.role !== "admin") {
					subscriberName = authState.user.name;
				}

				const res = await fetch(`${API}/subscription/create`, {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						timestamp: new Date().toISOString(),
						subscriptionNo: newSubscriptionNo,
						companyName,
						subscriberName,
						subscriptionName,
						price,
						frequency,
						purpose,
					}),
				});

				if (!res.ok) {
					toast.error("Backend error: " + res.status);
					return;
				}

				sheetState.updateSubscription();
				toast.success("Request submitted!");
				reset();
				
				// Refresh subscription number for next submission
				try {
					const newRes = await fetch(`${API}/subscription/generate-number`);
					const newData = await newRes.json();
					newSubscriptionNo = newData.subscriptionNo;
				} catch (error) {
					console.error("Failed to refresh subscription number:", error);
				}
			},

			onError: (context) => {
				const err = context?.errors
					? Object.values(context.errors)[0]
					: "Submission failed.";
				toast.error(err);
			},
		});

	$effect(() => {
		if (authState.user && authState.user?.role !== "admin") {
			setFields("subscriberName", authState.user.name);
		}
	});
</script>

<div class="h-full p-5 md:p-5 md:pt-0 pt-0">
	<form
		use:form
		class="md:p-10 bg-background p-5 sm:border h-full rounded-xl shadow-md"
	>
		<div class="grid gap-6">
			<div class="grid md:grid-cols-3 gap-6">
				<!-- Company Name Dropdown -->
				<div class="grid gap-2">
					<Label for="companyName">Company Name</Label>
					<Select.Root
						type="single"
						bind:value={$data.companyName}
						name="companyName"
						onValueChange={() => setTouched("companyName", true)}
						disabled={!isDataLoaded}
					>
						<Tooltip.Root disabled={!$errors.companyName}>
							<Tooltip.Trigger>
								<Select.Trigger
									class="w-full"
									aria-invalid={$errors.companyName ? true : undefined}
								>
									{#if !isDataLoaded}
										Loading companies...
									{:else if $data.companyName}
										{$data.companyName}
									{:else}
										Select Company
									{/if}
								</Select.Trigger>
							</Tooltip.Trigger>
							<Tooltip.Content>
								{$errors.companyName}
							</Tooltip.Content>
						</Tooltip.Root>
						<Select.Content>
							{#if isDataLoaded}
								{#each companyNames as company}
									<Select.Item value={company}>{company}</Select.Item>
								{/each}
							{:else}
								<Select.Item value="" disabled>Loading...</Select.Item>
							{/if}
						</Select.Content>
					</Select.Root>
				</div>

				<!-- Subscriber Name Dropdown -->
				<div class="grid gap-2">
					<Label for="subscriberName">Subscriber Name</Label>
					{#if authState.user?.role === "admin"}
						<Select.Root
							type="single"
							bind:value={$data.subscriberName}
							name="subscriberName"
							onValueChange={() => setTouched("subscriberName", true)}
							disabled={!isDataLoaded}
						>
							<Tooltip.Root disabled={!$errors.subscriberName}>
								<Tooltip.Trigger>
									<Select.Trigger
										class="w-full"
										aria-invalid={$errors.subscriberName ? true : undefined}
									>
										{#if !isDataLoaded}
											Loading users...
										{:else if $data.subscriberName}
											{users.find((s) => s.username === $data.subscriberName)?.name || $data.subscriberName}
										{:else}
											Select Subscriber
										{/if}
									</Select.Trigger>
								</Tooltip.Trigger>
								<Tooltip.Content>
									{$errors.subscriberName}
								</Tooltip.Content>
							</Tooltip.Root>
							<Select.Content>
								{#if isDataLoaded}
									{#each users as { username, name }}
										<Select.Item value={username}>{name}</Select.Item>
									{/each}
								{:else}
									<Select.Item value="" disabled>Loading...</Select.Item>
								{/if}
							</Select.Content>
						</Select.Root>
					{:else}
						<Tooltip.Root disabled={!$errors.subscriberName}>
							<Tooltip.Trigger>
								<Input
									name="subscriberName"
									id="subscriberName"
									placeholder="Enter subscriber name"
									readonly
									value={authState.user?.name || ""}
								/>
							</Tooltip.Trigger>
							<Tooltip.Content>{$errors.subscriberName}</Tooltip.Content>
						</Tooltip.Root>
					{/if}
				</div>

				<!-- Subscription Name -->
				<div class="grid gap-2">
					<Label for="subscriptionName">Subscription Name</Label>
					<Tooltip.Root disabled={!$errors.subscriptionName}>
						<Tooltip.Trigger>
							<Input
								name="subscriptionName"
								id="subscriptionName"
								placeholder="Enter subscription name"
							/>
						</Tooltip.Trigger>
						<Tooltip.Content>{$errors.subscriptionName}</Tooltip.Content>
					</Tooltip.Root>
				</div>
			</div>

			<div class="grid sm:grid-cols-2 gap-6">
				<!-- Price -->
				<div class="grid gap-2">
					<Label for="price">Price (&#8377;)</Label>
					<Tooltip.Root disabled={!$errors.price}>
						<Tooltip.Trigger>
							<Input
								name="price"
								id="price"
								type="number"
								placeholder="Enter price"
							/>
						</Tooltip.Trigger>
						<Tooltip.Content>{$errors.price}</Tooltip.Content>
					</Tooltip.Root>
				</div>

				<!-- Frequency -->
				<div class="grid gap-2">
					<Label>Frequency</Label>
					<Select.Root
						type="single"
						bind:value={$data.frequency}
						name="frequency"
						onValueChange={() => setTouched("frequency", true)}
					>
						<Tooltip.Root disabled={!$errors.frequency}>
							<Tooltip.Trigger>
								<Select.Trigger
									class="w-full"
									aria-invalid={$errors.frequency ? true : undefined}
								>
									{$data.frequency ? $data.frequency : "Select frequency"}
								</Select.Trigger>
							</Tooltip.Trigger>
							<Tooltip.Content>
								{$errors.frequency}
							</Tooltip.Content>
						</Tooltip.Root>
						<Select.Content>
							<Select.Item value="Monthly">Monthly</Select.Item>
							<Select.Item value="Quarterly">Quarterly</Select.Item>
							<Select.Item value="Semi-Annually">Semi-Annually</Select.Item>
							<Select.Item value="Annually">Annually</Select.Item>
						</Select.Content>
					</Select.Root>
				</div>
			</div>

			<!-- Purpose -->
			<div class="grid gap-2">
				<Label for="purpose">Purpose of Subscription</Label>
				<Tooltip.Root disabled={!$errors.purpose}>
					<Tooltip.Trigger>
						<Textarea
							class="min-h-30"
							name="purpose"
							id="purpose"
							placeholder="Enter the purpose of subscription"
						/>
					</Tooltip.Trigger>
					<Tooltip.Content>
						{$errors.purpose}
					</Tooltip.Content>
				</Tooltip.Root>
			</div>

			<!-- Submit Button -->
			<Button type="submit" disabled={$isSubmitting || !isDataLoaded}>
				{#if $isSubmitting}
					<Spinner /> Submitting
				{:else if !isDataLoaded}
					Loading Form...
				{:else}
					Submit
				{/if}
			</Button>
		</div>
	</form>
</div>