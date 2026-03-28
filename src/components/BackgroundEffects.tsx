// Static background — dot pattern + subtle radial gradients, no animation
export function BackgroundEffects() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0" aria-hidden="true">
      {/* Dot grid pattern */}
      <div className="absolute inset-0 dot-pattern opacity-[0.4]" />
      {/* Top-right glow estático */}
      <div
        className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full"
        style={{
          background: "radial-gradient(circle at 70% 20%, hsl(217 90% 55% / 0.06) 0%, transparent 60%)",
        }}
      />
      {/* Bottom-left subtle */}
      <div
        className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full"
        style={{
          background: "radial-gradient(circle at 30% 80%, hsl(222 70% 32% / 0.04) 0%, transparent 60%)",
        }}
      />
    </div>
  );
}
