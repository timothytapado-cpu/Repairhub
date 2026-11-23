import "./globals.css";
import "leaflet/dist/leaflet.css";
import type { Metadata } from "next";
import { Suspense } from "react";
import { NavProgress } from "@/components/nav-progress";

export const metadata: Metadata = {
  title: "Mobile RepairHub",
  description: "Find phone repair shops near you. Track your repair. Run your shop.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Suspense fallback={null}>
          <NavProgress />
        </Suspense>
        {children}
      </body>
    </html>
  );
}
