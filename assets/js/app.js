/* ============================================================
   McKenna & Jared — Save the Date
   Envelope reveal + video handoff to the native fullscreen player.
   ============================================================ */
(function () {
  'use strict';

  var $ = function (id) { return document.getElementById(id); };

  var stage    = $('stage');
  var scene    = $('scene');
  var envelope = $('envelope');
  var flap     = $('flap');
  var lining   = document.querySelector('.env-lining');
  var seal     = $('seal');
  var cue      = $('cue');
  var cardSlot = $('cardSlot');
  var card     = $('card');
  var film     = $('film');
  var video    = $('video');
  var playBtn  = $('playBtn');

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var opened  = false;

  /* ── pick a rendition ──────────────────────────────────────
     720p by default; drop to 540p only when the browser tells us
     the connection is metered or slow. */
  var HD = 'assets/video/save-the-date.mp4';
  var SD = 'assets/video/save-the-date-540.mp4';

  function chooseSource() {
    var c = navigator.connection || navigator.webkitConnection;
    if (c && (c.saveData || /^(slow-)?2g$/.test(c.effectiveType || ''))) return SD;
    return HD;
  }
  video.src = chooseSource();

  /* ── envelope reveal ──────────────────────────────────────── */

  function openEnvelope() {
    if (opened) return;
    opened = true;
    seal.setAttribute('disabled', '');
    scene.classList.add('is-opening');
    // the CSS "breathe" keyframes animate opacity too, and a running CSS
    // animation outranks inline styles — so GSAP can't fade the cue until
    // the keyframes are switched off
    cue.style.animation = 'none';

    // they've engaged — safe to start fetching video metadata now,
    // so the play tap can hand off to fullscreen without a stall
    video.preload = 'metadata';

    if (reduced || !window.gsap) { finish(true); return; }

    var eh = envelope.offsetHeight;

    var tl = gsap.timeline({ defaults: { ease: 'power3.out' }, onComplete: function () { finish(false); } });

    tl.to(cue,  { opacity: 0, y: 6, duration: 0.3 }, 0)
      .to(seal, { scale: 0.68, opacity: 0, rotation: -16, duration: 0.45, ease: 'power2.in' }, 0)

      // flap swings up and over the back of the envelope
      .set(lining, { opacity: 1 }, 0.2)
      .to(flap, {
        rotateX: -180,
        duration: 0.95,
        ease: 'power2.inOut',
        onUpdate: function () {
          // once past vertical the flap belongs *behind* the envelope
          flap.style.zIndex = (gsap.getProperty(flap, 'rotateX') < -90) ? '0' : '8';
        }
      }, 0.2)

      // card lifts far enough that its head clears the envelope's top edge
      .to(cardSlot, { y: -eh * 0.46, duration: 0.8, ease: 'power2.out' }, 0.95);
  }

  /* The card is a good deal taller than the envelope, so at rest it gets
     scaled down to sit wholly inside it — otherwise it pokes out of the top
     before anything has been opened. The FLIP at the end grows it back to
     full size, which is what sells the "unfolding" moment. */
  function seatCard() {
    if (!window.gsap || cardSlot.classList.contains('is-out')) return;
    var s = Math.min(0.9, (envelope.offsetHeight * 0.80) / card.offsetHeight);
    gsap.set(cardSlot, { xPercent: -50, x: 0, y: 0, scale: s, transformOrigin: '50% 100%' });
  }

  /* Hand the card off from "inside the envelope" to its own centred
     layout, using a FLIP so the size/position change is one motion
     instead of a jump. */
  function finish(instant) {
    var first = card.getBoundingClientRect();

    // lift the card out of the envelope's subtree so the envelope can be
    // dismissed without taking the card with it
    stage.appendChild(cardSlot);
    cardSlot.classList.add('is-out');
    stage.classList.add('is-revealed');

    if (instant || !window.gsap) {
      if (window.gsap) gsap.set(cardSlot, { clearProps: 'all' });
      else cardSlot.style.transform = 'none';
      scene.style.display = 'none';
      revealContent(true);
      return;
    }

    // centre the now-absolute envelope on the spot it already occupies
    gsap.set(scene, { xPercent: -50, yPercent: -50 });
    gsap.set(cardSlot, { clearProps: 'transform' });
    var last = card.getBoundingClientRect();

    gsap.set(cardSlot, {
      xPercent: 0,
      x: first.left - last.left,
      y: first.top  - last.top,
      scale: first.width / last.width,
      transformOrigin: '0 0'
    });

    gsap.timeline()
      .to(scene, {
        opacity: 0, y: 26, scale: 0.94, duration: 0.5, ease: 'power2.in',
        onComplete: function () { scene.style.display = 'none'; }
      }, 0)
      .to(cardSlot, {
        x: 0, y: 0, scale: 1,
        duration: 0.85,
        ease: 'power3.inOut',
        onComplete: function () { gsap.set(cardSlot, { clearProps: 'transform' }); }
      }, 0)
      .add(revealContent, 0.3);
  }

  /* lower half of the card fills in as it lands */
  function revealContent(instant) {
    var bits = card.querySelectorAll('.rule, .date, .film, .venue, .actions, .footnote');
    if (instant === true || reduced || !window.gsap) {
      gsap && gsap.set(bits, { opacity: 1, y: 0 });
      return;
    }
    gsap.fromTo(bits,
      { opacity: 0, y: 14 },
      { opacity: 1, y: 0, duration: 0.6, stagger: 0.075, ease: 'power2.out' });
  }

  /* hide those bits up front so the stagger has somewhere to come from */
  if (window.gsap && !reduced) {
    gsap.set(card.querySelectorAll('.rule, .date, .film, .venue, .actions, .footnote'), { opacity: 0 });
  }

  // "Tap" reads wrong on a desktop with a mouse
  if (!window.matchMedia('(hover: none)').matches) cue.textContent = 'Click to open';

  seatCard();
  window.addEventListener('resize', seatCard);
  // late-arriving webfonts change the card's height, so re-seat afterwards
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(seatCard);

  seal.addEventListener('click', openEnvelope);
  envelope.addEventListener('click', function (e) {
    if (!opened && !e.target.closest('.card')) openEnvelope();
  });

  /* ── video: play, then hand off to the native fullscreen player ── */

  function goFullscreen(el) {
    if (el.requestFullscreen)             return el.requestFullscreen();
    if (el.webkitEnterFullscreen)         return el.webkitEnterFullscreen();   // iPhone
    if (el.webkitRequestFullscreen)       return el.webkitRequestFullscreen();
    if (el.webkitSupportsPresentationMode) return el.webkitSetPresentationMode('fullscreen');
    return null;
  }

  playBtn.addEventListener('click', function () {
    film.classList.add('is-playing');

    var p = video.play();
    if (p && p.catch) p.catch(function () { /* fullscreen still worth trying */ });

    // iOS needs metadata before it will accept webkitEnterFullscreen
    if (video.readyState >= 1) {
      tryFullscreen();
    } else {
      video.addEventListener('loadedmetadata', tryFullscreen, { once: true });
      video.load();
    }
  });

  function tryFullscreen() {
    try {
      var r = goFullscreen(video);
      if (r && r.catch) r.catch(function () { /* stays inline, which is fine */ });
    } catch (e) { /* stays inline */ }
  }

  // coming back from fullscreen shouldn't leave a black box
  video.addEventListener('ended', function () {
    film.classList.remove('is-playing');
    video.currentTime = 0;
  });

})();
