import { requireAuth } from "@/lib/auth";

import VideosPageClient from "./_client";

export default async function VideosPage() {
  await requireAuth();
  return <VideosPageClient />;
}
