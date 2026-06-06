export const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE;
export type HttpMethod = "GET" | "POST" | "PATCH" | "DELETE";
function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("accessToken");
}
export async function api<T>(
  path: string,
  method: HttpMethod = "GET",
  body?: unknown
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  const token = getToken();
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });
  if (!res.ok) {
    let detail: unknown = undefined;
    try {
      detail = await res.json();
    } catch {}
    throw new Error(
      `API ${method} ${path} failed: ${res.status} ${
        res.statusText
      } :: ${JSON.stringify(detail)}`
    );
  }
  return res.json() as Promise<T>;
}
