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

interface PartRequestResponse {
  id: number;
}

function getCustomerId(): number {
  const raw =
    typeof window !== "undefined" ? localStorage.getItem("auth_user") : null;
  if (!raw) return 0;
  return (JSON.parse(raw) as { userId: number }).userId;
}

export default function RequestPartPage() {
  const [success, setSuccess] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: (dto: { PartName: string; Notes?: string }) =>
      apiFetchDirect<PartRequestResponse>(
        `/api/PartRequest?customerId=${getCustomerId()}`,
        { method: "POST", body: JSON.stringify(dto) },
      ),
    onSuccess() {
      setSuccess("Part request submitted.");
      setTimeout(() => setSuccess(null), 4000);
    },
  });

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const notes = (fd.get("notes") as string).trim();
    mutation.mutate({
      PartName: fd.get("partName") as string,
      ...(notes ? { Notes: notes } : {}),
    });
    e.currentTarget.reset();
  }

  return (
    <div className="max-w-md">
      <h2 className="text-xl font-bold mb-6">Request a Part</h2>
      <div className="bg-white border border-gray-300 rounded p-6">
        <Form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <TextField isRequired fullWidth name="partName">
            <Label>Part Name</Label>
            <Input placeholder="e.g. Brake Pad for Toyota Corolla 2018" />
            <FieldError />
          </TextField>

          <div className="flex flex-col gap-1">
            <label htmlFor="notes" className="text-sm font-medium">
              Notes <span className="text-gray-400">(optional)</span>
            </label>
            <textarea
              id="notes"
              name="notes"
              rows={3}
              placeholder="Any additional details..."
              className="border border-gray-300 rounded px-3 py-2 text-sm resize-none"
            />
          </div>

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
                {isPending ? "Submitting..." : "Submit Request"}
              </>
            )}
          </Button>
        </Form>
      </div>
    </div>
  );
}
