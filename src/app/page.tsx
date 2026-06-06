"use client";
import Link from "next/link";
import { useListOrdersQuery } from "@/services/orders.api";
import { useListProductsQuery } from "@/services/products.api";
import { useGetPublicSettingsQuery } from "@/services/settings.api";

export default function Home() {
  const { data: ordersData } = useListOrdersQuery({ limit: 1 });
  const { data: productsData } = useListProductsQuery({});

  const { data: settings } = useGetPublicSettingsQuery();
  const brand = settings?.siteName ?? "Rajib Electronics";
  const totalOrders = ordersData?.data?.total || 0;
  const totalProducts = productsData?.data?.total || productsData?.data?.items?.length || 0;
  const orders = ordersData?.data?.items || [];
  const totalRevenue = orders.reduce((sum, o) => sum + (o.totals?.grandTotal || 0), 0);
  const uniqueCustomers = new Set(orders.map(o => o.customer?.email)).size;
  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-rose-50 to-purple-50 relative overflow-hidden mt-16">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-64 h-64 bg-pink-200 rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-blob" />
        <div className="absolute top-40 right-10 w-72 h-72 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-blob animation-delay-2000" />
        <div className="absolute bottom-20 left-1/3 w-80 h-80 bg-rose-200 rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-blob animation-delay-4000" />
      </div>

      <div className="container mx-auto px-4 py-8 sm:py-12 lg:py-16 relative z-10">
        <div className="text-center">
          {/* Hero Section with Animation */}
          <div className="mb-8 sm:mb-12 animate-fade-in">
            <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-[#167389] to-[#167389] rounded-2xl shadow-2xl mb-6 transform hover:scale-110 transition-transform duration-300 animate-float">
              <svg
                className="w-9 h-9 sm:w-11 sm:h-11 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
                />
              </svg>
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#167389] to-[#167389] mb-3 sm:mb-4 animate-slide-up">
              {brand}
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-gray-600 mb-2 animate-slide-up animation-delay-200">
              Welcome to your admin panel
            </p>
           
          </div>

          {/* Feature Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 max-w-5xl mx-auto mb-8 sm:mb-12">
            {/* Users Card */}
            <Link href="/orders" className="group bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-2xl p-5 sm:p-6 border border-pink-100 transform hover:-translate-y-2 transition-all duration-300 animate-slide-up animation-delay-400 cursor-pointer">
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-[#167389] to-[#167389] rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-md">
                <svg
                  className="w-6 h-6 sm:w-7 sm:h-7 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2.5}
                    d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                  />
                </svg>
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-pink-700 mb-2 group-hover:text-pink-600 transition-colors">
                All Orders
              </h3>
              <p className="text-sm sm:text-base text-gray-600">
                Manage your Orders
              </p>
            </Link>

            {/* Products Card */}
            <Link href="/products" className="group bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-2xl p-5 sm:p-6 border border-rose-100 transform hover:-translate-y-2 transition-all duration-300 animate-slide-up animation-delay-600 cursor-pointer">
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-[#167389] to-[#167389] rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-md">
                <svg
                  className="w-6 h-6 sm:w-7 sm:h-7 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2.5}
                    d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                  />
                </svg>
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-rose-700 mb-2 group-hover:text-rose-600 transition-colors">
                All Products
              </h3>
              <p className="text-sm sm:text-base text-gray-600">
                Manage your products catalog
              </p>
            </Link>

            {/* Analytics Card */}
            <Link href="/dashboard" className="group bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-2xl p-5 sm:p-6 border border-purple-100 transform hover:-translate-y-2 transition-all duration-300 animate-slide-up animation-delay-800 sm:col-span-2 lg:col-span-1 cursor-pointer">
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-[#167389] to-[#167389] rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-md">
                <svg
                  className="w-6 h-6 sm:w-7 sm:h-7 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2.5}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-purple-700 mb-2 group-hover:text-purple-600 transition-colors">
                Analytics
              </h3>
              <p className="text-sm sm:text-base text-gray-600">
                Track sales performance and insights
              </p>
            </Link>
          </div>

          {/* Call to Action Button */}
          <Link href={"/login"}>
            <button className="group relative inline-flex items-center justify-center gap-2 mt-4 sm:mt-8 bg-gradient-to-r from-[#167389] to-[#167389] hover:from-cyan-300 hover:to-cyan-700 text-white font-semibold py-3 px-6 sm:py-4 sm:px-8 rounded-xl shadow-lg hover:shadow-2xl transform hover:scale-105 transition-all duration-300 animate-fade-in animation-delay-1000 text-sm sm:text-base">
              <span>Get Started</span>
              <svg
                className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d="M13 7l5 5m0 0l-5 5m5-5H6"
                />
              </svg>
            </button>
          </Link>

          {/* Dynamic Stats */}
          <div className="mt-12 sm:mt-16 grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 max-w-4xl mx-auto animate-fade-in animation-delay-1200">
            <div className="bg-white/60 backdrop-blur-sm rounded-xl p-3 sm:p-4 border border-pink-100 hover:border-pink-300 transition-colors">
              <div className="text-2xl sm:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-600 to-rose-600 mb-1">
                {totalProducts}+
              </div>
              <div className="text-xs sm:text-sm text-gray-600">Products</div>
            </div>
            <div className="bg-white/60 backdrop-blur-sm rounded-xl p-3 sm:p-4 border border-rose-100 hover:border-rose-300 transition-colors">
              <div className="text-2xl sm:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-rose-600 to-pink-600 mb-1">
                {uniqueCustomers}+
              </div>
              <div className="text-xs sm:text-sm text-gray-600">Customers</div>
            </div>
            <div className="bg-white/60 backdrop-blur-sm rounded-xl p-3 sm:p-4 border border-purple-100 hover:border-purple-300 transition-colors">
              <div className="text-2xl sm:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 mb-1">
                {totalOrders}+
              </div>
              <div className="text-xs sm:text-sm text-gray-600">Orders</div>
            </div>
            <div className="bg-white/60 backdrop-blur-sm rounded-xl p-3 sm:p-4 border border-pink-100 hover:border-pink-300 transition-colors">
              <div className="text-2xl sm:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-600 to-purple-600 mb-1">
                ৳{totalRevenue.toLocaleString()}
              </div>
              <div className="text-xs sm:text-sm text-gray-600">Revenue</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
