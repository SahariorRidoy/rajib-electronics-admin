import NextImage, { ImageProps } from "next/image";

/** Rewrites production image URLs to localhost in development */
export function resolveImageSrc(src: string): string {
  if (!src) return src;
  if (process.env.NODE_ENV === "development") {
    return src.replace(
      /https:\/\/api\.rajibelectronics\.com/g,
      "http://localhost:5000"
    );
  }
  return src;
}

/** Use this instead of next/image throughout the admin panel */
export default function Image({ src, ...props }: ImageProps) {
  const resolved = typeof src === "string" ? resolveImageSrc(src) : src;
  // eslint-disable-next-line jsx-a11y/alt-text
  return <NextImage src={resolved} {...props} />;
}
