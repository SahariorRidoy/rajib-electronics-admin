"use client";

import { X, Printer } from "lucide-react";

export type PrintSize = "pos" | "a4" | "mini" | "thermal";

interface PrintSettingsProps {
  open: boolean;
  onClose: () => void;
  onPrint: (size: PrintSize) => void;
}

const PRINT_SIZES = [
  { id: "a4" as PrintSize, name: "A4 Standard", desc: "210mm × 297mm", icon: "📄" },
  { id: "pos" as PrintSize, name: "POS Receipt", desc: "80mm width", icon: "🧾" },
  { id: "mini" as PrintSize, name: "Mini Receipt", desc: "58mm width", icon: "📝" },
  { id: "thermal" as PrintSize, name: "Thermal", desc: "80mm thermal", icon: "🖨️" },
];

export default function PrintSettings({ open, onClose, onPrint }: PrintSettingsProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="w-full max-w-2xl bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl border border-pink-100 max-h-[90vh] overflow-y-auto">
        <div className="px-4 sm:px-6 pt-4 sm:pt-6 pb-3 sm:pb-4 border-b border-pink-100 flex items-start sm:items-center justify-between gap-3">
          <div className="flex-1">
            <h3 className="text-lg sm:text-xl font-bold text-gray-900 flex items-center gap-2">
              <Printer className="w-5 h-5 sm:w-6 sm:h-6 text-pink-600" />
              Select Print Size
            </h3>
            <p className="text-xs sm:text-sm text-gray-600 mt-1">Choose the invoice format for printing</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-pink-50 rounded-xl transition flex-shrink-0">
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        <div className="p-4 sm:p-6 grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          {PRINT_SIZES.map((size) => (
            <button
              key={size.id}
              onClick={() => {
                onPrint(size.id);
                onClose();
              }}
              className="group relative p-4 sm:p-6 rounded-xl border-2 border-pink-200 hover:border-pink-500 hover:bg-pink-50 active:bg-pink-100 transition text-left"
            >
              <div className="text-3xl sm:text-4xl mb-2 sm:mb-3">{size.icon}</div>
              <h4 className="text-base sm:text-lg font-bold text-gray-900 mb-1">{size.name}</h4>
              <p className="text-xs sm:text-sm text-gray-600">{size.desc}</p>
              <div className="absolute top-3 sm:top-4 right-3 sm:right-4 w-5 h-5 rounded-full border-2 border-pink-300 group-hover:border-pink-600 group-hover:bg-pink-600 transition flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-white opacity-0 group-hover:opacity-100 transition" />
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
