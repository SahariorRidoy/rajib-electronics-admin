"use client"
import Guard from "@/components/Guard";
import Page from "@/components/Page";
import { useState } from "react";
import { api } from "@/lib/api";
import { useRouter } from "next/navigation";

type CreateDTO = {
  title: string;
  slug: string;
  image?: string;
  status?: "ACTIVE" | "HIDDEN";
};


export default function NewCategory() {
  const [form, setForm] = useState<CreateDTO>({
    title: "",
    slug: "",
    status: "ACTIVE",
  });
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    try {
      await api<{ ok: boolean; data: { id: string } }>(
        "/admin/categories",
        "POST",
        form
      );
      router.replace("/categories");
    } catch (e: unknown) {
      setErr((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Guard>
      <Page title="Add Category">
        <form
          onSubmit={submit}
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          <div>
            <label className="block text-sm mb-1">Title</label>
            <input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="block text-sm mb-1">Slug</label>
            <input
              value={form.slug}
              onChange={(e) => setForm({ ...form, slug: e.target.value })}
              required
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm mb-1">Image URL</label>
            <input
              value={form.image ?? ""}
              onChange={(e) => setForm({ ...form, image: e.target.value })}
            />
          </div>
          {err && (
            <div className="text-sm text-red-600 md:col-span-2">{err}</div>
          )}
          <div className="md:col-span-2">
            <button className="btn" disabled={loading}>
              {loading ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </Page>
    </Guard>
  );
}
