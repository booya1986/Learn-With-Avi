"use client";

import * as React from "react";

import Link from "next/link";
import { useRouter, useParams, usePathname } from "next/navigation";

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ArrowLeft, GripVertical, Edit, Trash2, Eye, EyeOff } from "lucide-react";

import { ConfirmDialog } from "@/components/admin/common/ConfirmDialog";
import { LoadingSpinner } from "@/components/admin/common/LoadingSpinner";
import { useToast } from "@/components/admin/common/Toast";
import { Button } from "@/components/ui/button";
import { formatTime } from "@/lib/utils";

interface Video {
  id: string;
  title: string;
  youtubeId: string;
  thumbnail: string;
  duration: number;
  order: number;
  published: boolean;
}

interface Course {
  id: string;
  title: string;
  videos: Video[];
}

interface SortableVideoItemProps {
  video: Video;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onTogglePublish: (id: string, published: boolean) => void;
}

const SortableVideoItem = ({
  video,
  onEdit,
  onDelete,
  onTogglePublish,
}: SortableVideoItemProps) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: video.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-4 rounded-lg border border-gray-200 bg-white p-4 transition-shadow hover:shadow-md"
    >
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab touch-none text-gray-400 hover:text-gray-600 active:cursor-grabbing"
        aria-label="Drag to reorder"
      >
        <GripVertical className="h-5 w-5" />
      </button>

      <img
        src={video.thumbnail}
        alt={video.title}
        className="h-16 w-28 rounded object-cover"
      />

      <div className="flex-1">
        <h3 className="font-medium text-gray-900">{video.title}</h3>
        <div className="mt-1 flex items-center gap-2 text-sm text-gray-600">
          <span>{formatTime(video.duration)}</span>
          {video.published ? (
            <span className="rounded bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
              Published
            </span>
          ) : (
            <span className="rounded bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700">
              Draft
            </span>
          )}
        </div>
      </div>

      <div className="flex gap-2">
        <Button
          size="sm"
          variant="ghost"
          onClick={() => onTogglePublish(video.id, video.published)}
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
          onClick={() => onEdit(video.id)}
        >
          <Edit className="h-4 w-4" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => onDelete(video.id)}
          className="text-red-600 hover:bg-red-50 hover:text-red-700"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

export default function CourseVideosPage() {
  const router = useRouter();
  const params = useParams();
  const pathname = usePathname();
  const locale = pathname?.split('/')[1] || 'en';
  const { toast } = useToast();
  const [course, setCourse] = React.useState<Course | null>(null);
  const [videos, setVideos] = React.useState<Video[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSaving, setIsSaving] = React.useState(false);
  const [deleteDialog, setDeleteDialog] = React.useState<{
    open: boolean;
    videoId: string | null;
  }>({ open: false, videoId: null });

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  React.useEffect(() => {
    fetchCourse();
  }, [params.id]);

  const fetchCourse = async () => {
    try {
      const response = await fetch(`/api/admin/courses/${params.id}`);
      if (!response.ok) {throw new Error("Failed to fetch course");}
      const data = await response.json();
      setCourse(data);
      setVideos(data.videos.sort((a: Video, b: Video) => a.order - b.order));
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch course",
        variant: "error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {return;}

    const oldIndex = videos.findIndex((v) => v.id === active.id);
    const newIndex = videos.findIndex((v) => v.id === over.id);

    const newVideos = arrayMove(videos, oldIndex, newIndex);
    setVideos(newVideos);

    // Save new order
    setIsSaving(true);
    try {
      const response = await fetch(`/api/admin/courses/${params.id}/reorder`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          videoIds: newVideos.map((v) => v.id),
        }),
      });

      if (!response.ok) {throw new Error("Failed to save order");}

      toast({
        title: "Success",
        description: "Video order updated",
        variant: "success",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save order",
        variant: "error",
      });
      fetchCourse();
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteDialog.videoId) {return;}

    try {
      const response = await fetch(
        `/api/admin/videos/${deleteDialog.videoId}`,
        { method: "DELETE" }
      );

      if (!response.ok) {throw new Error("Failed to delete video");}

      toast({
        title: "Success",
        description: "Video deleted successfully",
        variant: "success",
      });

      fetchCourse();
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

      fetchCourse();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update video",
        variant: "error",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <p className="text-gray-500">Course not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <Button variant="ghost" asChild className="mb-4">
          <Link href={`/${locale}/admin/courses`}>
            <ArrowLeft className="me-2 h-4 w-4" />
            Back to Courses
          </Link>
        </Button>
        <h1 className="text-3xl font-bold text-gray-900">{course.title}</h1>
        <p className="mt-2 text-gray-600">
          Manage videos and their order in this course
        </p>
      </div>

      {isSaving ? <div className="rounded-lg bg-blue-50 p-3 text-sm text-blue-700">
          Saving order...
        </div> : null}

      {videos.length === 0 ? (
        <div className="flex min-h-[400px] items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50">
          <div className="text-center">
            <h3 className="text-lg font-medium text-gray-900">No videos yet</h3>
            <p className="mt-2 text-sm text-gray-600">
              Add videos to this course from the Videos page
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={videos.map((v) => v.id)}
              strategy={verticalListSortingStrategy}
            >
              {videos.map((video) => (
                <SortableVideoItem
                  key={video.id}
                  video={video}
                  onEdit={(id) => router.push(`/${locale}/admin/videos/${id}/edit`)}
                  onDelete={(id) =>
                    setDeleteDialog({ open: true, videoId: id })
                  }
                  onTogglePublish={handleTogglePublish}
                />
              ))}
            </SortableContext>
          </DndContext>
        </div>
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
