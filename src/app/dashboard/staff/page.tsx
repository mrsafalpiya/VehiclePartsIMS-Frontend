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
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

interface ApiResponse<T> {
  success: boolean;
  message: string | null;
  data: T | null;
  errors: string[] | null;
}

interface Staff {
  id: number;
  fullName: string;
  email: string;
  phoneNumber: string;
  role: string;
}

interface CreateStaffPayload {
  fullName: string;
  email: string;
  phoneNumber: string;
  role: string;
  password: string;
  confirmPassword: string;
}

interface UpdateStaffPayload {
  fullName: string;
  email: string;
  phoneNumber: string;
  role: string;
  password?: string;
  confirmPassword?: string;
}

const fetchStaff = () => apiFetch<ApiResponse<Staff[]>>("/api/Staff");

const createStaff = (payload: CreateStaffPayload) =>
  apiFetch<ApiResponse<Staff>>("/api/Staff", {
    method: "POST",
    body: JSON.stringify(payload),
  });

const updateStaff = (id: number, payload: UpdateStaffPayload) =>
  apiFetch<ApiResponse<Staff>>(`/api/Staff/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });

const deleteStaff = (id: number) =>
  apiFetch<ApiResponse<object>>(`/api/Staff/${id}`, { method: "DELETE" });

interface StaffFormProps {
  initial?: Staff;
  onClose: () => void;
}

function StaffForm({ initial, onClose }: StaffFormProps) {
  const queryClient = useQueryClient();
  const isEdit = !!initial;
  const [role, setRole] = useState<Key>(initial?.role ?? "Staff");
  const [serverError, setServerError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: (data: CreateStaffPayload | UpdateStaffPayload) =>
      isEdit && initial
        ? updateStaff(initial.id, data as UpdateStaffPayload)
        : createStaff(data as CreateStaffPayload),
    onSuccess(result) {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: ["staff"] });
        onClose();
      } else {
        setServerError(
          result.message ?? result.errors?.[0] ?? "Something went wrong.",
        );
      }
    },
  });

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setServerError(null);
    const fd = new FormData(e.currentTarget);

    const password = fd.get("password") as string;
    const confirmPassword = fd.get("confirmPassword") as string;

    if (isEdit) {
      const payload: UpdateStaffPayload = {
        fullName: fd.get("fullName") as string,
        email: fd.get("email") as string,
        phoneNumber: fd.get("phoneNumber") as string,
        role: String(role),
        ...(password ? { password, confirmPassword } : {}),
      };
      mutation.mutate(payload);
    } else {
      const payload: CreateStaffPayload = {
        fullName: fd.get("fullName") as string,
        email: fd.get("email") as string,
        phoneNumber: fd.get("phoneNumber") as string,
        role: String(role),
        password,
        confirmPassword,
      };
      mutation.mutate(payload);
    }
  }

  return (
    <Form className="flex flex-col gap-4" onSubmit={handleSubmit}>
      <TextField
        isRequired
        fullWidth
        name="fullName"
        defaultValue={initial?.fullName}
      >
        <Label>Full Name</Label>
        <Input placeholder="John Smith" />
        <FieldError />
      </TextField>

      <TextField
        isRequired
        fullWidth
        name="email"
        type="email"
        defaultValue={initial?.email}
      >
        <Label>Email</Label>
        <Input placeholder="john@example.com" />
        <FieldError />
      </TextField>

      <TextField
        isRequired
        fullWidth
        name="phoneNumber"
        defaultValue={initial?.phoneNumber}
      >
        <Label>Phone Number</Label>
        <Input placeholder="+1 555 000 0000" />
        <FieldError />
      </TextField>

      <Select
        isRequired
        fullWidth
        value={role}
        onChange={(v) => v && setRole(v)}
        placeholder="Select role"
      >
        <Label>Role</Label>
        <Select.Trigger>
          <Select.Value />
          <Select.Indicator />
        </Select.Trigger>
        <Select.Popover>
          <ListBox>
            <ListBox.Item id="Admin" textValue="Admin">
              Admin
              <ListBox.ItemIndicator />
            </ListBox.Item>
            <ListBox.Item id="Staff" textValue="Staff">
              Staff
              <ListBox.ItemIndicator />
            </ListBox.Item>
          </ListBox>
        </Select.Popover>
      </Select>

      <TextField
        fullWidth={!isEdit}
        isRequired={!isEdit}
        name="password"
        type="password"
      >
        <Label>
          {isEdit ? "New Password (leave blank to keep)" : "Password"}
        </Label>
        <Input placeholder="••••••••" />
        <FieldError />
      </TextField>

      <TextField
        fullWidth={!isEdit}
        isRequired={!isEdit}
        name="confirmPassword"
        type="password"
      >
        <Label>Confirm Password</Label>
        <Input placeholder="••••••••" />
        <FieldError />
      </TextField>

      {serverError && <p className="text-red-500 text-sm">{serverError}</p>}

      <div className="flex gap-2 justify-end pt-2">
        <Button type="button" variant="secondary" onPress={onClose}>
          Cancel
        </Button>
        <Button type="submit" isPending={mutation.isPending}>
          {({ isPending }) => (
            <>
              {isPending && <Spinner color="current" size="sm" />}
              {isPending ? "Saving..." : isEdit ? "Save Changes" : "Add Staff"}
            </>
          )}
        </Button>
      </div>
    </Form>
  );
}

export default function StaffPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);

  useEffect(() => {
    if (!localStorage.getItem("auth_token")) {
      router.replace("/login");
    }
  }, [router]);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["staff"],
    queryFn: fetchStaff,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteStaff,
    onSuccess() {
      queryClient.invalidateQueries({ queryKey: ["staff"] });
    },
  });

  function openAdd() {
    setEditingStaff(null);
    setModalOpen(true);
  }

  function openEdit(staff: Staff) {
    setEditingStaff(staff);
    setModalOpen(true);
  }

  function handleDelete(staff: Staff) {
    if (window.confirm(`Delete staff member "${staff.fullName}"?`)) {
      deleteMutation.mutate(staff.id);
    }
  }

  const staffList = data?.data ?? [];

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">Staff Management</h2>
        <Button onPress={openAdd}>Add Staff</Button>
      </div>

      {isLoading && <p className="text-sm text-gray-500">Loading...</p>}
      {isError && <p className="text-sm text-red-500">Failed to load staff.</p>}

      {!isLoading && (
        <Table>
          <Table.ScrollContainer>
            <Table.Content aria-label="Staff list" className="min-w-150">
              <Table.Header>
                <Table.Column isRowHeader>Name</Table.Column>
                <Table.Column>Email</Table.Column>
                <Table.Column>Phone</Table.Column>
                <Table.Column>Role</Table.Column>
                <Table.Column>Actions</Table.Column>
              </Table.Header>
              <Table.Body
                renderEmptyState={() => (
                  <p className="text-center text-sm text-gray-500 py-6">
                    No staff members yet.
                  </p>
                )}
              >
                {staffList.map((s) => (
                  <Table.Row key={s.id} id={s.id}>
                    <Table.Cell>{s.fullName}</Table.Cell>
                    <Table.Cell>{s.email}</Table.Cell>
                    <Table.Cell>{s.phoneNumber}</Table.Cell>
                    <Table.Cell>{s.role}</Table.Cell>
                    <Table.Cell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="secondary"
                          onPress={() => openEdit(s)}
                        >
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="danger"
                          isPending={
                            deleteMutation.isPending &&
                            deleteMutation.variables === s.id
                          }
                          onPress={() => handleDelete(s)}
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
                {editingStaff ? "Edit Staff Member" : "Add Staff Member"}
              </Modal.Heading>
            </Modal.Header>
            <Modal.Body>
              {modalOpen && (
                <StaffForm
                  initial={editingStaff ?? undefined}
                  onClose={() => setModalOpen(false)}
                />
              )}
            </Modal.Body>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </div>
  );
}
