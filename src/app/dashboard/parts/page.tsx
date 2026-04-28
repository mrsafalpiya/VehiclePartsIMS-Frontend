"use client";

import type { Key } from "@heroui/react";
import {
  Button,
  FieldError,
  Form,
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

// ── Types ────────────────────────────────────────────────────────────────────

interface Vendor {
  id: number;
  vendorName: string;
}

interface Part {
  id: number;
  partName: string;
  partCode: string;
  sellingPrice: number;
  stockQuantity: number;
  vendorId: number;
  vendorName: string;
}

interface PartDto {
  PartName: string;
  PartCode: string;
  SellingPrice: number;
  StockQuantity: number;
  VendorId: number;
}

interface PartMutationInput extends PartDto {
  partId?: number;
}

// ── API ──────────────────────────────────────────────────────────────────────

const fetchParts = () => apiFetchDirect<Part[]>("/api/Part");

const fetchVendors = () => apiFetchDirect<Vendor[]>("/api/Vendor");

const savePart = ({ partId, ...dto }: PartMutationInput) =>
  partId !== undefined
    ? apiFetchDirect<Part>(`/api/Part/${partId}`, {
        method: "PUT",
        body: JSON.stringify(dto),
      })
    : apiFetchDirect<Part>("/api/Part", {
        method: "POST",
        body: JSON.stringify(dto),
      });

const removePart = (id: number) =>
  apiFetchDirect<string>(`/api/Part/${id}`, { method: "DELETE" });

// ── Page ─────────────────────────────────────────────────────────────────────

export default function PartsPage() {
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPart, setEditingPart] = useState<Part | null>(null);
  const [vendorId, setVendorId] = useState<Key>("");
  const [mutationError, setMutationError] = useState<string | null>(null);

  useEffect(() => {
    document.title =
      "Parts Management | Vehicle Parts Selling and Inventory Management System";
  }, []);

  const { data: parts = [], isLoading: partsLoading } = useQuery({
    queryKey: ["parts"],
    queryFn: fetchParts,
  });

  const { data: vendors = [] } = useQuery({
    queryKey: ["vendors", ""],
    queryFn: fetchVendors,
  });

  const saveMutation = useMutation({
    mutationFn: savePart,
    onSuccess() {
      queryClient.invalidateQueries({ queryKey: ["parts"] });
      setModalOpen(false);
      setMutationError(null);
    },
    onError(err: Error) {
      setMutationError(err.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: removePart,
    onSuccess() {
      queryClient.invalidateQueries({ queryKey: ["parts"] });
    },
    onError(err: Error) {
      window.alert(err.message);
    },
  });

  function openAdd() {
    setEditingPart(null);
    setVendorId("");
    setMutationError(null);
    setModalOpen(true);
  }

  function openEdit(p: Part) {
    setEditingPart(p);
    setVendorId(String(p.vendorId));
    setMutationError(null);
    setModalOpen(true);
  }

  function handleDelete(p: Part) {
    if (window.confirm(`Delete part "${p.partName}"?`)) {
      deleteMutation.mutate(p.id);
    }
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    saveMutation.mutate({
      ...(editingPart ? { partId: editingPart.id } : {}),
      PartName: fd.get("partName") as string,
      PartCode: fd.get("partCode") as string,
      SellingPrice: Number.parseFloat(fd.get("sellingPrice") as string),
      StockQuantity: Number.parseInt(fd.get("stockQuantity") as string, 10),
      VendorId: Number.parseInt(String(vendorId), 10),
    });
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">Parts Management</h2>
        <Button onPress={openAdd}>Add Part</Button>
      </div>

      {partsLoading && <p className="text-sm text-gray-500">Loading...</p>}

      {!partsLoading && (
        <Table>
          <Table.ScrollContainer>
            <Table.Content aria-label="Parts list">
              <Table.Header>
                <Table.Column isRowHeader>Part Name</Table.Column>
                <Table.Column>Code</Table.Column>
                <Table.Column>Selling Price</Table.Column>
                <Table.Column>Stock</Table.Column>
                <Table.Column>Vendor</Table.Column>
                <Table.Column>Actions</Table.Column>
              </Table.Header>
              <Table.Body
                renderEmptyState={() => (
                  <p className="text-center text-sm text-gray-500 py-6">
                    No parts found.
                  </p>
                )}
              >
                {parts.map((p) => (
                  <Table.Row key={p.id} id={p.id}>
                    <Table.Cell>{p.partName}</Table.Cell>
                    <Table.Cell>{p.partCode}</Table.Cell>
                    <Table.Cell>{p.sellingPrice.toFixed(2)}</Table.Cell>
                    <Table.Cell>{p.stockQuantity}</Table.Cell>
                    <Table.Cell>{p.vendorName}</Table.Cell>
                    <Table.Cell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="secondary"
                          onPress={() => openEdit(p)}
                        >
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="danger"
                          isPending={
                            deleteMutation.isPending &&
                            deleteMutation.variables === p.id
                          }
                          onPress={() => handleDelete(p)}
                        >
                          Delete
                        </Button>
                      </div>
                    </Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table.Content>
          </Table.ScrollContainer>
        </Table>
      )}

      {/* Add / Edit Modal */}
      <Modal.Backdrop
        isDismissable={false}
        isOpen={modalOpen}
        onOpenChange={setModalOpen}
      >
        <Modal.Container size="sm">
          <Modal.Dialog>
            <Modal.CloseTrigger />
            <Modal.Header>
              <Modal.Heading>
                {editingPart ? "Edit Part" : "Add Part"}
              </Modal.Heading>
            </Modal.Header>
            <Modal.Body>
              {modalOpen && (
                <Form className="flex flex-col gap-4" onSubmit={handleSubmit}>
                  <TextField
                    isRequired
                    fullWidth
                    name="partName"
                    defaultValue={editingPart?.partName}
                  >
                    <Label>Part Name</Label>
                    <Input placeholder="Brake Pad" />
                    <FieldError />
                  </TextField>

                  <TextField
                    isRequired
                    fullWidth
                    name="partCode"
                    defaultValue={editingPart?.partCode}
                  >
                    <Label>Part Code</Label>
                    <Input placeholder="BP-001" />
                    <FieldError />
                  </TextField>

                  <TextField
                    isRequired
                    fullWidth
                    name="sellingPrice"
                    type="number"
                    defaultValue={editingPart?.sellingPrice?.toString()}
                  >
                    <Label>Selling Price</Label>
                    <Input placeholder="0.00" />
                    <FieldError />
                  </TextField>

                  <TextField
                    isRequired
                    fullWidth
                    name="stockQuantity"
                    type="number"
                    defaultValue={editingPart?.stockQuantity?.toString()}
                  >
                    <Label>Stock Quantity</Label>
                    <Input placeholder="0" />
                    <FieldError />
                  </TextField>

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
                        {vendors.map((vendor) => (
                          <ListBox.Item
                            key={vendor.id}
                            id={String(vendor.id)}
                            textValue={vendor.vendorName}
                          >
                            {vendor.vendorName}
                            <ListBox.ItemIndicator />
                          </ListBox.Item>
                        ))}
                      </ListBox>
                    </Select.Popover>
                  </Select>

                  {mutationError && (
                    <p className="text-red-500 text-sm">{mutationError}</p>
                  )}

                  <div className="flex gap-2 justify-end pt-2">
                    <Button
                      type="button"
                      variant="secondary"
                      onPress={() => setModalOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" isPending={saveMutation.isPending}>
                      {({ isPending }) => (
                        <>
                          {isPending && <Spinner color="current" size="sm" />}
                          {isPending
                            ? "Saving..."
                            : editingPart
                              ? "Save Changes"
                              : "Add Part"}
                        </>
                      )}
                    </Button>
                  </div>
                </Form>
              )}
            </Modal.Body>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </div>
  );
}
