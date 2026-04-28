"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { apiFetchDirect } from "@/lib/api";

interface LineItem {
  partName: string;
  quantity: number;
  unitSellingPrice: number;
  lineTotal: number;
}

interface PurchaseHistoryItem {
  id: number;
  invoiceNumber: string;
  invoiceDate: string;
  lineItems: LineItem[];
  subtotal: number;
  loyaltyDiscount: number | null;
  finalTotal: number;
  paymentStatus: string;
}

interface AppointmentHistoryItem {
  id: number;
  preferredDate: string;
  preferredTime: string;
  status: string;
  createdAt: string;
}

function getCustomerId(): number {
  const raw =
    typeof window !== "undefined" ? localStorage.getItem("auth_user") : null;
  if (!raw) return 0;
  return (JSON.parse(raw) as { userId: number }).userId;
}

export default function HistoryPage() {
  const [tab, setTab] = useState<"purchases" | "appointments">("purchases");
  const customerId = getCustomerId();

  const { data: purchases = [], isLoading: purchasesLoading } = useQuery({
    queryKey: ["purchaseHistory", customerId],
    queryFn: () =>
      apiFetchDirect<PurchaseHistoryItem[]>(
        `/api/History/purchases?customerId=${customerId}`,
      ),
    enabled: tab === "purchases",
  });

  const { data: appointments = [], isLoading: appointmentsLoading } = useQuery({
    queryKey: ["appointmentHistory", customerId],
    queryFn: () =>
      apiFetchDirect<AppointmentHistoryItem[]>(
        `/api/History/appointments?customerId=${customerId}`,
      ),
    enabled: tab === "appointments",
  });

  const tabClass = (t: "purchases" | "appointments") =>
    `px-4 py-1.5 text-sm border rounded ${
      tab === t
        ? "bg-gray-800 text-white border-gray-800"
        : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
    }`;

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <h2 className="text-xl font-bold">My History</h2>

      {/* Tab switcher */}
      <div className="flex gap-2">
        <button
          type="button"
          className={tabClass("purchases")}
          onClick={() => setTab("purchases")}
        >
          Purchase History
        </button>
        <button
          type="button"
          className={tabClass("appointments")}
          onClick={() => setTab("appointments")}
        >
          Appointment History
        </button>
      </div>

      {/* Purchase History */}
      {tab === "purchases" && (
        <div>
          {purchasesLoading && (
            <p className="text-sm text-gray-500">Loading...</p>
          )}
          {!purchasesLoading && purchases.length === 0 && (
            <p className="text-sm text-gray-500">No purchase history yet.</p>
          )}
          {purchases.map((inv) => (
            <div
              key={inv.id}
              className="bg-white border border-gray-300 rounded p-5 mb-4"
            >
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="font-semibold text-sm">{inv.invoiceNumber}</p>
                  <p className="text-xs text-gray-500">{inv.invoiceDate}</p>
                </div>
                <span
                  className={`text-xs px-2 py-0.5 rounded border ${
                    inv.paymentStatus === "Paid"
                      ? "border-green-400 text-green-700 bg-green-50"
                      : "border-red-400 text-red-700 bg-red-50"
                  }`}
                >
                  {inv.paymentStatus}
                </span>
              </div>

              {/* Line items */}
              <table className="w-full text-sm mb-3">
                <thead>
                  <tr className="text-left text-gray-500 border-b border-gray-200">
                    <th className="pb-1 font-normal">Part</th>
                    <th className="pb-1 font-normal text-right">Qty</th>
                    <th className="pb-1 font-normal text-right">Unit Price</th>
                    <th className="pb-1 font-normal text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {inv.lineItems.map((li) => (
                    <tr key={li.partName} className="border-b border-gray-100">
                      <td className="py-1">{li.partName}</td>
                      <td className="py-1 text-right">{li.quantity}</td>
                      <td className="py-1 text-right">
                        {li.unitSellingPrice.toFixed(2)}
                      </td>
                      <td className="py-1 text-right">
                        {li.lineTotal.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Totals */}
              <div className="flex flex-col items-end gap-0.5 text-sm">
                <p>
                  Subtotal:{" "}
                  <span className="font-medium">{inv.subtotal.toFixed(2)}</span>
                </p>
                {inv.loyaltyDiscount != null && (
                  <p className="text-green-700">
                    Loyalty Discount (10%):{" "}
                    <span className="font-medium">
                      -{inv.loyaltyDiscount.toFixed(2)}
                    </span>
                  </p>
                )}
                <p className="font-semibold">
                  Final Total: <span>{inv.finalTotal.toFixed(2)}</span>
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Appointment History */}
      {tab === "appointments" && (
        <div>
          {appointmentsLoading && (
            <p className="text-sm text-gray-500">Loading...</p>
          )}
          {!appointmentsLoading && appointments.length === 0 && (
            <p className="text-sm text-gray-500">No appointments yet.</p>
          )}
          {appointments.map((appt) => (
            <div
              key={appt.id}
              className="bg-white border border-gray-300 rounded p-5 mb-3 flex items-start justify-between"
            >
              <div className="flex flex-col gap-1">
                <p className="text-sm font-medium">
                  {appt.preferredDate} at {appt.preferredTime}
                </p>
                <p className="text-xs text-gray-500">
                  Booked on{" "}
                  {new Date(appt.createdAt).toLocaleDateString(undefined, {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </p>
              </div>
              <span
                className={`text-xs px-2 py-0.5 rounded border ${
                  appt.status === "Confirmed"
                    ? "border-green-400 text-green-700 bg-green-50"
                    : appt.status === "Completed"
                      ? "border-blue-400 text-blue-700 bg-blue-50"
                      : appt.status === "Cancelled"
                        ? "border-red-400 text-red-700 bg-red-50"
                        : "border-gray-400 text-gray-700 bg-gray-50"
                }`}
              >
                {appt.status}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
