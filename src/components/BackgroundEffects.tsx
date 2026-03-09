import { useEffect, useRef } from "react";

/**
 * Animated background inspired by 21st.dev Background Circles, Paths & Lights.
 * Pure CSS + minimal canvas for the flowing paths.
 */
export function BackgroundEffects() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let t = 0;

    function resize() {
      if (!canvas) return;
      canvas.width = canvas.offsetWidth * window.devicePixelRatio;
      canvas.height = canvas.offsetHeight * window.devicePixelRatio;
      ctx!.scale(window.devicePixelRatio, window.devicePixelRatio);
    }
    resize();
    window.addEventListener("resize", resize);

    const w = () => canvas!.offsetWidth;
    const h = () => canvas!.offsetHeight;

    // Flowing path curves (inspired by Background Paths)
    function drawPath(
      phase: number,
      yOffset: number,
      amplitude: number,
      color: string,
      lineWidth: number
    ) {
      if (!ctx) return;
      ctx.beginPath();
      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth;
      const width = w();
      const height = h();
      for (let x = 0; x <= width; x += 3) {
        const normalX = x / width;
        const y =
          yOffset * height +
          Math.sin(normalX * Math.PI * 2 + phase) * amplitude +
          Math.sin(normalX * Math.PI * 4 + phase * 0.7) * (amplitude * 0.4) +
          Math.cos(normalX * Math.PI * 1.5 + phase * 1.3) * (amplitude * 0.25);
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }

    function draw() {
      if (!ctx || !canvas) return;
      const width = canvas.offsetWidth;
      const height = canvas.offsetHeight;
      ctx.clearRect(0, 0, width, height);

      // Draw multiple flowing paths
      const paths = [
        { y: 0.3, amp: 40, color: "rgba(8, 125, 190, 0.06)", lw: 1.5 },
        { y: 0.5, amp: 55, color: "rgba(8, 125, 190, 0.04)", lw: 2 },
        { y: 0.7, amp: 35, color: "rgba(26, 58, 92, 0.05)", lw: 1.5 },
        { y: 0.4, amp: 25, color: "rgba(8, 125, 190, 0.03)", lw: 1 },
        { y: 0.6, amp: 45, color: "rgba(26, 58, 92, 0.04)", lw: 1.8 },
      ];

      paths.forEach((p, i) => {
        drawPath(t * 0.3 + i * 1.2, p.y, p.amp, p.color, p.lw);
      });

      t += 0.015;
      animId = requestAnimationFrame(draw);
    }

    draw();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0" aria-hidden="true">
      {/* Canvas flowing paths */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        style={{ opacity: 1 }}
      />

      {/* Concentric circles (Background Circles) */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
        {[600, 500, 400, 300, 200].map((size, i) => (
          <div
            key={size}
            className="absolute rounded-full border animate-bg-circle"
            style={{
              width: size,
              height: size,
              top: -(size / 2),
              left: -(size / 2),
              borderColor: `rgba(8, 125, 190, ${0.04 + i * 0.01})`,
              animationDelay: `${i * 0.8}s`,
              animationDuration: `${18 + i * 2}s`,
            }}
          />
        ))}
      </div>

      {/* Light spots (Background Lights) */}
      <div
        className="absolute rounded-full animate-light-drift"
        style={{
          width: 500,
          height: 500,
          top: "-5%",
          right: "-8%",
          background: "radial-gradient(circle, rgba(8,125,190,0.08) 0%, transparent 70%)",
        }}
      />
      <div
        className="absolute rounded-full animate-light-drift-2"
        style={{
          width: 400,
          height: 400,
          bottom: "5%",
          left: "-5%",
          background: "radial-gradient(circle, rgba(26,58,92,0.06) 0%, transparent 70%)",
        }}
      />
      <div
        className="absolute rounded-full animate-light-drift-3"
        style={{
          width: 300,
          height: 300,
          top: "40%",
          left: "60%",
          background: "radial-gradient(circle, rgba(8,125,190,0.05) 0%, transparent 70%)",
        }}
      />
    </div>
  );
}
