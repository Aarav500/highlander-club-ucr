# SEO Template — Next.js Out-of-Box SEO

> Drop-in SEO setup for any app built from `fullstack-template`.
> Every new app ships with structured metadata, Open Graph, JSON-LD,
> sitemap, and performance best practices — zero extra config needed.

---

## 1. Root Layout Metadata (`apps/web/src/app/layout.tsx`)

Next.js App Router exports a `metadata` object that applies site-wide:

```tsx
import type { Metadata } from "next";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  title: {
    default: "Your App Name",
    template: "%s | Your App Name",    // per-page titles auto-suffix
  },
  description: "One compelling sentence describing what the app does and who it's for.",
  keywords: ["saas", "productivity", "your-niche-keyword"],
  authors: [{ name: "Your Name", url: "https://yoursite.com" }],
  creator: "Your Name",
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "Your App Name",
    title: "Your App Name",
    description: "One compelling sentence for social shares.",
    images: [
      {
        url: "/og-image.png",          // 1200×630 recommended
        width: 1200,
        height: 630,
        alt: "Your App Name — tagline",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Your App Name",
    description: "One compelling sentence for Twitter cards.",
    images: ["/og-image.png"],
    creator: "@yourhandle",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon-16x16.png",
    apple: "/apple-touch-icon.png",
  },
  manifest: "/site.webmanifest",
};
```

---

## 2. Per-Page Metadata

Each page can export its own `metadata` or use `generateMetadata` for dynamic content:

```tsx
// apps/web/src/app/pricing/page.tsx
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pricing",                    // renders as "Pricing | Your App Name"
  description: "Simple, transparent pricing for teams of all sizes.",
  openGraph: {
    title: "Pricing — Your App Name",
    description: "Simple, transparent pricing for teams of all sizes.",
  },
};
```

### Dynamic Metadata (for DB-driven pages)

```tsx
// apps/web/src/app/blog/[slug]/page.tsx
import type { Metadata } from "next";

export async function generateMetadata({ params }): Promise<Metadata> {
  const post = await getPost(params.slug);
  return {
    title: post.title,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      images: [{ url: post.coverImage, width: 1200, height: 630 }],
      type: "article",
      publishedTime: post.publishedAt,
    },
  };
}
```

---

## 3. JSON-LD Structured Data

Add structured data for rich search results. Use a reusable component:

```tsx
// apps/web/src/components/JsonLd.tsx
export default function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
```

### Organization Schema (root layout)

```tsx
<JsonLd data={{
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Your App Name",
  url: "https://yourapp.com",
  logo: "https://yourapp.com/logo.png",
  sameAs: [
    "https://twitter.com/yourhandle",
    "https://github.com/yourorg",
  ],
}} />
```

### Product/SaaS Schema (landing page)

```tsx
<JsonLd data={{
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Your App Name",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
}} />
```

---

## 4. Sitemap (`apps/web/src/app/sitemap.ts`)

Next.js auto-generates `sitemap.xml` from this file:

```tsx
import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://yourapp.com";

  return [
    { url: baseUrl, lastModified: new Date(), changeFrequency: "weekly", priority: 1 },
    { url: `${baseUrl}/pricing`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
    { url: `${baseUrl}/blog`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.7 },
    // Add dynamic routes here (blog posts, product pages, etc.)
  ];
}
```

---

## 5. Robots (`apps/web/src/app/robots.ts`)

```tsx
import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://yourapp.com";
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/api/", "/dashboard/"] },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
```

---

## 6. Performance Checklist

SEO and Core Web Vitals are tightly linked:

- [ ] Use Next.js `<Image>` component — auto-optimizes with `srcset`, WebP/AVIF, lazy loading
- [ ] Use `next/font` for self-hosted fonts — eliminates layout shift from font loading
- [ ] Server Components by default — minimize client JS bundle
- [ ] `loading.tsx` for route segments — shows skeleton UI during navigation
- [ ] `<Link>` for internal navigation — enables prefetching
- [ ] Avoid layout shifts — set explicit `width`/`height` on images, reserve space for dynamic content

---

## 7. Pre-Launch SEO Checklist

- [ ] `<title>` and `<meta name="description">` set on every page
- [ ] Open Graph image (`og-image.png`) created at 1200×630
- [ ] `favicon.ico`, `apple-touch-icon.png`, and `site.webmanifest` in `public/`
- [ ] `sitemap.ts` covers all public routes
- [ ] `robots.ts` blocks `/api/` and auth-gated routes
- [ ] JSON-LD on landing page (Organization or SoftwareApplication)
- [ ] Canonical URLs set (Next.js `metadataBase` handles this automatically)
- [ ] `NEXT_PUBLIC_SITE_URL` env var configured for production domain

---

## Related Files

| File | Purpose |
|------|---------|
| `distribution/viral-loops.md` | Referral programs and share buttons |
| `distribution/landing-page-generator.md` | Auto-generated marketing landing pages |
| `apps/web/src/app/layout.tsx` | Root layout where site-wide metadata lives |
