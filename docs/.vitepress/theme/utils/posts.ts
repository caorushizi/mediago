import { createContentLoader } from "vitepress";

export interface Post {
  title: string;
  author: string;
  date: string;
  pkg: string;
  content: string;
}
