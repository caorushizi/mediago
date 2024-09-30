import { twMerge } from "tailwind-merge";
import { type ClassValue, clsx } from "clsx";
import axios from "axios";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const http = axios.create({
  baseURL:
    import.meta.env.MODE === "development" ? "http://localhost:3222" : "/",
});
