"use client";

import { Spinner } from "@heroui/react";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

interface ApiResponse<T> {
  success: boolean;
  message: string | null;
  data: T | null;
  errors: string[] | null;
}

interface RegularCustomerReportItemDto {
  customerName: string;
  phoneNumber: string;
  email: string;
  totalPurchases: number;
}

interface HighSpenderReportItemDto {
  customerName: string;
  phoneNumber: string;
  email: string;
  totalAmountSpent: number;
}

interface PendingCreditReportItemDto {
  customerName: string;
  phoneNumber: string;
  email: string;
  totalOutstandingBalance: number;
}

type ReportType = "regular" | "high-spenders" | "pending-credits";

const TABS: { id: ReportType; label: string }[] = [
  { id: "regular", label: "Regular Customers" },
  { id: "high-spenders", label: "High Spenders" },
  { id: "pending-credits", label: "Pending Credits" },
];

function fmt(n: number) {
  return `Rs. ${n.toLocaleString()}`;
}

function TableContainer({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-white border border-gray-300 rounded overflow-hidden">
      {children}
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return <p className="text-gray-400 text-sm text-center py-12">{message}</p>;
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="p-6 text-center">
      <p className="text-red-500 text-sm mb-3">Failed to load report.</p>
      <button
        type="button"
        onClick={onRetry}
        className="text-sm text-gray-600 hover:underline"
      >
        Retry
      </button>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="flex justify-center items-center py-12">
      <Spinner />
    </div>
  );
}

function RegularCustomersReport() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["customer-reports-regular"],
    queryFn: () =>
      apiFetch<ApiResponse<RegularCustomerReportItemDto[]>>(
        "/api/customer-reports/regular",
      ),
  });

  const rows = data?.data ?? [];

  return (
    <TableContainer>
      {isLoading ? (
        <LoadingState />
      ) : isError ? (
        <ErrorState onRetry={refetch} />
      ) : rows.length === 0 ? (
        <EmptyState message="No customers found." />
      ) : (
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-2 font-medium text-gray-600">
                #
              </th>
              <th className="text-left px-4 py-2 font-medium text-gray-600">
                Name
              </th>
              <th className="text-left px-4 py-2 font-medium text-gray-600">
                Phone
              </th>
              <th className="text-left px-4 py-2 font-medium text-gray-600">
                Email
              </th>
              <th className="text-right px-4 py-2 font-medium text-gray-600">
                Total Purchases
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr
                key={`${row.email}-${i}`}
                className="border-b border-gray-100 last:border-0"
              >
                <td className="px-4 py-2 text-gray-400">{i + 1}</td>
                <td className="px-4 py-2 font-medium">{row.customerName}</td>
                <td className="px-4 py-2 text-gray-500">{row.phoneNumber}</td>
                <td className="px-4 py-2 text-gray-500">{row.email}</td>
                <td className="px-4 py-2 text-right font-medium">
                  {row.totalPurchases}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </TableContainer>
  );
}

function HighSpendersReport() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["customer-reports-high-spenders"],
    queryFn: () =>
      apiFetch<ApiResponse<HighSpenderReportItemDto[]>>(
        "/api/customer-reports/high-spenders",
      ),
  });

  const rows = data?.data ?? [];

  return (
    <TableContainer>
      {isLoading ? (
        <LoadingState />
      ) : isError ? (
        <ErrorState onRetry={refetch} />
      ) : rows.length === 0 ? (
        <EmptyState message="No customers found." />
      ) : (
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-2 font-medium text-gray-600">
                #
              </th>
              <th className="text-left px-4 py-2 font-medium text-gray-600">
                Name
              </th>
              <th className="text-left px-4 py-2 font-medium text-gray-600">
                Phone
              </th>
              <th className="text-left px-4 py-2 font-medium text-gray-600">
                Email
              </th>
              <th className="text-right px-4 py-2 font-medium text-gray-600">
                Total Spent
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr
                key={`${row.email}-${i}`}
                className="border-b border-gray-100 last:border-0"
              >
                <td className="px-4 py-2 text-gray-400">{i + 1}</td>
                <td className="px-4 py-2 font-medium">{row.customerName}</td>
                <td className="px-4 py-2 text-gray-500">{row.phoneNumber}</td>
                <td className="px-4 py-2 text-gray-500">{row.email}</td>
                <td className="px-4 py-2 text-right font-medium">
                  {fmt(row.totalAmountSpent)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </TableContainer>
  );
}

function PendingCreditsReport() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["customer-reports-pending-credits"],
    queryFn: () =>
      apiFetch<ApiResponse<PendingCreditReportItemDto[]>>(
        "/api/customer-reports/pending-credits",
      ),
  });

  const rows = data?.data ?? [];

  return (
    <TableContainer>
      {isLoading ? (
        <LoadingState />
      ) : isError ? (
        <ErrorState onRetry={refetch} />
      ) : rows.length === 0 ? (
        <EmptyState message="No customers with pending credits." />
      ) : (
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-2 font-medium text-gray-600">
                #
              </th>
              <th className="text-left px-4 py-2 font-medium text-gray-600">
                Name
              </th>
              <th className="text-left px-4 py-2 font-medium text-gray-600">
                Phone
              </th>
              <th className="text-left px-4 py-2 font-medium text-gray-600">
                Email
              </th>
              <th className="text-right px-4 py-2 font-medium text-gray-600">
                Outstanding Balance
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr
                key={`${row.email}-${i}`}
                className="border-b border-gray-100 last:border-0"
              >
                <td className="px-4 py-2 text-gray-400">{i + 1}</td>
                <td className="px-4 py-2 font-medium">{row.customerName}</td>
                <td className="px-4 py-2 text-gray-500">{row.phoneNumber}</td>
                <td className="px-4 py-2 text-gray-500">{row.email}</td>
                <td className="px-4 py-2 text-right font-medium text-red-600">
                  {fmt(row.totalOutstandingBalance)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </TableContainer>
  );
}

export default function StaffReportsPage() {
  const [active, setActive] = useState<ReportType>("regular");

  useEffect(() => {
    document.title =
      "Customer Reports | Vehicle Parts Selling and Inventory Management System";
  }, []);

  return (
    <div className="flex flex-col gap-6 max-w-4xl">
      <h2 className="text-xl font-bold">Customer Reports</h2>

      {/* Tab bar */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 w-fit">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActive(tab.id)}
            className={`text-sm px-4 py-1.5 rounded-md transition-colors ${
              active === tab.id
                ? "bg-white text-gray-900 shadow-sm font-medium"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Report content */}
      {active === "regular" && <RegularCustomersReport />}
      {active === "high-spenders" && <HighSpendersReport />}
      {active === "pending-credits" && <PendingCreditsReport />}
    </div>
  );
}
