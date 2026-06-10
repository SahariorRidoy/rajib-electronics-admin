"use client";

import { useParams, useSearchParams } from "next/navigation";
import { useGetOrderByIdQuery } from "@/services/orders.api";
import { useGetProductByIdQuery } from "@/services/products.api";
import { Printer, ArrowLeft } from "lucide-react";
import Image from "@/lib/image";
import { formatAddress } from "@/lib/address";
import Link from "next/link";
import { useEffect, useState } from "react";
import PrintSettings, { PrintSize } from "@/components/PrintSettings";
import { getPrintStyles } from "@/components/PrintStyles";
import { useGetPublicSettingsQuery } from "@/services/settings.api";

const bnDate = (iso?: string) =>
  iso
    ? new Date(iso).toLocaleDateString("bn-BD", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";

function OrderLineItem({ line }: { line: { productId: string; qty: number; title: string; price: number; image?: string; color?: string } }) {
  const { data: productData } = useGetProductByIdQuery(line.productId);
  const product = productData?.data;

  // Prefer stored order line data; fall back to live product data
  const title = (line.title && line.title !== "Product") ? line.title : (product?.title || line.title || "Product");
  const price = line.price > 0 ? line.price : (product?.price ?? 0);
  const image = line.image || product?.images?.[0] || product?.image;

  return (
    <tr className="border-b border-gray-200 print-table-row">
      <td className="py-2 px-2 print-table-cell">
        <div className="flex items-center gap-2">
          {image && (
            <Image src={image} alt={title} width={40} height={40} className="w-10 h-10 rounded object-cover print-item-image" />
          )}
          <div>
            <span className="text-sm print-item-name">{title}</span>
            {line.color && (
              <span className="text-xs text-gray-500 print-item-color"> · Color: {line.color}</span>
            )}
          </div>
        </div>
      </td>
      <td className="py-2 px-2 text-center text-sm print-table-cell">{line.qty}</td>
      <td className="py-2 px-2 text-right text-sm print-table-cell">৳{price}</td>
      <td className="py-2 px-2 text-right text-sm font-semibold print-table-cell">৳{price * line.qty}</td>
    </tr>
  );
}

export default function InvoicePage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const orderId = params.id as string;
  const autoPrint = searchParams.get("print") === "true";
  const sizeParam = searchParams.get("size") as PrintSize | null;

  const { data, isLoading, isError, error, refetch } = useGetOrderByIdQuery(orderId);
  const order = data?.data;

  const [showPrintSettings, setShowPrintSettings] = useState(false);
  const [printSize, setPrintSize] = useState<PrintSize>(sizeParam || "a4");
  const { data: settings } = useGetPublicSettingsQuery();
  const brand = settings?.siteName ?? "Rajib Electronics";
  const activeLogo = settings?.logos.find((l) => l.isActive);

  useEffect(() => {
    if (sizeParam) {
      setPrintSize(sizeParam);
    }
  }, [sizeParam]);

  useEffect(() => {
    if (autoPrint && order) {
      setTimeout(() => window.print(), 500);
    }
  }, [autoPrint, order]);

  const handlePrint = (size: PrintSize) => {
    setPrintSize(size);
    setTimeout(() => window.print(), 100);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-pink-200 border-t-pink-600 rounded-full" />
      </div>
    );
  }

  if (isError || !order) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const errMsg = (error as any)?.data?.message || (error as any)?.status || "Order not found";
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-red-600 font-semibold">{errMsg}</p>
        <p className="text-xs text-gray-400">Order ID: {orderId}</p>
        <div className="flex gap-3">
          <button
            onClick={() => refetch()}
            className="px-4 py-2 rounded-lg bg-[#167389] text-white text-sm hover:bg-[#125f73] transition"
          >
            Retry
          </button>
          <Link href="/orders" className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 text-sm hover:bg-gray-200 transition">
            Back to Orders
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: getPrintStyles(printSize) }} />
      
      <PrintSettings
        open={showPrintSettings}
        onClose={() => setShowPrintSettings(false)}
        onPrint={handlePrint}
      />
      
      <div className="min-h-screen bg-gray-50 py-8 print:bg-white print:py-0">
        <div className="max-w-4xl mx-auto bg-white shadow-lg print:shadow-none mt-16 print-container">
        {/* Action Buttons */}
        <div className="p-4 border-b print:hidden print-hide flex gap-2">

          <Link
            href="/orders"
            className="flex items-center gap-2 px-2  bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            All Orders
          </Link>
          <Link
            href="/dashboard"
            className="flex items-center gap-2 px-2 bg-gray-100 text-gray-700 border border-teal-800 p-1 rounded-xl hover:bg-gray-200 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Dashboard
          </Link>
          <button
            onClick={() => setShowPrintSettings(true)}
            className="flex items-center gap-2 px-4 bg-[#167389] text-white rounded-lg hover:bg-pink-700 transition"
          >
            <Printer className="w-4 h-4" />
            Print Invoice
          </button>
        </div>

        {/* Invoice Content */}
        <div className="p-8 print-content">
          {/* Header */}
          <div className="flex items-center justify-between border-b-2 border-[#167389] pb-4 mb-6 print-header">
            <div className="flex items-center gap-4">
              <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-white shadow-md flex items-center justify-center print-logo">
                <Image
                  src={activeLogo?.logoUrl || "/logo-amar-shop.jpg"}
                  alt="Logo"
                  width={64}
                  height={64}
                  className="object-contain"
                  priority
                />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-[#167389] print-brand">
                  {brand}
                </h1>
                <p className="text-sm text-gray-600 print-invoice-label">INVOICE</p>
              </div>
            </div>
            <div className="text-right text-xs text-gray-500 print-order-info">
              <p className="font-semibold">Order ID: {order._id}</p>
              <p>Date: {bnDate(order.createdAt)}</p>
            </div>
          </div>

          {/* Customer Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6 print-customer-grid">
            <div>
              <h3 className="text-sm font-bold text-gray-800 mb-2 print-section-title">Customer Info:</h3>
              <div className="print-section-content">
                <p className="text-sm text-gray-700">{order.customer.name}</p>
                <p className="text-sm text-gray-600">{order.customer.phone}</p>
                <p className="text-sm text-gray-600">
                  {formatAddress(order.customer.address) || "N/A"}
                </p>
              </div>
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-800 mb-2 print-section-title">Status:</h3>
              <span className="inline-block px-3 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-700 print-status">
                {order.status}
              </span>
            </div>
          </div>

          {/* Items Table */}
          <div>
            <table className="w-full print-table">
              <thead className="bg-gray-100 border-b-2 border-gray-300 print-table-header">
                <tr>
                  <th className="py-2 px-2 text-left text-xs font-bold text-gray-700">Item</th>
                  <th className="py-2 px-2 text-center text-xs font-bold text-gray-700">Qty</th>
                  <th className="py-2 px-2 text-right text-xs font-bold text-gray-700">Price</th>
                  <th className="py-2 px-2 text-right text-xs font-bold text-gray-700">Total</th>
                </tr>
              </thead>
              <tbody>
                {order.lines.map((line, idx) => (
                  <OrderLineItem key={idx} line={line} />
                ))}
              </tbody>
            </table>
          </div>

          {/* Footer & Totals */}
          <div className="pt-4 print-totals-section">
            {/* Totals Section */}
            <div className="w-full print-totals-right">
              <div className="flex justify-between text-sm print-total-row">
                <span className="text-gray-600">Subtotal:</span>
                <span className="font-semibold">৳{order.totals.subTotal}</span>
              </div>
              <div className="flex justify-between text-sm print-total-row">
                <span className="text-gray-600">Shipping:</span>
                <span className="font-semibold">৳{order.totals.shipping}</span>
              </div>
              <div className="flex justify-between text-lg font-bold border-t pt-2 print-grand-total">
                <span>Grand Total:</span>
                <span className="text-[#167389]">৳{order.totals.grandTotal}</span>
              </div>
            </div>
            
            {/* Footer Section */}
            <div className="w-full print-footer-left">
              <p className="text-sm text-gray-600 print-thank-you">Thank you for your order!</p>
              <p className="text-sm text-gray-500 mt-1 print-contact">
                Contact: {process.env.NEXT_PUBLIC_HOTLINE || "01700000000"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
    </>
  );
}
