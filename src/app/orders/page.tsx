"use client";

import { Suspense } from "react";
import Guard from "@/components/Guard";
import OrdersContent from "./OrdersContent";

export default function OrdersPage() {
  return (
    <Suspense fallback={<div>Loading orders...</div>}>
      <Guard>
        <OrdersContent />
      </Guard>
    </Suspense>
  );
}
