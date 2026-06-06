export type LoginResponse = {
  ok: boolean;
  data?: { accessToken: string };
  code?: string;
};
export function saveToken(token: string) {
  if (typeof window !== "undefined") {
    localStorage.setItem("accessToken", token);
  }
}
export function clearToken() {
  if (typeof window !== "undefined") {
    localStorage.removeItem("accessToken");
  }
}
export function isAuthed(): boolean {
  if (typeof window === "undefined") return false;
  return !!localStorage.getItem("accessToken");
}
