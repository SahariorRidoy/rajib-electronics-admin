const API =
  process.env.NEXT_PUBLIC_API_BASE ||
  process.env.NEXT_PUBLIC_API_BASE;

function authFetch(input: string, init: RequestInit = {}) {
  const token =
    (typeof window !== "undefined" && localStorage.getItem("accessToken")) ||
    null;

  const headers = new Headers(init.headers || {});
  if (token) headers.set("Authorization", `Bearer ${token}`);

  return fetch(input, {
    ...init,
    headers,
    credentials: "include",
  });
}

export async function getUploadSignature(folder?: string) {
  const url = folder ? `${API}/uploads?folder=${folder}` : `${API}/uploads`;
  const res = await authFetch(url, { method: "POST" });
  const json = await res.json();
  if (!res.ok || json?.ok === false) {
    throw new Error(json?.message || json?.code || "sign failed");
  }
  return json.data as {
    cloudName: string;
    apiKey: string;
    timestamp: number;
    signature: string;
    folder: string;
  };
}

export async function uploadToCloudinary(
  file: File,
  sign: Awaited<ReturnType<typeof getUploadSignature>>
) {
  const fd = new FormData();
  fd.append("file", file);
  fd.append("api_key", sign.apiKey);
  fd.append("timestamp", String(sign.timestamp));
  fd.append("signature", sign.signature);
  fd.append("folder", sign.folder);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${sign.cloudName}/auto/upload`,
    { method: "POST", body: fd }
  );
  const json = await res.json();
  if (!res.ok || json.error) {
    throw new Error(json?.error?.message || "cloudinary upload failed");
  }
  return json as {
    secure_url: string;
    public_id: string;
  };
}

export async function deleteFromCloudinary(publicId: string) {
  const res = await authFetch(`${API}/uploads/delete`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ publicId }),
  });
  const json = await res.json();
  if (!res.ok || json?.ok === false) {
    throw new Error(json?.message || json?.code || "delete failed");
  }
  return json.data;
}
