"use client";

import { motion } from "framer-motion";
import { GlassCard } from "@/components/GlassComponents";
import { Calendar as CalendarIcon, Clock, MapPin } from "lucide-react";

export default function CalendarPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
          <CalendarIcon className="text-primary w-8 h-8" />
          Calendar
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 24 }}
          className="lg:col-span-2"
        >
          <GlassCard className="p-8 min-h-[500px] flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mb-4 border border-primary/30">
              <CalendarIcon className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Select a Date</h3>
            <p className="text-muted-foreground max-w-sm">
              Use the interactive calendar to browse past and future events hosted by UCR clubs.
            </p>
          </GlassCard>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 24, delay: 0.1 }}
          className="flex flex-col gap-4"
        >
          <h3 className="text-lg font-bold text-white mb-2">Upcoming This Week</h3>
          {[1, 2, 3].map((i) => (
            <GlassCard key={i} hoverGlow className="p-5 cursor-pointer">
              <div className="text-sm font-bold text-primary mb-1">Tomorrow</div>
              <h4 className="text-base font-bold text-white mb-2">Highlander Tech Meetup</h4>
              <div className="flex flex-col gap-1 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5" /> 5:00 PM
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5" /> Winston Chung Hall
                </div>
              </div>
            </GlassCard>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
