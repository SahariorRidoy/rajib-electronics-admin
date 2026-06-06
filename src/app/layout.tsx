import { Suspense } from "react";
import "./globals.css"; 
import Providers from "./providers";
import AppShell from "@/components/AppShell";
import BackToTop from "@/components/BackToTop";
import { Outfit } from "next/font/google";
import Guard from "@/components/Guard";
import { Toaster } from "react-hot-toast";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
});

export const metadata = {
  title: "Rajib Electronics Admin",
  description: "Admin panel for Rajib Electronics",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={outfit.variable}>
      <body className="font-sans">
        <Suspense fallback={<div>Loading...</div>}>
          <Guard>
            <Providers>
              <AppShell>{children}</AppShell>
              <BackToTop />
              <Toaster position="top-right" />
            </Providers>
          </Guard>
        </Suspense>
      </body>
    </html>
  );
}
