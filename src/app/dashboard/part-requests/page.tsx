"use client";

import { Button, Spinner } from "@heroui/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetchDirect } from "@/lib/api";

interface PartRequestResponseDto {
  id: number;
  customerId: number;
  customerName: string;
  partName: string;
  notes: string | null;
  status: string;
  createdAt: string;
  updatedAt: string | null;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
}

// Status is an enum: 0 = Pending, 1 = Done
const STATUS_MAP: Record<string, number> = { Pending: 0, Done: 1 };

const statusBadge = (status: string) => {
  if (status === "Done") return "border-green-400 text-green-700 bg-green-50";
  return "border-yellow-400 text-yellow-700 bg-yellow-50";
};

export default function PartRequestsPage() {
  const queryClient = useQueryClient();

  const {
    data: requests = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["partRequests"],
    queryFn: () =>
      apiFetchDirect<ApiResponse<PartRequestResponseDto[]>>(
        "/api/PartRequest",
      ).then((r) => r.data),
  });

  const statusMutation = useMutation({
    mutationFn: (dto: { Id: number; Status: number }) =>
      apiFetchDirect<ApiResponse<PartRequestResponseDto>>(
        "/api/PartRequest/status",
        {
          method: "PUT",
          body: JSON.stringify(dto),
        },
      ),
    onSuccess() {
      queryClient.invalidateQueries({ queryKey: ["partRequests"] });
    },
  });

  function toggleStatus(req: PartRequestResponseDto) {
    const next =
      req.status === "Pending" ? STATUS_MAP.Done : STATUS_MAP.Pending;
    statusMutation.mutate({ Id: req.id, Status: next });
  }

  return (
    <div>
      <h2 className="text-xl font-bold mb-6">Part Requests</h2>

      {isLoading && <p className="text-sm text-gray-500">Loading...</p>}
      {isError && (
        <p className="text-sm text-red-500">Failed to load part requests.</p>
      )}

      {!isLoading && requests.length === 0 && (
        <p className="text-sm text-gray-500">No part requests yet.</p>
      )}

      {requests.length > 0 && (
        <div className="bg-white border border-gray-300 rounded overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-2 font-medium text-gray-600">
                  Customer
                </th>
                <th className="text-left px-4 py-2 font-medium text-gray-600">
                  Part Name
                </th>
                <th className="text-left px-4 py-2 font-medium text-gray-600">
                  Notes
                </th>
                <th className="text-left px-4 py-2 font-medium text-gray-600">
                  Submitted
                </th>
                <th className="text-left px-4 py-2 font-medium text-gray-600">
                  Status
                </th>
                <th className="px-4 py-2" />
              </tr>
            </thead>
            <tbody>
              {requests.map((req) => (
                <tr
                  key={req.id}
                  className="border-b border-gray-100 last:border-0"
                >
                  <td className="px-4 py-2">{req.customerName}</td>
                  <td className="px-4 py-2 font-medium">{req.partName}</td>
                  <td className="px-4 py-2 text-gray-500">
                    {req.notes ?? "—"}
                  </td>
                  <td className="px-4 py-2 text-gray-500">
                    {new Date(req.createdAt).toLocaleDateString(undefined, {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </td>
                  <td className="px-4 py-2">
                    <span
                      className={`text-xs px-2 py-0.5 rounded border ${statusBadge(req.status)}`}
                    >
                      {req.status}
                    </span>
                  </td>
                  <td className="px-4 py-2">
                    <Button
                      size="sm"
                      variant="outline"
                      isPending={
                        statusMutation.isPending &&
                        statusMutation.variables?.Id === req.id
                      }
                      onPress={() => toggleStatus(req)}
                    >
                      {({ isPending }) => (
                        <>
                          {isPending && <Spinner color="current" size="sm" />}
                          {req.status === "Pending"
                            ? "Mark Done"
                            : "Mark Pending"}
                        </>
                      )}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
