// src/lib/state/sheets.svelte.ts
import { backend } from "$lib/api/backend";
import type {
    ApprovalRow,
    PaymentRow,
    RenewalRow,
    SubscriptionRow,
    UserRow,
    Master,
} from "$lib/types/sheets";
import { getContext, setContext } from "svelte";
import { toast } from "svelte-sonner";

export class SheetState {
    subscriptionSheet = $state<SubscriptionRow[]>([]);
    renewalSheet = $state<RenewalRow[]>([]);
    approvalSheet = $state<ApprovalRow[]>([]);
    paymentSheet = $state<PaymentRow[]>([]);
    userSheet = $state<UserRow[]>([]);
    masterSheet = $state<Master>({ companyName: [] });

    subscriptionLoading = $state(true);
    renewalLoading = $state(true);
    approvalLoading = $state(true);
    paymentLoading = $state(true);
    userLoading = $state(true);
    allLoading = $state(true);

    // SUBSCRIPTIONS
    async updateSubscription() {
        this.subscriptionLoading = true;
        try {
            const { data } = await backend.getSubscriptions();
            this.subscriptionSheet = data;
        } finally {
            this.subscriptionLoading = false;
        }
    }

    // RENEWALS
    async updateRenewal() {
        this.renewalLoading = true;
        try {
            const { data } = await backend.getRenewals();
            this.renewalSheet = data;
        } finally {
            this.renewalLoading = false;
        }
    }

    // APPROVALS
    async updateApproval() {
        this.approvalLoading = true;
        try {
            const { data } = await backend.getApprovals();
            this.approvalSheet = data;
        } finally {
            this.approvalLoading = false;
        }
    }

    // PAYMENTS
    async updatePayment() {
        this.paymentLoading = true;
        try {
            const { data } = await backend.getPayments();
            this.paymentSheet = data;
        } finally {
            this.paymentLoading = false;
        }
    }

    // USERS
    async updateUser() {
        this.userLoading = true;
        try {
            const { data } = await backend.getUsers();
            this.userSheet = data;
        } finally {
            this.userLoading = false;
        }
    }

    // MASTER
    async updateMaster() {
        const { data } = await backend.getMaster();
        this.masterSheet = data;
    }

    // FETCH EVERYTHING AT ONCE
    async updateAll() {
        this.subscriptionLoading =
            this.renewalLoading =
            this.approvalLoading =
            this.paymentLoading =
            this.userLoading =
            this.allLoading =
                true;

        try {
            const { data } = await backend.getDashboard();

            this.subscriptionSheet = data.subscriptionSheet ?? data;
            this.renewalSheet = data.renewalSheet ?? [];
            this.approvalSheet = data.approvalSheet ?? [];
            this.paymentSheet = data.paymentSheet ?? [];
            this.userSheet = data.userSheet ?? [];
        } finally {
            this.subscriptionLoading =
                this.renewalLoading =
                this.approvalLoading =
                this.paymentLoading =
                this.userLoading =
                this.allLoading =
                    false;
        }
    }

    constructor() {
        toast.promise(this.updateAll(), {
            loading: "Fetching data from backend...",
            success: "All data loaded",
            error: "Failed to load backend",
        });
    }
}

const SHEET_KEY = "sheet-state";

export function setSheet(): SheetState {
    return setContext(Symbol.for(SHEET_KEY), new SheetState());
}

export function useSheets(): SheetState {
    return getContext(Symbol.for(SHEET_KEY));
}
