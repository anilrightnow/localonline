# Google Ad Slot Size Help

These slots are temporary placeholders. Replace each `GoogleAdSlot` with the final AdSense `<ins class="adsbygoogle">` code, or update `components/public/GoogleAdSlot.tsx` to render your real publisher and slot IDs.

## Recommended Placements

| Page | Slot | Component Size | Best Google Format | Why |
| --- | --- | --- | --- | --- |
| Home, below hero | `home-top-leaderboard` | `leaderboard` | 728x90 desktop, responsive on mobile | High visibility without blocking search intent. |
| Home, inside featured grid | `home-featured-in-feed` | `in-feed` | Native in-feed / fluid | Blends with business cards and usually performs better than side banners. |
| List page, top of results | `list-top-leaderboard` | `leaderboard` | 728x90 or responsive display | Strong impression inventory before users scan listings. |
| List page, after third result | `list-in-feed-after-third` | `in-feed` | Native in-feed / fluid | Good revenue placement after user engagement starts. |
| Short list pages | `list-in-feed-short-results` | `in-feed` | Native in-feed / fluid | Keeps ad inventory even when fewer than three listings exist. |
| Detail page, overview | `detail-overview-rectangle` | `medium-rectangle` | 300x250 / 336x280 | Good detail-page monetization near business info and contact intent. |

## Size Guide

| Size Key | Desktop Target | Mobile Target | Use For |
| --- | --- | --- | --- |
| `leaderboard` | 728x90 or responsive 970x90 | 320x100 | Top page inventory. |
| `large-mobile-banner` | 320x100 | 320x100 | Mobile-only banner slots. |
| `in-feed` | Fluid/native | Fluid/native | Between business cards and result items. |
| `medium-rectangle` | 300x250 or 336x280 | 300x250 responsive | Detail page content blocks. |
| `responsive-display` | Responsive | Responsive | General fallback display placement. |

## Manual AdSense Swap

Example replacement shape:

```tsx
<ins
  className="adsbygoogle"
  style={{ display: "block" }}
  data-ad-client="ca-pub-XXXXXXXXXXXXXXXX"
  data-ad-slot="YOUR_SLOT_ID"
  data-ad-format="auto"
  data-full-width-responsive="true"
/>
```

After adding real AdSense, load the AdSense script once in `_app.tsx` or the relevant page head.
