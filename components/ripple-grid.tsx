"use client"

import * as React from "react"

// Lightweight canvas-based ripple grid background inspired by ReactBits Ripple Grid
// - Draws a grid of dots and animates a circular ripple that highlights dots as it passes
// - Self-contained, no external deps; respects devicePixelRatio; cleans up on unmount
// - Tailwind-friendly wrapper allows absolute positioning behind content
export function RippleGridBG({
  className = "",
  color = "#22d3ee", // cyan-400
  dotSize = 1.6,
  gap = 16,
  rippleSpeed = 90, // pixels per second
  strength = 0.9,
  fixed = true,
}: {
  className?: string
  color?: string
  dotSize?: number
  gap?: number
  rippleSpeed?: number
  strength?: number
  fixed?: boolean
}) {
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null)
  const frameRef = React.useRef(0)
  const startRef = React.useRef<number | null>(null)

  React.useEffect(() => {
    const canvas = canvasRef.current!
    const ctx = canvas.getContext("2d", { alpha: true })!

    const state = { w: 0, h: 0, dpr: 1 }

    const resize = () => {
      const { clientWidth, clientHeight } = canvas.parentElement as HTMLElement
      state.dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1))
      state.w = Math.max(1, clientWidth)
      state.h = Math.max(1, clientHeight)
      canvas.width = Math.floor(state.w * state.dpr)
      canvas.height = Math.floor(state.h * state.dpr)
      canvas.style.width = state.w + "px"
      canvas.style.height = state.h + "px"
      ctx.setTransform(state.dpr, 0, 0, state.dpr, 0, 0)
    }

    const onResize = () => resize()
    resize()
    window.addEventListener("resize", onResize)

    const gridGap = gap
    const rSpeed = Math.max(10, rippleSpeed)
    const dotR = Math.max(0.5, dotSize)

    const draw = (time: number) => {
      if (startRef.current == null) startRef.current = time
      const elapsed = (time - startRef.current) / 1000 // s
      ctx.clearRect(0, 0, state.w, state.h)

      // Ripple radius grows linearly and wraps
      const maxR = Math.hypot(state.w, state.h)
      const radius = (elapsed * rSpeed) % (maxR + 80)

      // Background subtle grid
      ctx.fillStyle = "rgba(255,255,255,0.06)"
      for (let y = 0; y <= state.h + gridGap; y += gridGap) {
        for (let x = 0; x <= state.w + gridGap; x += gridGap) {
          ctx.beginPath()
          ctx.arc(x, y, dotR, 0, Math.PI * 2)
          ctx.fill()
        }
      }

      // Ripple highlight overlay
      const [r, g, b] = hexToRgb(color)
      for (let y = 0; y <= state.h + gridGap; y += gridGap) {
        for (let x = 0; x <= state.w + gridGap; x += gridGap) {
          const dist = Math.hypot(x - state.w / 2, y - state.h / 2)
          const band = 14 // band width in px
          const a = Math.max(0, 1 - Math.abs(dist - radius) / band) * strength
          if (a <= 0.01) continue
          ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${a})`
          ctx.beginPath()
          ctx.arc(x, y, dotR + 0.2, 0, Math.PI * 2)
          ctx.fill()
        }
      }

      frameRef.current = requestAnimationFrame(draw)
    }

    frameRef.current = requestAnimationFrame(draw)

    return () => {
      cancelAnimationFrame(frameRef.current)
      window.removeEventListener("resize", onResize)
    }
  }, [color, dotSize, gap, rippleSpeed, strength])

  return (
    <div className={`pointer-events-none ${fixed ? 'fixed' : 'absolute'} inset-0 ${className}`} aria-hidden>
      <canvas ref={canvasRef} className="block w-full h-full" />
      {/* soft gradient vignette to fade edges */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background/20" />
    </div>
  )
}

function hexToRgb(hex: string): [number, number, number] {
  const s = hex.replace('#','')
  const big = parseInt(s.length === 3 ? s.split('').map(c=>c+c).join('') : s, 16)
  return [(big >> 16) & 255, (big >> 8) & 255, big & 255]
}

export default RippleGridBG
