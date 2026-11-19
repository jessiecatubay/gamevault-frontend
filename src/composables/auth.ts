import { computed, ref } from "vue";
import { api } from "boot/api";

export interface AuthUser {
  id: number;
  email: string;
}

const TOKEN_KEY = "gamevault-token";
export const authToken = ref(
  typeof window === "undefined" ? "" : localStorage.getItem(TOKEN_KEY) || "",
);
export const authUser = ref<AuthUser | null>(null);
export const isAuthenticated = computed(() => Boolean(authToken.value));

interface AuthResponse {
  data: {
    token: string;
    user: AuthUser;
  };
}

export async function authenticate(
  email: string,
  password: string,
  register: boolean,
): Promise<void> {
  const response = await api.post<AuthResponse>(
    register ? "/auth/register" : "/auth/login",
    { email, password },
  );
  authToken.value = response.data.data.token;
  authUser.value = response.data.data.user;
  localStorage.setItem(TOKEN_KEY, authToken.value);
}

export function clearAuthentication(): void {
  authToken.value = "";
  authUser.value = null;
  localStorage.removeItem(TOKEN_KEY);
}

export async function loadCurrentUser(): Promise<void> {
  if (!authToken.value) return;
  const response = await api.get<{ data: AuthUser }>("/auth/me");
  authUser.value = response.data.data;
}

if (typeof window !== "undefined") {
  window.addEventListener("gamevault:auth-expired", clearAuthentication);
}
