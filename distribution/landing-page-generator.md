# Landing Page Generator — Auto-Generate Marketing Sites

> Every app built from `fullstack-template` ships with a production-quality
> landing page. This guide provides the component library, content structure,
> and generation workflow to produce a marketing site from a spec in minutes.

---

## Landing Page Architecture

A generated landing page follows a proven SaaS conversion structure:

```
┌──────────────────────────────────────────────┐
│  Navbar (Logo + Nav + CTA)                   │
├──────────────────────────────────────────────┤
│  Hero (Headline + Subheadline + CTA + Image) │
├──────────────────────────────────────────────┤
│  Social Proof (Logos / Testimonials / Stats)  │
├──────────────────────────────────────────────┤
│  Features Grid (3–6 cards with icons)         │
├──────────────────────────────────────────────┤
│  How It Works (3-step visual flow)            │
├──────────────────────────────────────────────┤
│  Pricing (Tier cards — Free / Pro / Enterprise│
├──────────────────────────────────────────────┤
│  FAQ (Accordion)                              │
├──────────────────────────────────────────────┤
│  CTA Banner (Final conversion push)          │
├──────────────────────────────────────────────┤
│  Footer (Links + Legal + Social)             │
└──────────────────────────────────────────────┘
```

---

## Component Library

All components use the existing design system from `globals.css` (design tokens,
glass cards, glow effects, gradient text) and Framer Motion for animations.

### 1. Hero Section

```tsx
// apps/web/src/components/landing/Hero.tsx
"use client";

import { motion } from "framer-motion";
import { useMotionVariants } from "@/components/motion";

interface HeroProps {
  headline: string;
  subheadline: string;
  ctaText: string;
  ctaHref: string;
  secondaryCtaText?: string;
  secondaryCtaHref?: string;
}

export default function Hero({
  headline, subheadline, ctaText, ctaHref,
  secondaryCtaText, secondaryCtaHref,
}: HeroProps) {
  const { fadeUp, shouldAnimate } = useMotionVariants();

  return (
    <section className="relative z-10 max-w-5xl mx-auto px-6 pt-32 pb-20 text-center">
      <motion.h1
        variants={fadeUp} initial="hidden" animate="visible" custom={0}
        className="text-5xl sm:text-7xl font-bold tracking-tight leading-[1.1] mb-6"
      >
        <span className="gradient-text">{headline}</span>
      </motion.h1>

      <motion.p
        variants={fadeUp} initial="hidden" animate="visible" custom={1}
        className="text-lg sm:text-xl text-zinc-400 max-w-2xl mx-auto mb-10"
      >
        {subheadline}
      </motion.p>

      <motion.div
        variants={fadeUp} initial="hidden" animate="visible" custom={2}
        className="flex flex-col sm:flex-row gap-4 justify-center"
      >
        <a href={ctaHref} className="px-8 py-4 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold transition-colors">
          {ctaText}
        </a>
        {secondaryCtaText && (
          <a href={secondaryCtaHref} className="px-8 py-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-semibold transition-colors border border-zinc-700">
            {secondaryCtaText}
          </a>
        )}
      </motion.div>
    </section>
  );
}
```

### 2. Features Grid

```tsx
// apps/web/src/components/landing/FeaturesGrid.tsx
"use client";

import { motion } from "framer-motion";
import { useMotionVariants } from "@/components/motion";

interface Feature {
  icon: string;
  title: string;
  description: string;
}

export default function FeaturesGrid({ features }: { features: Feature[] }) {
  const { fadeUp } = useMotionVariants();

  return (
    <section id="features" className="relative z-10 max-w-6xl mx-auto px-6 py-20">
      <h2 className="text-3xl font-bold text-center mb-12">Features</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {features.map((f, i) => (
          <motion.div
            key={f.title}
            variants={fadeUp} initial="hidden" whileInView="visible"
            viewport={{ once: true }} custom={i}
            className="glass rounded-xl p-6 hover:glow transition-shadow"
          >
            <div className="text-3xl mb-4">{f.icon}</div>
            <h3 className="text-lg font-semibold mb-2">{f.title}</h3>
            <p className="text-zinc-400 text-sm">{f.description}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
```

### 3. Pricing Section

```tsx
// apps/web/src/components/landing/Pricing.tsx
"use client";

import { motion } from "framer-motion";

interface Plan {
  name: string;
  price: string;
  period?: string;
  features: string[];
  ctaText: string;
  ctaHref: string;
  highlighted?: boolean;
}

export default function Pricing({ plans }: { plans: Plan[] }) {
  return (
    <section id="pricing" className="relative z-10 max-w-5xl mx-auto px-6 py-20">
      <h2 className="text-3xl font-bold text-center mb-12">Pricing</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <motion.div
            key={plan.name}
            whileHover={{ y: -4 }}
            className={`glass rounded-2xl p-8 flex flex-col ${
              plan.highlighted ? "border-violet-500/50 glow" : ""
            }`}
          >
            <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
            <div className="text-4xl font-bold mb-1">{plan.price}</div>
            {plan.period && <div className="text-zinc-500 text-sm mb-6">{plan.period}</div>}
            <ul className="flex-1 space-y-3 mb-8">
              {plan.features.map((f) => (
                <li key={f} className="text-sm text-zinc-300 flex items-start gap-2">
                  <span className="text-violet-400 mt-0.5">✓</span> {f}
                </li>
              ))}
            </ul>
            <a href={plan.ctaHref} className={`block text-center py-3 rounded-xl font-semibold transition-colors ${
              plan.highlighted
                ? "bg-violet-600 hover:bg-violet-500 text-white"
                : "bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700"
            }`}>
              {plan.ctaText}
            </a>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
```

### 4. FAQ Accordion

```tsx
// apps/web/src/components/landing/FAQ.tsx
"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface FAQItem {
  question: string;
  answer: string;
}

export default function FAQ({ items }: { items: FAQItem[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section id="faq" className="relative z-10 max-w-3xl mx-auto px-6 py-20">
      <h2 className="text-3xl font-bold text-center mb-12">FAQ</h2>
      <div className="space-y-3">
        {items.map((item, i) => (
          <div key={i} className="glass rounded-xl overflow-hidden">
            <button
              onClick={() => setOpenIndex(openIndex === i ? null : i)}
              className="w-full text-left px-6 py-4 flex justify-between items-center"
            >
              <span className="font-medium">{item.question}</span>
              <span className="text-zinc-500">{openIndex === i ? "−" : "+"}</span>
            </button>
            <AnimatePresence>
              {openIndex === i && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="px-6 pb-4 text-sm text-zinc-400"
                >
                  {item.answer}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
    </section>
  );
}
```

---

## Generation Workflow

When creating a landing page for a new app, follow this process:

### Step 1 — Extract Content from Spec

Read the app's spec (`specs/<slug>-spec.md`) and extract:

| Content | Source in Spec |
|---------|---------------|
| Headline | Product name + tagline |
| Subheadline | Product description (1–2 sentences) |
| Features | Core user stories → rewrite as benefits |
| Pricing tiers | Plan limits from billing addendum (if present) |
| FAQ | Common objections and onboarding questions |

### Step 2 — Assemble the Page

1. Copy the landing page components into `apps/web/src/components/landing/`.
2. Create `apps/web/src/app/(marketing)/page.tsx` with:
   - `Hero` — headline, subheadline, CTA to signup
   - `FeaturesGrid` — 3–6 features from spec
   - `Pricing` — tiers from billing config (or placeholder if no billing)
   - `FAQ` — 4–6 questions
   - `ShareButtons` from `distribution/viral-loops.md`
3. Apply SEO metadata from `distribution/seo-template.md`.
4. Generate OG image (1200×630) with app name and tagline.

### Step 3 — Polish

1. Add `JsonLd` structured data (SoftwareApplication schema).
2. Verify responsive design at 375px, 768px, 1280px.
3. Run Lighthouse — target 90+ on Performance, Accessibility, SEO, and Best Practices.
4. Add `prefers-reduced-motion` support (already handled by component library).

---

## Integration with `new-production-app` Workflow

The landing page generation is triggered automatically during Phase 2B (Frontend)
of the `new-production-app` workflow when the distribution gate is active:

1. Components are placed in `apps/web/src/components/landing/`.
2. The marketing page is created at `apps/web/src/app/(marketing)/page.tsx`.
3. SEO metadata is set in the root layout per `distribution/seo-template.md`.
4. Share buttons are added to the landing page and key app pages.

---

## Related Files

| File | Purpose |
|------|---------|
| `distribution/seo-template.md` | SEO metadata, Open Graph, JSON-LD |
| `distribution/viral-loops.md` | Share buttons, referrals, UTM tracking |
| `apps/web/src/app/globals.css` | Design tokens used by all components |
| `apps/web/src/components/motion.tsx` | Framer Motion variant hooks |
