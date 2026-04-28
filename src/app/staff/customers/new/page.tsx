"use client";

import {
  Button,
  FieldError,
  Form,
  Input,
  Label,
  Spinner,
  TextField,
} from "@heroui/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { apiFetchDirect } from "@/lib/api";

interface VehicleEntry {
  uid: string;
  plateNumber: string;
  make: string;
  model: string;
  year: string;
}

interface CustomerResponseDto {
  id: number;
  fullName: string;
  email: string;
  phoneNumber: string;
}

function makeUid() {
  return Math.random().toString(36).slice(2);
}

function emptyVehicle(): VehicleEntry {
  return { uid: makeUid(), plateNumber: "", make: "", model: "", year: "" };
}

export default function NewCustomerPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [vehicles, setVehicles] = useState<VehicleEntry[]>([emptyVehicle()]);
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    document.title =
      "Register Customer | Vehicle Parts Selling and Inventory Management System";
  }, []);

  const mutation = useMutation({
    mutationFn: (dto: object) =>
      apiFetchDirect<CustomerResponseDto>("/api/staff-customers", {
        method: "POST",
        body: JSON.stringify(dto),
      }),
    onSuccess() {
      queryClient.invalidateQueries({ queryKey: ["staff-customers"] });
      router.push("/staff/customers");
    },
    onError(err: Error) {
      setValidationError(err.message);
    },
  });

  function updateVehicle(
    uid: string,
    patch: Partial<Omit<VehicleEntry, "uid">>,
  ) {
    setVehicles((prev) =>
      prev.map((v) => (v.uid === uid ? { ...v, ...patch } : v)),
    );
  }

  function addVehicle() {
    setVehicles((prev) => [...prev, emptyVehicle()]);
  }

  function removeVehicle(uid: string) {
    setVehicles((prev) => prev.filter((v) => v.uid !== uid));
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setValidationError(null);

    const fd = new FormData(e.currentTarget);
    const password = fd.get("password") as string;
    const confirmPassword = fd.get("confirmPassword") as string;

    if (password !== confirmPassword) {
      setValidationError("Passwords do not match.");
      return;
    }

    if (vehicles.length === 0) {
      setValidationError("At least one vehicle is required.");
      return;
    }

    for (const v of vehicles) {
      if (!v.plateNumber || !v.make || !v.model || !v.year) {
        setValidationError("All vehicle fields are required.");
        return;
      }
      const year = Number.parseInt(v.year, 10);
      if (Number.isNaN(year) || v.year.length !== 4) {
        setValidationError("Year must be a 4-digit number.");
        return;
      }
    }

    mutation.mutate({
      FullName: fd.get("fullName") as string,
      Email: fd.get("email") as string,
      PhoneNumber: fd.get("phoneNumber") as string,
      HomeAddress: fd.get("homeAddress") as string,
      Password: password,
      Vehicles: vehicles.map((v) => ({
        PlateNumber: v.plateNumber,
        Make: v.make,
        Model: v.model,
        Year: Number.parseInt(v.year, 10),
      })),
    });
  }

  return (
    <div className="flex flex-col gap-6 max-w-xl">
      <div className="flex items-center gap-3">
        <Link
          href="/staff/customers"
          className="text-sm text-gray-500 hover:underline"
        >
          ← Customers
        </Link>
        <h2 className="text-xl font-bold">Register New Customer</h2>
      </div>

      <div className="bg-white border border-gray-300 rounded p-6">
        <Form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <TextField isRequired fullWidth name="fullName">
            <Label>Full Name</Label>
            <Input placeholder="Jane Doe" />
            <FieldError />
          </TextField>

          <TextField isRequired fullWidth name="email" type="email">
            <Label>Email Address</Label>
            <Input placeholder="jane@example.com" />
            <FieldError />
          </TextField>

          <TextField isRequired fullWidth name="phoneNumber">
            <Label>Phone Number</Label>
            <Input placeholder="98XXXXXXXX" />
            <FieldError />
          </TextField>

          <TextField isRequired fullWidth name="homeAddress">
            <Label>Home Address</Label>
            <Input placeholder="Kathmandu" />
            <FieldError />
          </TextField>

          <TextField isRequired fullWidth name="password" type="password">
            <Label>Password</Label>
            <Input />
            <FieldError />
          </TextField>

          <TextField
            isRequired
            fullWidth
            name="confirmPassword"
            type="password"
          >
            <Label>Confirm Password</Label>
            <Input />
            <FieldError />
          </TextField>

          {/* Vehicles */}
          <div>
            <p className="text-sm font-medium mb-2">
              Vehicles{" "}
              <span className="text-gray-400 font-normal">
                (at least one required)
              </span>
            </p>
            <div className="flex flex-col gap-4">
              {vehicles.map((v, idx) => (
                <div
                  key={v.uid}
                  className="border border-gray-200 rounded p-3 flex flex-col gap-2"
                >
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm text-gray-500">Vehicle {idx + 1}</p>
                    {vehicles.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeVehicle(v.uid)}
                        className="text-red-500 text-sm hover:underline"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      required
                      placeholder="Plate Number"
                      value={v.plateNumber}
                      onChange={(e) =>
                        updateVehicle(v.uid, { plateNumber: e.target.value })
                      }
                      className="border border-gray-300 rounded px-3 py-1.5 text-sm"
                    />
                    <input
                      required
                      placeholder="Make (e.g. Toyota)"
                      value={v.make}
                      onChange={(e) =>
                        updateVehicle(v.uid, { make: e.target.value })
                      }
                      className="border border-gray-300 rounded px-3 py-1.5 text-sm"
                    />
                    <input
                      required
                      placeholder="Model (e.g. Corolla)"
                      value={v.model}
                      onChange={(e) =>
                        updateVehicle(v.uid, { model: e.target.value })
                      }
                      className="border border-gray-300 rounded px-3 py-1.5 text-sm"
                    />
                    <input
                      required
                      placeholder="Year (e.g. 2018)"
                      value={v.year}
                      maxLength={4}
                      onChange={(e) =>
                        updateVehicle(v.uid, { year: e.target.value })
                      }
                      className="border border-gray-300 rounded px-3 py-1.5 text-sm"
                    />
                  </div>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={addVehicle}
              className="mt-3 text-sm text-gray-600 hover:underline"
            >
              + Add another vehicle
            </button>
          </div>

          {validationError && (
            <p className="text-red-500 text-sm">{validationError}</p>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <Link href="/staff/customers">
              <Button variant="outline" size="sm">
                Cancel
              </Button>
            </Link>
            <Button type="submit" isPending={mutation.isPending}>
              {({ isPending }) => (
                <>
                  {isPending && <Spinner color="current" size="sm" />}
                  {isPending ? "Registering..." : "Register Customer"}
                </>
              )}
            </Button>
          </div>
        </Form>
      </div>
    </div>
  );
}
