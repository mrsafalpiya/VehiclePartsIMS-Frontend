import Link from "next/link";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex bg-gray-100">
      {/* Sidebar */}
      <aside className="w-48 bg-white border-r border-gray-300 p-4">
        <h1 className="font-bold text-lg mb-6">Admin Panel</h1>
        <nav className="flex flex-col gap-2">
          <Link
            href="/dashboard/staff"
            className="text-sm px-2 py-1 rounded hover:bg-gray-100"
          >
            Staff Management
          </Link>
        </nav>
      </aside>

      {/* Main */}
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
