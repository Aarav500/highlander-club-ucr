"use client";

import { motion } from "framer-motion";
import { GlassCard } from "./GlassComponents";
import { Calendar, MapPin, Users, Heart } from "lucide-react";
import Image from "next/image";

interface Event {
  id: string;
  title: string;
  club_name: string;
  start_time: string;
  location: string;
  rsvp_count: string;
  category: string;
  image_url?: string;
  user_rsvped?: boolean;
}

const containerVars = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVars = {
  hidden: { opacity: 0, y: 30, scale: 0.95 },
  show: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 300, damping: 24 } },
};

const categoryColors: Record<string, string> = {
  Academic: "bg-blue-500",
  Social: "bg-pink-500",
  Sports: "bg-green-500",
  Career: "bg-indigo-500",
  Cultural: "bg-amber-500",
  "Greek Life": "bg-purple-500",
  Arts: "bg-orange-500",
  Technology: "bg-cyan-500",
};

export function FeedClient({ initialEvents }: { initialEvents: Event[] }) {
  if (!initialEvents || initialEvents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Calendar className="w-16 h-16 text-muted-foreground mb-4 opacity-50" />
        <h2 className="text-2xl font-bold text-foreground">No Upcoming Events</h2>
        <p className="text-muted-foreground mt-2">Follow some clubs to see their events here.</p>
      </div>
    );
  }

  return (
    <motion.div
      variants={containerVars}
      initial="hidden"
      animate="show"
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
    >
      {initialEvents.map((event) => {
        const catColor = categoryColors[event.category] || "bg-primary";
        const eventDate = new Date(event.start_time);

        return (
          <motion.div key={event.id} variants={itemVars} className="h-full flex">
            <GlassCard hoverGlow className="w-full flex flex-col group cursor-pointer h-full">
              {/* Event Image / Gradient Placeholder */}
              <div className="relative h-48 w-full overflow-hidden bg-secondary">
                {event.image_url ? (
                  <Image
                    src={event.image_url}
                    alt={event.title}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-secondary to-background opacity-80" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
                
                {/* Category Badge */}
                <div className="absolute top-4 left-4 flex items-center">
                  <div className={`px-3 py-1 rounded-full text-xs font-bold text-white shadow-lg backdrop-blur-md ${catColor}/80 border border-white/20`}>
                    {event.category || "Event"}
                  </div>
                </div>

                {/* RSVP Button */}
                <button className="absolute top-4 right-4 p-2 rounded-full bg-black/40 backdrop-blur-md border border-white/10 hover:bg-black/60 transition-colors">
                  <Heart className={`w-5 h-5 ${event.user_rsvped ? "fill-destructive text-destructive" : "text-white"}`} />
                </button>
              </div>

              {/* Event Details */}
              <div className="p-5 flex-1 flex flex-col">
                <div className="text-xs font-bold tracking-wider text-muted-foreground uppercase mb-2">
                  {event.club_name}
                </div>
                <h3 className="text-xl font-bold text-white leading-tight mb-4 group-hover:text-primary transition-colors">
                  {event.title}
                </h3>
                
                <div className="mt-auto space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="w-4 h-4 text-primary" />
                    <span>
                      {eventDate.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                      {" · "}
                      {eventDate.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}
                    </span>
                  </div>
                  {event.location && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="w-4 h-4 text-accent" />
                      <span className="truncate">{event.location}</span>
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
                    <Users className="w-4 h-4" />
                    <span>{event.rsvp_count || 0} attending</span>
                  </div>
                  <div className="text-primary font-semibold text-sm group-hover:underline">
                    View Details →
                  </div>
                </div>
              </div>
            </GlassCard>
          </motion.div>
        );
      })}
    </motion.div>
  );
}
