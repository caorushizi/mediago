import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * Headless Switch. Visually matches shadcn's new-york Switch without
 * pulling in `@radix-ui/react-switch` (one extra 4KB dep for a single
 * button-shaped control isn't worth it in an extension popup).
 *
 * Colour keying: off = `--surface-500` (a deeper warm cream than the
 * card), on = `--foreground` (the same warm near-black that drives
 * primary buttons). The thumb is cream — always readable against
 * either track.
 */
export interface SwitchProps extends Omit<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  "onChange"
> {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}

export const Switch = React.forwardRef<HTMLButtonElement, SwitchProps>(
  ({ className, checked, onCheckedChange, disabled, ...props }, ref) => (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      data-state={checked ? "checked" : "unchecked"}
      disabled={disabled}
      onClick={() => onCheckedChange(!checked)}
      ref={ref}
      className={cn(
        "peer inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border border-transparent transition-colors focus-visible:outline-none focus-visible:shadow-focus disabled:cursor-not-allowed disabled:opacity-50",
        checked ? "bg-primary" : "bg-surface-500",
        className,
      )}
      {...props}
    >
      <span
        className={cn(
          "pointer-events-none block h-3.5 w-3.5 rounded-full bg-background shadow-sm transition-transform",
          checked ? "translate-x-[18px]" : "translate-x-[2px]",
        )}
      />
    </button>
  ),
);
Switch.displayName = "Switch";
