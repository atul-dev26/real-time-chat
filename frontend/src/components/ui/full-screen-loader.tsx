import KineticDotsLoader from "@/components/ui/kinetic-dots-loader";

type FullScreenLoaderProps = {
  title?: string;
  subtitle?: string;
};

export default function FullScreenLoader({
  title,
  subtitle,
}: FullScreenLoaderProps) {
  return (
    <div
      className="fixed inset-0 z-[2000] flex items-center justify-center"
      style={{
        position: "fixed",
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
        zIndex: 2000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        className="absolute inset-0 bg-slate-950/50 backdrop-blur-md"
        style={{
          position: "absolute",
          top: 0,
          right: 0,
          bottom: 0,
          left: 0,
          backgroundColor: "rgba(2, 6, 23, 0.5)",
          backdropFilter: "blur(12px)",
        }}
      />
      <div
        className="relative flex flex-col items-center justify-center gap-4 text-white"
        style={{
          position: "relative",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "1rem",
          color: "white",
        }}
      >
        <KineticDotsLoader />
        {(title || subtitle) && (
          <div className="text-center">
            {title && <div className="text-lg font-semibold tracking-wide">{title}</div>}
            {subtitle && <div className="text-sm text-slate-300">{subtitle}</div>}
          </div>
        )}
      </div>
    </div>
  );
}
