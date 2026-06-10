"use client";

import { useState } from "react";
import { useListCustomersQuery, useGetCustomerOrdersQuery } from "@/services/customers.api";
import { formatAddress } from "@/lib/address";
import { Users, Mail, Phone, MapPin, ShoppingBag, ChevronDown, ChevronUp, CheckCircle, Search, Package, Calendar, CreditCard, Truck } from "lucide-react";
import type { User } from "@/types/user";

export default function CustomersPage() {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  
  const { data, isLoading } = useListCustomersQuery({ limit: 200, search });
  const customers = data?.data?.items || [];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-rose-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#167389] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading customers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-rose-50 to-purple-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 mt-16">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#167389] to-[#167389] mb-2">
            All Customers
          </h1>
          <p className="text-sm sm:text-base text-gray-600">
            {customers.length} total customers
          </p>
        </div>

        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, email, or phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#167389] focus:border-[#167389] transition"
            />
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-5 sm:p-6">
          {customers.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 text-lg">No customers found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {customers.map((customer) => (
                <CustomerCard 
                  key={customer._id} 
                  customer={customer}
                  isExpanded={expandedId === customer._id}
                  onToggle={() => setExpandedId(expandedId === customer._id ? null : customer._id)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface CustomerCardProps {
  customer: User;
  isExpanded: boolean;
  onToggle: () => void;
}

function CustomerCard({ customer, isExpanded, onToggle }: CustomerCardProps) {
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const { data: ordersData, isLoading: loadingOrders } = useGetCustomerOrdersQuery(
    { id: customer._id, limit: 10 },
    { skip: !isExpanded }
  );
  const orders = ordersData?.data?.items || [];

  console.log('Customer:', customer.name, 'Orders Data:', ordersData, 'Orders:', orders);

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden hover:shadow-md transition-shadow">
      <div
        onClick={onToggle}
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-4 flex-1">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
            {customer.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-gray-800">{customer.name}</h3>
              {customer.isVerified && <CheckCircle className="w-4 h-4 text-green-500" />}
              {customer.isAutoCreated && (
                <span className="px-2 py-0.5 bg-orange-100 text-orange-700 text-xs rounded-full font-medium">
                  Auto-Created
                </span>
              )}
            </div>
            <p className="text-sm text-gray-500">{customer.email}</p>
          </div>
          <div className="hidden sm:flex items-center gap-6">
            <div className="text-center">
              <p className="text-xs text-gray-500">Orders</p>
              <p className="font-bold text-[#167389]">{customer.orderCount}</p>
            </div>
          </div>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-5 h-5 text-gray-400" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-400" />
        )}
      </div>

      {isExpanded && (
        <div className="px-4 pb-4 pt-2 bg-gray-50 border-t border-gray-200">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div className="flex items-start gap-3">
              <Mail className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-xs text-gray-500 font-medium">Email</p>
                <p className="text-sm text-gray-800">{customer.email}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Phone className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-xs text-gray-500 font-medium">Phone</p>
                <p className="text-sm text-gray-800">{customer.phone || "N/A"}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <ShoppingBag className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-xs text-gray-500 font-medium">Total Orders</p>
                <p className="text-sm text-gray-800">{customer.orderCount}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-xs text-gray-500 font-medium">Status</p>
                <p className="text-sm text-gray-800">
                  {customer.isVerified ? "Verified" : "Not Verified"}
                  {customer.isAutoCreated && " • Auto-Created"}
                </p>
              </div>
            </div>
            {customer.address && (
              <div className="flex items-start gap-3 sm:col-span-2">
                <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-500 font-medium">Address</p>
                  <p className="text-sm text-gray-800">{formatAddress(customer.address)}</p>
                </div>
              </div>
            )}
            <div className="flex items-start gap-3">
              <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-xs text-gray-500 font-medium">Joined</p>
                <p className="text-sm text-gray-800">
                  {new Date(customer.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>

          {customer.orderCount > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <Package className="w-4 h-4" />
                Recent Orders ({orders.length})
              </h4>
              {loadingOrders ? (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#167389] mx-auto"></div>
                </div>
              ) : orders.length === 0 ? (
                <p className="text-sm text-gray-500">No orders found</p>
              ) : (
                <div className="space-y-2">
                  {(orders as Array<{ _id: string; createdAt?: string; totals?: { grandTotal?: number; subTotal?: number; shipping?: number }; status: string; lines?: Array<{ product?: { title?: string; price?: number }; title: string; price: number; qty: number }>; payment?: { method?: string; status?: string }; customer?: { name?: string; phone?: string; address?: string } }>).map((order) => (
                    <div key={order._id} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                      <div 
                        onClick={() => setExpandedOrderId(expandedOrderId === order._id ? null : order._id)}
                        className="flex items-center justify-between p-3 cursor-pointer hover:bg-gray-50"
                      >
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-800">Order #{order._id.slice(-8)}</p>
                          <p className="text-xs text-gray-500">
                            {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : "N/A"}
                          </p>
                        </div>
                        <div className="text-right flex items-center gap-2">
                          <div>
                            <p className="text-sm font-bold text-[#167389]">
                              ৳{order.totals?.grandTotal?.toLocaleString() || 0}
                            </p>
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              order.status === "DELIVERED" ? "bg-green-100 text-green-700" :
                              order.status === "PENDING" ? "bg-yellow-100 text-yellow-700" :
                              order.status === "CANCELLED" ? "bg-red-100 text-red-700" :
                              "bg-blue-100 text-blue-700"
                            }`}>
                              {order.status}
                            </span>
                          </div>
                          {expandedOrderId === order._id ? (
                            <ChevronUp className="w-4 h-4 text-gray-400" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-gray-400" />
                          )}
                        </div>
                      </div>

                      {expandedOrderId === order._id && (
                        <div className="px-3 pb-3 bg-gray-50 border-t">
                          <div className="mt-3 space-y-3">
                            {/* Products */}
                            <div>
                              <p className="text-xs font-semibold text-gray-700 mb-2">Products:</p>
                              {order.lines?.map((line: { product?: { title?: string; price?: number }; title: string; price: number; qty: number }, idx: number) => (
                                <div key={idx} className="flex justify-between text-xs py-1">
                                  <span>{line.product?.title || line.title} x {line.qty}</span>
                                  <span className="font-medium">৳{((line.product?.price || line.price) * line.qty).toLocaleString()}</span>
                                </div>
                              ))}
                            </div>

                            {/* Totals */}
                            <div className="border-t pt-2">
                              <div className="flex justify-between text-xs py-1">
                                <span>Subtotal:</span>
                                <span>৳{order.totals?.subTotal?.toLocaleString() || 0}</span>
                              </div>
                              <div className="flex justify-between text-xs py-1">
                                <span>Shipping:</span>
                                <span>৳{order.totals?.shipping?.toLocaleString() || 0}</span>
                              </div>
                              <div className="flex justify-between text-xs font-bold py-1">
                                <span>Total:</span>
                                <span>৳{order.totals?.grandTotal?.toLocaleString() || 0}</span>
                              </div>
                            </div>

                            {/* Payment & Shipping */}
                            <div className="grid grid-cols-2 gap-3 border-t pt-2">
                              <div>
                                <div className="flex items-center gap-1 mb-1">
                                  <CreditCard className="w-3 h-3 text-gray-500" />
                                  <p className="text-xs font-semibold text-gray-700">Payment:</p>
                                </div>
                                <p className="text-xs">{order.payment?.method || "N/A"}</p>
                                <p className="text-xs text-gray-500">{order.payment?.status || "N/A"}</p>
                              </div>
                              <div>
                                <div className="flex items-center gap-1 mb-1">
                                  <Truck className="w-3 h-3 text-gray-500" />
                                  <p className="text-xs font-semibold text-gray-700">Shipping:</p>
                                </div>
                                <p className="text-xs">{order.customer?.name}</p>
                                <p className="text-xs text-gray-500">{order.customer?.phone}</p>
                                <p className="text-xs text-gray-500">
                                  {formatAddress(order.customer?.address)}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
