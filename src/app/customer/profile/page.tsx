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
import { apiFetch } from "@/lib/api";

interface ApiResponse<T> {
  success: boolean;
  message: string | null;
  data: T | null;
  errors: string[] | null;
}

interface CustomerProfile {
  id: number;
  fullName: string;
  email: string;
  phoneNumber: string;
  homeAddress: string;
}

interface Vehicle {
  id: number;
  plateNumber: string;
  make: string;
  model: string;
  year: number;
}

interface VehicleDto {
  PlateNumber: string;
  Make: string;
  Model: string;
  Year: number;
}

interface VehicleMutationInput extends VehicleDto {
  vehicleId?: number;
}

const fetchProfile = () =>
  apiFetch<ApiResponse<CustomerProfile>>("/api/Customer/profile");

const fetchVehicles = () =>
  apiFetch<ApiResponse<Vehicle[]>>("/api/Customer/vehicles");

const updateProfile = (dto: {
  FullName: string;
  PhoneNumber: string;
  HomeAddress: string;
}) =>
  apiFetch<ApiResponse<CustomerProfile>>("/api/Customer/profile", {
    method: "PUT",
    body: JSON.stringify(dto),
  });

const changePassword = (dto: {
  CurrentPassword: string;
  NewPassword: string;
  ConfirmNewPassword: string;
}) =>
  apiFetch<ApiResponse<object>>("/api/Customer/password", {
    method: "PUT",
    body: JSON.stringify(dto),
  });

const createVehicle = (dto: VehicleDto) =>
  apiFetch<ApiResponse<Vehicle>>("/api/Customer/vehicles", {
    method: "POST",
    body: JSON.stringify(dto),
  });

const updateVehicle = (id: number, dto: VehicleDto) =>
  apiFetch<ApiResponse<Vehicle>>(`/api/Customer/vehicles/${id}`, {
    method: "PUT",
    body: JSON.stringify(dto),
  });

const deleteVehicle = (id: number) =>
  apiFetch<ApiResponse<object>>(`/api/Customer/vehicles/${id}`, {
    method: "DELETE",
  });

// ── Page ─────────────────────────────────────────────────────────────────────

export default function ProfilePage() {
  const queryClient = useQueryClient();
  const [vehicleModalOpen, setVehicleModalOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);

  useEffect(() => {
    document.title =
      "My Profile | Vehicle Parts Selling and Inventory Management System";
  }, []);

  const { data: profileData, isLoading: profileLoading } = useQuery({
    queryKey: ["customerProfile"],
    queryFn: fetchProfile,
  });

  const { data: vehiclesData, isLoading: vehiclesLoading } = useQuery({
    queryKey: ["customerVehicles"],
    queryFn: fetchVehicles,
  });

  const profile = profileData?.data;
  const vehicles = vehiclesData?.data ?? [];

  const profileMutation = useMutation({
    mutationFn: updateProfile,
    onSuccess(result) {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: ["customerProfile"] });
        setProfileSuccess("Profile updated.");
        setTimeout(() => setProfileSuccess(null), 3000);
      }
    },
  });

  const passwordMutation = useMutation({
    mutationFn: changePassword,
    onSuccess(result) {
      if (result.success) {
        setPasswordSuccess("Password changed successfully.");
        setTimeout(() => setPasswordSuccess(null), 3000);
      }
    },
  });

  const vehicleMutation = useMutation({
    mutationFn: ({ vehicleId, ...dto }: VehicleMutationInput) =>
      vehicleId !== undefined
        ? updateVehicle(vehicleId, dto)
        : createVehicle(dto),
    onSuccess(result) {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: ["customerVehicles"] });
        setVehicleModalOpen(false);
      }
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteVehicle,
    onSuccess() {
      queryClient.invalidateQueries({ queryKey: ["customerVehicles"] });
    },
  });

  function handleProfileSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    profileMutation.mutate({
      FullName: fd.get("fullName") as string,
      PhoneNumber: fd.get("phoneNumber") as string,
      HomeAddress: fd.get("homeAddress") as string,
    });
  }

  function handlePasswordSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    passwordMutation.mutate({
      CurrentPassword: fd.get("currentPassword") as string,
      NewPassword: fd.get("newPassword") as string,
      ConfirmNewPassword: fd.get("confirmNewPassword") as string,
    });
  }

  function handleVehicleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    vehicleMutation.mutate({
      ...(editingVehicle ? { vehicleId: editingVehicle.id } : {}),
      PlateNumber: fd.get("plateNumber") as string,
      Make: fd.get("make") as string,
      Model: fd.get("model") as string,
      Year: Number.parseInt(fd.get("year") as string, 10),
    });
  }

  function openAddVehicle() {
    setEditingVehicle(null);
    setVehicleModalOpen(true);
  }

  function openEditVehicle(v: Vehicle) {
    setEditingVehicle(v);
    setVehicleModalOpen(true);
  }

  function handleDeleteVehicle(v: Vehicle) {
    if (window.confirm(`Delete vehicle "${v.plateNumber}"?`)) {
      deleteMutation.mutate(v.id);
    }
  }

  return (
    <div className="flex flex-col gap-8 max-w-lg">
      <h2 className="text-xl font-bold">My Profile</h2>

      {/* Personal Details */}
      <div className="bg-white border border-gray-300 rounded p-6">
        <h3 className="font-semibold mb-4">Personal Details</h3>
        {profileLoading ? (
          <p className="text-sm text-gray-500">Loading...</p>
        ) : (
          <Form
            key={profile?.id}
            className="flex flex-col gap-4"
            onSubmit={handleProfileSubmit}
          >
            <TextField
              isRequired
              fullWidth
              name="fullName"
              defaultValue={profile?.fullName}
            >
              <Label>Full Name</Label>
              <Input />
              <FieldError />
            </TextField>

            <TextField
              isRequired
              fullWidth
              name="phoneNumber"
              defaultValue={profile?.phoneNumber}
            >
              <Label>Phone Number</Label>
              <Input />
              <FieldError />
            </TextField>

            <TextField
              isRequired
              fullWidth
              name="homeAddress"
              defaultValue={profile?.homeAddress}
            >
              <Label>Home Address</Label>
              <Input />
              <FieldError />
            </TextField>

            {profileMutation.data && !profileMutation.data.success && (
              <p className="text-red-500 text-sm">
                {profileMutation.data.message ?? "Update failed."}
              </p>
            )}
            {profileSuccess && (
              <p className="text-green-600 text-sm">{profileSuccess}</p>
            )}

            <Button type="submit" isPending={profileMutation.isPending}>
              {({ isPending }) => (
                <>
                  {isPending && <Spinner color="current" size="sm" />}
                  {isPending ? "Saving..." : "Save Changes"}
                </>
              )}
            </Button>
          </Form>
        )}
      </div>

      {/* Change Password */}
      <div className="bg-white border border-gray-300 rounded p-6">
        <h3 className="font-semibold mb-4">Change Password</h3>
        <Form className="flex flex-col gap-4" onSubmit={handlePasswordSubmit}>
          <TextField
            isRequired
            fullWidth
            name="currentPassword"
            type="password"
          >
            <Label>Current Password</Label>
            <Input placeholder="••••••••" />
            <FieldError />
          </TextField>

          <TextField isRequired fullWidth name="newPassword" type="password">
            <Label>New Password</Label>
            <Input placeholder="••••••••" />
            <FieldError />
          </TextField>

          <TextField
            isRequired
            fullWidth
            name="confirmNewPassword"
            type="password"
          >
            <Label>Confirm New Password</Label>
            <Input placeholder="••••••••" />
            <FieldError />
          </TextField>

          {passwordMutation.data && !passwordMutation.data.success && (
            <p className="text-red-500 text-sm">
              {passwordMutation.data.message ?? "Password change failed."}
            </p>
          )}
          {passwordSuccess && (
            <p className="text-green-600 text-sm">{passwordSuccess}</p>
          )}

          <Button type="submit" isPending={passwordMutation.isPending}>
            {({ isPending }) => (
              <>
                {isPending && <Spinner color="current" size="sm" />}
                {isPending ? "Changing..." : "Change Password"}
              </>
            )}
          </Button>
        </Form>
      </div>

      {/* Vehicles */}
      <div className="bg-white border border-gray-300 rounded p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">My Vehicles</h3>
          <Button size="sm" onPress={openAddVehicle}>
            Add Vehicle
          </Button>
        </div>

        {vehiclesLoading ? (
          <p className="text-sm text-gray-500">Loading...</p>
        ) : (
          <Table>
            <Table.ScrollContainer>
              <Table.Content aria-label="My vehicles">
                <Table.Header>
                  <Table.Column isRowHeader>Plate</Table.Column>
                  <Table.Column>Make</Table.Column>
                  <Table.Column>Model</Table.Column>
                  <Table.Column>Year</Table.Column>
                  <Table.Column>Actions</Table.Column>
                </Table.Header>
                <Table.Body
                  renderEmptyState={() => (
                    <p className="text-center text-sm text-gray-500 py-4">
                      No vehicles yet.
                    </p>
                  )}
                >
                  {vehicles.map((v) => (
                    <Table.Row key={v.id} id={v.id}>
                      <Table.Cell>{v.plateNumber}</Table.Cell>
                      <Table.Cell>{v.make}</Table.Cell>
                      <Table.Cell>{v.model}</Table.Cell>
                      <Table.Cell>{v.year}</Table.Cell>
                      <Table.Cell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="secondary"
                            onPress={() => openEditVehicle(v)}
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
                            onPress={() => handleDeleteVehicle(v)}
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
      </div>

      {/* Vehicle Add/Edit Modal */}
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
                    <Input placeholder="ABC-1234" />
                    <FieldError />
                  </TextField>

                  <TextField
                    isRequired
                    fullWidth
                    name="make"
                    defaultValue={editingVehicle?.make}
                  >
                    <Label>Make</Label>
                    <Input placeholder="Toyota" />
                    <FieldError />
                  </TextField>

                  <TextField
                    isRequired
                    fullWidth
                    name="model"
                    defaultValue={editingVehicle?.model}
                  >
                    <Label>Model</Label>
                    <Input placeholder="Corolla" />
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
                    <Input placeholder="2020" />
                    <FieldError />
                  </TextField>

                  {vehicleMutation.data && !vehicleMutation.data.success && (
                    <p className="text-red-500 text-sm">
                      {vehicleMutation.data.message ??
                        "Failed to save vehicle."}
                    </p>
                  )}

                  <div className="flex gap-2 justify-end pt-2">
                    <Button
                      type="button"
                      variant="secondary"
                      onPress={() => setVehicleModalOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" isPending={vehicleMutation.isPending}>
                      {({ isPending }) => (
                        <>
                          {isPending && <Spinner color="current" size="sm" />}
                          {isPending
                            ? "Saving..."
                            : editingVehicle
                              ? "Save Changes"
                              : "Add Vehicle"}
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
