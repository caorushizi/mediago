import * as React from "react";
import { Toaster as Sonner, type ToasterProps } from "sonner";

/**
 * Theme-aware sonner wrapper. The extension doesn't expose a theme
 * toggle, so we rely on the `.dark` class on <html> (added by the
 * popup/options entry based on `prefers-color-scheme`).
 *
 * Toast surfaces sit on `--popover` (Surface 100 on light, a slightly
 * lifted warm-dark on dark) so they read as "lifted" from the page
 * tone rather than neutral white. Borders use the signature warm oklab
 * ring and the whole thing shares the elevated shadow so toasts feel
 * like they belong to the same family as dialogs and cards.
 */
const Toaster = ({ ...props }: ToasterProps) => {
  const theme = React.useMemo<ToasterProps["theme"]>(() => {
    if (
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches
    ) {
      return "dark";
    }
    return "light";
  }, []);

  return (
    <Sonner
      theme={theme}
      className="toaster group"
      toastOptions={{
        classNames: {
          // 10px radius — Cursor's "featured container" bucket. Puts
          // toasts in the same visual bracket as the options hero, so
          // the two feel like siblings rather than arbitrary shapes.
          toast:
            "group toast group-[.toaster]:rounded-lg group-[.toaster]:bg-popover group-[.toaster]:text-popover-foreground group-[.toaster]:border group-[.toaster]:border-border group-[.toaster]:shadow-elevated",
          description:
            "group-[.toast]:font-serif group-[.toast]:text-muted-foreground",
          actionButton:
            "group-[.toast]:rounded-md group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton:
            "group-[.toast]:rounded-md group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
          success: "group-[.toast]:!text-success",
          error: "group-[.toast]:!text-destructive",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
