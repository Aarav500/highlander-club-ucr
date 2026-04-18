"use client";

import { motion } from "framer-motion";
import { GlassCard } from "@/components/GlassComponents";
import { User, Settings, LogOut, Heart, CalendarCheck, Shield } from "lucide-react";

export default function ProfilePage() {
  return (
    <div className="flex flex-col gap-8 max-w-4xl mx-auto w-full">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 24 }}
      >
        <GlassCard className="p-8 md:p-12 flex flex-col md:flex-row items-center gap-8 text-center md:text-left">
          <div className="w-32 h-32 rounded-full bg-secondary flex items-center justify-center border-4 border-background shadow-[0_0_30px_rgba(30,106,255,0.4)] overflow-hidden">
            <User className="w-16 h-16 text-muted-foreground" />
          </div>
          <div className="flex-1">
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Highlander User</h1>
            <p className="text-muted-foreground text-lg mb-6">student@ucr.edu</p>
            <div className="flex flex-wrap gap-4 justify-center md:justify-start">
              <button className="px-6 py-2 rounded-full bg-white/10 hover:bg-white/20 text-white font-medium border border-white/10 transition-colors flex items-center gap-2">
                <Settings className="w-4 h-4" /> Edit Profile
              </button>
              <button className="px-6 py-2 rounded-full bg-destructive/10 hover:bg-destructive/20 text-destructive font-medium border border-destructive/20 transition-colors flex items-center gap-2">
                <LogOut className="w-4 h-4" /> Sign Out
              </button>
            </div>
          </div>
        </GlassCard>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { icon: CalendarCheck, label: "My Events", count: "12", color: "text-primary", bg: "bg-primary/20" },
          { icon: Heart, label: "Following Clubs", count: "8", color: "text-destructive", bg: "bg-destructive/20" },
          { icon: Shield, label: "My Clubs", count: "2", color: "text-accent", bg: "bg-accent/20" },
        ].map((stat, i) => {
          const Icon = stat.icon;
          return (
            <motion.div 
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 24, delay: 0.1 + i * 0.1 }}
            >
              <GlassCard hoverGlow className="p-6 flex items-center gap-6">
                <div className={`w-14 h-14 rounded-full ${stat.bg} flex items-center justify-center border border-white/5`}>
                  <Icon className={`w-7 h-7 ${stat.color}`} />
                </div>
                <div>
                  <div className="text-3xl font-bold text-white">{stat.count}</div>
                  <div className="text-sm font-medium text-muted-foreground">{stat.label}</div>
                </div>
              </GlassCard>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
