"use client";

import { Spinner, Table } from "@heroui/react";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";

interface ApiResponse<T> {
  success: boolean;
  message: string | null;
  data: T | null;
  errors: string[] | null;
}

interface Appointment {
  id: number;
  customerName: string;
  preferredDate: string;
  preferredTime: string;
  status: string;
  createdAt: string;
}

const fetchAppointments = () =>
  apiFetch<ApiResponse<Appointment[]>>("/api/Appointment");

export default function StaffAppointmentsPage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["staffAppointments"],
    queryFn: fetchAppointments,
  });

  const appointments = data?.data ?? [];

  return (
    <div>
      <h2 className="text-xl font-bold mb-6">Upcoming Appointments</h2>

      {isLoading && (
        <div className="flex items-center gap-2 text-gray-500">
          <Spinner size="sm" />
          <span className="text-sm">Loading appointments...</span>
        </div>
      )}

      {isError && (
        <p className="text-red-500 text-sm">
          Failed to load appointments. Please try again.
        </p>
      )}

      {!isLoading && !isError && appointments.length === 0 && (
        <p className="text-gray-500 text-sm">No upcoming appointments.</p>
      )}

      {!isLoading && !isError && appointments.length > 0 && (
        <Table>
          <Table.ScrollContainer>
            <Table.Content aria-label="Upcoming appointments">
              <Table.Header>
                <Table.Column isRowHeader>Customer</Table.Column>
                <Table.Column>Date</Table.Column>
                <Table.Column>Time</Table.Column>
                <Table.Column>Status</Table.Column>
                <Table.Column>Booked At</Table.Column>
              </Table.Header>
              <Table.Body>
                {appointments.map((appt) => (
                  <Table.Row key={appt.id} id={appt.id}>
                    <Table.Cell>{appt.customerName}</Table.Cell>
                    <Table.Cell>{appt.preferredDate}</Table.Cell>
                    <Table.Cell>{appt.preferredTime}</Table.Cell>
                    <Table.Cell>{appt.status}</Table.Cell>
                    <Table.Cell>
                      {new Date(appt.createdAt).toLocaleDateString()}
                    </Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table.Content>
          </Table.ScrollContainer>
        </Table>
      )}
    </div>
  );
}
