import { HTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

interface BadgeProps extends HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "success" | "danger" | "warning" | "info" | "outline";
}

export const Badge = forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant = "default", ...props }, ref) => {
    const variants = {
      default: "bg-primary/10 text-primary border-primary/20",
      success: "bg-green-500/10 text-green-400 border-green-500/20",
      danger: "bg-destructive/10 text-destructive border-destructive/20",
      warning: "bg-orange-500/10 text-orange-400 border-orange-500/20",
      info: "bg-purple-500/10 text-purple-400 border-purple-500/20",
      outline: "bg-transparent text-muted-foreground border-border",
    };

    return (
      <div
        ref={ref}
        className={cn(
          "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border",
          variants[variant],
          className
        )}
        {...props}
      />
    );
  }
);
Badge.displayName = "Badge";
