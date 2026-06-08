"use client";

import { useState } from "react";
import {
  Package,
  ShoppingCart,
  Users,
  TrendingUp,
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  ArrowRight,
  Layers,
  Archive,
  PackageX,
} from "lucide-react";
import { useListOrdersQuery } from "@/services/orders.api";
import { useListProductsQuery } from "@/services/products.api";
import { useListCategoriesQuery } from "@/services/categories.api";
import Image from "@/lib/image";
import Link from "next/link";

export default function DashboardPage() {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  
  const { data: ordersData } = useListOrdersQuery({ limit: 5 });
  const { data: allOrdersData } = useListOrdersQuery({ 
    limit: 50000,
    startDate: startDate || undefined,
    endDate: endDate || undefined,
  });
  const { data: productsData } = useListProductsQuery({
    startDate: startDate || undefined,
    endDate: endDate || undefined,
  });
  const { data: allProductsData } = useListProductsQuery({ limit: 50000 } as Parameters<typeof useListProductsQuery>[0]);
  const { data: categoriesData } = useListCategoriesQuery();

  const orders = ordersData?.data?.items || [];
  const allOrders = allOrdersData?.data?.items || [];
  const products = productsData?.data?.items || [];

  // Build productId -> buyingPrice map for profit calculation
  const productBuyingPriceMap = new Map<string, number>();
  (allProductsData?.data?.items || allProductsData?.data || []).forEach((p: Record<string, unknown>) => {
    if (p._id) productBuyingPriceMap.set(String(p._id), Number(p.buyingPrice ?? 0));
  });

  const totalOrders = ordersData?.data?.total || 0;
  const totalProducts = productsData?.data?.total || products.length;
  const totalCategories = categoriesData?.data?.length || 0;
  const totalRevenue = allOrders.reduce((sum, o) => sum + (o.totals?.grandTotal || 0), 0);
  const totalProfit = allOrders.reduce((sum, o) => {
    const orderProfit = (o.lines || []).reduce((ls, line) => {
      const buyingPrice = productBuyingPriceMap.get(String(line.productId)) ?? 0;
      return ls + (line.price - buyingPrice) * (line.qty || 1);
    }, 0);
    return sum + orderProfit;
  }, 0);
  
  const customerMap = new Map();
  allOrders.forEach(order => {
    const identifier = order.customer?.email || order.customer?.phone || order.customer?.name || `guest-${order._id}`;
    if (identifier && !customerMap.has(identifier)) {
      customerMap.set(identifier, true);
    }
  });
  const uniqueCustomers = customerMap.size;

  const recentOrders = orders.slice(0, 5).map(o => ({
    id: o._id,
    displayId: `#${o._id.slice(-6).toUpperCase()}`,
    customer: o.customer?.name || "Guest",
    amount: `৳${(o.totals?.grandTotal || 0).toLocaleString()}`,
    status: o.status,
    time: o.createdAt ? new Date(o.createdAt).toLocaleDateString() : "N/A",
  }));

  const topProducts = products.slice(0, 4).map((p: Record<string, unknown>) => ({
    id: p._id as string,
    name: (p.title as string) || "Untitled",
    sold: (p.stock as number) || 0,
    revenue: `৳${(((p.price as number) || 0) * ((p.stock as number) || 0)).toLocaleString()}`,
    image: (p.image as string) || "📦",
  }));

  const getStatusBadge = (status: string) => {
    const styles: Record<string, { bg: string; text: string; icon: React.ComponentType<{ className?: string }> }> = {
      pending: { bg: "bg-amber-100", text: "text-amber-700", icon: Clock },
      processing: { bg: "bg-blue-100", text: "text-blue-700", icon: AlertCircle },
      delivered: { bg: "bg-emerald-100", text: "text-emerald-700", icon: CheckCircle },
      cancelled: { bg: "bg-red-100", text: "text-red-700", icon: XCircle },
    };

    const normalizedStatus = status?.toLowerCase() || "pending";
    const style = styles[normalizedStatus] || styles.pending;
    const Icon = style.icon;
    const label = normalizedStatus.charAt(0).toUpperCase() + normalizedStatus.slice(1);

    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${style.bg} ${style.text}`}>
        <Icon className="w-3.5 h-3.5" />
        {label}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-rose-50 to-purple-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 mt-6">
        {/* Page Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#167389] to-[#167389] mt-16 mb-2">
            Dashboard Overview
          </h1>
          <p className="text-sm sm:text-base text-gray-600">
            Welcome back! Here is what is happening with Store
          </p>
          <div className="flex flex-wrap gap-2 mt-3">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-3 py-1.5 text-sm rounded-lg border border-pink-200 focus:outline-none focus:ring-1 focus:ring-pink-300 focus:border-pink-400 transition"
            />
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-3 py-1.5 text-sm rounded-lg border border-pink-200 focus:outline-none focus:ring-1 focus:ring-pink-300 focus:border-pink-400 transition"
            />
            <button
              onClick={() => {
                const today = new Date().toISOString().split('T')[0];
                setStartDate(today);
                setEndDate(today);
              }}
              className="px-3 py-1.5 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
            >
              Today
            </button>
            <button
              onClick={() => {
                setStartDate('');
                setEndDate('');
              }}
              className="px-3 py-1.5 text-sm bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition"
            >
              Clear
            </button>
          </div>
        </div>

        {/* Quick Links */}
        <div className="mb-6 sm:mb-8">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4">Quick Links</h2>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            <Link href="/revenue" className="group bg-white rounded-xl shadow-md hover:shadow-lg transition-all p-4 border border-gray-100 hover:border-emerald-300">
              <div className="flex items-center justify-between mb-3">
                <DollarSign className="w-8 h-8 text-emerald-600" />
                <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-emerald-600 group-hover:translate-x-1 transition-all" />
              </div>
              <h3 className="font-medium text-gray-800 mb-1 text-sm">Total Revenue</h3>
              <p className="text-lg font-bold text-emerald-600">৳{totalRevenue.toLocaleString()}</p>
            </Link>

            <Link href="/revenue" className="group bg-white rounded-xl shadow-md hover:shadow-lg transition-all p-4 border border-gray-100 hover:border-violet-300">
              <div className="flex items-center justify-between mb-3">
                <TrendingUp className="w-8 h-8 text-violet-600" />
                <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-violet-600 group-hover:translate-x-1 transition-all" />
              </div>
              <h3 className="font-medium text-gray-800 mb-1 text-sm">Total Profit</h3>
              <p className={`text-lg font-bold ${totalProfit >= 0 ? "text-violet-600" : "text-red-600"}`}>৳{totalProfit.toLocaleString()}</p>
            </Link>

            <Link href="/products" className="group bg-white rounded-xl shadow-md hover:shadow-lg transition-all p-4 border border-gray-100 hover:border-pink-300">
              <div className="flex items-center justify-between mb-3">
                <Package className="w-8 h-8 text-pink-600" />
                <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-pink-600 group-hover:translate-x-1 transition-all" />
              </div>
              <h3 className="font-medium text-gray-800 mb-1 text-sm">All Products</h3>
              <p className="text-lg font-bold text-pink-600">{totalProducts}</p>
            </Link>

            <Link href="/orders" className="group bg-white rounded-xl shadow-md hover:shadow-lg transition-all p-4 border border-gray-100 hover:border-purple-300">
              <div className="flex items-center justify-between mb-3">
                <ShoppingCart className="w-8 h-8 text-purple-600" />
                <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-purple-600 group-hover:translate-x-1 transition-all" />
              </div>
              <h3 className="font-medium text-gray-800 mb-1 text-sm">Orders</h3>
              <p className="text-lg font-bold text-purple-600">{totalOrders}</p>
            </Link>

            <Link href="/inventory" className="group bg-white rounded-xl shadow-md hover:shadow-lg transition-all p-4 border border-gray-100 hover:border-rose-300">
              <div className="flex items-center justify-between mb-3">
                <Archive className="w-8 h-8 text-rose-600" />
                <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-rose-600 group-hover:translate-x-1 transition-all" />
              </div>
              <h3 className="font-medium text-gray-800 mb-1 text-sm">Stock Manage</h3>
              <p className="text-lg font-bold text-rose-600">{totalProducts}</p>
            </Link>

            <Link href="/categories" className="group bg-white rounded-xl shadow-md hover:shadow-lg transition-all p-4 border border-gray-100 hover:border-indigo-300">
              <div className="flex items-center justify-between mb-3">
                <Layers className="w-8 h-8 text-indigo-600" />
                <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
              </div>
              <h3 className="font-medium text-gray-800 mb-1 text-sm">Categories</h3>
              <p className="text-lg font-bold text-indigo-600">{totalCategories}</p>
            </Link>

            <Link href="/customers" className="group bg-white rounded-xl shadow-md hover:shadow-lg transition-all p-4 border border-gray-100 hover:border-blue-300">
              <div className="flex items-center justify-between mb-3">
                <Users className="w-8 h-8 text-blue-600" />
                <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
              </div>
              <h3 className="font-medium text-gray-800 mb-1 text-sm">Total Customers</h3>
              <p className="text-lg font-bold text-blue-600">{uniqueCustomers}</p>
            </Link>

            <Link href="/returns" className="group bg-white rounded-xl shadow-md hover:shadow-lg transition-all p-4 border border-gray-100 hover:border-orange-300">
              <div className="flex items-center justify-between mb-3">
                <PackageX className="w-8 h-8 text-orange-600" />
                <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-orange-600 group-hover:translate-x-1 transition-all" />
              </div>
              <h3 className="font-medium text-gray-800 mb-1 text-sm">Order Returns</h3>
              <p className="text-lg font-bold text-orange-600">View All</p>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Recent Orders */}
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-lg p-5 sm:p-6">
            <div className="flex items-center justify-between mb-5 sm:mb-6">
              <h2 className="text-lg sm:text-xl font-bold text-gray-800 flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 sm:w-6 sm:h-6 text-pink-600" />
                <span className="hidden sm:inline">Recent Orders</span>
                <span className="sm:hidden">Orders</span>
              </h2>
              <Link href="/orders" className="text-xs sm:text-sm text-pink-600 hover:text-pink-700 font-semibold hover:underline">
                View All
              </Link>
            </div>

            <div className="space-y-3 sm:space-y-4">
              {recentOrders.map((order) => (
                <Link
                  key={order.id}
                  href={`/orders/${order.id}/invoice`}
                  className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 sm:p-4 bg-gradient-to-r from-pink-50 to-purple-50 rounded-xl hover:shadow-md transition-all duration-200 border border-pink-100 cursor-pointer"
                >
                  <div className="flex-1 w-full sm:w-auto mb-3 sm:mb-0">
                    <div className="flex items-center gap-2 sm:gap-3 mb-2 flex-wrap">
                      <span className="font-bold text-gray-800 text-sm sm:text-base">
                        {order.displayId}
                      </span>
                      {getStatusBadge(order.status)}
                    </div>
                    <p className="text-xs sm:text-sm text-gray-600">
                      {order.customer}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">{order.time}</p>
                  </div>
                  <div className="text-left sm:text-right w-full sm:w-auto">
                    <p className="text-lg sm:text-xl font-bold text-pink-600">
                      {order.amount}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Top Products */}
          <div className="bg-white rounded-2xl shadow-lg p-5 sm:p-6">
            <div className="flex items-center justify-between mb-5 sm:mb-6">
              <h2 className="text-lg sm:text-xl font-bold text-gray-800 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-pink-600" />
                <span className="hidden sm:inline">Top Products</span>
                <span className="sm:hidden">Top</span>
              </h2>
              <Link href="/products" className="text-xs sm:text-sm text-pink-600 hover:text-pink-700 font-semibold hover:underline">
                View All
              </Link>
            </div>

            <div className="space-y-3 sm:space-y-4">
              {topProducts.map((product: { id: string; name: string; sold: number; revenue: string; image: string }) => (
                <Link
                  key={product.id}
                  href={`/products/${product.id}/inventory`}
                  className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-gradient-to-r from-pink-50 to-purple-50 rounded-xl hover:shadow-md transition-all duration-200 border border-pink-100 cursor-pointer"
                >
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white rounded-xl flex items-center justify-center text-xl sm:text-2xl shadow-sm flex-shrink-0 overflow-hidden">
                    {typeof product.image === 'string' && product.image.startsWith('http') ? (
                      <Image src={product.image} alt={product.name} width={48} height={48} className="w-full h-full object-cover" />
                    ) : (
                      <span>{product.image}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-800 text-xs sm:text-sm mb-1 truncate">
                      {product.name}
                    </h3>
                    <p className="text-xs text-gray-500">
                      Stock: {product.sold}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs sm:text-sm font-bold text-pink-600">
                      {product.revenue}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
