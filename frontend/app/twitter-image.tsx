import { renderOgImage } from "@/components/seo/og-image";

export { alt, size, contentType } from "@/components/seo/og-image";

export default function TwitterImage() {
  return renderOgImage();
}
