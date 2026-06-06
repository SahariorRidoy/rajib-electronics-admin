"use client";
import Guard from "@/components/Guard";
import Page from "@/components/Page";
import { api } from "@/lib/api";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
export const dynamic = "force-dynamic";

export default function EditCategory() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const [err, setErr] = useState<string | null>(null);
  const router = useRouter();
  const onDelete = async () => {
    if (!confirm("Delete this category?")) return;
    try {
      await api(`/admin/categories/${id}`, "DELETE");
      router.replace("/categories");
    } catch (e: unknown) {
      setErr((e as Error).message);
    }
  };
  return (
    <Guard>
      <Page
        title="Edit Category"
        actions={
          <button className="btn-outline" onClick={onDelete}>
            Delete
          </button>
        }
      >
        {err && <div className="text-sm text-red-600">{err}</div>}
        <div className="text-sm text-neutral-500">
          For brevity, implement update form and submit to PATCH
          /admin/categories/:id
        </div>
      </Page>
    </Guard>
  );
}
