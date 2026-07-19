"use client";

import { useEffect, useRef } from "react";
import { X, Printer } from "lucide-react";
import type { Order } from "@/types/order";

interface Props {
  orders: Order[];
  onClose: () => void;
}

const fmtDate = (iso?: string) =>
  iso
    ? new Date(iso).toLocaleDateString("en-BD", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";

export default function BulkSendPdfModal({ orders, onClose }: Props) {
  const printRef = useRef<HTMLDivElement>(null);

  // Prevent outside click — only close via button
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") e.preventDefault(); // block Escape too
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const handlePrint = () => {
    const content = printRef.current?.innerHTML;
    if (!content) return;

    const iframe = document.createElement("iframe");
    iframe.style.cssText = "position:fixed;top:-9999px;left:-9999px;width:900px;height:700px;border:none;";
    document.body.appendChild(iframe);

    const doc = iframe.contentDocument!;
    doc.open();
    doc.write(`<!DOCTYPE html>
<html>
  <head>
    <title>Steadfast Bulk Send — ${orders.length} Orders</title>
    <style>
      * { box-sizing: border-box; margin: 0; padding: 0; }
      body { font-family: Arial, sans-serif; font-size: 12px; color: #111; padding: 20px; }
      h1 { font-size: 18px; margin-bottom: 4px; }
      .meta { font-size: 11px; color: #555; margin-bottom: 20px; }
      table { width: 100%; border-collapse: collapse; margin-bottom: 28px; }
      th { background: #167389; color: #fff; padding: 7px 8px; text-align: left; font-size: 11px; }
      td { padding: 6px 8px; border-bottom: 1px solid #e5e7eb; vertical-align: top; font-size: 11px; }
      tr:nth-child(even) td { background: #f9fafb; }
      @media print { body { padding: 10px; } }
    </style>
  </head>
  <body>${content}</body>
</html>`);
    doc.close();

    iframe.onload = () => {
      iframe.contentWindow!.focus();
      iframe.contentWindow!.print();
      setTimeout(() => document.body.removeChild(iframe), 1000);
    };
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div>
            <h2 className="text-lg font-bold text-gray-900">
              ✅ Bulk Send Successful
            </h2>
            <p className="text-sm text-gray-500 mt-0.5">
              {orders.length} order{orders.length > 1 ? "s" : ""} sent to Steadfast
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#167389] text-white text-sm font-semibold hover:bg-[#125f73] transition shadow-sm"
            >
              <Printer className="w-4 h-4" />
              Print / Save PDF
            </button>
            <button
              onClick={onClose}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 text-gray-600 text-sm font-semibold hover:bg-gray-50 transition"
            >
              <X className="w-4 h-4" />
              Close
            </button>
          </div>
        </div>

        {/* Scrollable content */}
        <div className="overflow-y-auto flex-1 p-6">
          <div ref={printRef}>
            <h1 style={{ fontSize: 18, marginBottom: 4 }}>
              Steadfast Bulk Send Report
            </h1>
            <p className="meta" style={{ fontSize: 11, color: "#555", marginBottom: 20 }}>
              Generated: {fmtDate(new Date().toISOString())} &nbsp;|&nbsp; Total Orders:{" "}
              {orders.length} &nbsp;|&nbsp; Total COD: ৳
              {orders.reduce((s, o) => s + o.totals.grandTotal, 0).toLocaleString()}
            </p>

            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-[#167389] text-white">
                  <th className="p-2 text-left">#</th>
                  <th className="p-2 text-left">Order ID</th>
                  <th className="p-2 text-left">Customer</th>
                  <th className="p-2 text-left">Phone</th>
                  <th className="p-2 text-left">Address</th>
                  <th className="p-2 text-left">Products</th>
                  <th className="p-2 text-right">Subtotal</th>
                  <th className="p-2 text-right">Shipping</th>
                  <th className="p-2 text-right">COD</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o, idx) => (
                  <tr
                    key={o._id}
                    className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}
                  >
                    <td className="p-2 border-b border-gray-100 text-gray-500">
                      {idx + 1}
                    </td>
                    <td className="p-2 border-b border-gray-100 font-mono text-[#167389] font-bold text-[10px] break-all">
                      {o._id}
                    </td>
                    <td className="p-2 border-b border-gray-100 font-medium whitespace-nowrap">
                      {o.customer.name}
                    </td>
                    <td className="p-2 border-b border-gray-100 whitespace-nowrap">
                      {o.customer.phone}
                    </td>
                    <td className="p-2 border-b border-gray-100 text-gray-600 max-w-[160px]">
                      {o.customer.address ?? "—"}
                    </td>
                    <td className="p-2 border-b border-gray-100">
                      <div className="flex flex-col gap-0.5">
                        {o.lines.map((l, i) => (
                          <span key={i} className="text-gray-700">
                            {l.title}
                            {l.color ? ` (${l.color})` : ""} ×{l.qty} — ৳{l.price}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="p-2 border-b border-gray-100 text-right whitespace-nowrap">
                      ৳{o.totals.subTotal.toLocaleString()}
                    </td>
                    <td className="p-2 border-b border-gray-100 text-right whitespace-nowrap">
                      ৳{o.totals.shipping.toLocaleString()}
                    </td>
                    <td className="p-2 border-b border-gray-100 text-right font-bold text-[#167389] whitespace-nowrap">
                      ৳{o.totals.grandTotal.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-gray-100 font-bold">
                  <td colSpan={6} className="p-2 text-right text-gray-700">
                    Totals
                  </td>
                  <td className="p-2 text-right">
                    ৳{orders.reduce((s, o) => s + o.totals.subTotal, 0).toLocaleString()}
                  </td>
                  <td className="p-2 text-right">
                    ৳{orders.reduce((s, o) => s + o.totals.shipping, 0).toLocaleString()}
                  </td>
                  <td className="p-2 text-right text-[#167389]">
                    ৳{orders.reduce((s, o) => s + o.totals.grandTotal, 0).toLocaleString()}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
