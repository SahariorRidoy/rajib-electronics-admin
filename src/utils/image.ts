import { Category } from "@/types/category";


export const isValidImageUrl = (url?: string): boolean => {
  if (!url || url.trim() === "") return false;

  try {
    // Allow relative URLs
    if (url.startsWith("/")) return true;

    const parsedUrl = new URL(url);
    const allowedProtocols = ["http:", "https:"];

    // Check protocol
    if (!allowedProtocols.includes(parsedUrl.protocol)) return false;

    return true;
  } catch {
    return false;
  }
};

export const isActive = (category: Category): boolean => {
  return category.status === "ACTIVE";
};

export const generateSlug = (title: string): string => {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
};
