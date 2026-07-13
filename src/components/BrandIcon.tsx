import Image from "next/image";

import { cn } from "@/lib/utils";

export function BrandIcon({ className }: { className?: string }) {
  return (
    <div className={cn("relative shrink-0 overflow-hidden", className)}>
      <Image
        src="/free-icon-instagram-15713420.png"
        alt="Instagram"
        fill
        className="object-contain"
        sizes="80px"
      />
    </div>
  );
}
