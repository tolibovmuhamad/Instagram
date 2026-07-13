"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import imageCompression from "browser-image-compression";
import { ImagePlus, X } from "lucide-react";
import Cropper, { type Area } from "react-easy-crop";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useAddPost } from "@/features/posts/hooks";
import { createPostSchema, type CreatePostFormValues } from "@/features/posts/schemas";
import { getCroppedImageBlob } from "@/lib/utils/cropImage";

const ASPECT_OPTIONS = [
  { value: "1", label: "Квадрат (1:1)", ratio: 1 },
  { value: "4-5", label: "Портрет (4:5)", ratio: 4 / 5 },
  { value: "16-9", label: "Пейзаж (16:9)", ratio: 16 / 9 },
] as const;

interface PickedImage {
  id: string;
  file: File;
  previewUrl: string;
  crop: { x: number; y: number };
  zoom: number;
  croppedAreaPixels: Area | null;
}

type Step = "select" | "crop" | "caption";

export function CreatePostForm() {
  const router = useRouter();
  const addPost = useAddPost();

  const [step, setStep] = useState<Step>("select");
  const [aspectKey, setAspectKey] = useState<(typeof ASPECT_OPTIONS)[number]["value"]>("1");
  const [images, setImages] = useState<PickedImage[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const aspect = ASPECT_OPTIONS.find((option) => option.value === aspectKey)!.ratio;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreatePostFormValues>({
    resolver: zodResolver(createPostSchema),
    defaultValues: { title: "", content: "" },
  });

  useEffect(() => {
    return () => {
      images.forEach((image) => URL.revokeObjectURL(image.previewUrl));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFilesSelected = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    if (files.length === 0) return;

    const picked: PickedImage[] = files.map((file) => ({
      id: `${file.name}-${file.size}-${Math.random()}`,
      file,
      previewUrl: URL.createObjectURL(file),
      crop: { x: 0, y: 0 },
      zoom: 1,
      croppedAreaPixels: null,
    }));

    setImages(picked);
    setActiveIndex(0);
    setStep("crop");
    event.target.value = "";
  };

  const handleRemoveImage = (id: string) => {
    setImages((prev) => {
      const removed = prev.find((image) => image.id === id);
      if (removed) URL.revokeObjectURL(removed.previewUrl);
      const next = prev.filter((image) => image.id !== id);
      if (next.length === 0) setStep("select");
      return next;
    });
    setActiveIndex((index) => Math.max(0, Math.min(index, images.length - 2)));
  };

  const updateActiveImage = (patch: Partial<PickedImage>) => {
    setImages((prev) =>
      prev.map((image, index) => (index === activeIndex ? { ...image, ...patch } : image)),
    );
  };

  const handleCropComplete = useCallback(
    (_area: Area, pixels: Area) => {
      updateActiveImage({ croppedAreaPixels: pixels });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [activeIndex],
  );

  const goToNextImage = () => {
    if (activeIndex < images.length - 1) {
      setActiveIndex((index) => index + 1);
    } else {
      setStep("caption");
    }
  };

  const onSubmit = async (values: CreatePostFormValues) => {
    setIsSubmitting(true);
    try {
      const preparedImages = await Promise.all(
        images.map(async (image, index) => {
          const areaPixels = image.croppedAreaPixels ?? {
            x: 0,
            y: 0,
            width: 0,
            height: 0,
          };
          const croppedBlob = await getCroppedImageBlob(image.previewUrl, areaPixels);
          const croppedFile = new File([croppedBlob], `post-${index}.jpg`, {
            type: "image/jpeg",
          });
          const compressedBlob = await imageCompression(croppedFile, {
            maxSizeMB: 2,
            maxWidthOrHeight: 1920,
          });
          // browser-image-compression теряет имя файла у результата (см. AvatarUploadDialog) —
          // пересобираем File с явным именем перед отправкой.
          return new File([compressedBlob], `post-${index}.jpg`, { type: "image/jpeg" });
        }),
      );

      const newPostId = await addPost.mutateAsync({
        title: values.title,
        content: values.content,
        images: preparedImages,
      });

      toast.success("Пост опубликован");
      router.push(`/post/${newPostId}`);
    } catch {
      // ошибка уже показана через axios-интерцептор (toast)
    } finally {
      setIsSubmitting(false);
    }
  };

  if (step === "select") {
    return (
      <div className="mx-auto flex w-full max-w-md flex-col items-center gap-4 p-8 text-center">
        <ImagePlus className="size-16 text-muted-foreground" strokeWidth={1} />
        <h1 className="text-xl font-semibold">Новая публикация</h1>
        <p className="text-sm text-muted-foreground">Выберите одно или несколько фото</p>
        <Button type="button" onClick={() => document.getElementById("post-images")?.click()}>
          Выбрать на устройстве
        </Button>
        <input
          id="post-images"
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleFilesSelected}
        />
      </div>
    );
  }

  if (step === "crop") {
    const activeImage = images[activeIndex];
    return (
      <div className="mx-auto flex w-full max-w-lg flex-col gap-4 p-4">
        <div className="flex items-center justify-between">
          <h2 className="font-medium">
            Кадрирование {activeIndex + 1} из {images.length}
          </h2>
          <Select
            value={aspectKey}
            onValueChange={(value) => setAspectKey(value as typeof aspectKey)}
          >
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ASPECT_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="relative h-96 w-full bg-muted">
          <Cropper
            image={activeImage.previewUrl}
            crop={activeImage.crop}
            zoom={activeImage.zoom}
            aspect={aspect}
            onCropChange={(crop) => updateActiveImage({ crop })}
            onZoomChange={(zoom) => updateActiveImage({ zoom })}
            onCropComplete={handleCropComplete}
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {images.map((image, index) => (
            <button
              key={image.id}
              type="button"
              onClick={() => setActiveIndex(index)}
              className={`relative size-14 overflow-hidden rounded border-2 ${
                index === activeIndex ? "border-primary" : "border-transparent"
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={image.previewUrl}
                alt=""
                className="h-full w-full object-cover"
              />
              <span
                role="button"
                tabIndex={0}
                onClick={(event) => {
                  event.stopPropagation();
                  handleRemoveImage(image.id);
                }}
                className="absolute top-0 right-0 rounded-bl bg-black/60 p-0.5 text-white"
              >
                <X className="size-3" />
              </span>
            </button>
          ))}
        </div>

        <div className="flex justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={() => setStep("select")}
          >
            Назад
          </Button>
          <Button type="button" onClick={goToNextImage}>
            {activeIndex < images.length - 1 ? "Следующее фото" : "Далее"}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-md space-y-6 p-6">
      <h2 className="text-xl font-semibold">Подпись к публикации</h2>

      <div className="flex gap-2 overflow-x-auto">
        {images.map((image) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={image.id}
            src={image.previewUrl}
            alt=""
            className="size-16 shrink-0 rounded object-cover"
          />
        ))}
      </div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <FieldGroup>
          <Field data-invalid={!!errors.title}>
            <FieldLabel htmlFor="title">Заголовок</FieldLabel>
            <Input id="title" {...register("title")} />
          </Field>

          <Field data-invalid={!!errors.content}>
            <FieldLabel htmlFor="content">Подпись</FieldLabel>
            <Textarea id="content" rows={4} {...register("content")} />
          </Field>

          <div className="flex justify-between">
            <Button type="button" variant="outline" onClick={() => setStep("crop")}>
              Назад
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Публикуем…" : "Опубликовать"}
            </Button>
          </div>
        </FieldGroup>
      </form>
    </div>
  );
}
