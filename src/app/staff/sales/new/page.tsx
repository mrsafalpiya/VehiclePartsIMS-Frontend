"use client";

import type { Key } from "@heroui/react";
import {
  Button,
  Input,
  Label,
  ListBox,
  Modal,
  Select,
  Spinner,
  TextField,
} from "@heroui/react";
import { useMutation, useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useEffect, useState } from "react";
import { apiFetchDirect } from "@/lib/api";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Customer {
  id: number;
  fullName: string;
  email: string;
  phoneNumber: string;
}

interface Part {
  id: number;
  partName: string;
  partCode: string;
  sellingPrice: number;
  stockQuantity: number;
}

interface LineItem {
  uid: string;
  partId: string;
  quantity: string;
}

interface SalesInvoiceItemResponseDto {
  partName: string;
  partNumber: string;
  quantity: number;
  unitSellingPrice: number;
  totalPrice: number;
}

interface SalesInvoiceResponseDto {
  id: number;
  invoiceNumber: string;
  invoiceDate: string;
  customerName: string;
  customerEmail: string;
  staffName: string;
  subtotal: number;
  loyaltyDiscount: number | null;
  finalTotal: number;
  paymentStatus: string;
  loyaltyDiscountApplied: boolean;
  items: SalesInvoiceItemResponseDto[];
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeUid() {
  return Math.random().toString(36).slice(2);
}

function fmt(amount: number) {
  return `Rs. ${amount.toLocaleString()}`;
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function NewSalesInvoicePage() {
  const [customerId, setCustomerId] = useState<Key>("");
  const [customerSearch, setCustomerSearch] = useState("");
  const [paymentStatus, setPaymentStatus] = useState<Key>("Paid");
  const [items, setItems] = useState<LineItem[]>([
    { uid: makeUid(), partId: "", quantity: "" },
  ]);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [invoice, setInvoice] = useState<SalesInvoiceResponseDto | null>(null);

  useEffect(() => {
    document.title =
      "New Sales Invoice | Vehicle Parts Selling and Inventory Management System";
  }, []);

  // ── Data queries ───────────────────────────────────────────────────────────

  const { data: customers = [], isLoading: customersLoading } = useQuery({
    queryKey: ["staff-customers"],
    queryFn: () => apiFetchDirect<Customer[]>("/api/staff-customers"),
  });

  const { data: parts = [], isLoading: partsLoading } = useQuery({
    queryKey: ["parts-all"],
    queryFn: () => apiFetchDirect<Part[]>("/api/Part"),
  });

  const createMutation = useMutation({
    mutationFn: (dto: object) =>
      apiFetchDirect<ApiResponse<SalesInvoiceResponseDto>>(
        "/api/SalesInvoice",
        { method: "POST", body: JSON.stringify(dto) },
      ),
    onSuccess(result) {
      setInvoice(result.data);
      // Reset form
      setCustomerId("");
      setCustomerSearch("");
      setPaymentStatus("Paid");
      setItems([{ uid: makeUid(), partId: "", quantity: "" }]);
      setValidationError(null);
    },
    onError(err: Error) {
      setValidationError(err.message);
    },
  });

  // ── Derived calculations ───────────────────────────────────────────────────

  const filteredCustomers = customerSearch.trim()
    ? customers.filter(
        (c) =>
          c.fullName.toLowerCase().includes(customerSearch.toLowerCase()) ||
          c.phoneNumber.includes(customerSearch),
      )
    : customers;

  function getPartById(id: string): Part | undefined {
    return parts.find((p) => String(p.id) === id);
  }

  function lineTotal(item: LineItem): number | null {
    const part = getPartById(item.partId);
    const qty = Number.parseInt(item.quantity, 10);
    if (!part || Number.isNaN(qty) || qty < 1) return null;
    return part.sellingPrice * qty;
  }

  const subtotal = items.reduce<number>((sum, item) => {
    const t = lineTotal(item);
    return t !== null ? sum + t : sum;
  }, 0);

  const loyaltyDiscount = subtotal > 5000 ? Math.round(subtotal * 0.1) : 0;
  const finalTotal = subtotal - loyaltyDiscount;

  // ── Item helpers ───────────────────────────────────────────────────────────

  function addItem() {
    setItems((prev) => [...prev, { uid: makeUid(), partId: "", quantity: "" }]);
  }

  function removeItem(uid: string) {
    setItems((prev) => prev.filter((i) => i.uid !== uid));
  }

  function updateItem(uid: string, patch: Partial<Omit<LineItem, "uid">>) {
    setItems((prev) =>
      prev.map((i) => (i.uid === uid ? { ...i, ...patch } : i)),
    );
  }

  // ── Submit ─────────────────────────────────────────────────────────────────

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setValidationError(null);

    if (!customerId) {
      setValidationError("Please select a customer.");
      return;
    }

    if (items.length === 0) {
      setValidationError("At least one line item is required.");
      return;
    }

    for (const item of items) {
      if (!item.partId) {
        setValidationError("Each line item must have a part selected.");
        return;
      }
      const qty = Number.parseInt(item.quantity, 10);
      if (!item.quantity || Number.isNaN(qty) || qty < 1) {
        setValidationError("Quantity must be a whole number of at least 1.");
        return;
      }
      const part = getPartById(item.partId);
      if (part && qty > part.stockQuantity) {
        setValidationError(
          `Not enough stock for "${part.partName}". Available: ${part.stockQuantity}.`,
        );
        return;
      }
    }

    const raw =
      typeof window !== "undefined" ? localStorage.getItem("auth_user") : null;
    const user = raw ? (JSON.parse(raw) as { userId: number }) : null;

    createMutation.mutate({
      CustomerId: Number.parseInt(String(customerId), 10),
      CreatedByStaffId: user?.userId ?? 0,
      IsCredit: paymentStatus === "Unpaid",
      Items: items.map((i) => ({
        PartId: Number.parseInt(i.partId, 10),
        Quantity: Number.parseInt(i.quantity, 10),
      })),
    });
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/staff/customers"
          className="text-sm text-gray-500 hover:underline"
        >
          ← Customers
        </Link>
        <h2 className="text-xl font-bold">New Sales Invoice</h2>
      </div>

      {/* Form card */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-base">Sale Details</h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Select a customer, add line items, then save to generate the invoice.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-5">
          {/* Customer + Payment status row */}
          <div className="grid grid-cols-2 gap-4">
            {/* Customer search input + select */}
            <div className="flex flex-col gap-1.5">
              <TextField fullWidth>
                <Input
                  placeholder="Filter by name or phone…"
                  value={customerSearch}
                  onChange={(e) => {
                    setCustomerSearch(e.target.value);
                    setCustomerId(""); // clear selection when typing
                  }}
                />
              </TextField>
              <Select
                isRequired
                fullWidth
                isDisabled={customersLoading}
                value={customerId}
                onChange={(v) => {
                  if (v) setCustomerId(v);
                }}
                placeholder={
                  customersLoading ? "Loading customers…" : "Select customer"
                }
              >
                <Select.Trigger>
                  <Select.Value />
                  <Select.Indicator />
                </Select.Trigger>
                <Select.Popover>
                  <ListBox>
                    {filteredCustomers.map((c) => (
                      <ListBox.Item
                        key={c.id}
                        id={String(c.id)}
                        textValue={c.fullName}
                      >
                        <span className="font-medium">{c.fullName}</span>
                        <span className="text-gray-400 text-xs ml-1.5">
                          {c.phoneNumber}
                        </span>
                        <ListBox.ItemIndicator />
                      </ListBox.Item>
                    ))}
                  </ListBox>
                </Select.Popover>
              </Select>
            </div>

            {/* Payment status */}
            <Select
              isRequired
              fullWidth
              value={paymentStatus}
              onChange={(v) => {
                if (v) setPaymentStatus(v);
              }}
            >
              <Label>Payment Status</Label>
              <Select.Trigger>
                <Select.Value />
                <Select.Indicator />
              </Select.Trigger>
              <Select.Popover>
                <ListBox>
                  <ListBox.Item key="Paid" id="Paid" textValue="Paid">
                    Paid
                    <ListBox.ItemIndicator />
                  </ListBox.Item>
                  <ListBox.Item key="Unpaid" id="Unpaid" textValue="Unpaid">
                    Unpaid
                    <ListBox.ItemIndicator />
                  </ListBox.Item>
                </ListBox>
              </Select.Popover>
            </Select>
          </div>

          {/* Line items */}
          <div>
            <p className="text-sm font-medium mb-3">
              Line Items{" "}
              <span className="text-gray-400 font-normal text-xs">
                (at least one required)
              </span>
            </p>

            {/* Column headers */}
            <div className="grid grid-cols-[1fr_80px_120px_100px_32px] gap-2 mb-1 px-1">
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Part
              </span>
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Qty
              </span>
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Unit Price
              </span>
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide text-right">
                Line Total
              </span>
              <span />
            </div>

            <div className="flex flex-col gap-2">
              {items.map((item) => {
                const part = getPartById(item.partId);
                const total = lineTotal(item);
                const qtyNum = Number.parseInt(item.quantity, 10);
                const overStock =
                  part &&
                  !Number.isNaN(qtyNum) &&
                  qtyNum > part.stockQuantity;

                return (
                  <div
                    key={item.uid}
                    className="grid grid-cols-[1fr_80px_120px_100px_32px] gap-2 items-center bg-gray-50 rounded px-2 py-2"
                  >
                    {/* Part select */}
                    <Select
                      isRequired
                      fullWidth
                      isDisabled={partsLoading}
                      value={item.partId}
                      onChange={(v) =>
                        v && updateItem(item.uid, { partId: v })
                      }
                      placeholder={
                        partsLoading ? "Loading…" : "Select part"
                      }
                    >
                      <Select.Trigger>
                        <Select.Value />
                        <Select.Indicator />
                      </Select.Trigger>
                      <Select.Popover>
                        <ListBox>
                          {parts.map((p) => (
                            <ListBox.Item
                              key={p.id}
                              id={String(p.id)}
                              textValue={p.partName}
                            >
                              <span>{p.partName}</span>
                              <span className="text-gray-400 text-xs ml-1">
                                {p.partCode}
                              </span>
                              <span className="text-gray-400 text-xs ml-1">
                                · stock: {p.stockQuantity}
                              </span>
                              <ListBox.ItemIndicator />
                            </ListBox.Item>
                          ))}
                        </ListBox>
                      </Select.Popover>
                    </Select>

                    {/* Quantity */}
                    <Input
                      type="number"
                      min="1"
                      step="1"
                      placeholder="0"
                      value={item.quantity}
                      aria-label="Quantity"
                      className={overStock ? "border-red-300" : ""}
                      onChange={(e) =>
                        updateItem(item.uid, { quantity: e.target.value })
                      }
                    />

                    {/* Unit selling price (read-only) */}
                    <span className="text-sm text-gray-700 tabular-nums pl-1">
                      {part ? fmt(part.sellingPrice) : "—"}
                    </span>

                    {/* Line total */}
                    <span
                      className={`text-sm text-right tabular-nums font-medium ${overStock ? "text-red-500" : "text-gray-700"}`}
                    >
                      {total !== null
                        ? overStock
                          ? "Over stock"
                          : fmt(total)
                        : "—"}
                    </span>

                    {/* Remove */}
                    <button
                      type="button"
                      disabled={items.length === 1}
                      onClick={() => removeItem(item.uid)}
                      className="flex items-center justify-center w-7 h-7 rounded text-gray-400 hover:text-red-500 hover:bg-red-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                      aria-label="Remove line item"
                    >
                      ✕
                    </button>
                  </div>
                );
              })}
            </div>

            <button
              type="button"
              onClick={addItem}
              className="mt-3 text-sm text-gray-500 hover:text-gray-800 hover:underline"
            >
              + Add line item
            </button>
          </div>

          {/* Totals summary */}
          {subtotal > 0 && (
            <div className="border-t border-gray-100 pt-4">
              <div className="ml-auto w-56 flex flex-col gap-1.5 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span className="tabular-nums">{fmt(subtotal)}</span>
                </div>
                {loyaltyDiscount > 0 && (
                  <div className="flex justify-between text-green-700">
                    <span>Loyalty Discount (10%)</span>
                    <span className="tabular-nums">−{fmt(loyaltyDiscount)}</span>
                  </div>
                )}
                <div className="flex justify-between font-semibold text-gray-900 border-t border-gray-200 pt-1.5 mt-0.5">
                  <span>Final Total</span>
                  <span className="tabular-nums">{fmt(finalTotal)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Validation / API error */}
          {(validationError ?? createMutation.isError) && (
            <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded px-3 py-2">
              {validationError ??
                (createMutation.error as Error | null)?.message}
            </p>
          )}

          {/* Submit */}
          <div className="flex justify-end pt-1 border-t border-gray-100">
            <Button type="submit" isPending={createMutation.isPending}>
              {({ isPending }) => (
                <>
                  {isPending && <Spinner color="current" size="sm" />}
                  {isPending ? "Saving…" : "Save & Generate Invoice"}
                </>
              )}
            </Button>
          </div>
        </form>
      </div>

      {/* Invoice modal */}
      <Modal.Backdrop isOpen={invoice !== null}>
        <Modal.Container>
          {invoice && (
            <Modal.Dialog className="max-w-2xl w-full">
              <Modal.Header>
                <div>
                  <p className="font-bold text-lg">{invoice.invoiceNumber}</p>
                  <p className="text-xs text-gray-500 font-normal mt-0.5">
                    {String(invoice.invoiceDate)} &middot; Staff:{" "}
                    {invoice.staffName}
                  </p>
                </div>
                <Modal.CloseTrigger onClick={() => setInvoice(null)} />
              </Modal.Header>

              <Modal.Body className="flex flex-col gap-5">
                {/* Customer details */}
                <div className="bg-gray-50 rounded p-4 text-sm">
                  <p className="font-medium text-gray-900">
                    {invoice.customerName}
                  </p>
                  <p className="text-gray-500">{invoice.customerEmail}</p>
                </div>

                {/* Line items */}
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left border-b border-gray-200">
                      <th className="pb-2 font-medium text-gray-600">Part</th>
                      <th className="pb-2 font-medium text-gray-600 text-right">
                        Qty
                      </th>
                      <th className="pb-2 font-medium text-gray-600 text-right">
                        Unit Price
                      </th>
                      <th className="pb-2 font-medium text-gray-600 text-right">
                        Total
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoice.items.map((item) => (
                      <tr
                        key={`${item.partName}-${item.partNumber}`}
                        className="border-b border-gray-100 last:border-0"
                      >
                        <td className="py-2">
                          {item.partName}
                          {item.partNumber && (
                            <span className="text-gray-400 text-xs ml-1.5">
                              {item.partNumber}
                            </span>
                          )}
                        </td>
                        <td className="py-2 text-right tabular-nums">
                          {item.quantity}
                        </td>
                        <td className="py-2 text-right tabular-nums">
                          {fmt(item.unitSellingPrice)}
                        </td>
                        <td className="py-2 text-right tabular-nums">
                          {fmt(item.totalPrice)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Totals */}
                <div className="border-t border-gray-200 pt-4">
                  <div className="ml-auto w-60 flex flex-col gap-1.5 text-sm">
                    <div className="flex justify-between text-gray-600">
                      <span>Subtotal</span>
                      <span className="tabular-nums">
                        {fmt(invoice.subtotal)}
                      </span>
                    </div>
                    {invoice.loyaltyDiscountApplied &&
                      invoice.loyaltyDiscount != null && (
                        <div className="flex justify-between text-green-700">
                          <span>Loyalty Discount (10%)</span>
                          <span className="tabular-nums">
                            −{fmt(invoice.loyaltyDiscount)}
                          </span>
                        </div>
                      )}
                    <div className="flex justify-between font-semibold text-gray-900 border-t border-gray-200 pt-1.5 mt-0.5">
                      <span>Final Total</span>
                      <span className="tabular-nums">
                        {fmt(invoice.finalTotal)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Payment status */}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Payment Status</span>
                  <span
                    className={`font-semibold px-2 py-0.5 rounded text-xs ${
                      invoice.paymentStatus === "Paid"
                        ? "bg-green-100 text-green-700"
                        : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    {invoice.paymentStatus}
                  </span>
                </div>
              </Modal.Body>

              <Modal.Footer>
                <Button variant="secondary" onPress={() => setInvoice(null)}>
                  Close
                </Button>
              </Modal.Footer>
            </Modal.Dialog>
          )}
        </Modal.Container>
      </Modal.Backdrop>
    </div>
  );
}
