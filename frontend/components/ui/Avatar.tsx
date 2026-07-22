import Image from "next/image";
import type { ReactNode } from "react";

type AvatarProps = {
  avatarUrl?: string | null;
  name: string;
  className?: string;
  imageClassName?: string;
  children?: ReactNode;
};

export default function Avatar({
  avatarUrl,
  name,
  className = "",
  imageClassName = "",
  children,
}: AvatarProps) {
  const googleAvatarUrl = avatarUrl?.startsWith("https://lh3.googleusercontent.com/")
    ? avatarUrl
    : null;

  return (
    <div className={`retro-avatar ${className}`}>
      {googleAvatarUrl ? (
        <Image
          src={googleAvatarUrl}
          alt={`${name}'s avatar`}
          fill
          sizes="(max-width: 640px) 10rem, 10rem"
          className={`retro-avatar-image ${imageClassName}`}
        />
      ) : avatarUrl ? (
        <img
          src={avatarUrl}
          alt={`${name}'s avatar`}
          className={`retro-avatar-image ${imageClassName}`}
        />
      ) : (
        <div className="retro-avatar-fallback" role="img" aria-label={`${name}'s default avatar`}>
          <span className="retro-avatar-head" aria-hidden="true">
            <i className="retro-avatar-eye left" />
            <i className="retro-avatar-eye right" />
            <i className="retro-avatar-mouth" />
          </span>
        </div>
      )}
      {children}
    </div>
  );
}
