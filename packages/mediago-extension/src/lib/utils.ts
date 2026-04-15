import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Tailwind-aware className merger — same helper used by apps/ui so
 * shadcn components copied over work without tweaks.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
