# SaveTheDate

One-page animated digital save-the-date (envelope → wax seal → card). Plain HTML/CSS/JS, no build step, no dependencies. Deployed by GitHub Pages straight from `main`, custom domain in `CNAME`. `README.md` is the full design write-up — read it before changing the animation.

**Public repo:** keep guest-facing details in the site files, not in commit messages, issues or this file.

## Run
- `./serve.sh [port]` → http://localhost:8000 (python3 http.server). It must be served over http: `file://` blocks the fonts and video.
- Phone test on the same wifi: `ipconfig getifaddr en0`, then `http://<ip>:8000`.

## Layout
- `index.html`: all markup. `assets/js/app.js`: the reveal sequence (GSAP, vendored as `assets/js/gsap.min.js`; don't swap in a CDN copy).
- `assets/css/styles.css`, self-hosted fonts in `assets/fonts/` (woff2).
- `assets/video/`: `save-the-date.mp4` and a `-540` mobile rendition; `tools/transcode.swift` regenerates them. `assets/img/poster*.jpg` are the video posters.
- `assets/*.ics`: the "add to calendar" file.

## Conventions
- Pushing `main` deploys. Use a branch for experiments, and check desktop and phone (iOS Safari especially) before merging.
- This site's envelope animation is the original that later sites (mirrorball) reused.
