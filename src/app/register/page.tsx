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
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { apiFetch } from "@/lib/api";

interface ApiResponse<T> {
  success: boolean;
  message: string | null;
  data: T | null;
  errors: string[] | null;
}

interface RegisterPayload {
  FullName: string;
  Email: string;
  PhoneNumber: string;
  HomeAddress: string;
  Password: string;
  ConfirmPassword: string;
}

function registerRequest(payload: RegisterPayload) {
  return apiFetch<ApiResponse<unknown>>("/api/Customer/register", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export default function RegisterPage() {
  const router = useRouter();

  useEffect(() => {
    const raw = localStorage.getItem("auth_user");
    if (raw) {
      const user = JSON.parse(raw);
      if (user.role === "Customer") router.replace("/customer/profile");
    }
  }, [router]);

  const mutation = useMutation({
    mutationFn: registerRequest,
    onSuccess(result) {
      if (result.success) {
        router.push("/customer/login");
      }
    },
  });

  const errorMessage =
    mutation.data && !mutation.data.success
      ? (mutation.data.message ??
        mutation.data.errors?.[0] ??
        "Registration failed.")
      : mutation.isError
        ? "Unable to connect to the server."
        : null;

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    mutation.mutate({
      FullName: fd.get("fullName") as string,
      Email: fd.get("email") as string,
      PhoneNumber: fd.get("phoneNumber") as string,
      HomeAddress: fd.get("homeAddress") as string,
      Password: fd.get("password") as string,
      ConfirmPassword: fd.get("confirmPassword") as string,
    });
  }

  return (
    <main className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-white border border-gray-300 rounded p-8">
        <h1 className="text-xl font-bold text-center mb-6">Create Account</h1>

        <Form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <TextField isRequired fullWidth name="fullName">
            <Label>Full Name</Label>
            <Input placeholder="John Smith" />
            <FieldError />
          </TextField>

          <TextField isRequired fullWidth name="email" type="email">
            <Label>Email</Label>
            <Input placeholder="john@example.com" />
            <FieldError />
          </TextField>

          <TextField isRequired fullWidth name="phoneNumber">
            <Label>Phone Number</Label>
            <Input placeholder="+1 555 000 0000" />
            <FieldError />
          </TextField>

          <TextField isRequired fullWidth name="homeAddress">
            <Label>Home Address</Label>
            <Input placeholder="123 Main St" />
            <FieldError />
          </TextField>

          <TextField isRequired fullWidth name="password" type="password">
            <Label>Password</Label>
            <Input placeholder="••••••••" />
            <FieldError />
          </TextField>

          <TextField
            isRequired
            fullWidth
            name="confirmPassword"
            type="password"
          >
            <Label>Confirm Password</Label>
            <Input placeholder="••••••••" />
            <FieldError />
          </TextField>

          {errorMessage && (
            <p className="text-red-500 text-sm">{errorMessage}</p>
          )}

          <Button type="submit" fullWidth isPending={mutation.isPending}>
            {({ isPending }) => (
              <>
                {isPending && <Spinner color="current" size="sm" />}
                {isPending ? "Creating account..." : "Register"}
              </>
            )}
          </Button>
        </Form>

        <p className="text-sm text-center mt-4">
          Already have an account?{" "}
          <Link href="/login" className="underline">
            Log in
          </Link>
        </p>
      </div>
    </main>
  );
}
