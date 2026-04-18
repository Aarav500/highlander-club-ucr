"use client";

import { motion } from "framer-motion";
import { GlassCard } from "@/components/GlassComponents";
import { Map as MapIcon, Compass } from "lucide-react";

export default function MapPage() {
  return (
    <div className="flex flex-col gap-6 h-full min-h-[70vh]">
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
          <MapIcon className="text-accent w-8 h-8" />
          Campus Map
        </h1>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 24 }}
        className="flex-1 flex"
      >
        <GlassCard className="flex-1 flex flex-col items-center justify-center text-center p-8 border-accent/20">
          <Compass className="w-16 h-16 text-accent mb-6 animate-pulse" />
          <h2 className="text-2xl font-bold text-white mb-2">Interactive Map Coming Soon</h2>
          <p className="text-muted-foreground max-w-md">
            The next generation of the UCR campus map is being loaded with WebGL and Leaflet for a fully immersive, 3D-like experience.
          </p>
        </GlassCard>
      </motion.div>
    </div>
  );
}
