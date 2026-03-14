# Viral Loops — Referrals, Share Buttons, and Growth Mechanics

> Prebuilt viral distribution patterns for any app built from `fullstack-template`.
> Every new app should ship with at least share buttons; referral programs are
> added when the app has user accounts and a growth loop.

---

## 1. Share Buttons Component

A zero-dependency, privacy-friendly share component using native share URLs
(no third-party tracking scripts):

```tsx
// apps/web/src/components/ShareButtons.tsx
"use client";

interface ShareButtonsProps {
  url: string;
  title: string;
  description?: string;
}

const SHARE_CHANNELS = [
  {
    name: "Twitter",
    icon: "𝕏",
    url: (u: string, t: string) =>
      `https://twitter.com/intent/tweet?url=${encodeURIComponent(u)}&text=${encodeURIComponent(t)}`,
  },
  {
    name: "LinkedIn",
    icon: "in",
    url: (u: string, t: string) =>
      `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(u)}`,
  },
  {
    name: "Email",
    icon: "✉",
    url: (u: string, t: string) =>
      `mailto:?subject=${encodeURIComponent(t)}&body=${encodeURIComponent(`Check this out: ${u}`)}`,
  },
  {
    name: "Copy Link",
    icon: "🔗",
    url: null, // handled via clipboard API
  },
];

export default function ShareButtons({ url, title, description }: ShareButtonsProps) {
  const handleNativeShare = async () => {
    if (navigator.share) {
      await navigator.share({ title, text: description, url });
    }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(url);
    // show toast notification
  };

  return (
    <div className="flex items-center gap-2">
      {/* Native share (mobile) */}
      {typeof navigator !== "undefined" && "share" in navigator && (
        <button onClick={handleNativeShare} className="share-btn" aria-label="Share">
          📤
        </button>
      )}

      {/* Channel buttons */}
      {SHARE_CHANNELS.map((ch) =>
        ch.url ? (
          <a
            key={ch.name}
            href={ch.url(url, title)}
            target="_blank"
            rel="noopener noreferrer"
            className="share-btn"
            aria-label={`Share on ${ch.name}`}
          >
            {ch.icon}
          </a>
        ) : (
          <button key={ch.name} onClick={handleCopy} className="share-btn" aria-label={ch.name}>
            {ch.icon}
          </button>
        )
      )}
    </div>
  );
}
```

### Styling

```css
/* Add to globals.css */
.share-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.5rem;
  height: 2.5rem;
  border-radius: var(--radius-lg);
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s;
}
.share-btn:hover {
  background: var(--color-accent-soft);
  border-color: var(--color-accent);
  transform: scale(1.05);
}
```

---

## 2. Referral Program

For apps with user accounts, a referral system that tracks who invited whom
and rewards both parties.

### Database Schema

```sql
CREATE TABLE IF NOT EXISTS referrals (
  id            SERIAL PRIMARY KEY,
  referrer_id   TEXT        NOT NULL,           -- user who shared the link
  referee_id    TEXT,                            -- user who signed up (null until conversion)
  referral_code TEXT        NOT NULL UNIQUE,     -- short code (e.g., "abc123")
  status        TEXT        NOT NULL DEFAULT 'pending',  -- pending | converted | rewarded
  reward_type   TEXT,                            -- credit | discount | feature_unlock
  reward_amount NUMERIC,                         -- e.g., 10.00 for $10 credit
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  converted_at  TIMESTAMPTZ
);

CREATE INDEX idx_referrals_code ON referrals (referral_code);
CREATE INDEX idx_referrals_referrer ON referrals (referrer_id);
```

### Backend Routes

```
src/routes/referrals.js
```

```js
const { Router } = require("express");
const crypto = require("crypto");
const { query } = require("../db");

const router = Router();

/* ── Generate referral link ──────────────────────────────────────── */
router.post("/generate", async (req, res, next) => {
  try {
    const referralCode = crypto.randomBytes(4).toString("hex"); // 8-char code
    await query(
      `INSERT INTO referrals (referrer_id, referral_code) VALUES ($1, $2)`,
      [req.user.id, referralCode]
    );
    const referralUrl = `${process.env.FRONTEND_URL}/signup?ref=${referralCode}`;
    res.json({ referralCode, referralUrl });
  } catch (err) {
    next(err);
  }
});

/* ── Convert referral on signup ──────────────────────────────────── */
router.post("/convert", async (req, res, next) => {
  try {
    const { referralCode, newUserId } = req.body;
    if (!referralCode || !newUserId) {
      return res.status(400).json({ error: "referralCode and newUserId required" });
    }

    const result = await query(
      `UPDATE referrals
       SET referee_id = $1, status = 'converted', converted_at = now()
       WHERE referral_code = $2 AND status = 'pending'
       RETURNING *`,
      [newUserId, referralCode]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Invalid or already-used referral code" });
    }

    // TODO: Apply reward to both referrer and referee
    res.json({ data: result.rows[0] });
  } catch (err) {
    next(err);
  }
});

/* ── Get referral stats ──────────────────────────────────────────── */
router.get("/stats", async (req, res, next) => {
  try {
    const result = await query(
      `SELECT
         COUNT(*) FILTER (WHERE status = 'pending') AS pending,
         COUNT(*) FILTER (WHERE status = 'converted') AS converted,
         COUNT(*) FILTER (WHERE status = 'rewarded') AS rewarded
       FROM referrals WHERE referrer_id = $1`,
      [req.user.id]
    );
    res.json({ data: result.rows[0] });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
```

### Frontend: Referral Widget

```tsx
// apps/web/src/components/ReferralWidget.tsx
"use client";

import { useState } from "react";
import ShareButtons from "./ShareButtons";

export default function ReferralWidget() {
  const [referralUrl, setReferralUrl] = useState<string | null>(null);

  const generateLink = async () => {
    const res = await fetch("/api/referrals/generate", { method: "POST" });
    const { referralUrl } = await res.json();
    setReferralUrl(referralUrl);
  };

  return (
    <div className="glass rounded-2xl p-6">
      <h3 className="text-lg font-bold mb-2">Invite Friends</h3>
      <p className="text-zinc-400 text-sm mb-4">
        Share your unique link. You both get rewarded when they sign up.
      </p>
      {referralUrl ? (
        <>
          <input
            readOnly
            value={referralUrl}
            className="w-full px-3 py-2 rounded-lg bg-zinc-800 text-sm text-zinc-200 border border-zinc-700 mb-3"
          />
          <ShareButtons url={referralUrl} title="Join me on AppName!" />
        </>
      ) : (
        <button onClick={generateLink} className="btn-primary">
          Generate Invite Link
        </button>
      )}
    </div>
  );
}
```

---

## 3. UTM Tracking Middleware

Track where users come from and which channels perform best:

```js
// apps/web/src/middleware.ts (Next.js middleware)
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const response = NextResponse.next();
  const { searchParams } = request.nextUrl;

  // Persist UTM params in a cookie for attribution
  const utmParams = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "ref"];
  const utmData: Record<string, string> = {};

  for (const param of utmParams) {
    const value = searchParams.get(param);
    if (value) utmData[param] = value;
  }

  if (Object.keys(utmData).length > 0) {
    response.cookies.set("utm_data", JSON.stringify(utmData), {
      maxAge: 30 * 24 * 60 * 60, // 30 days
      path: "/",
      httpOnly: true,
      sameSite: "lax",
    });
  }

  return response;
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
```

---

## 4. Viral Growth Checklist

Every new app should implement at minimum the first tier:

### Tier 1 — Share Buttons (all apps)

- [ ] `ShareButtons` component on key pages (landing, results, profiles)
- [ ] Native Web Share API on mobile
- [ ] Copy Link with toast confirmation
- [ ] Social meta tags set (OG image, Twitter card) via `distribution/seo-template.md`

### Tier 2 — Referrals (apps with user accounts)

- [ ] Referral code generation endpoint
- [ ] Referral conversion on signup
- [ ] Referral stats dashboard
- [ ] Reward fulfillment (credit, discount, or feature unlock)

### Tier 3 — Advanced (growth-stage apps)

- [ ] UTM tracking middleware for channel attribution
- [ ] Invite-by-email flow (batch invites)
- [ ] Social proof widgets (e.g., "X people signed up today")
- [ ] Milestone rewards (invite 5 friends → unlock premium feature)

---

## Related Files

| File | Purpose |
|------|---------|
| `distribution/seo-template.md` | SEO metadata, Open Graph, JSON-LD |
| `distribution/landing-page-generator.md` | Auto-generated marketing landing pages |
| `billing/stripe-checkout.md` | Stripe integration (referral rewards can tie into billing credits) |
