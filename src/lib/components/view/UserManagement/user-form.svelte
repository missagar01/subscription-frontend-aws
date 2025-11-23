<script lang="ts">
	import * as Tooltip from "$lib/components/ui/tooltip";
	import * as Dialog from "$lib/components/ui/dialog";
	import * as Select from "$lib/components/ui/select";
	import { Label } from "$lib/components/ui/label";
	import { Input } from "$lib/components/ui/input";
	import { Button } from "$lib/components/ui/button";
	import { validator } from "@felte/validator-zod";
	import { createForm } from "felte";
	import z from "zod";
	import type { UserData } from "./columns";
	import { getContext, createEventDispatcher } from "svelte";
	import { Eye, EyeClosed } from "@lucide/svelte";
	import Spinner from "$lib/components/element/Spinner.svelte";
	import { toast } from "svelte-sonner";
	import { useAuth } from "$lib/state/auth.svelte";

	const dispatch = createEventDispatcher();
	const authState = useAuth();
	const API_BASE = "http://localhost:5050";

	const dialogState: {
		selectedRow: UserData | undefined;
		open: boolean;
		typeForm: "Edit" | "Create";
	} = getContext(Symbol.for("dialog-state"));

	let passwordVisible = $state(false);

	const schema = z.object({
		username: z.string().nonempty("Please enter a username"),
		name: z.string().nonempty("Please enter a name"),
		password: z.string().nonempty("Please enter a password"),
		email: z.string().email("Invalid email format"),
		role: z.enum(["admin", "user"], "Please select role"),
	});

	const { form, setTouched, setFields, reset, data, errors, isSubmitting } =
		createForm({
			extend: [validator({ schema })],

			onSubmit: async (values) => {
				const headers = {
					"Content-Type": "application/json",
					Authorization: `Bearer ${authState.token}`
				};

				if (dialogState.typeForm === "Create") {
					const res = await fetch(`${API_BASE}/api/users/create`, {
						method: "POST",
						headers,
						body: JSON.stringify(values)
					});

					if (!res.ok) throw Error((await res.json()).error);
				} else {
					const res = await fetch(`${API_BASE}/api/users/update/${dialogState.selectedRow?.username}`, {
						method: "PUT",
						headers,
						body: JSON.stringify(values)
					});

					if (!res.ok) throw Error((await res.json()).error);
				}

				dialogState.open = false;
				dispatch("refresh");
				toast.success(`User ${dialogState.typeForm === "Create" ? "created" : "updated"} successfully`);
			},

			onError: (e) => toast.error(e.message),
		});

	// LOAD VALUES WHEN EDITING
	$effect(() => {
		if (dialogState.open && dialogState.selectedRow) {
			setFields({
				email: dialogState.selectedRow.user.email,
				name: dialogState.selectedRow.user.name,
				password: dialogState.selectedRow.password,
				role: dialogState.selectedRow.role,
				username: dialogState.selectedRow.username,
			});
		} else if (dialogState.open) {
			reset();
		}
	});
</script>

<Dialog.Content>
	<form use:form class="grid gap-4">
		<Dialog.Header>
			<Dialog.Title>{dialogState.typeForm} User</Dialog.Title>
		</Dialog.Header>

		<div class="grid gap-4 md:grid-cols-2">
			<!-- Username -->
			<div class="grid gap-2">
				<Label for="username">Username</Label>
				<Tooltip.Root disabled={!$errors.username}>
					<Tooltip.Trigger>
						<Input name="username" id="username" placeholder="Enter username" />
					</Tooltip.Trigger>
					<Tooltip.Content>{$errors.username}</Tooltip.Content>
				</Tooltip.Root>
			</div>

			<!-- Password -->
			<div class="grid gap-2">
				<Label for="password">Password</Label>
				<Tooltip.Root disabled={!$errors.password}>
					<Tooltip.Trigger>
						<div class="relative">
							<Input
								name="password"
								placeholder="Enter password"
								type={passwordVisible ? "text" : "password"}
							/>
							<Button
								class="absolute right-0 top-0 hover:bg-transparent"
								variant="ghost"
								size="icon"
								type="button"
								onclick={() => (passwordVisible = !passwordVisible)}
							>
								{#if passwordVisible}<EyeClosed />{:else}<Eye />{/if}
							</Button>
						</div>
					</Tooltip.Trigger>
					<Tooltip.Content>{$errors.password}</Tooltip.Content>
				</Tooltip.Root>
			</div>

			<!-- Name -->
			<div class="grid gap-2">
				<Label for="name">Name</Label>
				<Input name="name" placeholder="Enter name" />
			</div>

			<!-- Email -->
			<div class="grid gap-2">
				<Label for="email">Email</Label>
				<Input name="email" placeholder="Enter email" />
			</div>
		</div>

		<!-- Role -->
		<div class="grid gap-2">
			<Label>Role of User</Label>

			<Select.Root
				name="role"
				type="single"
				bind:value={$data.role}
				onValueChange={() => setTouched("role", true)}
			>
				<Select.Trigger class="w-full">
					{$data.role || "Select role"}
				</Select.Trigger>

				<Select.Content>
					<Select.Item value="admin">admin</Select.Item>
					<Select.Item value="user">user</Select.Item>
				</Select.Content>
			</Select.Root>

			{#if $errors.role}
				<p class="text-red-500 text-sm">{$errors.role}</p>
			{/if}
		</div>

		<Dialog.Footer>
			<Button class="w-full" type="submit" disabled={$isSubmitting}>
				{#if $isSubmitting}
					<Spinner /> Submitting...
				{:else}
					Submit
				{/if}
			</Button>
		</Dialog.Footer>
	</form>
</Dialog.Content>
