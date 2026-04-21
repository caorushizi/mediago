import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * Button variants follow Cursor's warm-palette interaction model:
 *
 * - **default** — the "warm primary": cream surface (`--secondary` /
 *   `#ebeae5`) with dark text. The *signature* Cursor button. On
 *   hover, the text shifts to `--destructive` (`#cf2d56`) rather than
 *   changing the background — an unusual, memorable move that we keep
 *   site-wide.
 *
 * - **dark** — inverse primary, used sparingly for top-level CTAs where
 *   we want maximum contrast. Dark surface, cream text, same crimson
 *   hover.
 *
 * - **outline** — transparent with an oklab-style border. Hover fills
 *   in a warm tint.
 *
 * - **secondary** — pill-shaped warm surface for toolbar actions.
 *
 * - **ghost** — near-invisible at rest, warm tint on hover.
 *
 * - **link** — text-only with the brand orange.
 *
 * - **destructive** — kept for semantic destructive actions (the solid
 *   crimson fill), distinct from the *hover-as-destructive* gesture
 *   the default button uses.
 */
const buttonVariants = cva(
  // `font-feat-display` opts the label into Cursor's engineered-glyph
  // feature set (ss09 on Geist). Safe on system-font fallbacks.
  // Transitions bound to the centralised --transition-color / shadow
  // vars so every interactive surface shares one rhythm.
  "inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium font-feat-display [transition:color_var(--transition-color),background-color_var(--transition-color),box-shadow_var(--transition-shadow)] focus-visible:outline-none focus-visible:shadow-focus disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 cursor-pointer",
  {
    variants: {
      variant: {
        default:
          "rounded-md bg-secondary text-secondary-foreground hover:text-destructive",
        dark: "rounded-md bg-primary text-primary-foreground hover:text-destructive",
        destructive:
          "rounded-md bg-destructive text-white hover:bg-destructive/90",
        outline:
          "rounded-md border border-border bg-transparent hover:bg-surface-300 hover:text-destructive",
        secondary:
          "rounded-full bg-surface-400 text-foreground/70 hover:text-destructive",
        /* Tertiary pill — Cursor's "active filter" shape.
         * Surface 500 + 60% fg: reads as a pressed state of the
         * secondary pill. Reserved for selected tag / filter chips. */
        "tertiary-pill":
          "rounded-full bg-surface-500 text-foreground/60 hover:text-destructive",
        ghost:
          "rounded-md bg-transparent text-foreground/70 hover:bg-surface-300 hover:text-destructive",
        /* Light surface — intended for dropdown triggers / pickers.
         * Sits half a shade brighter than the page so it reads as a
         * lifted-but-quiet interactive surface. */
        "light-surface":
          "rounded-md bg-surface-100 text-foreground/90 hover:bg-background hover:text-destructive",
        link: "text-orange underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-3.5 text-sm",
        sm: "h-8 px-3 text-[13px]",
        xs: "h-7 px-2.5 text-xs",
        /* Pill-specific density — 3px/8px padding, 22px tall. Matches
         * Cursor's pill recipe exactly. */
        pill: "h-[22px] px-2 text-[11px] tracking-[0.02em]",
        lg: "h-10 px-5 text-sm",
        icon: "h-9 w-9 rounded-md",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
