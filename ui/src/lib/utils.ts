import axios from "axios";
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

const devUrl = "http://localhost:8080";
const isDev = import.meta.env.MODE === "development";
const baseURL = isDev ? devUrl : "/";

export const http = axios.create({
  baseURL,
});

export function getVideoURL(url: string) {
  if (isDev) {
    return `${devUrl}/${url}`;
  }
  return url;
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
