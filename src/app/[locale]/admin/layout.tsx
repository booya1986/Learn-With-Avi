"use client";

import * as React from "react";

import { SessionProvider, useSession } from "next-auth/react";

import { Toaster } from "@/components/admin/common/Toast";
import { AdminSidebar } from "@/components/admin/layout/AdminSidebar";
import { ProtectedRoute } from "@/components/admin/ProtectedRoute";

const AdminLayoutContent = ({ children }: { children: React.ReactNode }) => {
  const { data: session } = useSession();

  return (
    <ProtectedRoute>
      <div
        className="flex h-screen relative overflow-hidden"
        style={{
          background: `
            radial-gradient(circle at 30% 20%, #4A6FDC 0%, transparent 50%),
            radial-gradient(circle at 70% 80%, #6B75D6 0%, transparent 50%),
            linear-gradient(135deg, #2E3548 0%, #3A3F4E 100%)`
        }}
      >
        {/* Pattern overlay */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.02]"
          style={{
            backgroundImage: `
              repeating-linear-gradient(
                0deg,
                transparent,
                transparent 100px,
                rgba(255, 255, 255, 0.06) 100px,
                rgba(255, 255, 255, 0.06) 102px
              ),
              repeating-linear-gradient(
                90deg,
                transparent,
                transparent 100px,
                rgba(255, 255, 255, 0.06) 100px,
                rgba(255, 255, 255, 0.06) 102px
              )
            `,
          }}
        />

        <AdminSidebar />
        <div className="flex flex-1 flex-col overflow-hidden relative z-10">
          <header className="border-b border-white/10 bg-white/5 backdrop-blur-md px-8 py-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">Admin Panel</h2>
              {session?.user ? <div className="flex items-center gap-3">
                  <span className="text-sm text-white/70">
                    {session.user.name || session.user.email}
                  </span>
                </div> : null}
            </div>
          </header>
          <main className="flex-1 overflow-y-auto p-8">
            {children}
          </main>
        </div>
      </div>
      <Toaster />
    </ProtectedRoute>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <AdminLayoutContent>{children}</AdminLayoutContent>
    </SessionProvider>
  );
}
