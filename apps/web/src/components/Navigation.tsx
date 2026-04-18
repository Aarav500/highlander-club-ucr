"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { GlassNavbar, GlassButton } from "./GlassComponents";
import { Home, Compass, Map as MapIcon, Calendar, User, Bell } from "lucide-react";
import { motion } from "framer-motion";

const navItems = [
  { href: "/", label: "Feed", icon: Home },
  { href: "/explore", label: "Explore", icon: Compass },
  { href: "/map", label: "Map", icon: MapIcon },
  { href: "/calendar", label: "Calendar", icon: Calendar },
];

export function Navigation() {
  const pathname = usePathname();

  return (
    <GlassNavbar className="flex items-center justify-between px-6 py-3">
      {/* Brand */}
      <Link href="/" className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center shadow-[0_0_15px_rgba(30,106,255,0.4)]">
          <span className="text-primary-foreground font-bold text-lg leading-none">H</span>
        </div>
        <span className="font-bold text-xl tracking-tight text-white hidden sm:block">
          Highlander<span className="text-primary">Events</span>
        </span>
      </Link>

      {/* Main Nav Links */}
      <nav className="hidden md:flex items-center gap-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          
          return (
            <Link key={item.href} href={item.href} className="relative px-4 py-2 rounded-full transition-colors hover:bg-white/5">
              <span className={cn(
                "relative z-10 flex items-center gap-2 font-medium text-sm transition-colors duration-300",
                isActive ? "text-primary" : "text-muted-foreground hover:text-white"
              )}>
                <Icon className="w-4 h-4" />
                {item.label}
              </span>
              {isActive && (
                <motion.div
                  layoutId="nav-indicator"
                  className="absolute inset-0 bg-primary/10 rounded-full border border-primary/20"
                  transition={{ type: "spring", stiffness: 350, damping: 25 }}
                />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <button className="relative p-2 rounded-full text-muted-foreground hover:bg-white/10 hover:text-white transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-accent rounded-full border-2 border-background" />
        </button>
        <Link href="/profile">
          <div className="w-9 h-9 rounded-full bg-secondary border border-glass-border flex items-center justify-center overflow-hidden hover:border-primary/50 transition-colors cursor-pointer">
            <User className="w-5 h-5 text-muted-foreground" />
          </div>
        </Link>
      </div>
    </GlassNavbar>
  );
}
