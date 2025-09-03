import axios from "axios";
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const http = axios.create({
  baseURL: import.meta.env.MODE === "development" ? "http://localhost:3222" : "/",
});
