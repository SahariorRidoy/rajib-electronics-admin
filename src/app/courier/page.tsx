"use client";

import { Suspense } from "react";
import Guard from "@/components/Guard";
import CourierContent from "./CourierContent";

export default function CourierPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Guard>
        <CourierContent />
      </Guard>
    </Suspense>
  );
}
