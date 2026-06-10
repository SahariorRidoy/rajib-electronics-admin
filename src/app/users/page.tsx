"use client";

import { useState } from "react";
import { useListUsersQuery } from "@/services/users.api";
import { formatAddress } from "@/lib/address";
import { Users, Mail, Phone, MapPin, ShoppingBag, ChevronDown, ChevronUp, CheckCircle, XCircle } from "lucide-react";

export default function UsersPage() {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const { data, isLoading } = useListUsersQuery({ limit: 50 });
  
  const users = data?.data?.items || [];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-rose-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#167389] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-rose-50 to-purple-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 mt-16">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#167389] to-[#167389] mb-2">
            All Users
          </h1>
          <p className="text-sm sm:text-base text-gray-600">
            Total {users.length} registered users
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-5 sm:p-6">
          {users.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 text-lg">No users found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {users.map((user) => (
                <div key={user._id} className="border border-gray-200 rounded-xl overflow-hidden hover:shadow-md transition-shadow">
                  <div
                    onClick={() => setExpandedId(expandedId === user._id ? null : user._id)}
                    className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-gray-800">{user.name}</h3>
                          {user.isVerified ? (
                            <CheckCircle className="w-4 h-4 text-green-500" />
                          ) : (
                            <XCircle className="w-4 h-4 text-gray-400" />
                          )}
                        </div>
                        <p className="text-sm text-gray-500">{user.email}</p>
                      </div>
                      <div className="hidden sm:flex items-center gap-6">
                        <div className="text-center">
                          <p className="text-xs text-gray-500">Orders</p>
                          <p className="font-bold text-[#167389]">{user.orderCount}</p>
                        </div>
                      </div>
                    </div>
                    {expandedId === user._id ? (
                      <ChevronUp className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    )}
                  </div>

                  {expandedId === user._id && (
                    <div className="px-4 pb-4 pt-2 bg-gray-50 border-t border-gray-200">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="flex items-start gap-3">
                          <Mail className="w-5 h-5 text-gray-400 mt-0.5" />
                          <div>
                            <p className="text-xs text-gray-500 font-medium">Email</p>
                            <p className="text-sm text-gray-800">{user.email}</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <Phone className="w-5 h-5 text-gray-400 mt-0.5" />
                          <div>
                            <p className="text-xs text-gray-500 font-medium">Phone</p>
                            <p className="text-sm text-gray-800">{user.phone || "N/A"}</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <ShoppingBag className="w-5 h-5 text-gray-400 mt-0.5" />
                          <div>
                            <p className="text-xs text-gray-500 font-medium">Total Orders</p>
                            <p className="text-sm text-gray-800">{user.orderCount}</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <CheckCircle className="w-5 h-5 text-gray-400 mt-0.5" />
                          <div>
                            <p className="text-xs text-gray-500 font-medium">Status</p>
                            <p className="text-sm text-gray-800">
                              {user.isVerified ? "Verified" : "Not Verified"}
                            </p>
                          </div>
                        </div>
                        {user.address && (
                          <div className="flex items-start gap-3 sm:col-span-2">
                            <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                            <div>
                              <p className="text-xs text-gray-500 font-medium">Address</p>
                              <p className="text-sm text-gray-800">{formatAddress(user.address)}</p>
                            </div>
                          </div>
                        )}
                        <div className="flex items-start gap-3">
                          <div className="w-5 h-5 flex items-center justify-center">
                            <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 font-medium">Joined</p>
                            <p className="text-sm text-gray-800">
                              {new Date(user.createdAt).toLocaleDateString()}
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
      </div>
    </div>
  );
}
