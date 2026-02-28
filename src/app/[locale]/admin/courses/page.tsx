import { requireAuth } from "@/lib/auth";

import CoursesPageClient from "./_client";

export default async function CoursesPage() {
  await requireAuth();
  return <CoursesPageClient />;
}
