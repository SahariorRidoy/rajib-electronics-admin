"use client";

import { useState } from "react";
import Image from "next/image";
import { UploadCloud, Trash2 } from "lucide-react";
import { uploadFile, deleteFile } from "@/services/uploads";

export type UploadValue = {
  url: string;
  filePath: string;
} | null;

export default function UploadImage({
  label = "Image",
  hint,
  value,
  onChange,
  disabled,
  folder,
}: {
  label?: string;
  hint?: string;
  value: UploadValue;
  onChange: (v: UploadValue) => void;
  disabled?: boolean;
  folder?: string;
}) {
  const [busy, setBusy] = useState(false);

  const onPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setBusy(true);
      const result = await uploadFile(file, folder);
      onChange({ url: result.url, filePath: result.filePath });
    } catch {
      alert("Upload failed");
    } finally {
      setBusy(false);
      e.currentTarget.value = "";
    }
  };

  const onRemove = async () => {
    if (!value?.filePath) { onChange(null); return; }
    try {
      setBusy(true);
      await deleteFile(value.filePath);
      onChange(null);
    } catch {
      alert("Delete failed");
    } finally {
      setBusy(false);
    }
  };

  const containerClass = hint
    ? "relative w-full aspect-[3/1] rounded-xl overflow-hidden border-2 border-rose-200"
    : "relative w-full h-48 rounded-xl overflow-hidden border-2 border-rose-200";

  const uploadAreaClass = hint
    ? "flex items-center justify-center w-full aspect-[3/1] border-2 border-dashed rounded-xl cursor-pointer hover:bg-rose-50 border-rose-300 text-rose-600"
    : "flex items-center justify-center w-full h-40 border-2 border-dashed rounded-xl cursor-pointer hover:bg-rose-50 border-rose-300 text-rose-600";

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-semibold text-gray-700">{label}</label>
        {hint && <span className="text-xs text-pink-500 font-medium">{hint}</span>}
      </div>

      {!value ? (
        <label className={uploadAreaClass}>
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={onPick}
            disabled={disabled || busy}
          />
          <div className="flex flex-col items-center gap-2">
            <UploadCloud className="w-6 h-6" />
            <span className="text-sm font-medium">
              {busy ? "Uploading..." : "Click to upload"}
            </span>
            {hint && <span className="text-xs text-rose-400">{hint}</span>}
          </div>
        </label>
      ) : (
        <div className={containerClass}>
          <Image src={value.url} alt="uploaded" fill className="object-cover" sizes="800px" />
          <button
            type="button"
            onClick={onRemove}
            disabled={disabled || busy}
            className="absolute top-2 right-2 inline-flex items-center gap-1 px-3 py-1.5 bg-red-50 border border-red-200 text-red-600 rounded-lg hover:bg-red-100 text-xs"
          >
            <Trash2 className="w-4 h-4" />
            Remove
          </button>
          {hint && (
            <div className="absolute bottom-2 left-2 bg-white/90 px-2 py-0.5 rounded text-xs font-bold text-gray-700">
              {hint}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
