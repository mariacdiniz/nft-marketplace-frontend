import { Slot } from "@radix-ui/react-slot";
import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/shared/utils/eth";

export function Button({
  className,
  asChild,
  variant = "primary",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  asChild?: boolean;
  variant?: "primary" | "ghost" | "outline" | "muted";
}) {
  const Comp = asChild ? Slot : "button";
  const styles = {
    primary: "bg-kurio-orange text-black font-semibold hover:bg-kurio-orangeHover",
    ghost: "bg-transparent text-kurio-cream hover:text-kurio-orange",
    outline: "border border-line text-kurio-cream hover:border-kurio-orange",
    muted: "bg-card text-kurio-cream border border-line",
  }[variant];
  return (
    <Comp
      type={asChild ? undefined : (props.type ?? "button")}
      className={cn(
        "inline-flex items-center justify-center rounded-md px-4 py-2 text-sm transition disabled:opacity-60",
        styles,
        className,
      )}
      {...props}
    />
  );
}
