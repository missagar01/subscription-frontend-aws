<script lang="ts">
	import * as Dropdown from "$lib/components/ui/dropdown-menu";
	import { getContext, createEventDispatcher } from "svelte";
	import type { UserData } from "./columns";
	import { Ellipsis, Pencil, Trash } from "@lucide/svelte";
	import { toast } from "svelte-sonner";
	import { useAuth } from "$lib/state/auth.svelte";

	let { currentRow }: { currentRow: UserData } = $props();
	const dialogState: any = getContext(Symbol.for("dialog-state"));
	const dispatch = createEventDispatcher();

	const authState = useAuth();
	// const API_BASE = "http://localhost:5050";
	const API_BASE = import.meta.env.VITE_API_BASE_URL;
</script>

<div class="flex justify-center">
	<Dropdown.Root>
		<Dropdown.Trigger>
			<Ellipsis size={18} />
		</Dropdown.Trigger>

		<Dropdown.Content>

			<!-- ⭐ EDIT BUTTON -->
			<Dropdown.Item
				class="flex gap-2"
				onclick={() => {
					dialogState.selectedRow = currentRow;
					dialogState.open = true;
					dialogState.typeForm = "Edit";
				}}
			>
				<Pencil size={15} color="var(--foreground)" /> Edit
			</Dropdown.Item>

			<!-- ❌ DELETE BUTTON -->
			<Dropdown.Item
				class="flex gap-2 text-destructive"
				onclick={async () => {
					toast.promise(
						fetch(`${API_BASE}/users/delete/${currentRow.username}`, {
							method: "DELETE",
							headers: {
								Authorization: `Bearer ${authState.token}`
							}
						}),
						{
							loading: "Deleting user...",
							success: () => {
								dispatch("refresh"); // 🔥 tell parent to reload users
								return "User deleted successfully";
							},
							error: "Failed to delete user"
						}
					);
				}}
			>
				<Trash size={15} color="var(--destructive)" /> Delete
			</Dropdown.Item>

		</Dropdown.Content>
	</Dropdown.Root>
</div>
