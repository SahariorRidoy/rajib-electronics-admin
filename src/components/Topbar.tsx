// components/Topbar.tsx
"use client";

import { logout } from "@/features/auth/auth.slice";
import { useListCategoriesQuery } from "@/services/categories.api";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import clsx from "clsx";
import {
  ClipboardList,
  FolderTree,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  Search,
  X,
  Image as ImageIcon,
  Truck,
  Layers,
  PackageSearch,
  Tag,
  DollarSign,
  Users,
  PackageX,
  Bell,
  KeyRound,
  Settings,
  SendHorizonal,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import NotificationDropdown from "@/components/NotificationDropdown";
import { useGetPublicSettingsQuery } from "@/services/settings.api";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/orders", label: "Orders", icon: ClipboardList },
  { href: "/returns", label: "Order Returns", icon: PackageX },
  { href: "/revenue", label: "Revenue", icon: DollarSign },
  { href: "/customers", label: "Customers", icon: Users },
  { href: "/products", label: "All Products", icon: Package },
  { href: "/inventory", label: "Stock Management", icon: PackageSearch },
  { href: "/categories", label: "Categories", icon: FolderTree },
  { href: "/subcategories", label: "Subcategories", icon: Layers },
  { href: "/brands", label: "Brands", icon: Tag },
  { href: "/banners", label: "Home Banners", icon: ImageIcon },
  { href: "/courier", label: "Courier", icon: SendHorizonal },
  { href: "/delivery-settings", label: "Delivery Charge", icon: Truck },
  { href: "/site-settings", label: "Site Settings", icon: Settings },
  { href: "/notifications", label: "Notifications", icon: Bell },
  { href: "/change-password", label: "Change Password", icon: KeyRound },
];

export default function Topbar() {
  const pathname = usePathname();
  const router = useRouter();
  const sp = useSearchParams();
  const dispatch = useAppDispatch();
  const token = useAppSelector((s) => s.auth.token);

  const [q, setQ] = useState<string>(sp.get("q") ?? "");
  const [cat, setCat] = useState<string>(sp.get("category") ?? "");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const { data, isLoading } = useListCategoriesQuery();
  const cats = data?.data ?? [];

  const { data: settings } = useGetPublicSettingsQuery();
  const activeLogo = settings?.logos.find((l) => l.isActive);
  const brand = settings?.siteName ?? "Rajib Electronics";

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (q.trim()) params.set("q", q.trim());
    if (cat) params.set("category", cat);
    router.push(`/products${params.toString() ? `?${params.toString()}` : ""}`);
  };

  const onClear = () => {
    setQ("");
    setCat("");
    router.push("/products");
  };

  const handleLogout = () => {
    dispatch(logout());
    router.push("/login");
    setShowLogoutModal(false);
  };

  const showLogout = () => setShowLogoutModal(true);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[#167389] backdrop-blur-md border-b border-pink-100 shadow-sm">
      {/* Desktop Logo Area - Left Side */}
      <div className="hidden lg:block fixed top-0 left-0 w-64 h-16 bg-[#167389] border-r border-pink-100 z-50">
        <Link
          href="/dashboard"
          className="flex items-center gap-3 px-4 py-4 h-full group"
          aria-label="Go to dashboard"
        >
          <div className="relative w-10 h-10 rounded-xl overflow-hidden bg-white shadow-md flex items-center justify-center">
            <Image
              src={activeLogo?.logoUrl || "/logo-amar-shop.jpg"}
              alt={brand}
              fill
              sizes="40px"
              className="object-contain"
              priority
            />
          </div>
          <div className="text-lg font-bold text-white tracking-wide">
            {brand}
          </div>
        </Link>
      </div>

      <div className="lg:ml-64">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Main Header */}
          <div className="flex items-center gap-4 py-4">
            {/* Logo & Brand - Mobile Only */}
            <Link
              href="/dashboard"
              className="flex lg:hidden items-center gap-2 shrink-0 group"
              aria-label="Go to dashboard"
            >
              <div className="relative w-10 h-10 sm:w-11 sm:h-11 rounded-xl overflow-hidden bg-white shadow-md flex items-center justify-center">
                <Image
                  src={activeLogo?.logoUrl || "/logo-amar-shop.jpg"}
                  alt={brand}
                  fill
                  sizes="(max-width:768px) 36px, 48px"
                  className="object-contain"
                  priority
                />
              </div>
              <div className="hidden sm:block lg:hidden text-lg font-bold text-white tracking-wide">
                {brand}
              </div>
            </Link>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-white hover:bg-white/10 rounded-xl transition-all"
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>

            {/* Search Bar */}
            <form
              onSubmit={onSearch}
              className="hidden md:flex items-center gap-2 ml-auto flex-1 max-w-2xl"
            >
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-pink-500" />
                <input
                  placeholder="Search products..."
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border-2 border-pink-200 rounded-xl focus:outline-none focus:border-pink-500 focus:ring-4 focus:ring-pink-100 transition-all bg-white/50 placeholder:text-gray-500"
                />
              </div>
              <button
                type="submit"
                className="px-5 py-2.5 bg-white text-[#167389] font-medium rounded-xl hover:bg-gray-50 transition-all shadow-md whitespace-nowrap"
              >
                Search
              </button>
              {(q || cat) && (
                <button
                  type="button"
                  onClick={onClear}
                  className="px-4 py-2.5 border-2 border-pink-200 text-white font-medium rounded-xl hover:bg-white/10 transition-all whitespace-nowrap"
                >
                  Clear
                </button>
              )}
            </form>

            {/* Category Dropdown */}
            <select
              value={cat}
              onChange={(e) => {
                setCat(e.target.value);
                const params = new URLSearchParams();
                if (q.trim()) params.set("q", q.trim());
                if (e.target.value) params.set("category", e.target.value);
                router.push(`/products${params.toString() ? `?${params.toString()}` : ""}`);
              }}
              disabled={isLoading}
              className="hidden md:block px-4 py-2.5 border-2 border-pink-200 rounded-xl bg-white text-[#167389] font-medium shadow-sm hover:shadow-md transition-all text-sm"
              style={{
                WebkitAppearance: "menulist",
                color: "#167389",
              }}
            >
              <option value="" className="text-[#167389] bg-white font-medium">
                {isLoading ? "Loading..." : "All categories"}
              </option>
              {cats.map((c) => (
                <option
                  key={c._id}
                  value={c.slug}
                  className="text-[#167389] bg-white font-medium"
                  style={{
                    backgroundColor: "white",
                    color: "#167389",
                  }}
                >
                  {c?.title}
                </option>
              ))}
            </select>

            {/* Right Actions */}
            <div className="hidden sm:flex lg:hidden items-center gap-2">
              {/* <a
                title="Call us"
                href={`tel:${hotline}`}
                className="flex items-center gap-2 px-4 py-2.5 bg-white border-2 border-pink-200 text-pink-700 font-medium rounded-xl hover:bg-gray-50 transition-all"
              >
                <Phone className="w-4 h-4" />
                <span className="text-sm">{hotline}</span>
              </a> */}
              {token && (
                <button
                  onClick={showLogout}
                  className="flex items-center gap-2 px-4 py-2.5 bg-red-50 border-2 border-red-200 text-red-600 font-medium rounded-xl hover:bg-red-100 transition-all"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="text-sm">Logout</span>
                </button>
              )}
            </div>

            {/* Mobile Right Actions */}
            <div className="flex sm:hidden items-center gap-1 ml-auto">
              <NotificationDropdown />
              <Link href="/orders" className="flex items-center gap-1 px-2 py-1.5 bg-blue-50 border border-blue-200 text-blue-600 rounded-lg hover:bg-blue-100 transition-all text-xs" title="Orders">
                <ClipboardList className="w-3 h-3" />
                <span>Orders</span>
              </Link>
              <Link href="/products" className="flex items-center gap-1 px-2 py-1.5 bg-green-50 border border-green-200 text-green-600 rounded-lg hover:bg-green-100 transition-all text-xs" title="Products">
                <Package className="w-3 h-3" />
                <span>Products</span>
              </Link>
              {token && (
                <button
                  onClick={showLogout}
                  className="p-2 bg-red-50 border border-red-200 text-red-600 rounded-lg hover:bg-red-100 transition-all"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Desktop Hotline & Logout */}
            <div className="hidden lg:flex items-center gap-2">
              <NotificationDropdown />
              {/* <a
                title="Call us"
                href={`tel:${hotline}`}
                className="flex items-center gap-2 px-4 py-2.5 bg-white border-2 border-pink-200 text-pink-700 font-medium rounded-xl hover:bg-gray-50 transition-all"
              >
                <Phone className="w-4 h-4" />
                <span className="text-sm">{hotline}</span>
              </a> */}
              {token && (
                <button
                  onClick={showLogout}
                  className="flex items-center gap-2 px-4 py-2.5 bg-red-50 border-2 border-red-200 text-red-600 font-medium rounded-xl hover:bg-red-100 transition-all"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="text-sm">Logout</span>
                </button>
              )}
            </div>
          </div>

          {/* Mobile Search */}
          <div className="hidden md:hidden pb-4">
            <form onSubmit={onSearch} className="space-y-2">
              <div className="relative">
                <input
                  placeholder="Search products..."
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border-2 border-pink-200 rounded-xl focus:outline-none focus:border-pink-500 focus:ring-4 focus:ring-pink-100 transition-all bg-white/50 placeholder:text-gray-500"
                />
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-pink-500" />
              </div>
              <div className="flex gap-2">
                <select
                  value={cat}
                  onChange={(e) => setCat(e.target.value)}
                  disabled={isLoading}
                  className="w-full px-4 py-3.5 border border-pink-200 rounded-xl focus:ring-2 focus:ring-pink-300 focus:border-pink-400 bg-white text-[#167389] font-medium shadow-sm transition-all text-base relative z-[50]"
                  style={{
                    WebkitAppearance: "menulist",
                    color: "#167389",
                  }}
                >
                  <option
                    value=""
                    className="text-[#167389] bg-white font-medium"
                  >
                    {isLoading ? "Loading..." : "All categories"}
                  </option>
                  {cats.map((c) => (
                    <option
                      key={c._id}
                      value={c.slug}
                      className="bg-white text-[#167389] font-medium"
                      style={{
                        backgroundColor: "white",
                        color: "#167389",
                      }}
                    >
                      {c.name}
                    </option>
                  ))}
                </select>

                <button
                  type="submit"
                  className="px-5 py-2.5 bg-gradient-to-r from-pink-500 to-rose-600 text-white font-medium rounded-xl shadow-md"
                >
                  Search
                </button>
              </div>
              {(q || cat) && (
                <button
                  type="button"
                  onClick={onClear}
                  className="w-full px-4 py-2.5 border-2 border-pink-200 text-pink-700 font-medium rounded-xl hover:bg-pink-50 transition-all"
                >
                  Clear Filters
                </button>
              )}
            </form>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-pink-100 bg-white max-h-[90vh] overflow-y-auto">
          <div className="max-w-7xl mx-auto px-4 py-4 space-y-2">
            
            {NAV.map((n) => {
              const Icon = n.icon;
              const isActive = pathname === n.href;

              return (
                <Link
                  key={n.href}
                  href={n.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={clsx(
                    "flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all",
                    isActive
                      ? "bg-gradient-to-r from-pink-500 to-rose-600 text-white shadow-md"
                      : "text-gray-700 hover:bg-pink-50 hover:text-pink-700"
                  )}
                >
                  <Icon className="w-5 h-5" />
                  <span>{n.label}</span>
                </Link>
              );
            })}

            <div className="pt-2 mt-2 border-t border-pink-100 space-y-2">
              {/* <a
                href={`tel:${hotline}`}
                className="flex items-center gap-3 px-4 py-3 border-2 border-pink-200 text-pink-700 font-medium rounded-xl hover:bg-pink-50 transition-all"
              >
                <Phone className="w-5 h-5" />
                <span>{hotline}</span>
              </a> */}
              {token && (
                <button
                  onClick={showLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 bg-red-50 border-2 border-red-200 text-red-600 font-medium rounded-xl hover:bg-red-100 transition-all"
                >
                  <LogOut className="w-5 h-5" />
                  <span>Logout</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="w-full max-w-sm mx-auto bg-white rounded-3xl border border-pink-200 shadow-2xl mt-32">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-800">Confirm Logout</h3>
              <p className="text-sm text-gray-600 mt-1">Are you sure you want to logout?</p>
            </div>
            <div className="flex gap-3 p-6 pt-0">
              <button 
                onClick={() => setShowLogoutModal(false)} 
                className="flex-1 px-5 py-2.5 rounded-xl border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button 
                onClick={handleLogout} 
                className="flex-1 px-5 py-2.5 rounded-xl bg-red-600 text-white font-semibold hover:bg-red-700 transition"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}