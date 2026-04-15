import * as React from "react";
import { Toaster as Sonner, type ToasterProps } from "sonner";

/**
 * Theme-aware sonner wrapper. The extension doesn't expose a theme
 * toggle, so we rely on the `.dark` class on <html> (added by the
 * popup/options entry based on `prefers-color-scheme`).
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
          toast:
            "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-muted-foreground",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
