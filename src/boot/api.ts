import axios from "axios";
import { boot } from "quasar/wrappers";

interface FrontendImportMeta extends ImportMeta {
  readonly env: {
    readonly VITE_API_URL?: string;
  };
}

export const API_URL =
  (import.meta as FrontendImportMeta).env.VITE_API_URL ||
  "http://localhost:3000/api";

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const token =
    typeof window === "undefined"
      ? null
      : window.localStorage.getItem("gamevault-token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (
      axios.isAxiosError(error) &&
      error.response?.status === 401 &&
      !["/auth/login", "/auth/register"].includes(error.config?.url || "")
    ) {
      window.localStorage.removeItem("gamevault-token");
      window.dispatchEvent(new Event("gamevault:auth-expired"));
      if (window.location.pathname !== "/login") {
        window.location.assign("/login");
      }
    }
    return Promise.reject(error);
  },
);

export default boot(() => {
  // The configured Axios client is imported by API-consuming pages.
});
