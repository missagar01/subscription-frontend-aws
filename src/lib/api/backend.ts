// src/lib/api/backend.ts
import { API } from "./client";

export const backend = {
    // Dashboard (returns everything)
    getDashboard: () => API.get("/dashboard-routes/dashboard"),

    // Subscription API
    getSubscriptions: () => API.get("/dashboard-routes/all"),
    getMySubscriptions: () => API.get("/dashboard-routes/mine"),

    // Renewal API
    getRenewals: () => API.get("/dashboard-routes/renewals"),

    // Approval API
    // getApprovals: () => API.get("/approval/all"),
    getApprovals: () => API.get("/subscription-approval/pending"),  // ✅ Changed from "/app

    // Payments API
    getPayments: () => API.get("/payment/all"),

    // Users API
    getUsers: () => API.get("/users"),

    getUsers1: () => API.get("/users1"),

    // Master API
    getMaster: () => API.get("/master"),

    // (extra fallback)
    getAll: () => API.get("/dashboard-routes/dashboard"),
};
