import { DownloadType } from "@mediago/shared-common";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * Badge styling is warm-palette first. Variants broadly fall into two
 * camps:
 *
 * 1. Status variants (default / secondary / destructive / success /
 *    warning / outline) follow Cursor's warm-crimson hover + oklab
 *    border treatment. No bright primary brand colors here — those are
 *    reserved for actual call-to-action buttons.
 *
 * 2. Timeline variants (thinking / grep / read / edit / mediago) map
 *    Cursor's AI-timeline accent palette onto our DownloadType enum so
 *    the popup's source list reads at a glance. Each color is a soft
 *    desaturated pastel — surface tint + fully-opaque label — that sits
 *    calmly on the cream background and doesn't fight CTA buttons.
 */
const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide transition-colors",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        secondary:
          "border-transparent bg-surface-400 text-foreground/70 hover:text-destructive",
        destructive: "border-transparent bg-destructive/15 text-destructive",
        outline: "border-border text-foreground/70",
        success: "border-transparent bg-success/15 text-success",
        warning: "border-transparent bg-gold/20 text-gold",
        /* --- timeline variants — match DownloadType labels --- */
        thinking:
          "border-transparent bg-timeline-thinking/25 text-timeline-thinking",
        grep: "border-transparent bg-timeline-grep/25 text-timeline-grep",
        read: "border-transparent bg-timeline-read/25 text-timeline-read",
        edit: "border-transparent bg-timeline-edit/25 text-timeline-edit",
        mediago: "border-transparent bg-orange/15 text-orange",
      },
      tone: {
        solid: "",
        /* Softer, desaturated version used by SourceItem/StatusBadge
         * where we layer a badge over a colored card. Purely optical. */
        soft: "shadow-[inset_0_0_0_1px_rgb(0_0_0_/_0.02)]",
      },
    },
    defaultVariants: {
      variant: "default",
      tone: "solid",
    },
  },
);

export interface BadgeProps
  extends
    React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, tone, ...props }: BadgeProps) {
  return (
    <div
      className={cn(badgeVariants({ variant, tone }), className)}
      {...props}
    />
  );
}

/**
 * Map a DownloadType to its timeline variant. Keeps the mapping in one
 * place so SourceItem and anywhere else that renders a type badge
 * agree — and so `cva`'s variant union stays the source of truth.
 */
export function variantForDownloadType(
  type: DownloadType | string,
): "thinking" | "grep" | "read" | "edit" | "mediago" | "secondary" {
  switch (type) {
    case DownloadType.bilibili:
      return "thinking"; // warm peach — Bilibili
    case DownloadType.direct:
      return "grep"; // sage — direct file match
    case DownloadType.youtube:
      return "read"; // blue — external read
    case DownloadType.m3u8:
      return "edit"; // lavender — stream processing
    case DownloadType.mediago:
      return "mediago"; // brand orange
    default:
      return "secondary";
  }
}

export { Badge, badgeVariants };
