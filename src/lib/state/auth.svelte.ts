// src/lib/state/auth.svelte.ts
import { getContext, setContext } from "svelte";
import { navigate } from "$lib/router";
import { setAuthToken } from "$lib/api";

class AuthState {
  loggedin = $state(false);
  loading = $state(false);
  user = $state<any>(null);
  token = $state("");

  
  async login({ username, password }: { username: string; password: string }) {
    this.loading = true;
    
    const API = import.meta.env.VITE_API_BASE_URL;
const res = await fetch(`${API}/auth/login`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ username, password })
});


    const data = await res.json();
    this.loading = false;

    if (!res.ok) return false;

    // Save
    this.token = data.token;
    this.user = data.user;
    this.loggedin = true;

    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data.user));

    // 🔥 Important: update axios token
    setAuthToken(data.token);

    return true;
  }

  logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    this.loggedin = false;
    this.user = null;
    this.token = "";

    setAuthToken(""); // remove axios token
    navigate("/auth/login");
  }

  constructor() {
    const savedToken = localStorage.getItem("token");
    const savedUser = localStorage.getItem("user");

    if (savedToken && savedUser) {
      this.token = savedToken;
      this.user = JSON.parse(savedUser);
      this.loggedin = true;

      // 🔥 critical fix after refresh
      setAuthToken(savedToken);
    }
  }
}

export const setAuth = () =>
  setContext(Symbol.for("auth-state"), new AuthState());

export function useAuth() {
  return getContext(Symbol.for("auth-state"));
}
