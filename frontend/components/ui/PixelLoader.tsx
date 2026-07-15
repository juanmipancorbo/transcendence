type PixelLoaderProps = {
  label?: string;
};

export default function PixelLoader({ label }: PixelLoaderProps) {
  return (
    <div className="pixel-loader" role="status" aria-live="polite">
      <div className="pixel-loader-track" aria-hidden="true">
        <i />
        <i />
        <i />
        <i />
      </div>
      {label && <p>{label}</p>}
    </div>
  );
}
