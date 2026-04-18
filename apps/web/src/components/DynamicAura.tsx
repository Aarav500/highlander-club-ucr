"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";

export function DynamicAura() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({
        x: e.clientX,
        y: e.clientY,
      });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10 bg-background">
      {/* Primary Aura (UCR Blue) */}
      <motion.div
        animate={{
          x: mousePosition.x - 400,
          y: mousePosition.y - 400,
        }}
        transition={{ type: "spring", stiffness: 50, damping: 20, mass: 0.5 }}
        className="absolute w-[800px] h-[800px] rounded-full bg-primary/20 blur-[120px] opacity-60 mix-blend-screen"
      />
      
      {/* Accent Aura (UCR Gold) */}
      <motion.div
        animate={{
          x: (mousePosition.x * -0.5) + (typeof window !== "undefined" ? window.innerWidth / 2 : 500),
          y: (mousePosition.y * -0.5) + (typeof window !== "undefined" ? window.innerHeight / 2 : 500),
        }}
        transition={{ type: "spring", stiffness: 30, damping: 25, mass: 1 }}
        className="absolute w-[600px] h-[600px] rounded-full bg-accent/15 blur-[100px] opacity-40 mix-blend-screen"
      />
      
      {/* Ambient static glow */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary/10 blur-[120px]" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-accent/10 blur-[120px]" />
      
      {/* Noise overlay to prevent banding */}
      <div 
        className="absolute inset-0 opacity-[0.03] mix-blend-overlay"
        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}
      />
    </div>
  );
}
