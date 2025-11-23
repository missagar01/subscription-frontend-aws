<script lang="ts">
	import { Root as DialogRoot } from "$lib/components/ui/dialog";
	import { setContext } from "svelte";
	import { userColumns, type UserData } from "./columns";
	import DataTable from "$lib/components/element/DataTable.svelte";
	import { Button } from "$lib/components/ui/button";
	import { UserPlus } from "@lucide/svelte";
	import UserForm from "./user-form.svelte";
	import { Dialog } from "bits-ui";
	import { useAuth } from "$lib/state/auth.svelte";

	let open = $state(false);
	let selectedRow = $state<UserData>();
	let typeForm = $state<"Edit" | "Create">("Create");

	const authState = useAuth();
	const API_BASE = "http://localhost:5050";

	let users = $state<UserData[]>([]);
	let loading = $state(true);

	setContext(Symbol.for("dialog-state"), {
		get open() { return open },
		set open(v) { open = v },

		get selectedRow() { return selectedRow },
		set selectedRow(v) { selectedRow = v },

		get typeForm() { return typeForm },
		set typeForm(v) { typeForm = v }
	});

	// 🔥 Fetch from backend
	async function loadUsers() {
		try {
			loading = true;

			const res = await fetch(`${API_BASE}/api/users`, {
				headers: {
					Authorization: `Bearer ${authState.token}`
				}
			});

			const data = await res.json();
			if (!Array.isArray(data)) return;

			users = data.map((u) => ({
				lastLogin: u.last_login ? new Date(u.last_login) : null,
				role: u.role,
				user: { email: u.email, name: u.name },
				username: u.username,
				password: u.password
			}));
		} finally {
			loading = false;
		}
	}

	// PAGE LOAD
	$effect.pre(() => {
		loadUsers();
	});
</script>

<div class="md:p-5 md:pt-0">
	<div class="bg-background p-5 rounded-md shadow-md">
		<DialogRoot bind:open>
			<DataTable
				columns={userColumns}
				data={users}
				loading={loading}
				class="h-[84dvh] md:h-[79dvh]"
			>
				<Button onclick={() => {
					selectedRow = undefined;
					typeForm = "Create";
					open = true;
				}}>
					<UserPlus /> Create User
				</Button>
			</DataTable>

			<UserForm on:refresh={() => loadUsers()} />
		</DialogRoot>
	</div>
</div>
