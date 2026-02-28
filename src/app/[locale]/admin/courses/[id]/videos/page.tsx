import { requireAuth } from "@/lib/auth";

import CourseVideosPageClient from "../_client";

export default async function CourseVideosPage() {
  await requireAuth();
  return <CourseVideosPageClient />;
}
