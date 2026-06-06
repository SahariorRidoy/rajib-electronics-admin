"use client";

import { usePathname } from "next/navigation";
import Topbar from "@/components/Topbar";
import Sidebar from "@/components/Sidebar";
import Footer from "@/components/Footer";
import { useState, createContext, useContext } from "react";

const SidebarContext = createContext({ isCollapsed: false, setIsCollapsed: (_value: boolean) => {} });

export const useSidebar = () => useContext(SidebarContext);

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthRoute = pathname === "/login" || pathname === "/forgot-password" || pathname === "/reset-password";
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <SidebarContext.Provider value={{ isCollapsed, setIsCollapsed }}>
      {!isAuthRoute && <div className="print:hidden"><Sidebar /></div>}
      <div className={!isAuthRoute ? (isCollapsed ? "lg:pl-20 print:pl-0" : "lg:pl-64 print:pl-0") : ""}>
        {!isAuthRoute && <div className="print:hidden"><Topbar /></div>}
        {children}
        {!isAuthRoute && <div className="print:hidden"><Footer /></div>}
      </div>
    </SidebarContext.Provider>
  );
}
