const API_BASE = "http://localhost:5050/api/subscription-payment";

export async function getPendingPayments() {
	const res = await fetch(`${API_BASE}/pending`);
	return await res.json();
}

export async function getPaymentHistory() {
	const res = await fetch(`${API_BASE}/history`);
	return await res.json();
}

export async function submitPayment(payload: any) {
	const res = await fetch(`${API_BASE}/submit`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(payload)
	});
	return await res.json();
}
