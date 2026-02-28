import * as React from "react";

import { AdminLayoutClient } from "./admin-layout-client";

/**
 * Server-Side Admin Layout
 * ========================
 *
 * Security Model:
 * - Individual admin pages use requireAuth() for server-side protection
 * - This layout provides SessionProvider for client components
 * - Defense-in-depth: server-side (requireAuth) + client-side (ProtectedRoute)
 *
 * Why not check auth in layout:
 * - Layouts can't access the current pathname to exclude login page
 * - Individual pages have better context for auth requirements
 * - See: src/lib/auth.ts requireAuth() helper for page-level protection
 *
 * Usage in protected pages:
 * ```typescript
 * import { requireAuth } from '@/lib/auth';
 *
 * export default async function AdminPage() {
 *   await requireAuth(); // Server-side redirect if not authenticated
 *   // ... rest of page
 * }
 * ```
 */
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AdminLayoutClient>{children}</AdminLayoutClient>;
}
