"use client";

import Link from "next/link";
import { useGetPublicSettingsQuery } from "@/services/settings.api";
import {
  Sparkles,
  Mail,
  MapPin,
  // Facebook,
  // Instagram,
  // Twitter,
  // Youtube,
  Heart,
} from "lucide-react";

export default function Footer() {
  const currentYear = new Date().getFullYear();
  const { data: settings } = useGetPublicSettingsQuery();
  const brand = settings?.siteName ?? "Rajib Electronics";

  return (
    <footer className="bg-white text-black mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 py-12">
          {/* Brand Column */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-12 h-12 bg-[#167389] rounded-xl flex items-center justify-center shadow-lg">
                <Sparkles className="w-7 h-7 text-white" strokeWidth={2.5} />
              </div>
              <div>
                <h3 className="text-xl font-bold">{brand}</h3>
                <p className="text-xs text-black">Admin Panel</p>
              </div>
            </div>
            <p className="text-black text-sm leading-relaxed mb-4">
              Managing premium Gadgets products with elegance and
              care. Building trust through quality and authenticity.
            </p>
            <div className="flex items-center gap-2 text-sm text-black">
              <Heart className="w-4 h-4 fill-pink-300" />
              <span>Gadgets that inspires confidence</span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-bold mb-4 flex items-center gap-2">
              <span className="w-1 h-6 bg-pink-400 rounded-full"></span>
              Quick Links
            </h4>
            <ul className="space-y-2.5 text-black">
              <li>
                <Link
                  href="/dashboard"
                  className="hover:text-white hover:pl-2 transition-all duration-200 inline-block"
                >
                  Dashboard
                </Link>
              </li>
              <li>
                <Link
                  href="/products"
                  className="hover:text-white hover:pl-2 transition-all duration-200 inline-block"
                >
                  Products
                </Link>
              </li>
              <li>
                <Link
                  href="/categories"
                  className="hover:text-white hover:pl-2 transition-all duration-200 inline-block"
                >
                  Categories
                </Link>
              </li>
              <li>
                <Link
                  href="/orders"
                  className="hover:text-white hover:pl-2 transition-all duration-200 inline-block"
                >
                  Orders
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="text-lg font-bold mb-4 flex items-center gap-2">
              <span className="w-1 h-6 bg-pink-black rounded-full"></span>
              Contact Us
            </h4>
            <ul className="space-y-3 text-black text-sm">
              <li className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-black flex-shrink-0 mt-0.5" />
                <span>Ishwardi, Pabna, Rajshahi, Bangladesh</span>
              </li>
              {/* <li className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-black flex-shrink-0" />
                <a
                  href={`tel:${hotline}`}
                  className="hover:text-white transition-colors"
                >
                  {hotline}
                </a>
              </li> */}
              <li className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-black flex-shrink-0" />
                <a
                  href="mailto:admin@rajibelectronics.com"
                  className="hover:text-white transition-colors"
                >
                  admin@rajibelectronics.com
                </a>
              </li>
            </ul>
          </div>

          {/* Social & Info */}
          <div>
            {/* Connect With Us - commented out
            <h4 className="text-lg font-bold mb-4 flex items-center gap-2">
              <span className="w-1 h-6 text-black rounded-full"></span>
              Connect With Us
            </h4>
            <div className="flex gap-3 mb-6">
              <a
                href="https://www.facebook.com/share/1Ara58741x"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10  hover:bg-pink-700 rounded-lg flex items-center justify-center transition-all duration-200 hover:scale-110"
              >
                <Facebook className="w-5 h-5" />
              </a>
              <a
                href="https://www.instagram.com/amaarshopbd?igsh=MTk5cWtmbzAyZTRyMQ=="
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10  hover:bg-pink-700 rounded-lg flex items-center justify-center transition-all duration-200 hover:scale-110"
              >
                <Instagram className="w-5 h-5" />
              </a>
              <a
                href="https://www.tiktok.com/@amaarshop1?_t=ZS-90tPDmEVWSY&_r=1"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10  hover:bg-pink-700 rounded-lg flex items-center justify-center transition-all duration-200 hover:scale-110"
              >
                <Twitter className="w-5 h-5" />
              </a>
              <a
                href="https://youtube.com/@amarshopb?si=oblM13m2Lo-NamLI"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10  hover:bg-pink-700 rounded-lg flex items-center justify-center transition-all duration-200 hover:scale-110"
              >
                <Youtube className="w-5 h-5" />
              </a>
            </div>
            */}
            <div className="bg-[#167389] border border-[#167389] rounded-xl p-4">
              <p className="text-xs text-white mb-2 font-semibold">
                Admin Panel Hours
              </p>
              <p className="text-sm text-white">24/7 System Access</p>
              <p className="text-xs text-white mt-1">Support: 9 AM - 12 PM</p>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-pink-800 py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-black">
            <p>
              © {currentYear}{" "}
              <span className="font-semibold text-[#167389]">{brand}</span>. All
              rights reserved.
            </p>
            <div className="flex items-center gap-4">
              <Link
                href="/privacy"
                className="hover:text-white transition-colors"
              >
                Privacy Policy
              </Link>
              <span className="text-black">|</span>
              <Link
                href="/terms"
                className="hover:text-white transition-colors"
              >
                Terms of Service
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
