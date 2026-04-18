"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { login } from "@/lib/api";
import { useAppStore } from "@/lib/store";
import { Leaf } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const setAuth = useAppStore((s) => s.setAuth);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await login(email, password);
      setAuth(data.token, data.user);
      router.push("/");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-farm-pale to-white px-4">
      <div className="w-full max-w-md animate-scale-in">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-farm-green mb-4 animate-scale-in">
            <Leaf className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800">Welcome back</h1>
          <p className="text-gray-500 text-sm mt-1">Sign in to your FarmSense account</p>
        </div>

        <form onSubmit={submit} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 space-y-5">
          {error && (
            <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-lg">{error}</div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-farm-light focus:border-transparent"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-farm-light focus:border-transparent"
              placeholder="••••••••"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-farm-green text-white font-semibold py-2.5 rounded-xl hover:bg-farm-light transition-colors disabled:opacity-50"
          >
            {loading ? "Signing in…" : "Sign In"}
          </button>
          <p className="text-center text-sm text-gray-500">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="text-farm-green font-medium hover:underline">
              Create one
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
