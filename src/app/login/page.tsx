"use client";

import type { Key } from "@heroui/react";
import {
  Button,
  FieldError,
  Form,
  Input,
  Label,
  ListBox,
  Select,
  Spinner,
  TextField,
} from "@heroui/react";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface ApiResponse<T> {
  success: boolean;
  message: string | null;
  data: T | null;
  errors: string[] | null;
}

interface LoginData {
  userId: number;
  name: string;
  email: string;
  role: string;
  token: string;
}

interface LoginPayload {
  email: string;
  password: string;
  role: string;
}

async function loginRequest(
  payload: LoginPayload,
): Promise<ApiResponse<LoginData>> {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/Auth/login`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        Email: payload.email,
        Password: payload.password,
        Role: payload.role,
      }),
    },
  );
  return res.json();
}

export default function LoginPage() {
  const router = useRouter();
  const [role, setRole] = useState<Key>("Admin");

  const mutation = useMutation({
    mutationFn: loginRequest,
    onSuccess(result) {
      if (result.success && result.data) {
        localStorage.setItem("auth_token", result.data.token);
        localStorage.setItem("auth_user", JSON.stringify(result.data));
        router.push("/dashboard");
      }
    },
  });

  const errorMessage =
    mutation.data && !mutation.data.success
      ? (mutation.data.message ??
        mutation.data.errors?.[0] ??
        "Invalid credentials.")
      : mutation.isError
        ? "Unable to connect to the server. Please try again."
        : null;

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    mutation.mutate({
      email: formData.get("email") as string,
      password: formData.get("password") as string,
      role: String(role),
    });
  }

  return (
    <main className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-white border border-gray-300 rounded p-8">
        <h1 className="text-xl font-bold text-center mb-6">Login</h1>

        <Form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <TextField isRequired fullWidth name="email" type="email">
            <Label>Email</Label>
            <Input placeholder="Enter your email" />
            <FieldError />
          </TextField>

          <TextField isRequired fullWidth name="password" type="password">
            <Label>Password</Label>
            <Input placeholder="Enter your password" />
            <FieldError />
          </TextField>

          <Select
            isRequired
            fullWidth
            value={role}
            onChange={(value) => value && setRole(value)}
            placeholder="Select your role"
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

          {errorMessage && (
            <p className="text-red-500 text-sm">{errorMessage}</p>
          )}

          <Button type="submit" fullWidth isPending={mutation.isPending}>
            {({ isPending }) => (
              <>
                {isPending && <Spinner color="current" size="sm" />}
                {isPending ? "Logging in..." : "Login"}
              </>
            )}
          </Button>
        </Form>
      </div>
    </main>
  );
}
