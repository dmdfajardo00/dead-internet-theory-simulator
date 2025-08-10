import * as React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    const variants = {
      default: "bg-[var(--ig-primary)] text-white hover:bg-[var(--ig-primary)]/90 shadow-sm",
      destructive: "bg-[var(--ig-heart)] text-white hover:bg-[var(--ig-heart)]/90 shadow-sm",
      outline: "border border-[var(--ig-border)] bg-white hover:bg-[var(--ig-hover)] text-[var(--ig-fg)]",
      secondary: "bg-[var(--ig-secondary)] text-white hover:bg-[var(--ig-secondary)]/90 shadow-sm",
      ghost: "hover:bg-[var(--ig-hover)] text-[var(--ig-fg)]",
      link: "text-[var(--ig-primary)] underline-offset-4 hover:underline",
    };

    const sizes = {
      default: "h-9 px-4 py-2",
      sm: "h-8 rounded-md px-3 text-xs",
      lg: "h-10 rounded-md px-8",
      icon: "h-9 w-9",
    };

    return (
      <button
        className={cn(
          "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ig-primary)] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
          variants[variant],
          sizes[size],
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button };