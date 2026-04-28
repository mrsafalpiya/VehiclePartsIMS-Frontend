"use client";

import {
  Button,
  FieldError,
  Form,
  Input,
  Label,
  Modal,
  Spinner,
  TextField,
} from "@heroui/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { apiFetchDirect } from "@/lib/api";

interface VehicleResponseDto {
  id: number;
  plateNumber: string;
  make: string;
  model: string;
  year: number;
}

interface InvoiceItemSummaryDto {
  partName: string;
  quantity: number;
  unitSellingPrice: number;
}

interface SalesInvoiceSummaryDto {
  id: number;
  invoiceNumber: string;
  invoiceDate: string;
  paymentStatus: string;
  subtotal: number;
  loyaltyDiscount: number | null;
  finalTotal: number;
  items: InvoiceItemSummaryDto[];
}

interface StaffCustomerProfileResponseDto {
  id: number;
  fullName: string;
  email: string;
  phoneNumber: string;
  homeAddress: string;
  vehicles: VehicleResponseDto[];
  salesHistory: SalesInvoiceSummaryDto[];
}

interface MessageResponse {
  message: string;
}

function formatAmount(amount: number) {
  return `Rs. ${amount.toLocaleString()}`;
}

export default function CustomerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const customerId = Number(params.id);
  const queryClient = useQueryClient();

  const [editDetailsOpen, setEditDetailsOpen] = useState(false);
  const [vehicleModalOpen, setVehicleModalOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] =
    useState<VehicleResponseDto | null>(null);
  const [mutationError, setMutationError] = useState<string | null>(null);
  const [expandedInvoice, setExpandedInvoice] = useState<number | null>(null);

  useEffect(() => {
    document.title =
      "Customer Profile | Vehicle Parts Selling and Inventory Management System";
  }, []);

  const {
    data: profile,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["staffCustomer", customerId],
    queryFn: () =>
      apiFetchDirect<StaffCustomerProfileResponseDto>(
        `/api/staff-customers/${customerId}`,
      ),
    enabled: !Number.isNaN(customerId),
  });

  // Update customer details
  const updateDetailsMutation = useMutation({
    mutationFn: (dto: {
      FullName: string;
      PhoneNumber: string;
      HomeAddress: string;
    }) =>
      apiFetchDirect<MessageResponse>(`/api/staff-customers/${customerId}`, {
        method: "PUT",
        body: JSON.stringify(dto),
      }),
    onSuccess() {
      queryClient.invalidateQueries({
        queryKey: ["staffCustomer", customerId],
      });
      setEditDetailsOpen(false);
      setMutationError(null);
    },
    onError(err: Error) {
      setMutationError(err.message);
    },
  });

  // Add vehicle
  const addVehicleMutation = useMutation({
    mutationFn: (dto: {
      PlateNumber: string;
      Make: string;
      Model: string;
      Year: number;
    }) =>
      apiFetchDirect<MessageResponse>(
        `/api/staff-customers/${customerId}/vehicles`,
        { method: "POST", body: JSON.stringify(dto) },
      ),
    onSuccess() {
      queryClient.invalidateQueries({
        queryKey: ["staffCustomer", customerId],
      });
      setVehicleModalOpen(false);
      setMutationError(null);
    },
    onError(err: Error) {
      setMutationError(err.message);
    },
  });

  // Update vehicle
  const updateVehicleMutation = useMutation({
    mutationFn: ({
      vehicleId,
      dto,
    }: {
      vehicleId: number;
      dto: { PlateNumber: string; Make: string; Model: string; Year: number };
    }) =>
      apiFetchDirect<MessageResponse>(
        `/api/staff-customers/${customerId}/vehicles/${vehicleId}`,
        { method: "PUT", body: JSON.stringify(dto) },
      ),
    onSuccess() {
      queryClient.invalidateQueries({
        queryKey: ["staffCustomer", customerId],
      });
      setVehicleModalOpen(false);
      setMutationError(null);
    },
    onError(err: Error) {
      setMutationError(err.message);
    },
  });

  // Delete vehicle
  const deleteVehicleMutation = useMutation({
    mutationFn: (vehicleId: number) =>
      apiFetchDirect<MessageResponse>(
        `/api/staff-customers/${customerId}/vehicles/${vehicleId}`,
        { method: "DELETE" },
      ),
    onSuccess() {
      queryClient.invalidateQueries({
        queryKey: ["staffCustomer", customerId],
      });
    },
    onError(err: Error) {
      window.alert(err.message);
    },
  });

  function openAddVehicle() {
    setEditingVehicle(null);
    setMutationError(null);
    setVehicleModalOpen(true);
  }

  function openEditVehicle(v: VehicleResponseDto) {
    setEditingVehicle(v);
    setMutationError(null);
    setVehicleModalOpen(true);
  }

  function handleDeleteVehicle(v: VehicleResponseDto) {
    if (window.confirm(`Remove vehicle "${v.plateNumber}"?`)) {
      deleteVehicleMutation.mutate(v.id);
    }
  }

  function handleDetailsSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    updateDetailsMutation.mutate({
      FullName: fd.get("fullName") as string,
      PhoneNumber: fd.get("phoneNumber") as string,
      HomeAddress: fd.get("homeAddress") as string,
    });
  }

  function handleVehicleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const dto = {
      PlateNumber: fd.get("plateNumber") as string,
      Make: fd.get("make") as string,
      Model: fd.get("model") as string,
      Year: Number.parseInt(fd.get("year") as string, 10),
    };
    if (editingVehicle) {
      updateVehicleMutation.mutate({ vehicleId: editingVehicle.id, dto });
    } else {
      addVehicleMutation.mutate(dto);
    }
  }

  const vehicleMutationPending =
    addVehicleMutation.isPending || updateVehicleMutation.isPending;

  if (isLoading) return <p className="text-sm text-gray-500">Loading...</p>;
  if (isError || !profile)
    return (
      <div>
        <p className="text-sm text-red-500 mb-2">Customer not found.</p>
        <button
          type="button"
          className="text-sm text-gray-500 hover:underline"
          onClick={() => router.back()}
        >
          ← Back
        </button>
      </div>
    );

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      {/* Back */}
      <button
        type="button"
        className="text-sm text-gray-500 hover:underline self-start"
        onClick={() => router.back()}
      >
        ← Back
      </button>

      {/* Personal details */}
      <div className="bg-white border border-gray-300 rounded p-6">
        <div className="flex items-start justify-between mb-4">
          <h2 className="text-lg font-semibold">{profile.fullName}</h2>
          <Button
            size="sm"
            variant="secondary"
            onPress={() => {
              setMutationError(null);
              setEditDetailsOpen(true);
            }}
          >
            Edit
          </Button>
        </div>
        <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
          <div>
            <p className="text-gray-500">Email</p>
            <p>{profile.email}</p>
          </div>
          <div>
            <p className="text-gray-500">Phone</p>
            <p>{profile.phoneNumber}</p>
          </div>
          <div className="col-span-2">
            <p className="text-gray-500">Home Address</p>
            <p>{profile.homeAddress}</p>
          </div>
        </div>
      </div>

      {/* Vehicles */}
      <div className="bg-white border border-gray-300 rounded p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">Vehicles</h3>
          <Button size="sm" onPress={openAddVehicle}>
            Add Vehicle
          </Button>
        </div>
        {profile.vehicles.length === 0 && (
          <p className="text-sm text-gray-500">No vehicles on record.</p>
        )}
        {profile.vehicles.length > 0 && (
          <table className="w-full text-sm">
            <thead className="text-left text-gray-500 border-b border-gray-200">
              <tr>
                <th className="pb-1 font-normal">Plate</th>
                <th className="pb-1 font-normal">Make</th>
                <th className="pb-1 font-normal">Model</th>
                <th className="pb-1 font-normal">Year</th>
                <th className="pb-1" />
              </tr>
            </thead>
            <tbody>
              {profile.vehicles.map((v) => (
                <tr
                  key={v.id}
                  className="border-b border-gray-100 last:border-0"
                >
                  <td className="py-1.5 font-medium">{v.plateNumber}</td>
                  <td className="py-1.5">{v.make}</td>
                  <td className="py-1.5">{v.model}</td>
                  <td className="py-1.5">{v.year}</td>
                  <td className="py-1.5">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => openEditVehicle(v)}
                        className="text-sm text-gray-600 hover:underline"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteVehicle(v)}
                        className="text-sm text-red-500 hover:underline"
                      >
                        Remove
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Sales history */}
      <div className="bg-white border border-gray-300 rounded p-6">
        <h3 className="font-semibold mb-4">Sales History</h3>
        {profile.salesHistory.length === 0 && (
          <p className="text-sm text-gray-500">No invoices yet.</p>
        )}
        {profile.salesHistory.map((inv) => (
          <div key={inv.id} className="border border-gray-200 rounded mb-3">
            <button
              type="button"
              className="w-full flex items-center justify-between px-4 py-3 text-sm hover:bg-gray-50"
              onClick={() =>
                setExpandedInvoice(expandedInvoice === inv.id ? null : inv.id)
              }
            >
              <div className="flex items-center gap-4">
                <span className="font-medium">{inv.invoiceNumber}</span>
                <span className="text-gray-500">{String(inv.invoiceDate)}</span>
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
              <div className="flex items-center gap-3">
                <span className="font-semibold">
                  {formatAmount(inv.finalTotal)}
                </span>
                <span className="text-gray-400">
                  {expandedInvoice === inv.id ? "▲" : "▼"}
                </span>
              </div>
            </button>
            {expandedInvoice === inv.id && (
              <div className="px-4 pb-4">
                <table className="w-full text-sm mb-3">
                  <thead>
                    <tr className="text-left text-gray-500 border-b border-gray-100">
                      <th className="pb-1 font-normal">Part</th>
                      <th className="pb-1 font-normal text-right">Qty</th>
                      <th className="pb-1 font-normal text-right">
                        Unit Price
                      </th>
                      <th className="pb-1 font-normal text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {inv.items.map((item) => (
                      <tr
                        key={item.partName}
                        className="border-b border-gray-50"
                      >
                        <td className="py-1">{item.partName}</td>
                        <td className="py-1 text-right">{item.quantity}</td>
                        <td className="py-1 text-right">
                          {formatAmount(item.unitSellingPrice)}
                        </td>
                        <td className="py-1 text-right">
                          {formatAmount(item.quantity * item.unitSellingPrice)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="flex flex-col items-end gap-0.5 text-sm">
                  <p>
                    Subtotal:{" "}
                    <span className="font-medium">
                      {formatAmount(inv.subtotal)}
                    </span>
                  </p>
                  {inv.loyaltyDiscount != null && (
                    <p className="text-green-700">
                      Loyalty Discount (10%):{" "}
                      <span className="font-medium">
                        -{formatAmount(inv.loyaltyDiscount)}
                      </span>
                    </p>
                  )}
                  <p className="font-semibold">
                    Final Total: {formatAmount(inv.finalTotal)}
                  </p>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Edit details modal */}
      <Modal.Backdrop
        isDismissable={false}
        isOpen={editDetailsOpen}
        onOpenChange={setEditDetailsOpen}
      >
        <Modal.Container size="sm">
          <Modal.Dialog>
            <Modal.CloseTrigger />
            <Modal.Header>
              <Modal.Heading>Edit Customer Details</Modal.Heading>
            </Modal.Header>
            <Modal.Body>
              {editDetailsOpen && (
                <Form
                  className="flex flex-col gap-4"
                  onSubmit={handleDetailsSubmit}
                >
                  <TextField
                    isRequired
                    fullWidth
                    name="fullName"
                    defaultValue={profile.fullName}
                  >
                    <Label>Full Name</Label>
                    <Input />
                    <FieldError />
                  </TextField>
                  <TextField
                    isRequired
                    fullWidth
                    name="phoneNumber"
                    defaultValue={profile.phoneNumber}
                  >
                    <Label>Phone Number</Label>
                    <Input />
                    <FieldError />
                  </TextField>
                  <TextField
                    isRequired
                    fullWidth
                    name="homeAddress"
                    defaultValue={profile.homeAddress}
                  >
                    <Label>Home Address</Label>
                    <Input />
                    <FieldError />
                  </TextField>

                  {mutationError && (
                    <p className="text-red-500 text-sm">{mutationError}</p>
                  )}

                  <div className="flex gap-2 justify-end pt-2">
                    <Button
                      type="button"
                      variant="secondary"
                      onPress={() => setEditDetailsOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      isPending={updateDetailsMutation.isPending}
                    >
                      {({ isPending }) => (
                        <>
                          {isPending && <Spinner color="current" size="sm" />}
                          {isPending ? "Saving..." : "Save"}
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

      {/* Add / Edit vehicle modal */}
      <Modal.Backdrop
        isDismissable={false}
        isOpen={vehicleModalOpen}
        onOpenChange={setVehicleModalOpen}
      >
        <Modal.Container size="sm">
          <Modal.Dialog>
            <Modal.CloseTrigger />
            <Modal.Header>
              <Modal.Heading>
                {editingVehicle ? "Edit Vehicle" : "Add Vehicle"}
              </Modal.Heading>
            </Modal.Header>
            <Modal.Body>
              {vehicleModalOpen && (
                <Form
                  className="flex flex-col gap-4"
                  onSubmit={handleVehicleSubmit}
                >
                  <TextField
                    isRequired
                    fullWidth
                    name="plateNumber"
                    defaultValue={editingVehicle?.plateNumber}
                  >
                    <Label>Plate Number</Label>
                    <Input />
                    <FieldError />
                  </TextField>
                  <TextField
                    isRequired
                    fullWidth
                    name="make"
                    defaultValue={editingVehicle?.make}
                  >
                    <Label>Make</Label>
                    <Input placeholder="e.g. Toyota" />
                    <FieldError />
                  </TextField>
                  <TextField
                    isRequired
                    fullWidth
                    name="model"
                    defaultValue={editingVehicle?.model}
                  >
                    <Label>Model</Label>
                    <Input placeholder="e.g. Corolla" />
                    <FieldError />
                  </TextField>
                  <TextField
                    isRequired
                    fullWidth
                    name="year"
                    type="number"
                    defaultValue={editingVehicle?.year?.toString()}
                  >
                    <Label>Year</Label>
                    <Input placeholder="2018" />
                    <FieldError />
                  </TextField>

                  {mutationError && (
                    <p className="text-red-500 text-sm">{mutationError}</p>
                  )}

                  <div className="flex gap-2 justify-end pt-2">
                    <Button
                      type="button"
                      variant="secondary"
                      onPress={() => setVehicleModalOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" isPending={vehicleMutationPending}>
                      {({ isPending }) => (
                        <>
                          {isPending && <Spinner color="current" size="sm" />}
                          {isPending
                            ? "Saving..."
                            : editingVehicle
                              ? "Save"
                              : "Add"}
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
