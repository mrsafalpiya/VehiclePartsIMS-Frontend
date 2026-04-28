"use client";

import type { Key } from "@heroui/react";
import {
  Button,
  FieldError,
  Input,
  Label,
  ListBox,
  Select,
  Spinner,
  TextField,
} from "@heroui/react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { apiFetchDirect } from "@/lib/api";

interface Vendor {
  id: number;
  vendorName: string;
}

interface Part {
  id: number;
  partName: string;
  partCode: string;
}

interface LineItem {
  uid: string;
  partId: Key;
  quantity: string;
  unitCostPrice: string; // decimal string entered by user
}

interface PurchaseInvoiceItemResponseDto {
  partName: string;
  quantity: number;
  unitCostPrice: number;
  totalPrice: number;
}

interface PurchaseInvoiceResponseDto {
  id: number;
  invoiceNumber: string;
  invoiceDate: string;
  vendorName: string;
  totalAmount: number;
  items: PurchaseInvoiceItemResponseDto[];
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
}

function formatAmount(amount: number) {
  return `Rs. ${amount.toLocaleString()}`;
}

function makeUid() {
  return Math.random().toString(36).slice(2);
}

export default function PurchaseInvoicesPage() {
  const [vendorId, setVendorId] = useState<Key>("");
  const [items, setItems] = useState<LineItem[]>([
    { uid: makeUid(), partId: "", quantity: "", unitCostPrice: "" },
  ]);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState<PurchaseInvoiceResponseDto[]>([]);
  const [viewingInvoice, setViewingInvoice] =
    useState<PurchaseInvoiceResponseDto | null>(null);

  useEffect(() => {
    document.title =
      "Purchase Invoices | Vehicle Parts Selling and Inventory Management System";
  }, []);

  const { data: vendors = [] } = useQuery({
    queryKey: ["vendors", ""],
    queryFn: () => apiFetchDirect<Vendor[]>("/api/Vendor"),
  });

  const { data: parts = [] } = useQuery({
    queryKey: ["parts"],
    queryFn: () => apiFetchDirect<Part[]>("/api/Part"),
  });

  const createMutation = useMutation({
    mutationFn: (dto: {
      VendorId: number;
      Items: { PartId: number; Quantity: number; UnitCostPrice: number }[];
    }) =>
      apiFetchDirect<ApiResponse<PurchaseInvoiceResponseDto>>(
        "/api/PurchaseInvoice",
        { method: "POST", body: JSON.stringify(dto) },
      ),
    onSuccess(res) {
      setSubmitted((prev) => [res.data, ...prev]);
      // Reset form
      setVendorId("");
      setItems([
        { uid: makeUid(), partId: "", quantity: "", unitCostPrice: "" },
      ]);
      setValidationError(null);
    },
  });

  function addItem() {
    setItems((prev) => [
      ...prev,
      { uid: makeUid(), partId: "", quantity: "", unitCostPrice: "" },
    ]);
  }

  function removeItem(uid: string) {
    setItems((prev) => prev.filter((i) => i.uid !== uid));
  }

  function updateItem(uid: string, patch: Partial<Omit<LineItem, "uid">>) {
    setItems((prev) =>
      prev.map((i) => (i.uid === uid ? { ...i, ...patch } : i)),
    );
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setValidationError(null);

    if (!vendorId) {
      setValidationError("Please select a vendor.");
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
      const price = Number.parseInt(item.unitCostPrice, 10);
      if (!item.quantity || Number.isNaN(qty) || qty < 1) {
        setValidationError("Quantity must be a whole number of at least 1.");
        return;
      }
      if (!item.unitCostPrice || Number.isNaN(price) || price < 1) {
        setValidationError("Unit cost price must be greater than 0.");
        return;
      }
    }

    // Check for duplicate parts
    const partIds = items.map((i) => String(i.partId));
    if (new Set(partIds).size !== partIds.length) {
      setValidationError(
        "The same part cannot appear more than once. Adjust the quantity instead.",
      );
      return;
    }

    createMutation.mutate({
      VendorId: Number.parseInt(String(vendorId), 10),
      Items: items.map((i) => ({
        PartId: Number.parseInt(String(i.partId), 10),
        Quantity: Number.parseInt(i.quantity, 10),
        UnitCostPrice: Number.parseInt(i.unitCostPrice, 10),
      })),
    });
  }

  if (viewingInvoice) {
    return (
      <div className="max-w-lg">
        <button
          type="button"
          className="text-sm text-gray-500 hover:underline mb-4"
          onClick={() => setViewingInvoice(null)}
        >
          ← Back
        </button>
        <div className="bg-white border border-gray-300 rounded p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="font-bold text-lg">
                {viewingInvoice.invoiceNumber}
              </p>
              <p className="text-sm text-gray-500">
                {viewingInvoice.invoiceDate}
              </p>
            </div>
            <p className="text-sm text-gray-600">{viewingInvoice.vendorName}</p>
          </div>

          <table className="w-full text-sm mb-4">
            <thead>
              <tr className="text-left text-gray-500 border-b border-gray-200">
                <th className="pb-1 font-normal">Part</th>
                <th className="pb-1 font-normal text-right">Qty</th>
                <th className="pb-1 font-normal text-right">Unit Cost</th>
                <th className="pb-1 font-normal text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {viewingInvoice.items.map((item) => (
                <tr key={item.partName} className="border-b border-gray-100">
                  <td className="py-1">{item.partName}</td>
                  <td className="py-1 text-right">{item.quantity}</td>
                  <td className="py-1 text-right">
                    {formatAmount(item.unitCostPrice)}
                  </td>
                  <td className="py-1 text-right">
                    {formatAmount(item.totalPrice)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="flex justify-end">
            <p className="font-semibold text-sm">
              Total: {formatAmount(viewingInvoice.totalAmount)}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 max-w-2xl">
      <h2 className="text-xl font-bold">Purchase Invoices</h2>

      {/* Create form */}
      <div className="bg-white border border-gray-300 rounded p-6">
        <h3 className="font-semibold mb-4">New Purchase Invoice</h3>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Vendor */}
          <Select
            isRequired
            fullWidth
            value={vendorId}
            onChange={(v) => v && setVendorId(v)}
            placeholder="Select a vendor"
          >
            <Label>Vendor</Label>
            <Select.Trigger>
              <Select.Value />
              <Select.Indicator />
            </Select.Trigger>
            <Select.Popover>
              <ListBox>
                {vendors.map((v) => (
                  <ListBox.Item
                    key={v.id}
                    id={String(v.id)}
                    textValue={v.vendorName}
                  >
                    {v.vendorName}
                    <ListBox.ItemIndicator />
                  </ListBox.Item>
                ))}
              </ListBox>
            </Select.Popover>
          </Select>

          {/* Line items */}
          <div>
            <p className="text-sm font-medium mb-2">Line Items</p>
            <div className="flex flex-col gap-3">
              {items.map((item, idx) => (
                <div
                  key={item.uid}
                  className="grid grid-cols-[1fr_auto_auto_auto] gap-2 items-end"
                >
                  {/* Part dropdown */}
                  <Select
                    isRequired
                    fullWidth
                    value={item.partId}
                    onChange={(v) => v && updateItem(item.uid, { partId: v })}
                    placeholder="Select a part"
                  >
                    {idx === 0 && <Label>Part</Label>}
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
                            {p.partName} ({p.partCode})
                            <ListBox.ItemIndicator />
                          </ListBox.Item>
                        ))}
                      </ListBox>
                    </Select.Popover>
                  </Select>

                  {/* Quantity */}
                  <TextField
                    isRequired
                    value={item.quantity}
                    onChange={(v) => updateItem(item.uid, { quantity: v })}
                    aria-label={`Quantity for item ${idx + 1}`}
                  >
                    {idx === 0 && <Label>Qty</Label>}
                    <Input
                      type="number"
                      min="1"
                      step="1"
                      placeholder="1"
                      className="w-20"
                    />
                    <FieldError />
                  </TextField>

                  {/* Unit cost price */}
                  <TextField
                    isRequired
                    value={item.unitCostPrice}
                    onChange={(v) => updateItem(item.uid, { unitCostPrice: v })}
                    aria-label={`Unit cost price for item ${idx + 1}`}
                  >
                    {idx === 0 && <Label>Unit Cost</Label>}
                    <Input
                      type="number"
                      min="1"
                      step="1"
                      placeholder="0"
                      className="w-28"
                    />
                    <FieldError />
                  </TextField>

                  {/* Remove row */}
                  <div className={idx === 0 ? "pt-5" : ""}>
                    <button
                      type="button"
                      disabled={items.length === 1}
                      onClick={() => removeItem(item.uid)}
                      className="text-red-500 text-sm px-2 py-1 rounded hover:bg-red-50 disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={addItem}
              className="mt-3 text-sm text-gray-600 hover:underline"
            >
              + Add item
            </button>
          </div>

          {(validationError ?? createMutation.isError) && (
            <p className="text-red-500 text-sm">
              {validationError ??
                (createMutation.error as Error | null)?.message}
            </p>
          )}

          <div className="flex justify-end pt-1">
            <Button type="submit" isPending={createMutation.isPending}>
              {({ isPending }) => (
                <>
                  {isPending && <Spinner color="current" size="sm" />}
                  {isPending ? "Saving..." : "Save Invoice"}
                </>
              )}
            </Button>
          </div>
        </form>
      </div>

      {/* Session invoice list */}
      {submitted.length > 0 && (
        <div>
          <h3 className="font-semibold mb-3">Invoices Created This Session</h3>
          <div className="bg-white border border-gray-300 rounded overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-2 font-medium text-gray-600">
                    Invoice #
                  </th>
                  <th className="text-left px-4 py-2 font-medium text-gray-600">
                    Date
                  </th>
                  <th className="text-left px-4 py-2 font-medium text-gray-600">
                    Vendor
                  </th>
                  <th className="text-right px-4 py-2 font-medium text-gray-600">
                    Total
                  </th>
                  <th className="px-4 py-2" />
                </tr>
              </thead>
              <tbody>
                {submitted.map((inv) => (
                  <tr
                    key={inv.id}
                    className="border-b border-gray-100 last:border-0"
                  >
                    <td className="px-4 py-2 font-medium">
                      {inv.invoiceNumber}
                    </td>
                    <td className="px-4 py-2 text-gray-500">
                      {inv.invoiceDate}
                    </td>
                    <td className="px-4 py-2">{inv.vendorName}</td>
                    <td className="px-4 py-2 text-right">
                      {formatAmount(inv.totalAmount)}
                    </td>
                    <td className="px-4 py-2">
                      <button
                        type="button"
                        className="text-sm text-gray-600 hover:underline"
                        onClick={() => setViewingInvoice(inv)}
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
