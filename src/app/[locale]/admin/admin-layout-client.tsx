"use client";

import * as React from "react";

import { Menu } from "lucide-react";
import { SessionProvider, useSession } from "next-auth/react";


import { Toaster } from "@/components/admin/common/Toast";
import { AdminSidebar } from "@/components/admin/layout/AdminSidebar";
import { ProtectedRoute } from "@/components/admin/ProtectedRoute";

/**
 * Client-Side Admin Layout Content
 * =================================
 *
 * Handles:
 * - SessionProvider for useSession hook
 * - Client-side redirect fallback (ProtectedRoute)
 * - UI rendering with user session data
 * - Mobile-responsive sidebar with hamburger toggle
 *
 * Note: Server-side auth check in parent layout prevents initial content flash
 * This provides defense-in-depth with client-side fallback
 */
const AdminLayoutContent = ({ children }: { children: React.ReactNode }) => {
  const { data: session } = useSession();
  const [sidebarOpen, setSidebarOpen] = React.useState(false);

  const handleCloseSidebar = React.useCallback(() => {
    setSidebarOpen(false);
  }, []);

  const handleToggleSidebar = React.useCallback(() => {
    setSidebarOpen((prev) => !prev);
  }, []);

  // Close sidebar on escape key
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && sidebarOpen) {
        setSidebarOpen(false);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [sidebarOpen]);

  return (
    <ProtectedRoute>
      <div
        className="flex h-screen relative overflow-hidden"
        style={{
          background: `
            radial-gradient(circle at 30% 20%, #4A6FDC 0%, transparent 50%),
            radial-gradient(circle at 70% 80%, #6B75D6 0%, transparent 50%),
            linear-gradient(135deg, #2E3548 0%, #3A3F4E 100%)`,
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

        {/* Sidebar — desktop: always visible, mobile: drawer */}
        <div className="hidden md:flex">
          <AdminSidebar />
        </div>

        {/* Mobile sidebar drawer */}
        <div className="md:hidden">
          <AdminSidebar isOpen={sidebarOpen} onClose={handleCloseSidebar} />
        </div>

        {/* Main content area */}
        <div className="flex flex-1 flex-col overflow-hidden relative z-10 min-w-0">
          <header className="border-b border-white/10 bg-white/5 backdrop-blur-md px-4 py-4 md:px-8">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                {/* Hamburger menu — mobile only */}
                <button
                  type="button"
                  onClick={handleToggleSidebar}
                  className="flex h-11 w-11 items-center justify-center rounded-lg text-white/70 hover:bg-white/10 hover:text-white transition-colors md:hidden"
                  aria-label="Open navigation menu"
                  aria-expanded={sidebarOpen}
                  aria-controls="admin-sidebar"
                >
                  <Menu className="h-5 w-5" />
                </button>
                <h1 className="text-lg font-semibold text-white">Admin Panel</h1>
              </div>
              {session?.user ? (
                <div className="flex items-center gap-3">
                  <span className="text-sm text-white/70 truncate max-w-[140px] md:max-w-none">
                    {session.user.name || session.user.email}
                  </span>
                </div>
              ) : null}
            </div>
          </header>
          <main id="main-content" className="flex-1 overflow-y-auto p-4 md:p-8">
            {children}
          </main>
        </div>
      </div>
      <Toaster />
    </ProtectedRoute>
  );
};

/** Admin layout wrapper with sidebar navigation and auth protection. */
export const AdminLayoutClient = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  return (
    <SessionProvider>
      <AdminLayoutContent>{children}</AdminLayoutContent>
    </SessionProvider>
  );
};
