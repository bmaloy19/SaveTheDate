# Save the Date — McKenna & Jared

A one-page digital save-the-date. It opens as a sealed envelope; tapping the seal
swings the flap open and the invitation card slides out and grows into place.
Tapping the film hands off to the phone's native fullscreen video player.

**Live:** https://bmaloy19.github.io/SaveTheDate/

- **Saturday, May 29, 2027**
- Willow on Grand — 6011 Grand Avenue, Des Moines, IA 50312
- Wedding site: https://www.appycouple.com/wedding/mckennajared/welcome/

---

## Design

Palette and typography are matched to the couple's Appy Couple wedding site so the
two read as one suite:

| | |
|---|---|
| Display type | Bauer Bodoni on their site → **Bodoni Moda** (the closest free Bodoni revival) |
| Body type | **Open Sans** Light (300), same as their site |
| Sand | `#d7c2a3` — their heading colour |
| Cream | `#efe8e0` / `#e8e0d7` |
| Charcoal | `#454545` |

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
- `robots.txt` and a `noindex` meta keep it out of search results. It is reachable
  by anyone with the link, so treat the URL as the only gate.

## Editing the details

Names, date and venue are plain text in `index.html`. If the date or venue changes,
update it in **three** places: `index.html`, `assets/mckenna-jared-wedding.ics`, and
the `og:description` meta tag.
