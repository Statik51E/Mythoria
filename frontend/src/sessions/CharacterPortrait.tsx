import { useEffect, useState } from "react";

interface Props {
  src: string;
  alt: string;
  size?: number;
  rounded?: "full" | "sm" | "md";
  fallbackInitials?: string;
}

export default function CharacterPortrait({
  src,
  alt,
  size = 96,
  rounded = "md",
  fallbackInitials,
}: Props) {
  const [status, setStatus] = useState<"loading" | "ok" | "error">("loading");

  useEffect(() => {
    setStatus("loading");
  }, [src]);

  const radius = rounded === "full" ? "9999px" : rounded === "md" ? "6px" : "3px";

  return (
    <div
      className="relative overflow-hidden"
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        background: "linear-gradient(135deg, #2a2219, #0f0a06)",
        border: "1px solid rgba(232,208,138,.35)",
        boxShadow: "0 4px 20px rgba(0,0,0,.55), inset 0 0 0 1px rgba(255,255,255,.04)",
      }}
    >
      {status !== "error" && (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          onLoad={() => setStatus("ok")}
          onError={() => setStatus("error")}
          className="absolute inset-0 w-full h-full object-cover"
          style={{ opacity: status === "ok" ? 1 : 0, transition: "opacity 320ms ease-out" }}
        />
      )}
      {status === "loading" && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-6 h-6 rounded-full border-2 border-gold-500/30 border-t-gold-400 animate-spin" />
        </div>
      )}
      {status === "error" && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="font-serif text-parchment" style={{ fontSize: size * 0.32 }}>
            {fallbackInitials || alt[0]?.toUpperCase() || "?"}
          </div>
        </div>
      )}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,.45) 100%)",
        }}
      />
    </div>
  );
}
