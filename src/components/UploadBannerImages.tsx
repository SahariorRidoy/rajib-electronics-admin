"use client";

import { useState } from "react";
import Image from "next/image";
import { UploadCloud, Trash2 } from "lucide-react";
import {
  getUploadSignature,
  uploadToCloudinary,
  deleteFromCloudinary,
} from "@/services/uploads";

export type BannerImage = { url: string; publicId: string };

const SLOTS = [
  {
    label: "Image 1 — Square (1:1)",
    hint: "500 × 500 px",
    aspect: "aspect-square",
    badge: "1:1 · 500×500",
  },
  {
    label: "Image 2 — Banner (3:1)",
    hint: "1200 × 400 px",
    aspect: "aspect-[3/1]",
    badge: "3:1 · 1200×400",
  },
];

export default function UploadBannerImages({
  value,
  onChange,
  disabled,
}: {
  label?: string;
  value: BannerImage[];
  onChange: (v: BannerImage[]) => void;
  disabled?: boolean;
}) {
  const [busy, setBusy] = useState<number | null>(null);

  const onPick = async (e: React.ChangeEvent<HTMLInputElement>, slotIdx: number) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(slotIdx);
    try {
      const sign = await getUploadSignature();
      const up = await uploadToCloudinary(file, sign);
      const next = [...value];
      next[slotIdx] = { url: up.secure_url, publicId: up.public_id };
      onChange(next);
    } finally {
      setBusy(null);
      e.currentTarget.value = "";
    }
  };

  const removeAt = async (idx: number) => {
    const it = value[idx];
    try {
      if (it?.publicId) await deleteFromCloudinary(it.publicId);
    } catch {
      // ignore
    }
    const next = [...value];
    next[idx] = { url: "", publicId: "" };
    onChange(next);
  };

  return (
    <div className="space-y-3">
      <p className="text-sm font-semibold text-gray-700">Category Images</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {SLOTS.map((slot, i) => {
          const img = value[i];
          const isUploading = busy === i;
          return (
            <div key={i} className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-600">{slot.label}</span>
                <span className="text-xs text-pink-500 font-medium">{slot.hint}</span>
              </div>
              <div
                className={`relative w-full ${slot.aspect} rounded-xl overflow-hidden border-2 ${
                  img?.url ? "border-pink-300" : "border-dashed border-pink-200"
                } bg-pink-50/30`}
              >
                {img?.url ? (
                  <>
                    <Image
                      src={img.url}
                      alt={slot.label}
                      fill
                      className="object-cover"
                      sizes={i === 0 ? "300px" : "600px"}
                    />
                    <button
                      type="button"
                      onClick={() => removeAt(i)}
                      disabled={disabled || busy !== null}
                      className="absolute top-2 right-2 inline-flex items-center gap-1 px-2 py-1 bg-red-50 border border-red-200 text-red-600 rounded-lg hover:bg-red-100 text-xs"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <div className="absolute bottom-2 left-2 bg-white/90 px-2 py-0.5 rounded text-xs font-bold text-gray-700">
                      {slot.badge}
                    </div>
                  </>
                ) : (
                  <label className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer hover:bg-pink-50/60 transition">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => onPick(e, i)}
                      disabled={disabled || busy !== null}
                    />
                    <UploadCloud className="w-6 h-6 text-pink-400" />
                    <span className="text-xs font-medium text-pink-500 mt-1">
                      {isUploading ? "Uploading..." : `Upload · ${slot.hint}`}
                    </span>
                    <span className="text-[10px] text-gray-400 mt-0.5">{slot.badge}</span>
                  </label>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
