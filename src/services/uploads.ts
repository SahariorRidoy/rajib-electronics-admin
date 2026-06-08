const API = process.env.NEXT_PUBLIC_API_BASE || "";

function authFetch(input: string, init: RequestInit = {}) {
  const token =
    (typeof window !== "undefined" && localStorage.getItem("accessToken")) || null;
  const headers = new Headers(init.headers || {});
  if (token) headers.set("Authorization", `Bearer ${token}`);
  return fetch(input, { ...init, headers, credentials: "include" });
}

export type UploadResult = { url: string; filePath: string };

export async function uploadFile(file: File, folder?: string): Promise<UploadResult> {
  const url = folder
    ? `${API}/uploads?folder=${folder}`
    : `${API}/uploads`;

  const fd = new FormData();
  fd.append("file", file);

  const res = await authFetch(url, { method: "POST", body: fd });
  const json = await res.json();
  if (!res.ok || json?.ok === false) {
    throw new Error(json?.message || json?.code || "Upload failed");
  }
  return json.data as UploadResult;
}

export async function deleteFile(filePath: string): Promise<void> {
  const res = await authFetch(`${API}/uploads/delete`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ filePath }),
  });
  const json = await res.json();
  if (!res.ok || json?.ok === false) {
    throw new Error(json?.message || json?.code || "Delete failed");
  }
}
