"use client";

import * as React from "react";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";

import { Plus, Edit, Trash2, Eye, EyeOff, Play } from "lucide-react";

import { ConfirmDialog } from "@/components/admin/common/ConfirmDialog";
import { DataTable, type Column } from "@/components/admin/common/DataTable";
import { LoadingSpinner } from "@/components/admin/common/LoadingSpinner";
import { SearchInput } from "@/components/admin/common/SearchInput";
import { useToast } from "@/components/admin/common/Toast";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import { formatTime } from "@/lib/utils";

interface Video {
  id: string;
  title: string;
  youtubeId: string;
  thumbnail: string;
  duration: number;
  topic: string;
  published: boolean;
  createdAt: string;
  course: {
    id: string;
    title: string;
  };
}

export default function VideosPageClient() {
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();

  // Extract locale from pathname (e.g., /en/admin/videos -> en)
  const locale = pathname?.split('/')[1] || 'en';
  const [videos, setVideos] = React.useState<Video[]>([]);
  const [filteredVideos, setFilteredVideos] = React.useState<Video[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [deleteDialog, setDeleteDialog] = React.useState<{
    open: boolean;
    videoId: string | null;
  }>({ open: false, videoId: null });

  React.useEffect(() => {
    fetchVideos();
  }, []);

  React.useEffect(() => {
    if (searchQuery) {
      setFilteredVideos(
        videos.filter(
          (video) =>
            video.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            video.topic.toLowerCase().includes(searchQuery.toLowerCase()) ||
            video.course.title.toLowerCase().includes(searchQuery.toLowerCase())
        )
      );
    } else {
      setFilteredVideos(videos);
    }
  }, [searchQuery, videos]);

  const fetchVideos = async () => {
    try {
      const response = await fetch("/api/admin/videos");
      if (!response.ok) {throw new Error("Failed to fetch videos");}
      const data = await response.json();
      setVideos(data);
      setFilteredVideos(data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch videos",
        variant: "error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteDialog.videoId) {return;}

    try {
      const response = await fetch(`/api/admin/videos/${deleteDialog.videoId}`, {
        method: "DELETE",
      });

      if (!response.ok) {throw new Error("Failed to delete video");}

      toast({
        title: "Success",
        description: "Video deleted successfully",
        variant: "success",
      });

      fetchVideos();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete video",
        variant: "error",
      });
    }
  };

  const handleTogglePublish = async (videoId: string, published: boolean) => {
    try {
      const response = await fetch(`/api/admin/videos/${videoId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ published: !published }),
      });

      if (!response.ok) {throw new Error("Failed to update video");}

      toast({
        title: "Success",
        description: `Video ${!published ? "published" : "unpublished"}`,
        variant: "success",
      });

      fetchVideos();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update video",
        variant: "error",
      });
    }
  };

  const columns: Column<Video>[] = [
    {
      key: "thumbnail",
      header: "Preview",
      width: "w-32",
      render: (video) => (
        <img
          src={video.thumbnail}
          alt={video.title}
          className="h-16 w-28 rounded object-cover ring-1 ring-white/10"
        />
      ),
    },
    {
      key: "title",
      header: "Title",
      sortable: true,
      render: (video) => (
        <div>
          <div className="font-medium text-white">{video.title}</div>
          <div className="mt-1 text-sm text-white/70">{video.topic}</div>
        </div>
      ),
    },
    {
      key: "course",
      header: "Course",
      sortable: true,
      render: (video) => (
        <span className="text-sm text-white/80">{video.course.title}</span>
      ),
    },
    {
      key: "duration",
      header: "Duration",
      sortable: true,
      render: (video) => (
        <span className="text-sm text-white/80">{formatTime(video.duration)}</span>
      ),
    },
    {
      key: "published",
      header: "Status",
      sortable: true,
      render: (video) =>
        video.published ? (
          <span className="inline-flex rounded-full bg-green-500/20 border border-green-500/30 px-2 py-1 text-xs font-medium text-green-400">
            Published
          </span>
        ) : (
          <span className="inline-flex rounded-full bg-white/10 border border-white/20 px-2 py-1 text-xs font-medium text-white/70">
            Draft
          </span>
        ),
    },
    {
      key: "actions",
      header: "Actions",
      render: (video) => (
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={(e) => {
              e.stopPropagation();
              handleTogglePublish(video.id, video.published);
            }}
            className="text-white/70 hover:text-white hover:bg-white/10"
            title={video.published ? "Unpublish" : "Publish"}
          >
            {video.published ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={(e) => {
              e.stopPropagation();
              router.push(`/${locale}/admin/videos/${video.id}/edit`);
            }}
            className="text-white/70 hover:text-white hover:bg-white/10"
            title="Edit"
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={(e) => {
              e.stopPropagation();
              setDeleteDialog({ open: true, videoId: video.id });
            }}
            className="text-red-400 hover:bg-red-500/10 hover:text-red-300"
            title="Delete"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Videos</h1>
          <p className="mt-2 text-white/70">
            Manage your video library and content
          </p>
        </div>
        <Button asChild variant="orbyto-primary" size="orbyto">
          <Link href={`/${locale}/admin/videos/new`}>
            <Plus className="me-2 h-4 w-4" />
            Add Video
          </Link>
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <SearchInput
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search videos, topics, or courses..."
          className="max-w-sm"
        />
        <div className="text-sm text-white/60">
          {filteredVideos.length} video{filteredVideos.length !== 1 ? "s" : ""}
        </div>
      </div>

      {filteredVideos.length === 0 && searchQuery === "" ? (
        <GlassCard variant="dark" padding="lg">
          <div className="flex min-h-[400px] items-center justify-center">
            <div className="text-center">
              <Play className="mx-auto h-12 w-12 text-white/40" />
              <h3 className="mt-4 text-lg font-medium text-white">
                No videos yet
              </h3>
              <p className="mt-2 text-sm text-white/70">
                Add your first video to get started
              </p>
              <Button asChild variant="orbyto-primary" size="orbyto" className="mt-4">
                <Link href={`/${locale}/admin/videos/new`}>
                  <Plus className="me-2 h-4 w-4" />
                  Add Video
                </Link>
              </Button>
            </div>
          </div>
        </GlassCard>
      ) : (
        <DataTable
          columns={columns}
          data={filteredVideos}
          onRowClick={(video) => router.push(`/${locale}/admin/videos/${video.id}/edit`)}
          emptyMessage="No videos found matching your search"
          pageSize={15}
        />
      )}

      <ConfirmDialog
        open={deleteDialog.open}
        onOpenChange={(open) =>
          setDeleteDialog({ open, videoId: deleteDialog.videoId })
        }
        title="Delete Video"
        description="Are you sure you want to delete this video? This action cannot be undone."
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={handleDelete}
      />
    </div>
  );
}
