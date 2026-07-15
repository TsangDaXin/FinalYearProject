import { cn } from "../../lib/utils";
import React from "react";

export const RadialGlowBackground = ({ className }: { className?: string }) => {
  return (
    <div
      className={cn("fixed inset-0 z-0 pointer-events-none", className)}
      style={{
        backgroundImage: `radial-gradient(circle 800px at 50% 100px, rgba(255,109,41,0.15), transparent)`,
      }}
    />
  );
};
