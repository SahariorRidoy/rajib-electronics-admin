"use client";

import { logout } from "@/features/auth/auth.slice";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { useSidebar } from "@/components/AppShell";
import clsx from "clsx";
import {
  ClipboardList,
  FolderTree,
  LayoutDashboard,
  LogOut,
  Package,
  Image as ImageIcon,
  Truck,
  ChevronLeft,
  ChevronRight,
  Layers,
  PackageSearch,
  Tag,
  DollarSign,
  Users,
  PackageX,
  KeyRound,
  Settings,
  SendHorizonal,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import NotificationSidebarLink from "@/components/NotificationSidebarLink";
import { useGetPublicSettingsQuery } from "@/services/settings.api";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/orders", label: "Orders", icon: ClipboardList },
  { href: "/customers", label: "Customers", icon: Users },
  { href: "/products", label: "All Products", icon: Package },
  { href: "/inventory", label: "Stock Management", icon: PackageSearch },
  { href: "/categories", label: "All Categories", icon: FolderTree },
  { href: "/subcategories", label: "Subcategories", icon: Layers },
  { href: "/brands", label: "Brands Manufactures", icon: Tag },
  { href: "/returns", label: "Order Returns", icon: PackageX },
  { href: "/revenue", label: "Revenue", icon: DollarSign },
  { href: "/users", label: "All Users", icon: Users },
  { href: "/banners", label: "Home Banners", icon: ImageIcon },
  { href: "/courier", label: "Courier", icon: SendHorizonal },
  { href: "/delivery-settings", label: "Delivery Charge", icon: Truck },
  { href: "/site-settings", label: "Site Settings", icon: Settings },
  { href: "/change-password", label: "Change Password", icon: KeyRound },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const token = useAppSelector((s) => s.auth.token);
  const { isCollapsed, setIsCollapsed } = useSidebar();
  const { data: settings } = useGetPublicSettingsQuery();
  const activeLogo = settings?.logos.find((l) => l.isActive);
  const brand = settings?.siteName ?? "Rajib Electronics";

  const handleLogout = () => {
    dispatch(logout());
    router.push("/login");
  };

  return (
    <aside className={clsx(
      "hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 lg:bg-white lg:border-r lg:border-gray-200 lg:shadow-sm transition-all duration-300",
      isCollapsed ? "lg:w-20" : "lg:w-64"
    )}>
      <div className="flex flex-col h-full">
        {/* Logo */}
        <Link href="/dashboard" className="flex items-center gap-3 px-4 py-5 border-b border-gray-200 hover:bg-gray-50 transition-colors">
          <div className="relative w-10 h-10 rounded-xl overflow-hidden bg-white shadow-md flex items-center justify-center flex-shrink-0">
            <Image
              src={activeLogo?.logoUrl || "/logo-amar-shop.jpg"}
              alt="Logo"
              fill
              sizes="40px"
              className="object-contain"
              priority
            />
          </div>
          {!isCollapsed && <span className="text-lg font-bold text-[#167389] truncate">{brand}</span>}
        </Link>

        {/* Toggle Button */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="mx-4 mt-4 p-2 rounded-lg hover:bg-gray-100 transition-all flex items-center justify-center"
        >
          {isCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
        </button>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
          {NAV.map((n) => {
            const Icon = n.icon;
            const isActive = pathname === n.href;

            return (
              <Link
                key={n.href}
                href={n.href}
                title={isCollapsed ? n.label : ""}
                className={clsx(
                  "flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all",
                  isActive
                    ? "bg-[#167389] text-white shadow-md"
                    : "text-gray-700 hover:bg-gray-100",
                  isCollapsed && "justify-center"
                )}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {!isCollapsed && <span>{n.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        {token && (
          <div className="px-4 py-4 border-t border-gray-200 space-y-1">
            <NotificationSidebarLink isCollapsed={isCollapsed} />
            <button
              onClick={handleLogout}
              title={isCollapsed ? "Logout" : ""}
              className={clsx(
                "w-full flex items-center gap-3 px-4 py-3 bg-red-50 border border-red-200 text-red-600 font-medium rounded-xl hover:bg-red-100 transition-all",
                isCollapsed && "justify-center"
              )}
            >
              <LogOut className="w-5 h-5 flex-shrink-0" />
              {!isCollapsed && <span>Logout</span>}
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
