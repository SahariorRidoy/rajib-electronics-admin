"use client";

import { useState, useEffect } from "react";
import { useListOrdersQuery } from "@/services/orders.api";
import { useListProductsQuery } from "@/services/products.api";
import { DollarSign, TrendingUp, Calendar, ShoppingBag, ArrowLeft, Filter, X, TrendingDown } from "lucide-react";
import Link from "next/link";

type OrderStatus = "PENDING" | "IN_PROGRESS" | "IN_SHIPPING" | "DELIVERED" | "CANCELLED";

export default function RevenuePage() {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "">("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("");

  // Generate month options (last 12 months)
  const monthOptions = Array.from({ length: 12 }, (_, i) => {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    return {
      value: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`,
      label: date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    };
  });

  // Update date range when month is selected
  useEffect(() => {
    if (selectedMonth) {
      const [year, month] = selectedMonth.split('-');
      const firstDay = `${year}-${month}-01`;
      const lastDay = new Date(parseInt(year), parseInt(month), 0).getDate();
      const lastDayStr = `${year}-${month}-${String(lastDay).padStart(2, '0')}`;
      setStartDate(firstDay);
      setEndDate(lastDayStr);
    }
  }, [selectedMonth]);
  
  const { data: allOrdersData, isLoading } = useListOrdersQuery({ 
    limit: 50000,
    startDate: startDate || undefined,
    endDate: endDate || undefined,
    status: statusFilter || undefined,
  });
  const { data: allProductsData } = useListProductsQuery({ limit: 50000 } as Parameters<typeof useListProductsQuery>[0]);
  const allOrders = allOrdersData?.data?.items || [];

  // Build productId -> buyingPrice map
  const productBuyingPriceMap = new Map<string, number>();
  (allProductsData?.data?.items || allProductsData?.data || []).forEach((p: Record<string, unknown>) => {
    if (p._id) productBuyingPriceMap.set(String(p._id), Number(p.buyingPrice ?? 0));
  });

  // Client-side search filter
  const filteredOrders = allOrders.filter(order => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      order._id.toLowerCase().includes(q) ||
      order.customer?.name?.toLowerCase().includes(q) ||
      order.customer?.phone?.toLowerCase().includes(q)
    );
  });

  const totalRevenue = filteredOrders.reduce((sum, o) => sum + (o.totals?.grandTotal || 0), 0);
  const deliveredOrders = filteredOrders.filter(o => o.status?.toLowerCase() === "delivered");
  const deliveredRevenue = deliveredOrders.reduce((sum, o) => sum + (o.totals?.grandTotal || 0), 0);
  const pendingOrders = filteredOrders.filter(o => o.status?.toLowerCase() === "pending");
  const pendingRevenue = pendingOrders.reduce((sum, o) => sum + (o.totals?.grandTotal || 0), 0);
  const inProgressOrders = filteredOrders.filter(o => o.status?.toLowerCase() === "in_progress" || o.status?.toLowerCase() === "in_shipping");
  const inProgressRevenue = inProgressOrders.reduce((sum, o) => sum + (o.totals?.grandTotal || 0), 0);

  // Profit = (selling price - buying price) * qty, for orders with known buyingPrice
  const totalProfit = filteredOrders.reduce((sum, o) => {
    const orderProfit = (o.lines || []).reduce((ls, line) => {
      const buyingPrice = productBuyingPriceMap.get(String(line.productId)) ?? 0;
      return ls + (line.price - buyingPrice) * (line.qty || 1);
    }, 0);
    return sum + orderProfit;
  }, 0);
  const deliveredProfit = deliveredOrders.reduce((sum, o) => {
    const orderProfit = (o.lines || []).reduce((ls, line) => {
      const buyingPrice = productBuyingPriceMap.get(String(line.productId)) ?? 0;
      return ls + (line.price - buyingPrice) * (line.qty || 1);
    }, 0);
    return sum + orderProfit;
  }, 0);

  const revenueByMonth = filteredOrders.reduce((acc: Record<string, number>, order) => {
    if (order.createdAt) {
      const month = new Date(order.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      acc[month] = (acc[month] || 0) + (order.totals?.grandTotal || 0);
    }
    return acc;
  }, {});

  const monthlyData = Object.entries(revenueByMonth).slice(-6);

  const clearFilters = () => {
    setStartDate("");
    setEndDate("");
    setStatusFilter("");
    setSearchQuery("");
    setSelectedMonth("");
  };

  const hasActiveFilters = startDate || endDate || statusFilter || searchQuery || selectedMonth;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-rose-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#167389] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading revenue data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-rose-50 to-purple-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 mt-16">
        <div className="mb-6 sm:mb-8">
          <Link href="/dashboard" className="inline-flex items-center border border-teal-800 rounded-lg p-1 gap-2 text-gray-600 hover:text-[#167389] mb-4 transition-colors">
            <ArrowLeft className="w-5 h-5" />
            <span className="font-semibold">Back to Dashboard</span>
          </Link>
          <h1 className="text-2xl sm:text-3xl  lg:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#167389] to-[#167389] mb-2">
            Revenue Overview
          </h1>
          <p className="text-sm sm:text-base text-gray-600">
            Track your store&apos;s revenue and financial performance
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <Filter className="w-5 h-5 text-[#167389]" />
              Filters
            </h3>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="text-sm text-red-600 hover:text-red-700 font-medium flex items-center gap-1"
              >
                <X className="w-4 h-4" />
                Clear All
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-4 py-2 rounded-xl border border-pink-200 focus:outline-none focus:ring-2 focus:ring-pink-300 focus:border-pink-400 transition"
            >
              <option value="">Select Month</option>
              {monthOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setSelectedMonth("");
              }}
              className="px-4 py-2 rounded-xl border border-pink-200 focus:outline-none focus:ring-2 focus:ring-pink-300 focus:border-pink-400 transition"
              placeholder="Start Date"
            />
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setSelectedMonth("");
              }}
              className="px-4 py-2 rounded-xl border border-pink-200 focus:outline-none focus:ring-2 focus:ring-pink-300 focus:border-pink-400 transition"
              placeholder="End Date"
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as OrderStatus | "")}
              className="px-4 py-2 rounded-xl border border-pink-200 focus:outline-none focus:ring-2 focus:ring-pink-300 focus:border-pink-400 transition"
            >
              <option value="">All Statuses</option>
              <option value="PENDING">Pending</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="IN_SHIPPING">In Shipping</option>
              <option value="DELIVERED">Delivered</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search orders..."
              className="px-4 py-2 rounded-xl border border-pink-200 focus:outline-none focus:ring-2 focus:ring-pink-300 focus:border-pink-400 transition"
            />
          </div>
        </div>

        {/* Revenue Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <Link href="/revenue" className="bg-white rounded-2xl shadow-lg p-5 sm:p-6 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-center mb-4">
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl flex items-center justify-center shadow-md">
                <DollarSign className="w-6 h-6 sm:w-7 sm:h-7 text-white" strokeWidth={2.5} />
              </div>
            </div>
            <h3 className="text-gray-600 text-xs sm:text-sm font-medium mb-1 text-center">Total Revenue</h3>
            <p className="text-2xl sm:text-3xl font-bold text-gray-800 text-center">৳{totalRevenue.toLocaleString()}</p>
            <p className="text-xs text-gray-500 text-center mt-2">{filteredOrders.length} orders</p>
          </Link>

          <Link href="/orders?status=DELIVERED" className="bg-white rounded-2xl shadow-lg p-5 sm:p-6 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-center mb-4">
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-md">
                <TrendingUp className="w-6 h-6 sm:w-7 sm:h-7 text-white" strokeWidth={2.5} />
              </div>
            </div>
            <h3 className="text-gray-600 text-xs sm:text-sm font-medium mb-1 text-center">Delivered Revenue</h3>
            <p className="text-2xl sm:text-3xl font-bold text-gray-800 text-center">৳{deliveredRevenue.toLocaleString()}</p>
            <p className="text-xs text-gray-500 text-center mt-2">{deliveredOrders.length} orders</p>
          </Link>

          <Link href="/orders?status=PENDING" className="bg-white rounded-2xl shadow-lg p-5 sm:p-6 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-center mb-4">
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center shadow-md">
                <Calendar className="w-6 h-6 sm:w-7 sm:h-7 text-white" strokeWidth={2.5} />
              </div>
            </div>
            <h3 className="text-gray-600 text-xs sm:text-sm font-medium mb-1 text-center">Pending Revenue</h3>
            <p className="text-2xl sm:text-3xl font-bold text-gray-800 text-center">৳{pendingRevenue.toLocaleString()}</p>
            <p className="text-xs text-gray-500 text-center mt-2">{pendingOrders.length} orders</p>
          </Link>

          <Link href="/orders" className="bg-white rounded-2xl shadow-lg p-5 sm:p-6 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-center mb-4">
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl flex items-center justify-center shadow-md">
                <ShoppingBag className="w-6 h-6 sm:w-7 sm:h-7 text-white" strokeWidth={2.5} />
              </div>
            </div>
            <h3 className="text-gray-600 text-xs sm:text-sm font-medium mb-1 text-center">In Progress</h3>
            <p className="text-2xl sm:text-3xl font-bold text-gray-800 text-center">৳{inProgressRevenue.toLocaleString()}</p>
            <p className="text-xs text-gray-500 text-center mt-2">{inProgressOrders.length} orders</p>
          </Link>

          <div className="bg-white rounded-2xl shadow-lg p-5 sm:p-6 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-center mb-4">
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center shadow-md">
                <TrendingUp className="w-6 h-6 sm:w-7 sm:h-7 text-white" strokeWidth={2.5} />
              </div>
            </div>
            <h3 className="text-gray-600 text-xs sm:text-sm font-medium mb-1 text-center">Total Profit</h3>
            <p className={`text-2xl sm:text-3xl font-bold text-center ${totalProfit >= 0 ? "text-violet-700" : "text-red-600"}`}>৳{totalProfit.toLocaleString()}</p>
            <p className="text-xs text-gray-500 text-center mt-2">All orders</p>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-5 sm:p-6 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-center mb-4">
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-md">
                <TrendingDown className="w-6 h-6 sm:w-7 sm:h-7 text-white" strokeWidth={2.5} />
              </div>
            </div>
            <h3 className="text-gray-600 text-xs sm:text-sm font-medium mb-1 text-center">Delivered Profit</h3>
            <p className={`text-2xl sm:text-3xl font-bold text-center ${deliveredProfit >= 0 ? "text-teal-700" : "text-red-600"}`}>৳{deliveredProfit.toLocaleString()}</p>
            <p className="text-xs text-gray-500 text-center mt-2">{deliveredOrders.length} delivered</p>
          </div>
        </div>

        {/* Monthly Revenue */}
        <div className="bg-white rounded-2xl shadow-lg p-5 sm:p-6 mb-6 sm:mb-8">
          <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-4">Monthly Revenue (Last 6 Months)</h2>
          <div className="space-y-3">
            {monthlyData.map(([month, revenue]) => (
              <div key={month} className="flex items-center justify-between p-4 bg-gradient-to-r from-emerald-50 to-green-50 rounded-xl border border-emerald-100">
                <span className="font-semibold text-gray-800">{month}</span>
                <span className="text-lg font-bold text-emerald-600">৳{revenue.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Revenue Orders */}
        <div className="bg-white rounded-2xl shadow-lg p-5 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg sm:text-xl font-bold text-gray-800">Recent Orders</h2>
            <Link href="/orders" className="text-sm text-[#167389] hover:text-[#125a6b] font-semibold">
              View All →
            </Link>
          </div>
          {filteredOrders.length === 0 ? (
            <div className="text-center py-12">
              <ShoppingBag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600">No orders found</p>
              <p className="text-sm text-gray-500 mt-2">Try adjusting your filters</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredOrders.slice(0, 10).map((order) => (
                <Link
                  key={order._id}
                  href={`/orders/${order._id}/invoice`}
                  className="flex items-center justify-between p-4 bg-gradient-to-r from-pink-50 to-purple-50 rounded-xl border border-pink-100 hover:shadow-md transition-shadow"
                >
                  <div>
                    <p className="font-semibold text-gray-800">#{order._id.slice(-6).toUpperCase()}</p>
                    <p className="text-xs text-gray-600">{order.customer?.name || "Guest"}</p>
                    <p className="text-xs text-gray-500">{order.createdAt ? new Date(order.createdAt).toLocaleDateString() : "N/A"}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-emerald-600">৳{(order.totals?.grandTotal || 0).toLocaleString()}</p>
                    <p className="text-xs text-gray-600 capitalize">{order.status}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
