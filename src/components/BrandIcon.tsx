"use client";

import { useId } from "react";

import { cn } from "@/lib/utils";

export function BrandIcon({ className }: { className?: string }) {
  // Градиент задаётся через <defs> и ссылается по id, а иконка на странице входа
  // рендерится дважды — useId разводит id по инстансам, чтобы не было дублей в DOM.
  const gradientId = useId();

  return (
    <svg
      viewBox="0 0 48 48"
      role="img"
      aria-label="Instagram"
      className={cn("shrink-0", className)}
    >
      <defs>
        <radialGradient id={gradientId} gradientUnits="userSpaceOnUse" cx="13.5" cy="47" r="52">
          <stop offset="0" stopColor="#FEDA75" />
          <stop offset="0.25" stopColor="#FA7E1E" />
          <stop offset="0.5" stopColor="#D62976" />
          <stop offset="0.75" stopColor="#962FBF" />
          <stop offset="1" stopColor="#4F5BD5" />
        </radialGradient>
      </defs>

      <rect width="48" height="48" rx="12" fill={`url(#${gradientId})`} />
      <rect x="11" y="11" width="26" height="26" rx="8" fill="none" stroke="#fff" strokeWidth="3" />
      <circle cx="24" cy="24" r="6.5" fill="none" stroke="#fff" strokeWidth="3" />
      <circle cx="32" cy="16" r="1.9" fill="#fff" />
    </svg>
  );
}
