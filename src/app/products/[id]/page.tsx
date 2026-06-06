"use client";
import Guard from "@/components/Guard";
import Page from "@/components/Page";
import { api } from "@/lib/api";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";

export default function EditProduct() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const [err, setErr] = useState<string | null>(null);
  const router = useRouter();

  const onDelete = async () => {
    if (!confirm("Delete this product?")) return;
    try {
      await api(`/admin/products/${id}`, "DELETE");
      router.replace("/products");
    } catch (e: unknown) {
      setErr((e as Error).message);
    }
  };

  return (
    <Guard>
      <Page
        title="Edit Product"
        actions={
          <button onClick={onDelete} className="btn-outline">
            Delete
          </button>
        }
      >
        {err && <div className="text-sm text-red-600">{err}</div>}
        <div className="text-sm text-neutral-500">
          For brevity, implement update fields similarly to /products/new and
          submit to PATCH /admin/products/:id
        </div>
      </Page>
    </Guard>
  );
}
