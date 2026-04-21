import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * Cursor cards sit on a cream page with a *single* oklab-brown ring
 * and a diffuse ambient shadow — the page feels like it "opened a
 * space" for the card rather than the card floating above the page.
 *
 * Three modes:
 *  - default        → ambient shadow, static
 *  - `elevated`     → permanent 28px/70px lift, for hero / modal-like
 *                     surfaces that should read as decidedly above
 *                     the page at rest
 *  - `interactive`  → ambient at rest, eases up to `elevated` on hover.
 *                     Use on cards that *are* the primary action target
 *                     (e.g. the dispatch-mode card on options). Skip
 *                     for info cards — hover lift should read as "you
 *                     can act on this", not decoration.
 *
 * `elevated` and `interactive` are mutually exclusive in spirit; if
 * both are set, `elevated` wins (matches user intent of "always lifted").
 */
interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  elevated?: boolean;
  interactive?: boolean;
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, elevated = false, interactive = false, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        // 10px radius — Cursor's "featured" bucket. Slightly more
        // comfortable than the 8px default we use on buttons, so the
        // card reads as a distinct container.
        "rounded-lg border border-border bg-card text-card-foreground [transition:box-shadow_var(--transition-shadow)]",
        elevated
          ? "shadow-elevated"
          : interactive
            ? "shadow-ambient hover:shadow-elevated"
            : "shadow-ambient",
        className,
      )}
      {...props}
    />
  ),
);
Card.displayName = "Card";

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col gap-1.5 p-5", className)}
    {...props}
  />
));
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "text-[17px] font-medium leading-tight tracking-[-0.011em]",
      className,
    )}
    {...props}
  />
));
CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      // `font-feat-editorial` turns on the Source Serif 4 contextual
      // alternates — our closest match to Cursor's jjannon `"cswh"`
      // feature. Gives editorial body copy a subtly more hand-set feel.
      "font-serif text-[15px] leading-relaxed font-feat-editorial text-muted-foreground",
      className,
    )}
    {...props}
  />
));
CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-5 pt-0", className)} {...props} />
));
CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-5 pt-0", className)}
    {...props}
  />
));
CardFooter.displayName = "CardFooter";

export {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
};
