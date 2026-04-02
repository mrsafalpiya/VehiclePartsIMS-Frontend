import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "#/context/AuthContext";
import { Spin } from "antd";

export const Route = createFileRoute("/")({
  component: IndexPage,
});

function IndexPage() {
  const { currentUser, role } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!currentUser) {
      navigate({ to: "/login" });
    } else if (role === "admin") {
      navigate({ to: "/admin" });
    } else if (role === "staff") {
      navigate({ to: "/staff" });
    } else {
      navigate({ to: "/customer" });
    }
  }, [currentUser, role, navigate]);

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
      }}
    >
      <Spin size="large" />
    </div>
  );
}
