"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();

  useEffect(() => {
    document.title =
      "Admin Panel | Vehicle Parts Selling and Inventory Management System";
  }, []);

  function logout() {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("auth_user");
    router.push("/login");
  }

  return (
    <div className="min-h-screen flex bg-gray-100">
      {/* Sidebar */}
      <aside className="w-48 bg-white border-r border-gray-300 p-4 flex flex-col">
        <h1 className="font-bold text-lg mb-6">Admin Panel</h1>
        <nav className="flex flex-col gap-2 flex-1">
          <Link
            href="/dashboard/staff"
            className="text-sm px-2 py-1 rounded hover:bg-gray-100"
          >
            Staff Management
          </Link>
          <Link
            href="/dashboard/vendors"
            className="text-sm px-2 py-1 rounded hover:bg-gray-100"
          >
            Vendors
          </Link>
          <Link
            href="/dashboard/parts"
            className="text-sm px-2 py-1 rounded hover:bg-gray-100"
          >
            Parts
          </Link>
          <Link
            href="/dashboard/part-requests"
            className="text-sm px-2 py-1 rounded hover:bg-gray-100"
          >
            Part Requests
          </Link>
          <Link
            href="/dashboard/purchase-invoices"
            className="text-sm px-2 py-1 rounded hover:bg-gray-100"
          >
            Purchase Invoices
          </Link>
        </nav>
        <button
          type="button"
          className="text-sm text-left px-2 py-1 rounded hover:bg-gray-100"
          onClick={logout}
        >
          Logout
        </button>
      </aside>

      {/* Main */}
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
