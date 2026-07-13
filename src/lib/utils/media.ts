const VIDEO_EXTENSIONS = new Set(["mp4", "mov", "webm", "avi", "mkv"]);

export function isVideoFile(filename: string): boolean {
  const ext = filename.split(".").pop()?.toLowerCase();
  return !!ext && VIDEO_EXTENSIONS.has(ext);
}
