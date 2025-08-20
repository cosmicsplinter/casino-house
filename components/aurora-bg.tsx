"use client"

import * as React from "react"

type AuroraBgProps = {
  speed?: number // 0.2 requested => very slow
  blend?: number // 0..1 opacity multiplier
  className?: string
  fixed?: boolean // when false, render absolute to parent instead of fixed to viewport
}

// Lightweight aurora background inspired by reactbits aurora
// Renders animated blurred radial blobs with mix blending.
export function AuroraBg({ speed = 0.2, blend = 1.0, className, fixed = true }: AuroraBgProps) {
  // Map speed to animation duration (slower when smaller)
  const baseDur = Math.max(10, Math.round(60 / Math.max(0.05, speed))) // e.g., 0.2 -> 300s
  const opacity = Math.max(0, Math.min(1, blend))

  // Palette tuned for vivid glow on dark background
  const colors = ["#22c55e", "#60a5fa", "#8b5cf6", "#22c55e"] // green, blue, violet, green

  const common: React.CSSProperties = {
    position: "absolute",
    width: "140%",
    height: "140%",
    filter: "blur(35px)",
    opacity,
    borderRadius: "50%",
    // Brighten over dark backgrounds
    mixBlendMode: "screen",
    willChange: "transform, opacity",
  }

  return (
    <div className={"pointer-events-none " + (fixed ? "fixed" : "absolute") + " inset-0 overflow-hidden " + (className || "")}
      style={{
        background:
          `radial-gradient(120% 80% at 0% 0%, rgba(34,197,94,0.35), transparent 60%),` +
          `radial-gradient(120% 80% at 100% 0%, rgba(96,165,250,0.33), transparent 60%),` +
          `radial-gradient(120% 100% at 50% 100%, rgba(139,92,246,0.28), transparent 65%)`,
      }}
    > 
      {/* layer 1 */}
      <span
        style={{
          ...common,
          left: "10%",
          top: "-10%",
          background: `radial-gradient(35% 35% at 50% 50%, ${colors[0]} 0%, transparent 75%)`,
          animation: `aurora-move ${baseDur}s linear infinite`,
        }}
      />
      {/* layer 2 */}
      <span
        style={{
          ...common,
          right: "0%",
          top: "0%",
          background: `radial-gradient(35% 35% at 50% 50%, ${colors[1]} 0%, transparent 75%)`,
          animation: `aurora-move-rev ${baseDur * 0.9}s linear infinite`,
        }}
      />
      {/* layer 3 */}
      <span
        style={{
          ...common,
          left: "20%",
          bottom: "-10%",
          background: `radial-gradient(35% 35% at 50% 50%, ${colors[2]} 0%, transparent 75%)`,
          animation: `aurora-move ${baseDur * 1.1}s linear infinite`,
        }}
      />
      {/* layer 4 */}
      <span
        style={{
          ...common,
          right: "10%",
          bottom: "-5%",
          background: `radial-gradient(35% 35% at 50% 50%, ${colors[3]} 0%, transparent 75%)`,
          animation: `aurora-move-rev ${baseDur * 1.2}s linear infinite`,
        }}
      />
      <style>{`
        /* Make loop seamless by keeping translate offset constant across the cycle */
        @keyframes aurora-move {
          0% { transform: translate3d(20%, 10%, 0) rotate(0deg); }
          100% { transform: translate3d(20%, 10%, 0) rotate(360deg); }
        }
        @keyframes aurora-move-rev {
          0% { transform: translate3d(-15%, -10%, 0) rotate(0deg); }
          100% { transform: translate3d(-15%, -10%, 0) rotate(-360deg); }
        }
      `}</style>
    </div>
  )
}

export default AuroraBg
