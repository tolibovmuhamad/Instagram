"use client";

import { useCallback, useState } from "react";
import imageCompression from "browser-image-compression";
import Cropper, { type Area } from "react-easy-crop";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useUpdateAvatar } from "@/features/users/hooks";
import { getCroppedImageBlob } from "@/lib/utils/cropImage";

interface AvatarUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  imageSrc: string;
}

export function AvatarUploadDialog({ open, onOpenChange, imageSrc }: AvatarUploadDialogProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const updateAvatar = useUpdateAvatar();

  const handleCropComplete = useCallback((_croppedArea: Area, pixels: Area) => {
    setCroppedAreaPixels(pixels);
  }, []);

  const handleSave = async () => {
    if (!croppedAreaPixels) return;
    setIsProcessing(true);
    try {
      const croppedBlob = await getCroppedImageBlob(imageSrc, croppedAreaPixels);
      const croppedFile = new File([croppedBlob], "avatar.jpg", { type: "image/jpeg" });
      const compressedBlob = await imageCompression(croppedFile, {
        maxSizeMB: 1,
        maxWidthOrHeight: 1024,
      });
      // browser-image-compression (с useWebWorker по умолчанию) теряет имя файла у
      // результата — без расширения бэкенд сохраняет картинку под "голым" GUID и /images/{filename}
      // отдаёт 404. Пересобираем File с явным именем перед отправкой.
      const compressedFile = new File([compressedBlob], "avatar.jpg", { type: "image/jpeg" });
      await updateAvatar.mutateAsync(compressedFile);
      toast.success("Аватар обновлён");
      onOpenChange(false);
    } catch {
      // ошибка уже показана через axios-интерцептор (toast)
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Новый аватар</DialogTitle>
        </DialogHeader>

        <div className="relative h-72 w-full bg-muted">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={1}
            cropShape="round"
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={handleCropComplete}
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isProcessing}>
            Отмена
          </Button>
          <Button onClick={handleSave} disabled={isProcessing || !croppedAreaPixels}>
            {isProcessing ? "Сохраняем…" : "Сохранить"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
