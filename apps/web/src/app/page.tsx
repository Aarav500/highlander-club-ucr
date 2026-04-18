import { FeedClient } from "@/components/FeedClient";

async function getEvents() {
  try {
    const res = await fetch(`${process.env.API_TARGET || "http://localhost:3001"}/api/events`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return [];
    return res.json();
  } catch (error) {
    console.error("Failed to fetch events:", error);
    return [];
  }
}

export default async function Home() {
  const events = await getEvents();

  return (
    <div className="flex flex-col gap-8 pb-16">
      {/* Hero Section */}
      <section className="relative w-full rounded-3xl overflow-hidden border border-glass-border bg-glass-bg backdrop-blur-md p-8 md:p-12 shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-transparent to-accent/10 mix-blend-overlay" />
        <div className="relative z-10 max-w-2xl">
  <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4 tracking-tight">
            Discover What&apos;s <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">Happening</span>
          </h1>
          <p className="text-lg text-muted-foreground mb-8">
            Explore events, join clubs, and connect with the Highlander community. 
            Experience UCR like never before with our premium discovery platform.
          </p>
          <div className="flex flex-wrap gap-4">
            <button className="px-8 py-3 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-[0_0_20px_rgba(30,106,255,0.4)] transition-all hover:scale-105 active:scale-95">
              Explore Clubs
            </button>
            <button className="px-8 py-3 rounded-full bg-white/5 hover:bg-white/10 text-white font-semibold border border-white/10 transition-all hover:scale-105 active:scale-95 backdrop-blur-sm">
              View Calendar
            </button>
          </div>
        </div>
      </section>

      {/* Feed Section */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <span className="w-8 h-1 rounded-full bg-accent" />
            Upcoming Events
          </h2>
        </div>
        <FeedClient initialEvents={events} />
      </section>
    </div>
  );
}
