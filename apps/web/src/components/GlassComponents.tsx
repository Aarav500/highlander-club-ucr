"use client";

import { motion, HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";
import React from "react";

// --- Glass Card ---
interface GlassCardProps extends Omit<HTMLMotionProps<"div">, "children"> {
  hoverGlow?: boolean;
  children?: React.ReactNode;
}

export const GlassCard = React.forwardRef<HTMLDivElement, GlassCardProps>(
  ({ className, children, hoverGlow = false, ...props }, ref) => {
    return (
      <motion.div
        ref={ref}
        whileHover={hoverGlow ? { scale: 0.985 } : undefined}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        className={cn(
          "relative overflow-hidden rounded-2xl border border-glass-border bg-glass-bg backdrop-blur-[24px] shadow-[0_8px_32px_rgba(0,0,0,0.3)]",
          hoverGlow && "hover:border-primary/50 hover:shadow-[0_8px_32px_rgba(30,106,255,0.25)] transition-colors duration-300",
          className
        )}
        {...props}
      >
        {/* Edge Lighting */}
        <div className="absolute inset-0 border-t border-white/10 pointer-events-none rounded-[inherit]" />
        {children}
      </motion.div>
    );
  }
);
GlassCard.displayName = "GlassCard";

// --- Glass Navbar ---
export const GlassNavbar = ({ children, className }: { children: React.ReactNode; className?: string }) => {
  return (
    <header className={cn(
      "sticky top-0 z-50 w-full border-b border-glass-border bg-background/60 backdrop-blur-[32px] shadow-sm",
      className
    )}>
      <div className="absolute inset-0 border-b border-white/5 pointer-events-none" />
      {children}
    </header>
  );
};

// --- Glass Button ---
interface GlassButtonProps extends Omit<HTMLMotionProps<"button">, "children"> {
  variant?: "primary" | "accent" | "ghost";
  children?: React.ReactNode;
}

export const GlassButton = React.forwardRef<HTMLButtonElement, GlassButtonProps>(
  ({ className, children, variant = "primary", ...props }, ref) => {
    const baseStyles = "relative overflow-hidden rounded-full font-semibold flex items-center justify-center px-6 py-2.5 transition-all";
    
    const variants = {
      primary: "bg-primary/90 text-primary-foreground hover:bg-primary border border-primary/50 shadow-[0_0_15px_rgba(30,106,255,0.3)]",
      accent: "bg-accent/90 text-accent-foreground hover:bg-accent border border-accent/50 shadow-[0_0_15px_rgba(255,184,0,0.3)]",
      ghost: "bg-transparent text-foreground hover:bg-white/5 border border-transparent hover:border-white/10",
    };

    return (
      <motion.button
        ref={ref}
        whileTap={{ scale: 0.95 }}
        whileHover={{ scale: 1.02 }}
        transition={{ type: "spring", stiffness: 400, damping: 15 }}
        className={cn(baseStyles, variants[variant], className)}
        {...props}
      >
        {/* Shine effect overlay */}
        <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/10 to-white/0 opacity-0 hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
        {children}
      </motion.button>
    );
  }
);
GlassButton.displayName = "GlassButton";
