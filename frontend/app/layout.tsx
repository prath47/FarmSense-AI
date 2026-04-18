import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "@/components/dashboard/Sidebar";
import AuthGuard from "@/components/AuthGuard";

export const metadata: Metadata = {
  title: "FarmSense AI",
  description: "AI-powered farming assistant",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
