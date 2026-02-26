'use client';

import './kinetic-dots-loader.css';

export default function KineticDotsLoader() {
  const dots = 4; // Increased to 4 for better rhythm

  return (
    <div
      className="flex items-center justify-center min-h-[250px] p-8 bg-slate-950/0"
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "250px",
        padding: "2rem",
        backgroundColor: "transparent",
      }}
    >
      <div
        className="flex gap-5"
        style={{
          display: "flex",
          gap: "1.25rem",
        }}
      >
        {[...Array(dots)].map((_, i) => (
          <div
            key={i}
            className="relative flex flex-col items-center justify-end h-20 w-6"
            style={{
              position: "relative",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "flex-end",
              height: "5rem",
              width: "1.5rem",
            }}
          >
            {/* 1. THE BOUNCING DOT */}
            <div
              className="relative w-5 h-5 z-10"
              style={{
                position: "relative",
                width: "1.25rem",
                height: "1.25rem",
                zIndex: 10,
                animation:
                  'gravity-bounce 1.4s cubic-bezier(0.45, 0.05, 0.55, 0.95) infinite',
                animationDelay: `${i * 0.15}s`,
                willChange: 'transform',
              }}
            >
              <div
                className="w-full h-full rounded-full bg-gradient-to-b from-cyan-300 to-blue-600 shadow-[0_0_15px_rgba(6,182,212,0.6)]"
                style={{
                  width: "100%",
                  height: "100%",
                  borderRadius: "9999px",
                  background: "linear-gradient(to bottom, #67e8f9, #2563eb)",
                  boxShadow: "0 0 15px rgba(6, 182, 212, 0.6)",
                  animation: 'rubber-morph 1.4s linear infinite',
                  animationDelay: `${i * 0.15}s`,
                  willChange: 'transform',
                }}
              />

              {/* Specular highlight for liquid look */}
              <div
                className="absolute top-1 left-1 w-1.5 h-1.5 bg-white/60 rounded-full blur-[0.5px]"
                style={{
                  position: "absolute",
                  top: "0.25rem",
                  left: "0.25rem",
                  width: "0.375rem",
                  height: "0.375rem",
                  background: "rgba(255, 255, 255, 0.6)",
                  borderRadius: "9999px",
                  filter: "blur(0.5px)",
                }}
              />
            </div>

            {/* 2. FLOOR RIPPLE (Shockwave on impact) */}
            <div
              className="absolute bottom-0 w-10 h-3 border border-cyan-500/30 rounded-[100%] opacity-0"
              style={{
                position: "absolute",
                bottom: 0,
                width: "2.5rem",
                height: "0.75rem",
                border: "1px solid rgba(6, 182, 212, 0.3)",
                borderRadius: "100%",
                opacity: 0,
                animation: 'ripple-expand 1.4s linear infinite',
                animationDelay: `${i * 0.15}s`,
              }}
            />

            {/* 3. REFLECTIVE SHADOW */}
            <div
              className="absolute -bottom-1 w-5 h-1.5 rounded-[100%] bg-cyan-500/40 blur-sm"
              style={{
                position: "absolute",
                bottom: "-0.25rem",
                width: "1.25rem",
                height: "0.375rem",
                borderRadius: "100%",
                background: "rgba(6, 182, 212, 0.4)",
                filter: "blur(4px)",
                animation:
                  'shadow-breathe 1.4s cubic-bezier(0.45, 0.05, 0.55, 0.95) infinite',
                animationDelay: `${i * 0.15}s`,
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
