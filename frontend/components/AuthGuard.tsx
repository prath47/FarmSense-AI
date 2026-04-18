"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/lib/store";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const token = useAppStore((s) => s.token);
  const router = useRouter();
  // Wait for Zustand persist to rehydrate from localStorage before checking auth.
  // On first render the store is empty even if localStorage has a token.
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated && !token) router.replace("/login");
  }, [hydrated, token, router]);

  if (!hydrated) return null;
  if (!token) return null;
  return <>{children}</>;
}
