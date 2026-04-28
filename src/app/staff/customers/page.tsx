"use client";

import { Button, Spinner } from "@heroui/react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useEffect } from "react";
import { apiFetchDirect } from "@/lib/api";

interface CustomerResponseDto {
  id: number;
  fullName: string;
  email: string;
  phoneNumber: string;
}

export default function CustomersPage() {
  useEffect(() => {
    document.title =
      "Customers | Vehicle Parts Selling and Inventory Management System";
  }, []);

  const {
    data: customers,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["staff-customers"],
    queryFn: () =>
      apiFetchDirect<CustomerResponseDto[]>("/api/staff-customers"),
  });

  return (
    <div className="flex flex-col gap-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Customers</h2>
        <Link href="/staff/customers/new">
          <Button variant="primary" size="sm">
            Register New Customer
          </Button>
        </Link>
      </div>

      <div className="bg-white border border-gray-300 rounded overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <Spinner />
          </div>
        ) : isError ? (
          <div className="p-6 text-center">
            <p className="text-red-500 text-sm mb-3">
              Failed to load customers.
            </p>
            <button
              type="button"
              onClick={() => refetch()}
              className="text-sm text-gray-600 hover:underline"
            >
              Retry
            </button>
          </div>
        ) : customers && customers.length > 0 ? (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-2 font-medium text-gray-600">
                  Name
                </th>
                <th className="text-left px-4 py-2 font-medium text-gray-600">
                  Email
                </th>
                <th className="text-left px-4 py-2 font-medium text-gray-600">
                  Phone
                </th>
                <th className="px-4 py-2" />
              </tr>
            </thead>
            <tbody>
              {customers.map((c) => (
                <tr
                  key={c.id}
                  className="border-b border-gray-100 last:border-0"
                >
                  <td className="px-4 py-2">{c.fullName}</td>
                  <td className="px-4 py-2 text-gray-500">{c.email}</td>
                  <td className="px-4 py-2 text-gray-500">{c.phoneNumber}</td>
                  <td className="px-4 py-2">
                    <Link
                      href={`/staff/customers/${c.id}`}
                      className="text-sm text-gray-600 hover:underline"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-gray-400 text-sm text-center py-12">
            No customers registered yet.
          </p>
        )}
      </div>
    </div>
  );
}
