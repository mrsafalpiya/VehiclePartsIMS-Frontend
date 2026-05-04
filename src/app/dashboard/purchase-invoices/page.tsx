"use client";

import type { Key } from "@heroui/react";
import {
  Button,
  FieldError,
  Input,
  Label,
  ListBox,
  Modal,
  Select,
  Spinner,
  Table,
  TextField,
} from "@heroui/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
  const queryClient = useQueryClient();
  const [vendorId, setVendorId] = useState<Key>("");
  const [invoiceDate, setInvoiceDate] = useState<string>(
    new Date().toISOString().split("T")[0],
  );
  const [items, setItems] = useState<LineItem[]>([
    { uid: makeUid(), partId: "", quantity: "", unitCostPrice: "" },
  ]);
  const [validationError, setValidationError] = useState<string | null>(null);
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

  const {
    data: invoices = [],
    isLoading: invoicesLoading,
    isError: invoicesError,
  } = useQuery({
    queryKey: ["purchaseInvoices"],
    queryFn: () =>
      apiFetchDirect<ApiResponse<PurchaseInvoiceResponseDto[]>>(
        "/api/PurchaseInvoice",
      ).then((r) => r.data),
  });

  const createMutation = useMutation({
    mutationFn: (dto: {
      VendorId: number;
      InvoiceDate: string;
      Items: { PartId: number; Quantity: number; UnitCostPrice: number }[];
    }) =>
      apiFetchDirect<ApiResponse<PurchaseInvoiceResponseDto>>(
        "/api/PurchaseInvoice",
        { method: "POST", body: JSON.stringify(dto) },
      ),
    onSuccess() {
      queryClient.invalidateQueries({ queryKey: ["purchaseInvoices"] });
      // Reset form
      setVendorId("");
      setInvoiceDate(new Date().toISOString().split("T")[0]);
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

    if (!invoiceDate) {
      setValidationError("Please select an invoice date.");
      return;
    }

    createMutation.mutate({
      VendorId: Number.parseInt(String(vendorId), 10),
      InvoiceDate: invoiceDate,
      Items: items.map((i) => ({
        PartId: Number.parseInt(String(i.partId), 10),
        Quantity: Number.parseInt(i.quantity, 10),
        UnitCostPrice: Number.parseInt(i.unitCostPrice, 10),
      })),
    });
  }

  const lineTotal = (item: LineItem) => {
    const qty = Number.parseInt(item.quantity, 10);
    const price = Number.parseInt(item.unitCostPrice, 10);
    if (Number.isNaN(qty) || Number.isNaN(price)) return null;
    return qty * price;
  };

  const grandTotal = items.reduce<number>((sum, item) => {
    const t = lineTotal(item);
    return t !== null ? sum + t : sum;
  }, 0);

  return (
    <div className="flex flex-col gap-8 max-w-3xl">
      <h2 className="text-xl font-bold">Purchase Invoices</h2>

      {/* Create form */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-base">New Purchase Invoice</h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Fill in the vendor, date, and line items then save.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-5">
          {/* Vendor + Date row */}
          <div className="grid grid-cols-2 gap-4">
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

            <TextField
              isRequired
              fullWidth
              value={invoiceDate}
              onChange={setInvoiceDate}
            >
              <Label>Invoice Date</Label>
              <Input type="date" />
              <FieldError />
            </TextField>
          </div>

          {/* Line items */}
          <div>
            <p className="text-sm font-medium mb-3">Line Items</p>

            {/* Header row */}
            <div className="grid grid-cols-[1fr_90px_110px_90px_32px] gap-2 mb-1 px-1">
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Part
              </span>
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Qty
              </span>
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Unit Cost (Rs.)
              </span>
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide text-right">
                Total
              </span>
              <span />
            </div>

            <div className="flex flex-col gap-2">
              {items.map((item) => {
                const total = lineTotal(item);
                return (
                  <div
                    key={item.uid}
                    className="grid grid-cols-[1fr_90px_110px_90px_32px] gap-2 items-center bg-gray-50 rounded px-2 py-2"
                  >
                    <Select
                      isRequired
                      fullWidth
                      value={item.partId}
                      onChange={(v) => v && updateItem(item.uid, { partId: v })}
                      placeholder="Select part"
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
                              {p.partName} ({p.partCode})
                              <ListBox.ItemIndicator />
                            </ListBox.Item>
                          ))}
                        </ListBox>
                      </Select.Popover>
                    </Select>

                    <Input
                      type="number"
                      min="1"
                      step="1"
                      placeholder="0"
                      value={item.quantity}
                      aria-label="Quantity"
                      onChange={(e) =>
                        updateItem(item.uid, { quantity: e.target.value })
                      }
                    />

                    <Input
                      type="number"
                      min="1"
                      step="1"
                      placeholder="0"
                      value={item.unitCostPrice}
                      aria-label="Unit cost price"
                      onChange={(e) =>
                        updateItem(item.uid, { unitCostPrice: e.target.value })
                      }
                    />

                    <span className="text-sm text-right text-gray-700 font-medium tabular-nums">
                      {total !== null ? formatAmount(total) : "—"}
                    </span>

                    <button
                      type="button"
                      disabled={items.length === 1}
                      onClick={() => removeItem(item.uid)}
                      className="flex items-center justify-center w-7 h-7 rounded text-gray-400 hover:text-red-500 hover:bg-red-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                      aria-label="Remove item"
                    >
                      ✕
                    </button>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-between mt-3">
              <button
                type="button"
                onClick={addItem}
                className="text-sm text-gray-500 hover:text-gray-800 hover:underline"
              >
                + Add line item
              </button>
              {grandTotal > 0 && (
                <p className="text-sm font-semibold text-gray-700">
                  Estimated total:{" "}
                  <span className="text-gray-900">
                    {formatAmount(grandTotal)}
                  </span>
                </p>
              )}
            </div>
          </div>

          {(validationError ?? createMutation.isError) && (
            <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded px-3 py-2">
              {validationError ??
                (createMutation.error as Error | null)?.message}
            </p>
          )}

          <div className="flex justify-end pt-1 border-t border-gray-100">
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

      {/* Invoice list */}
      <div>
        <h3 className="font-semibold mb-3">All Purchase Invoices</h3>

        {invoicesLoading && (
          <div className="flex items-center gap-2 text-gray-500 text-sm">
            <Spinner size="sm" />
            Loading invoices...
          </div>
        )}

        {invoicesError && (
          <p className="text-red-600 text-sm">Failed to load invoices.</p>
        )}

        {!invoicesLoading && !invoicesError && (
          <Table>
            <Table.ScrollContainer>
              <Table.Content aria-label="Purchase invoices">
                <Table.Header>
                  <Table.Column isRowHeader>Invoice #</Table.Column>
                  <Table.Column>Date</Table.Column>
                  <Table.Column>Vendor</Table.Column>
                  <Table.Column>Items</Table.Column>
                  <Table.Column>Total</Table.Column>
                  <Table.Column>Actions</Table.Column>
                </Table.Header>
                <Table.Body
                  renderEmptyState={() => (
                    <p className="text-center text-sm text-gray-500 py-6">
                      No purchase invoices yet.
                    </p>
                  )}
                >
                  {invoices.map((inv) => (
                    <Table.Row key={inv.id} id={inv.id}>
                      <Table.Cell>
                        <span className="font-medium text-sm">
                          {inv.invoiceNumber}
                        </span>
                      </Table.Cell>
                      <Table.Cell>{String(inv.invoiceDate)}</Table.Cell>
                      <Table.Cell>{inv.vendorName}</Table.Cell>
                      <Table.Cell>{inv.items.length}</Table.Cell>
                      <Table.Cell>
                        <span className="font-medium tabular-nums">
                          {formatAmount(inv.totalAmount)}
                        </span>
                      </Table.Cell>
                      <Table.Cell>
                        <Button
                          size="sm"
                          variant="secondary"
                          onPress={() => setViewingInvoice(inv)}
                        >
                          View
                        </Button>
                      </Table.Cell>
                    </Table.Row>
                  ))}
                </Table.Body>
              </Table.Content>
            </Table.ScrollContainer>
          </Table>
        )}
      </div>

      {/* Invoice detail modal */}
      <Modal.Backdrop isOpen={viewingInvoice !== null}>
        <Modal.Container>
          {viewingInvoice && (
            <Modal.Dialog>
              <Modal.Header>
                <div>
                  <p className="font-bold">{viewingInvoice.invoiceNumber}</p>
                  <p className="text-xs text-gray-500 font-normal mt-0.5">
                    {String(viewingInvoice.invoiceDate)} &middot;{" "}
                    {viewingInvoice.vendorName}
                  </p>
                </div>
                <Modal.CloseTrigger onClick={() => setViewingInvoice(null)} />
              </Modal.Header>
              <Modal.Body>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left border-b border-gray-200">
                      <th className="pb-2 font-medium text-gray-600">Part</th>
                      <th className="pb-2 font-medium text-gray-600 text-right">
                        Qty
                      </th>
                      <th className="pb-2 font-medium text-gray-600 text-right">
                        Unit Cost
                      </th>
                      <th className="pb-2 font-medium text-gray-600 text-right">
                        Total
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {viewingInvoice.items.map((item) => (
                      <tr
                        key={item.partName}
                        className="border-b border-gray-100 last:border-0"
                      >
                        <td className="py-2">{item.partName}</td>
                        <td className="py-2 text-right tabular-nums">
                          {item.quantity}
                        </td>
                        <td className="py-2 text-right tabular-nums">
                          {formatAmount(item.unitCostPrice)}
                        </td>
                        <td className="py-2 text-right tabular-nums">
                          {formatAmount(item.totalPrice)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td
                        colSpan={3}
                        className="pt-3 text-right font-semibold text-sm"
                      >
                        Total
                      </td>
                      <td className="pt-3 text-right font-bold tabular-nums">
                        {formatAmount(viewingInvoice.totalAmount)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </Modal.Body>
            </Modal.Dialog>
          )}
        </Modal.Container>
      </Modal.Backdrop>
    </div>
  );
}
