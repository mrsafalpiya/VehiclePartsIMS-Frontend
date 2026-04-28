"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const raw = localStorage.getItem("auth_user");
    if (!raw) {
      router.replace("/login");
      return;
    }
    const user = JSON.parse(raw);
    if (user.role === "Customer") router.replace("/customer/profile");
    else router.replace("/dashboard");
  }, [router]);

  return null;
}
