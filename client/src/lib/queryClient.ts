import { QueryClient } from "@tanstack/react-query";
import { auth } from "./firebase";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      queryFn: async ({ queryKey }) => {
        const url = queryKey[0] as string;
        return await fetcher(url);
      },
    },
  },
});

export async function apiRequest(
  endpoint: string,
  options: RequestInit = {}
): Promise<any> {
  const user = auth.currentUser;
  if (!user) throw new Error("Kullanıcı login değil. Lütfen giriş yapın.");
  const idToken = await user.getIdToken();
  let url = endpoint.startsWith("/api") ? endpoint : `/api${endpoint.startsWith("/") ? "" : "/"}${endpoint}`;
  const config: RequestInit = {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${idToken}`,
      ...options.headers,
    },
  };
  if (options.body && typeof options.body !== "string" && !(options.body instanceof FormData)) {
    config.body = JSON.stringify(options.body);
  }
  const response = await fetch(url, config);
  const contentType = response.headers.get("content-type");
  if (!response.ok) {
    let error;
    if (contentType && contentType.includes("application/json")) {
      error = await response.json();
    } else {
      error = { message: await response.text() };
    }
    throw new Error(error.message || `HTTP ${response.status}`);
  }
  if (contentType && contentType.includes("application/json")) {
    return response.json();
  } else {
    return response.text();
  }
}

export const fetcher = async (url: string) => {
  return apiRequest(url);
};