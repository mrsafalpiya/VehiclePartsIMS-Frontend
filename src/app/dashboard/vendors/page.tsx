"use client";

import {
  Button,
  FieldError,
  Form,
  Input,
  Label,
  Modal,
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
  contactPersonName: string;
  email: string;
  phoneNumber: string;
  address: string;
}

interface VendorDto {
  VendorName: string;
  ContactPersonName: string;
  Email: string;
  PhoneNumber: string;
  Address: string;
}

interface VendorMutationInput extends VendorDto {
  vendorId?: number;
}

// ── API ──────────────────────────────────────────────────────────────────────

const fetchVendors = (search: string) =>
  apiFetchDirect<Vendor[]>(
    `/api/Vendor${search ? `?search=${encodeURIComponent(search)}` : ""}`,
  );

const saveVendor = ({ vendorId, ...dto }: VendorMutationInput) =>
  vendorId !== undefined
    ? apiFetchDirect<Vendor>(`/api/Vendor/${vendorId}`, {
        method: "PUT",
        body: JSON.stringify(dto),
      })
    : apiFetchDirect<Vendor>("/api/Vendor", {
        method: "POST",
        body: JSON.stringify(dto),
      });

const removeVendor = (id: number) =>
  apiFetchDirect<string>(`/api/Vendor/${id}`, { method: "DELETE" });

// ── Page ─────────────────────────────────────────────────────────────────────

export default function VendorsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);
  const [mutationError, setMutationError] = useState<string | null>(null);

  useEffect(() => {
    document.title =
      "Vendor Management | Vehicle Parts Selling and Inventory Management System";
  }, []);

  const { data: vendors = [], isLoading } = useQuery({
    queryKey: ["vendors", search],
    queryFn: () => fetchVendors(search),
  });

  const saveMutation = useMutation({
    mutationFn: saveVendor,
    onSuccess() {
      queryClient.invalidateQueries({ queryKey: ["vendors"] });
      setModalOpen(false);
      setMutationError(null);
    },
    onError(err: Error) {
      setMutationError(err.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: removeVendor,
    onSuccess() {
      queryClient.invalidateQueries({ queryKey: ["vendors"] });
    },
    onError(err: Error) {
      window.alert(err.message);
    },
  });

  function openAdd() {
    setEditingVendor(null);
    setMutationError(null);
    setModalOpen(true);
  }

  function openEdit(v: Vendor) {
    setEditingVendor(v);
    setMutationError(null);
    setModalOpen(true);
  }

  function handleDelete(v: Vendor) {
    if (window.confirm(`Delete vendor "${v.vendorName}"?`)) {
      deleteMutation.mutate(v.id);
    }
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    saveMutation.mutate({
      ...(editingVendor ? { vendorId: editingVendor.id } : {}),
      VendorName: fd.get("vendorName") as string,
      ContactPersonName: fd.get("contactPersonName") as string,
      Email: fd.get("email") as string,
      PhoneNumber: fd.get("phoneNumber") as string,
      Address: fd.get("address") as string,
    });
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">Vendor Management</h2>
        <Button onPress={openAdd}>Add Vendor</Button>
      </div>

      {/* Search */}
      <div className="mb-4">
        <input
          type="text"
          className="border border-gray-300 rounded px-3 py-1.5 text-sm w-64"
          placeholder="Search by vendor name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {isLoading && <p className="text-sm text-gray-500">Loading...</p>}

      {!isLoading && (
        <Table>
          <Table.ScrollContainer>
            <Table.Content aria-label="Vendors list">
              <Table.Header>
                <Table.Column isRowHeader>Vendor Name</Table.Column>
                <Table.Column>Contact Person</Table.Column>
                <Table.Column>Email</Table.Column>
                <Table.Column>Phone</Table.Column>
                <Table.Column>Address</Table.Column>
                <Table.Column>Actions</Table.Column>
              </Table.Header>
              <Table.Body
                renderEmptyState={() => (
                  <p className="text-center text-sm text-gray-500 py-6">
                    No vendors found.
                  </p>
                )}
              >
                {vendors.map((v) => (
                  <Table.Row key={v.id} id={v.id}>
                    <Table.Cell>{v.vendorName}</Table.Cell>
                    <Table.Cell>{v.contactPersonName}</Table.Cell>
                    <Table.Cell>{v.email}</Table.Cell>
                    <Table.Cell>{v.phoneNumber}</Table.Cell>
                    <Table.Cell>{v.address}</Table.Cell>
                    <Table.Cell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="secondary"
                          onPress={() => openEdit(v)}
                        >
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="danger"
                          isPending={
                            deleteMutation.isPending &&
                            deleteMutation.variables === v.id
                          }
                          onPress={() => handleDelete(v)}
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
                {editingVendor ? "Edit Vendor" : "Add Vendor"}
              </Modal.Heading>
            </Modal.Header>
            <Modal.Body>
              {modalOpen && (
                <Form className="flex flex-col gap-4" onSubmit={handleSubmit}>
                  <TextField
                    isRequired
                    fullWidth
                    name="vendorName"
                    defaultValue={editingVendor?.vendorName}
                  >
                    <Label>Vendor Name</Label>
                    <Input placeholder="Acme Parts Co." />
                    <FieldError />
                  </TextField>

                  <TextField
                    isRequired
                    fullWidth
                    name="contactPersonName"
                    defaultValue={editingVendor?.contactPersonName}
                  >
                    <Label>Contact Person</Label>
                    <Input placeholder="Jane Doe" />
                    <FieldError />
                  </TextField>

                  <TextField
                    isRequired
                    fullWidth
                    name="email"
                    type="email"
                    defaultValue={editingVendor?.email}
                  >
                    <Label>Email</Label>
                    <Input placeholder="contact@acme.com" />
                    <FieldError />
                  </TextField>

                  <TextField
                    isRequired
                    fullWidth
                    name="phoneNumber"
                    defaultValue={editingVendor?.phoneNumber}
                  >
                    <Label>Phone Number</Label>
                    <Input placeholder="+1 555 000 0000" />
                    <FieldError />
                  </TextField>

                  <TextField
                    isRequired
                    fullWidth
                    name="address"
                    defaultValue={editingVendor?.address}
                  >
                    <Label>Physical Address</Label>
                    <Input placeholder="123 Supplier St" />
                    <FieldError />
                  </TextField>

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
                            : editingVendor
                              ? "Save Changes"
                              : "Add Vendor"}
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
