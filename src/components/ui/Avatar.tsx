"use client";

import * as React from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

function Avatar({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="avatar"
      className={cn(
        "relative flex size-8 shrink-0 overflow-hidden rounded-full",
        className
      )}
      {...props}
    />
  );
}

function AvatarImage({
  className,
  src,
  alt,
  width = 32,
  height = 32,
  ...props
}: {
  className?: string;
  src?: string;
  alt?: string;
  width?: number;
  height?: number;
} & Omit<React.ComponentProps<typeof Image>, 'src' | 'alt' | 'width' | 'height'>) {
  return (
    <Image
      data-slot="avatar-image"
      src={src || "/users/placeholder.png"}
      alt={alt || "Avatar"}
      width={width}
      height={height}
      className={cn("aspect-square size-full object-cover", className)}
      {...props}
    />
  );
}

function AvatarFallback({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="avatar-fallback"
      className={cn(
        "bg-[var(--ig-secondary)] text-white flex size-full items-center justify-center rounded-full text-xs font-medium",
        className
      )}
      {...props}
    />
  );
}

export { Avatar, AvatarImage, AvatarFallback };