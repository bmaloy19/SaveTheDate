/* ============================================================
   McKenna & Jared — Save the Date

   Three beats:
     1. the stamped front  — tap turns the envelope over
     2. the back           — tap breaks the seal, the flap opens and the
                             card rises out lying on its side
     3. the card           — tap the film for the native fullscreen player
   ============================================================ */
(function () {
  'use strict';

  var $ = function (id) { return document.getElementById(id); };

  var stage    = $('stage');
  var scene    = $('scene');
  var flipper  = $('flipper');
  var faceFront= $('faceFront');
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
  var touch   = window.matchMedia('(hover: none)').matches;
  var VERB    = touch ? 'Tap' : 'Click';

  var state = 'front';        // front -> flipping -> back -> opening -> done
  var flapBehind = false;
  var seatScale  = 1;

  /* ── pick a rendition ────────────────────────────────────── */
  var HD = 'assets/video/save-the-date.mp4';
  var SD = 'assets/video/save-the-date-540.mp4';
  function chooseSource() {
    var c = navigator.connection || navigator.webkitConnection;
    if (c && (c.saveData || /^(slow-)?2g$/.test(c.effectiveType || ''))) return SD;
    return HD;
  }
  video.src = chooseSource();

  cue.textContent = VERB + ' to turn over';

  /* ══ beat 1 — turn the envelope over ══ */

  function flipOver() {
    if (state !== 'front') return;
    state = 'flipping';
    setCue(VERB + ' to open');

    // engagement: safe to start pulling video metadata now
    video.preload = 'metadata';
    try { video.load(); } catch (e) { /* non-fatal */ }

    if (reduced || !window.gsap) { settleFlip(); return; }

    gsap.timeline({ onComplete: settleFlip })
      .to(flipper, { rotateY: 180, duration: 1.05, ease: 'power2.inOut' }, 0)
      // a touch of lift makes the turn feel like a hand doing it
      .to(flipper, { scale: 1.045, duration: 0.5,  ease: 'power2.out' }, 0)
      .to(flipper, { scale: 1,     duration: 0.55, ease: 'power2.in'  }, 0.5);
  }

  /* Drop out of 3D once the turn is finished. The back face carries its own
     rotateY(180); combined with the flipper's 180 that is a full turn, so
     zeroing both together leaves the geometry identical while handing the
     flap back a plain 2D context with ordinary z-index stacking. */
  function settleFlip() {
    if (window.gsap) gsap.set(flipper, { clearProps: 'transform' });
    flipper.classList.add('is-flat');
    faceFront.style.display = 'none';
    state = 'back';
    seatCard();
  }

  /* ══ beat 2 — break the seal, open, draw the card up and out ══ */

  function openEnvelope() {
    if (state !== 'back') return;
    state = 'opening';
    seal.setAttribute('disabled', '');
    // a running CSS animation outranks inline styles, so the keyframes have
    // to be switched off before GSAP can fade the cue
    cue.style.animation = 'none';

    if (reduced || !window.gsap) { finish(true); return; }

    var eh = envelope.offsetHeight;

    gsap.timeline({ defaults: { ease: 'power3.out' }, onComplete: function () { finish(false); } })
      .to(cue,  { opacity: 0, y: 6, duration: 0.3 }, 0)
      .to(seal, { scale: 0.68, opacity: 0, rotation: -16, duration: 0.45, ease: 'power2.in' }, 0)

      // the script is printed on the flap; it would read mirrored once the
      // flap swings past vertical, so it goes before that happens
      .to('.eb-script', { opacity: 0, duration: 0.35, ease: 'power2.in' }, 0.2)
      .set(lining, { opacity: 1 }, 0.2)
      .to(flap, {
        rotateX: -180,
        duration: 0.95,
        ease: 'power2.inOut',
        onUpdate: function () {
          // once past vertical the flap belongs behind the envelope; only
          // write on the actual crossing, not every tick
          var behind = gsap.getProperty(flap, 'rotateX') < -90;
          if (behind !== flapBehind) {
            flapBehind = behind;
            flap.style.zIndex = behind ? '0' : '8';
          }
        }
      }, 0.2)

      // …and the card rises out through the mouth the flap just opened. It
      // stays lying on its side the whole way and only stands up once it has
      // cleared the envelope, during the settle.
      .to(cardSlot, { y: -eh * 0.64, duration: 0.9, ease: 'power2.out' }, 0.95);
  }

  /* The card lies on its side inside the landscape envelope, exactly as a
     portrait card really sits in one. Rotated 90deg its HEIGHT spans the
     envelope's width and its WIDTH spans the height, so it has to be fitted
     against both axes. It stands upright again during the final settle. */
  function seatCard() {
    if (!window.gsap || cardSlot.classList.contains('is-out')) return;
    seatScale = Math.min(
      0.9,
      (envelope.offsetWidth  * 0.86) / card.offsetHeight,
      (envelope.offsetHeight * 0.82) / card.offsetWidth
    );
    gsap.set(cardSlot, {
      xPercent: -50, yPercent: -50,
      x: 0, y: 0,
      rotation: 90,
      scale: seatScale,
      transformOrigin: '50% 50%'
    });
  }

  /* ══ beat 3 — hand the card off to its own centred layout ══ */

  function finish(instant) {
    var first = card.getBoundingClientRect();

    stage.appendChild(cardSlot);
    cardSlot.classList.add('is-out');
    stage.classList.add('is-revealed');

    if (instant || !window.gsap) {
      if (window.gsap) gsap.set(cardSlot, { clearProps: 'all' });
      else cardSlot.style.transform = 'none';
      scene.style.display = 'none';
      revealContent(true);
      state = 'done';
      return;
    }

    gsap.set(scene, { xPercent: -50, yPercent: -50 });
    gsap.set(cardSlot, { clearProps: 'transform' });
    var last = card.getBoundingClientRect();

    gsap.set(cardSlot, {
      xPercent: 0, yPercent: 0,
      x: (first.left + first.width  / 2) - (last.left + last.width  / 2),
      y: (first.top  + first.height / 2) - (last.top  + last.height / 2),
      rotation: 90,
      scale: seatScale,
      transformOrigin: '50% 50%'
    });

    gsap.timeline({ onComplete: function () { state = 'done'; } })
      .to(scene, {
        opacity: 0, y: 26, scale: 0.94, duration: 0.5, ease: 'power2.in',
        onComplete: function () { scene.style.display = 'none'; }
      }, 0)
      .to(cardSlot, {
        x: 0, y: 0, scale: 1, rotation: 0,
        duration: 1.0,
        ease: 'power3.inOut',
        onComplete: function () { gsap.set(cardSlot, { clearProps: 'transform' }); }
      }, 0)
      .add(revealContent, 0.3);
  }

  function revealContent(instant) {
    var bits = card.querySelectorAll('.film, .venue, .actions, .footnote');
    if (instant === true || reduced || !window.gsap) {
      if (window.gsap) gsap.set(bits, { opacity: 1, y: 0 });
      return;
    }
    gsap.fromTo(bits,
      { opacity: 0, y: 14 },
      { opacity: 1, y: 0, duration: 0.6, stagger: 0.08, ease: 'power2.out' });
  }

  if (window.gsap && !reduced) {
    gsap.set(card.querySelectorAll('.film, .venue, .actions, .footnote'), { opacity: 0 });
  }

  function setCue(text) {
    if (!window.gsap || reduced) { cue.textContent = text; return; }
    gsap.to(cue, {
      opacity: 0, duration: 0.25,
      onComplete: function () {
        cue.textContent = text;
        gsap.to(cue, { opacity: 0.85, duration: 0.3 });
      }
    });
  }

  /* ── wiring ── */

  seatCard();
  window.addEventListener('resize', seatCard);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(seatCard);

  flipper.addEventListener('click', function (e) {
    if (state === 'front') { flipOver(); return; }
    if (state === 'back' && !e.target.closest('.card')) openEnvelope();
  });
  seal.addEventListener('click', function (e) {
    e.stopPropagation();
    if (state === 'back') openEnvelope();
  });

  /* ── video: play, then hand off to the native fullscreen player ── */

  function goFullscreen(el) {
    if (el.requestFullscreen)              return el.requestFullscreen();
    if (el.webkitEnterFullscreen)          return el.webkitEnterFullscreen();   // iPhone
    if (el.webkitRequestFullscreen)        return el.webkitRequestFullscreen();
    if (el.webkitSupportsPresentationMode) return el.webkitSetPresentationMode('fullscreen');
    return null;
  }

  playBtn.addEventListener('click', function () {
    film.classList.add('is-playing');
    var p = video.play();
    if (p && p.catch) p.catch(function () { /* fullscreen still worth trying */ });

    if (video.readyState >= 1) tryFullscreen();
    else {
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

  video.addEventListener('ended', function () {
    film.classList.remove('is-playing');
    video.currentTime = 0;
  });

})();
