import * as React from "react";

import { cn } from "@/lib/utils";

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "placeholder:text-neutral-500 focus-visible:ring-[3px] focus-visible:ring-[var(--ig-primary, #0095f6)] focus-visible:border-[var(--ig-primary, #0095f6)] flex min-h-16 w-full rounded-md border border-[var(--ig-border,#dbdbdb)] bg-white text-[var(--ig-fg,#262626)] dark:bg-neutral-900 px-3 py-2 text-base shadow-xs outline-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        className
      )}
      {...props}
    />
  );
}

export { Textarea };