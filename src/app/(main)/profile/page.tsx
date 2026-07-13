"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { useAuthStore } from "@/store/auth";

export default function ProfileRedirectPage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    if (user) {
      router.replace(`/profile/${user.id}`);
    }
  }, [user, router]);

  return null;
}
