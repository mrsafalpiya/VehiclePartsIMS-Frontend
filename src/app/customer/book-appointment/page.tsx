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
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { apiFetchDirect } from "@/lib/api";

interface AppointmentResponse {
  id: number;
}

function getCustomerId(): number {
  const raw =
    typeof window !== "undefined" ? localStorage.getItem("auth_user") : null;
  if (!raw) return 0;
  return (JSON.parse(raw) as { userId: number }).userId;
}

const today = new Date().toISOString().split("T")[0];

function currentTime(): string {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
}

export default function BookAppointmentPage() {
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState("");

  const mutation = useMutation({
    mutationFn: (dto: { PreferredDate: string; PreferredTime: string }) =>
      apiFetchDirect<AppointmentResponse>(
        `/api/Appointment?customerId=${getCustomerId()}`,
        { method: "POST", body: JSON.stringify(dto) },
      ),
    onSuccess() {
      setSuccess("Appointment booked successfully.");
      setTimeout(() => setSuccess(null), 4000);
    },
  });

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    mutation.mutate({
      PreferredDate: fd.get("preferredDate") as string,
      PreferredTime: fd.get("preferredTime") as string,
    });
    e.currentTarget.reset();
  }

  return (
    <div className="max-w-md">
      <h2 className="text-xl font-bold mb-6">Book an Appointment</h2>
      <div className="bg-white border border-gray-300 rounded p-6">
        <Form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <TextField isRequired fullWidth name="preferredDate" type="date">
            <Label>Preferred Date</Label>
            <Input
              min={today}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
            <FieldError />
          </TextField>

          <TextField isRequired fullWidth name="preferredTime" type="time">
            <Label>Preferred Time</Label>
            <Input min={selectedDate === today ? currentTime() : undefined} />
            <FieldError />
          </TextField>

          {mutation.isError && (
            <p className="text-red-500 text-sm">
              {(mutation.error as Error).message}
            </p>
          )}
          {success && <p className="text-green-600 text-sm">{success}</p>}

          <Button type="submit" isPending={mutation.isPending}>
            {({ isPending }) => (
              <>
                {isPending && <Spinner color="current" size="sm" />}
                {isPending ? "Booking..." : "Book Appointment"}
              </>
            )}
          </Button>
        </Form>
      </div>
    </div>
  );
}
