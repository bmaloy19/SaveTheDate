# Save the Date — McKenna & Jared

A one-page digital save-the-date. It opens as a sealed envelope; tapping the seal
swings the flap open and the invitation card slides out and grows into place.
Tapping the film hands off to the phone's native fullscreen video player.

**Live:** https://bmaloy19.github.io/SaveTheDate/

- **Saturday, May 29, 2027**
- Willow on Grand — 6011 Grand Avenue, Des Moines, IA 50312
- Wedding site: https://www.appycouple.com/wedding/mckennajared/welcome/

---

## The three beats

1. **The stamped front.** A landscape envelope: the film shows through a vellum
   window on the left, postmark and four botanical stamps on the right. Tapping
   turns it over.
2. **The back.** "Mark your calendars" on the flap, names along the pocket, a
   green wax seal. Tapping breaks the seal — the flap opens and the card rises
   out through the mouth, **lying on its side** the way a portrait card really
   sits in a landscape envelope.
3. **The card.** It stands upright as it settles, then presents portrait: a
   green oval cartouche (SAVE / *the* / DATE, names, date) over the film,
   venue, and the two buttons.

## Design

Matched to the couple's **Greenvelope** save-the-date:

| | |
|---|---|
| Display type | **Bodoni Moda** (closest free Bodoni revival) |
| Body type | **Open Sans** Light (300) |
| Green | `#8b9a56` — sampled from their Greenvelope theme |
| Deep / soft green | `#6b7a3e` / `#a8b583` |
| Vellum | `#f8f7ef` envelope, `#e4e8d5` page ground |

The stamps and postmark are generated SVG (perforations punched with a mask),
not images — they stay crisp at any size and cost nothing to download.

Fonts are self-hosted (latin subset only, ~168 KB total) rather than pulled from
Google Fonts — that removes a third-party connection from the critical path.

## Video

The source `engagement.MOV` was **HEVC/H.265**, which does not play in Firefox or
many Android browsers. It is transcoded to **H.264 + AAC in MP4**, which every
current browser supports, at two sizes:

| File | Size | Bitrate | Used when |
|---|---|---|---|
| `save-the-date.mp4` | 1280×720, 11.1 MB | 2.1 Mbps | default |
| `save-the-date-540.mp4` | 960×540, 5.9 MB | 1.1 Mbps | `saveData` or a 2G connection |

Both are written with the `moov` atom ahead of `mdat` (faststart), so playback can
begin while the file is still downloading instead of after.

`preload` is `none` until the envelope is opened, then upgraded to `metadata` — so
a visitor who never opens the envelope downloads no video at all, and one who does
gets a fullscreen handoff without stalling.

### Re-encoding from a new source

`tools/transcode.swift` uses AVFoundation, so it needs no ffmpeg install:

```bash
swiftc -O tools/transcode.swift -o /tmp/transcode
/tmp/transcode source.MOV assets/video/save-the-date.mp4 2200000 1280
/tmp/transcode source.MOV assets/video/save-the-date-540.mp4 1100000 960
```

## Bandwidth

GitHub Pages soft-caps at 100 GB/month. At ~11 MB per full view that is roughly
8,000 views — far beyond what a save-the-date needs. Nothing to worry about here,
but it is the number that would matter if this were ever shared widely.

## Structure

```
index.html                     markup, meta + link-preview tags
assets/css/styles.css          all styling; palette lives in :root
assets/js/app.js               envelope timeline, FLIP handoff, video
assets/js/gsap.min.js          GSAP 3.13 (vendored — no CDN)
assets/video/                  H.264 renditions
assets/img/                    poster frames, icons
assets/mckenna-jared-wedding.ics   add-to-calendar file
tools/transcode.swift          HEVC → H.264 encoder
```

No build step. It is static files; edit and push.

## Notes

- The reveal is a GSAP timeline, then a manual [FLIP](https://css-tricks.com/animating-layouts-with-the-flip-technique/)
  so the card's move from "inside the envelope" to "centred on screen" is one
  continuous motion rather than a jump.
- The envelope uses `perspective` on itself rather than `transform-style: preserve-3d`,
  so the flap still rotates in 3D while every panel keeps ordinary `z-index` stacking.
- `prefers-reduced-motion` skips straight to the open card.
- If GSAP fails to load, the page still opens — it just does so without animation.
- **iOS toolbar tint.** Safari 26 dropped support for `<meta theme-color>`; it now
  reads the `background-color` of `body`, or of a fixed element within 4px of the
  top / 3px of the bottom (>=80% wide, >=3px tall). Gradients are ignored, so the
  body needs a real `background-color` or the bars fall back to white. `.tint-top`
  and `.tint-bottom` in `styles.css` give each bar the gradient's colour at its own
  edge. The `theme-color` meta is kept for Android Chrome and pre-26 iOS.
- `robots.txt` and a `noindex` meta keep it out of search results. It is reachable
  by anyone with the link, so treat the URL as the only gate.

## Editing the details

Names, date and venue are plain text in `index.html`. If the date or venue changes,
update it in **three** places: `index.html`, `assets/mckenna-jared-wedding.ics`, and
the `og:description` meta tag.
