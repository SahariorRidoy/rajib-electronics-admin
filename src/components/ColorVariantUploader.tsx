"use client";

import { useState } from "react";
import Image from "next/image";
import { Plus, Trash2, UploadCloud, Palette, Loader2 } from "lucide-react";
import { getUploadSignature, uploadToCloudinary, deleteFromCloudinary } from "@/services/uploads";

export type ColorVariantItem = {
  colorName: string;
  colorHex: string;
  image: string;
  imageId: string;
};

const PRESET_COLORS = [
  { name: "Black", hex: "#000000" },
  { name: "White", hex: "#FFFFFF" },
  { name: "Red", hex: "#EF4444" },
  { name: "Blue", hex: "#3B82F6" },
  { name: "Green", hex: "#22C55E" },
  { name: "Yellow", hex: "#EAB308" },
  { name: "Orange", hex: "#F97316" },
  { name: "Purple", hex: "#A855F7" },
  { name: "Pink", hex: "#EC4899" },
  { name: "Gray", hex: "#6B7280" },
  { name: "Brown", hex: "#92400E" },
  { name: "Navy", hex: "#1E3A5F" },
];

function ColorVariantCard({
  item,
  index,
  onRemove,
}: {
  item: ColorVariantItem;
  index: number;
  onRemove: (index: number) => void;
}) {
  return (
    <div className="relative group flex flex-col items-center gap-2 p-3 bg-white rounded-2xl border-2 border-gray-100 hover:border-[#167389]/40 hover:shadow-md transition-all duration-200">
      {/* Image */}
      <div className="relative w-full h-24 rounded-xl overflow-hidden bg-gray-50 border border-gray-100">
        {item.image ? (
          <Image src={item.image} alt={item.colorName} fill className="object-cover" sizes="160px" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <UploadCloud className="w-6 h-6 text-gray-300" />
          </div>
        )}
      </div>

      {/* Color swatch + name */}
      <div className="flex items-center gap-2 w-full">
        <span
          className="w-5 h-5 rounded-full border-2 border-white shadow-sm flex-shrink-0"
          style={{ backgroundColor: item.colorHex }}
        />
        <span className="text-xs font-semibold text-gray-700 truncate">{item.colorName}</span>
        <span className="text-[10px] text-gray-400 font-mono ml-auto">{item.colorHex}</span>
      </div>

      {/* Remove */}
      <button
        type="button"
        onClick={() => onRemove(index)}
        className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-md hover:bg-red-600"
      >
        <Trash2 className="w-3 h-3" />
      </button>
    </div>
  );
}

export default function ColorVariantUploader({
  value,
  onChange,
}: {
  value: ColorVariantItem[];
  onChange: (v: ColorVariantItem[]) => void;
}) {
  const [isAdding, setIsAdding] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [draft, setDraft] = useState<ColorVariantItem>({
    colorName: "",
    colorHex: "#000000",
    image: "",
    imageId: "",
  });

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const input = e.currentTarget;
    if (!file) return;
    try {
      setUploading(true);
      const sign = await getUploadSignature("variants");
      const up = await uploadToCloudinary(file, sign);
      setDraft((d) => ({ ...d, image: up.secure_url, imageId: up.public_id }));
    } catch {
      alert("Image upload failed");
    } finally {
      setUploading(false);
      if (input) input.value = "";
    }
  };

  const handleAdd = () => {
    if (!draft.colorName.trim() || !draft.image) return;
    onChange([...value, { ...draft }]);
    setDraft({ colorName: "", colorHex: "#000000", image: "", imageId: "" });
    setIsAdding(false);
  };

  const handleCancel = async () => {
    if (draft.imageId) {
      await deleteFromCloudinary(draft.imageId).catch(() => {});
    }
    setDraft({ colorName: "", colorHex: "#000000", image: "", imageId: "" });
    setIsAdding(false);
  };

  const handleRemove = async (index: number) => {
    const item = value[index];
    if (item.imageId) {
      await deleteFromCloudinary(item.imageId).catch(() => {});
    }
    onChange(value.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Palette className="w-4 h-4 text-[#167389]" />
          <label className="text-sm font-semibold text-gray-700">Color Variants</label>
          {value.length > 0 && (
            <span className="text-xs font-semibold bg-[#167389]/10 text-[#167389] border border-[#167389]/20 rounded-full px-2 py-0.5">
              {value.length} added
            </span>
          )}
        </div>
        {!isAdding && (
          <button
            type="button"
            onClick={() => setIsAdding(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-[#167389]/10 text-[#167389] hover:bg-[#167389]/20 border border-[#167389]/20 transition"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Color
          </button>
        )}
      </div>

      {/* Existing variants grid */}
      {value.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {value.map((item, i) => (
            <ColorVariantCard key={i} item={item} index={i} onRemove={handleRemove} />
          ))}
        </div>
      )}

      {/* Empty state */}
      {value.length === 0 && !isAdding && (
        <div
          onClick={() => setIsAdding(true)}
          className="flex flex-col items-center justify-center gap-2 p-6 border-2 border-dashed border-[#167389]/30 rounded-2xl bg-[#167389]/5 cursor-pointer hover:bg-[#167389]/10 hover:border-[#167389]/50 transition-all"
        >
          <Palette className="w-8 h-8 text-[#167389]/50" />
          <p className="text-sm font-semibold text-[#167389]/70">No color variants yet</p>
          <p className="text-xs text-gray-400">Click to add color variants with images</p>
        </div>
      )}

      {/* Add new variant panel */}
      {isAdding && (
        <div className="border-2 border-[#167389]/30 rounded-2xl bg-gradient-to-br from-[#167389]/5 to-white p-4 space-y-4">
          <p className="text-sm font-bold text-gray-700 flex items-center gap-2">
            <Plus className="w-4 h-4 text-[#167389]" />
            New Color Variant
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Left: color name + hex */}
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Color Name *</label>
                <input
                  type="text"
                  value={draft.colorName}
                  onChange={(e) => setDraft((d) => ({ ...d, colorName: e.target.value }))}
                  placeholder="e.g. Midnight Black"
                  className="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#167389]/30 focus:border-[#167389] transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Color Hex</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={draft.colorHex}
                    onChange={(e) => setDraft((d) => ({ ...d, colorHex: e.target.value }))}
                    className="w-10 h-10 rounded-lg border border-gray-200 cursor-pointer p-0.5"
                  />
                  <input
                    type="text"
                    value={draft.colorHex}
                    onChange={(e) => setDraft((d) => ({ ...d, colorHex: e.target.value }))}
                    placeholder="#000000"
                    className="flex-1 px-3 py-2.5 text-sm font-mono rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#167389]/30 focus:border-[#167389] transition"
                  />
                </div>
              </div>

              {/* Preset colors */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-2">Quick Presets</label>
                <div className="flex flex-wrap gap-1.5">
                  {PRESET_COLORS.map((c) => (
                    <button
                      key={c.hex}
                      type="button"
                      title={c.name}
                      onClick={() => setDraft((d) => ({ ...d, colorName: c.name, colorHex: c.hex }))}
                      className="w-6 h-6 rounded-full border-2 border-white shadow hover:scale-110 transition-transform"
                      style={{ backgroundColor: c.hex, outline: draft.colorHex === c.hex ? "2px solid #167389" : "none", outlineOffset: "2px" }}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Right: image upload */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">
                Variant Image *
              </label>
              {draft.image ? (
                <div className="relative h-36 rounded-xl overflow-hidden border-2 border-[#167389]/30">
                  <Image src={draft.image} alt="variant" fill className="object-cover" sizes="200px" />
                  <button
                    type="button"
                    onClick={() => {
                      deleteFromCloudinary(draft.imageId).catch(() => {});
                      setDraft((d) => ({ ...d, image: "", imageId: "" }));
                    }}
                    className="absolute top-2 right-2 px-2 py-1 bg-red-500 text-white text-xs rounded-lg hover:bg-red-600 transition flex items-center gap-1"
                  >
                    <Trash2 className="w-3 h-3" /> Remove
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center h-36 border-2 border-dashed border-[#167389]/30 rounded-xl cursor-pointer bg-[#167389]/5 hover:bg-[#167389]/10 hover:border-[#167389]/50 transition text-[#167389]">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageUpload}
                    disabled={uploading}
                  />
                  {uploading ? (
                    <Loader2 className="w-7 h-7 animate-spin" />
                  ) : (
                    <UploadCloud className="w-7 h-7" />
                  )}
                  <span className="text-xs font-semibold mt-2">
                    {uploading ? "Uploading..." : "Click to upload image"}
                  </span>
                  <span className="text-[10px] text-gray-400 mt-0.5">PNG, JPG, WEBP</span>
                </label>
              )}
            </div>
          </div>

          {/* Preview */}
          {draft.colorName && draft.image && (
            <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-[#167389]/20">
              <div className="relative w-12 h-12 rounded-lg overflow-hidden border border-gray-100 flex-shrink-0">
                <Image src={draft.image} alt={draft.colorName} fill className="object-cover" sizes="48px" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded-full border border-white shadow-sm" style={{ backgroundColor: draft.colorHex }} />
                  <span className="text-sm font-bold text-gray-800">{draft.colorName}</span>
                </div>
                <span className="text-xs text-gray-400 font-mono">{draft.colorHex}</span>
              </div>
              <span className="ml-auto text-xs font-semibold text-green-600 bg-green-50 px-2 py-1 rounded-lg">Ready to add</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={handleCancel}
              className="flex-1 px-4 py-2.5 text-sm rounded-xl border border-gray-200 text-gray-600 font-semibold hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleAdd}
              disabled={!draft.colorName.trim() || !draft.image}
              className="flex-1 px-4 py-2.5 text-sm rounded-xl bg-[#167389] text-white font-semibold hover:bg-[#125f73] disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Variant
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
