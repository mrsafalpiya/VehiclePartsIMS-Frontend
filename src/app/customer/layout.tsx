"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();

  useEffect(() => {
    const raw = localStorage.getItem("auth_user");
    if (!raw) {
      router.replace("/login");
      return;
    }
    const user = JSON.parse(raw);
    if (user.role !== "Customer") router.replace("/login");
  }, [router]);

  function logout() {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("auth_user");
    router.push("/login");
  }

  return (
    <div className="min-h-screen flex bg-gray-100">
      <aside className="w-48 bg-white border-r border-gray-300 p-4 flex flex-col">
        <h1 className="font-bold text-lg mb-6">My Account</h1>
        <nav className="flex flex-col gap-2 flex-1">
          <Link
            href="/customer/profile"
            className="text-sm px-2 py-1 rounded hover:bg-gray-100"
          >
            Profile
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
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
