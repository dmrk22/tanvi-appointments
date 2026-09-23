---
description: Build, test and ship "Tanvi's Appointment Desk" end to end (no questions asked)
---

# /go — Tanvi's Appointment Desk

You are building a tiny, extremely polished, heavily animated, lovey-dovey website where **Tanvi** books an "appointment" with her boyfriend. It is a gift. It must feel expensive, playful and alive on a phone.

Work fully autonomously from start to finish. **Do not ask the user any questions.** Make every decision yourself using this document; where the document is silent, choose what makes it cuter, smoother and smaller. Run every phase, verify it, fix anything broken, then give the final report described at the end.

---

## 0. Config

Optional overrides may arrive as arguments: `$ARGUMENTS`
Accepted forms: `name=Rahul phone=919876543210`. Parse them if present. Otherwise use the defaults below and continue without asking.

```ts
// src/config.ts
export const CONFIG = {
  herName: "Tanvi",
  myName: "",            // shown as "with {myName}". Empty -> "with me"
  myWhatsApp: "",        // digits only incl. country code, e.g. 919876543210. Empty -> WhatsApp opens its contact picker
  places: ["FOOD COURT", "SR BLOCK", "CV BLOCK", "NAB"],
  bookingWindowDays: 60,
  firstSlot: "08:00",
  lastSlot: "22:00",
  slotMinutes: 30,
  timezone: "Asia/Kolkata",
} as const;
```

---

## 1. Product in one paragraph

A single-page app with four scenes: **Boot → Hello → Booking wizard (6 steps) → Success**. Tanvi picks a date, a time, a place, a reason, then "pays" the fee, which is **one photo of herself**. Without a photo the booking cannot be confirmed. On confirmation, a huge heart-and-love-bar celebration plays, a beautiful appointment pass (PNG) is generated with her photo on it, and she sends it to him via the phone's share sheet / WhatsApp. No backend, no accounts, no tracking. The photo never leaves her phone unless she shares it.

---

## 2. Hard constraints

1. **Stack:** Vite + TypeScript (strict) + vanilla DOM. No React, no UI kits, no Tailwind.
2. **Runtime dependencies:** only `gsap` (≥ 3.13, which ships SplitText, DrawSVGPlugin, MorphSVGPlugin, Flip, CustomEase for free). Nothing else at runtime. Everything visual is SVG, CSS or `<canvas>`, generated in code. **Zero image files** except `public/favicon.svg`.
3. **Budget (gzipped):** JS ≤ 120 KB total, CSS ≤ 20 KB. Check after build with `gzip -c file | wc -c` and report the numbers.
4. **Mobile first.** Design at 390×844, must be flawless at 360×740, still lovely at 1440×900. Respect `env(safe-area-inset-*)`. Tap targets ≥ 44px.
5. **60fps:** animate only `transform`, `opacity`, `filter: blur` sparingly. One shared `requestAnimationFrame` loop for all canvas work. Pause canvas when `document.hidden`. Cap DPR at 2.
6. **Heavy motion is the brief.** Still honour `prefers-reduced-motion: reduce`: keep fades and the success moment, drop screen shakes, cut ambient particles to ≤ 8, shorten durations by 60%.
7. **Accessibility floor:** real `<button>`s, visible focus rings (pink 3px outline, 3px offset), labels on inputs, `aria-live="polite"` region for toasts and step changes, keyboard can complete the whole flow.
8. `vite.config.ts` uses `base: './'` so the build works from any host path.
9. **Test mode:** `?test=1` sets `gsap.globalTimeline.timeScale(20)`, disables the boot delay, turns the hold-to-confirm into a single tap, and seeds `Math.random` deterministically. Every interactive element gets a `data-testid`.
10. Use `git init` at the start and commit at the end of every phase with a message like `phase 3: booking wizard`.

---

## 3. Design system

### 3.1 Palette (white, pink, blue, as requested)

```css
:root {
  --milk:        #FFFFFF;  /* page base */
  --cloud:       #FFF6FA;  /* soft panels */
  --blush:       #FFD1E3;  /* secondary pink fills */
  --bubblegum:   #FF5FA2;  /* primary action, hearts */
  --rose-deep:   #E23E86;  /* pressed state, text on pink */
  --sky:         #CFE6FF;  /* secondary blue fills */
  --cornflower:  #5B9BFF;  /* accents, selected outlines, clock hands */
  --ink:         #3A2A4D;  /* all text — plum ink, never black */
  --ink-soft:    #7B6A8E;  /* secondary text */
  --pixel-shadow: 4px 4px 0 var(--ink);  /* hard 8-bit drop shadow for pixel elements */
}
```

Background: `--milk` with a slowly drifting blurred mesh of three blobs (blush top-left, sky bottom-right, a smaller bubblegum at 20% opacity centre). Blobs animate with GSAP `yoyo` over 18–26s so the page is never still.

### 3.2 Type (two families, clearly distinct)

- **Fredoka** (Google Fonts, weights 400–700): all headings and body. Rounded, soft, bubbly.
- **Silkscreen** (Google Fonts, 400/700): pixel accents only — love bar %, ticket codes, step counter, stamps like `PAID`, the loader.

Scale (mobile): 14 / 16 / 20 / 28 / 44 / 64px. Headlines weight 600, line-height 1.05, letter-spacing -0.01em. Body 16px, line-height 1.5. Sentence case everywhere except the four place names, which the user wrote in capitals — keep those exactly.

Load fonts with `<link rel="preconnect">` + `display=swap`. Before drawing any canvas text (ticket PNG) `await document.fonts.ready`.

### 3.3 Shape language

Two coexisting worlds, deliberately mixed:
- **Soft world:** big radii (28px panels, pill buttons), glossy highlights, blooming vector flowers, floating hearts.
- **Pixel world:** crisp 8-bit hearts, a segmented love bar, pixel icons for places, hard `--pixel-shadow`, `image-rendering: pixelated`.

Rule: interactive controls are soft; status and reward elements are pixel. That contrast is the signature of this site.

### 3.4 Motion tokens (`src/motion/tokens.ts`)

```ts
export const DUR = { xs: 0.15, s: 0.3, m: 0.55, l: 0.9, xl: 1.6 };
export const EASE = {
  pop:     "back.out(2.2)",
  bouncy:  "elastic.out(1, 0.45)",
  smooth:  "power3.out",
  swoop:   "expo.inOut",
  squish:  "power2.inOut",
};
export const STAGGER = { tight: 0.025, normal: 0.05, loose: 0.09 };
```

Principles: every tap gets a reaction within 50ms (squish scale 0.94 → pop back). Things that appear bounce in; things that leave swoop out. Every selection spawns a tiny heart burst from the tapped point.

### 3.5 Layer stack (fixed, bottom → top)

| z | Layer | Contents |
|---|---|---|
| 0 | `#bg` | drifting gradient blobs (CSS + GSAP) |
| 1 | `#ambient` canvas | floating hearts + petals, pooled particles |
| 2 | `#flowers` SVG | blooming flowers at bottom corners, swaying |
| 3 | `#app` | current scene |
| 4 | `#trail` canvas | pointer/touch sparkle-heart trail |
| 5 | `#overlay` | success explosion, toasts |

---

## 4. File structure

```
index.html
package.json
vite.config.ts
tsconfig.json
public/favicon.svg                 (pixel heart)
src/
  main.ts                          boot, layer setup, scene router
  config.ts
  styles/
    tokens.css  base.css  components.css  scenes.css  pixel.css
  motion/
    tokens.ts
    gsap.ts                        registers plugins once, test-mode timeScale
    loop.ts                        single shared rAF loop with add/remove + visibility pause
    particles.ts                   pooled particle engine (hearts, petals, sparkles, pixel squares)
    flowers.ts                     procedural SVG flowers: grow, bloom, sway, rain
    trail.ts                       pointer trail
    transitions.ts                 scene + step transitions
    burst.ts                       heartBurst(x, y, count, palette)
    sfx.ts                         WebAudio synthesized sounds, no audio files
    haptics.ts                     navigator.vibrate wrappers, silently no-op
  scenes/
    boot.ts  hello.ts  wizard.ts  success.ts  history.ts
  steps/
    date.ts  time.ts  place.ts  reason.ts  payment.ts  review.ts
  components/
    loveBar.ts  calendar.ts  clock.ts  pixelArt.ts  toast.ts
    polaroid.ts  ticketView.ts  holdButton.ts  runawayButton.ts
  lib/
    state.ts                       tiny store: get/set/subscribe
    image.ts                       load, orient, compress, thumbnail
    ticketPng.ts                   canvas renderer for the shareable pass
    share.ts                       Web Share with files + WhatsApp fallback
    ics.ts                         calendar file
    storage.ts                     localStorage history (try/catch everywhere)
    dom.ts                         h() element helper, qs, on
    id.ts                          LOVE-XXXX ticket ids
tests/
  flow.spec.ts                     Playwright end-to-end
```

State shape:

```ts
type Booking = {
  date: string | null;        // YYYY-MM-DD
  time: string | null;        // HH:mm 24h
  place: string | null;       // one of CONFIG.places
  reasons: string[];
  note: string;
  missMeter: number;          // 1..100, 100 renders as ∞
  photo: Blob | null;         // compressed JPEG
  photoUrl: string | null;    // object URL for previews
  id: string | null;          // LOVE-7Q3K style
};
```

---

## 5. Shared motion systems (build these first, everything reuses them)

### 5.1 Particle engine (`particles.ts`)
- Object pool, fixed capacity: 60 on mobile (`matchMedia('(pointer: coarse)')`), 110 on desktop, 8 with reduced motion.
- Particle kinds: `heart` (drawn with two arcs + triangle path, cached to an offscreen canvas per colour/size), `petal` (ellipse, rotates on its long axis by scaling x with `cos`), `sparkle` (4-point star), `pixel` (square, snaps to 4px grid).
- Ambient mode: particles rise slowly with sine-wave drift, gentle rotation, fade in at bottom, fade out near top; colours from bubblegum/blush/sky/cornflower.
- Burst mode: radial velocity + gravity + drag, lifetime 0.8–1.6s.
- Rain mode: petals and hearts fall from top with wind sway (used on success).

### 5.2 Procedural flowers (`flowers.ts`)
- `createFlower({x, y, scale, petals: 5|6|8, color, center})` returns an SVG `<g>`: stem path, two leaves, petals, centre.
- `bloom(flower)`: DrawSVG the stem 0→100% (0.9s), leaves unfurl (scale from base, `EASE.bouncy`), petals pop one by one with rotation stagger, centre pulses once.
- Continuous `sway`: rotate from stem base ±3° with offset phases per flower.
- Place 3 flowers bottom-left and 3 bottom-right (different heights, pink/blue/white petals with blush outlines). They bloom on the Hello scene and re-bloom whenever a step is completed (one extra flower pops each time, max 12 total, so the garden literally grows as she books).

### 5.3 Pointer trail (`trail.ts`)
On `pointermove`/`touchmove`, emit a small sparkle or mini heart every ~24px of travel, fading in 0.5s. Disabled with reduced motion.

### 5.4 Heart burst (`burst.ts`)
`heartBurst(x, y, n = 10)` — used on every selection. Pair with `sfx.pop()` and `haptics.tap()`.

### 5.5 Sound (`sfx.ts`)
WebAudio only, synthesized: `pop` (short sine blip with pitch drop), `pluck` (triangle + fast decay, pitch varies by selection index so calendar taps play a little scale), `chime` (arpeggio C6-E6-G6-C7), `fanfare` (success: arpeggio + shimmer noise). Created lazily after first user gesture. A round sound toggle top-right (speaker icon ↔ speaker with heart); default on, persisted in localStorage.

### 5.6 Transitions (`transitions.ts`)
- **Scene change:** outgoing scene scales 0.96 + blurs 6px + fades; a wipe of large overlapping pink and blue circles sweeps diagonally across the screen (clip-path circles animated with GSAP), incoming scene rises in.
- **Step change inside wizard:** cards behave like a deck. Forward: current card rotates -8°, flies up-left; next card slides up from under it with `EASE.pop`. Back: reversed. Direction-aware.
- Hook up `history.pushState` for each step so Android's back button goes to the previous step instead of leaving the site.

### 5.7 Love bar (`loveBar.ts`) — pixel style, used in wizard and success
- 12 segments in Silkscreen style with `--pixel-shadow`, filled segments bubblegum with a 2px blush highlight row.
- A pixel heart "rider" sits at the fill edge and bobs.
- Label to the right in Silkscreen: percentage.
- Mood caption under it changes with progress: 0% "warming up", 17% "getting cute", 33% "blushing", 50% "heart racing", 67% "can't stop smiling", 83% "almost there", 100% "full".
- `fillTo(pct)`: segments fill one by one with a tick sound and a tiny jump each.
- `overflow()`: used on success only (see 8).

### 5.8 Pixel art helper (`pixelArt.ts`)
`pixelSvg(map: string[], palette: Record<string,string>, cell = 4)` → crisp `<svg>` of `<rect>`s with `shape-rendering="crispEdges"`. Pixel heart map:

```
..XX...XX..
.XXOO.XXXX.
XXXOXXXXXXX
XXXXXXXXXXX
XXXXXXXXXXX
.XXXXXXXXX.
..XXXXXXX..
...XXXXX...
....XXX....
.....X.....
```
`X` = bubblegum, `O` = white highlight. Draw 12×12 icons for the four places yourself in the same style:
- FOOD COURT: burger with a heart-shaped bun seed or a steaming bowl
- SR BLOCK: small building with the letters SR on its roof sign
- CV BLOCK: building with a round window and a flag
- NAB: the tallest building, with a heart in the top window
Keep them readable at 48px.

---

## 6. Scenes

### 6.0 Boot (≤ 1.6s, skipped in test mode)
White screen. A big pixel heart fills row by row from the bottom, each row landing with a tick. Silkscreen text below counts `loading love… 0%` → `100%`. At 100% the heart's pixels explode outward and **become the ambient particles** (hand them to the particle engine at their current positions — seamless handoff). Then Hello scene enters.

### 6.1 Hello
Layout (centered, vertical):

```
┌────────────────────────────┐
│  (sound)            (0 ♥)  │  ← history counter, only if bookings exist
│                            │
│        Hello               │
│        Tanvi               │  ← giant, 64px, two lines
│   ─ pixel heart underline ─│
│                            │
│  Someone would like to see │
│  you. Officially.          │
│                            │
│  [ Book your appointment ] │  ← big pill, bubblegum
│        maybe later         │  ← tiny runaway button
│                            │
│ ✿✿✿                   ✿✿✿ │  ← flowers bloom
└────────────────────────────┘
```

Motion:
1. "Hello" letters drop from above with `SplitText` chars, `EASE.bouncy`, stagger 0.05, slight random rotation that settles to 0.
2. "Tanvi" letters then pop in one by one, each in alternating bubblegum/cornflower, and **keep gently wobbling** forever (each letter a tiny independent float loop, y ±3px, rotate ±2°).
3. Pixel heart underline draws left to right.
4. Subline fades up. Flowers bloom from both corners.
5. Main button: continuous heartbeat (scale 1 → 1.06 → 1 → 1.04 → 1, 1.2s loop) and a glossy shine sweep every 3s. On desktop it is magnetic (drifts toward cursor within 80px). Tap: squish, big heart burst, `chime`, then scene transition.
6. **"maybe later"** runaway button: on hover/tap it jumps to a random position inside the viewport with a `pop` ease and changes text each time: "maybe later" → "are you sure?" → "think again" → "nope" → "ok fine, book it". On the fifth attempt it becomes a normal button that also starts booking. Keyboard users: pressing it just advances the text, never traps focus.
7. **Easter egg:** tapping the word "Tanvi" 5 times triggers a pixel speech bubble: "Caught you staring at your own name." plus a heart rain for 2s.

Copy (use exactly): title "Hello Tanvi", subline "Someone would like to see you. Officially.", button "Book your appointment".
Under the button, very small ink-soft text: `Appointments with {myName || "me"}. Fee: one cute pic.`

### 6.2 Booking wizard
Persistent header: back arrow (soft circle), Silkscreen step counter `step 1/6`, and the love bar under it. Body: one big rounded card (the "deck") holding the current step. Footer: primary button `Next` (disabled until the step is valid; disabled look = blush with a sleeping pixel heart). Each completed step: love bar fills to `step/6`, one new flower blooms in the corner garden, `pluck` sound.

#### Step 1 — Date: "Pick a day"
Custom calendar component (`calendar.ts`), no libraries.
- Month header: month name in Fredoka 28px; arrows to change month. Changing month flips the grid in 3D (rotateX 90° out, new grid rotateX -90° in).
- Weekday row: S M T W T F S.
- Days cascade in diagonally (stagger by `row + col`), each popping with `EASE.pop`.
- Today: cornflower ring that pulses softly.
- Past dates and dates beyond `bookingWindowDays`: faded, a tiny "z" floats off them; tapping one wiggles it and toasts "That day already happened. Pick a future one."
- Weekends get a tiny flower dot under the number.
- Selecting a date: a pixel heart stamp drops onto it with squash-and-stretch (scaleY 1.3 → 0.8 → 1), heart burst, the rest of the week row does a small wave. Selected label below: "Friday, 3 October" in Fredoka.
- Keyboard: arrow keys move focus in the grid, Enter selects.

#### Step 2 — Time: "What time?"
- Top: an SVG analog clock (180px) with a blush face, 12 tiny heart ticks, cornflower hands, a bubblegum centre heart. When a time is selected, the hands sweep there with `EASE.bouncy` (compute the shortest rotation path) and the clock gives a little jump.
- Below: slot chips from `firstSlot` to `lastSlot` every `slotMinutes`, grouped under four small headings with tiny animated SVG icons: Morning (sun rotating slowly), Afternoon (cloud drifting), Evening (sun setting), Night (moon with a twinkling star). 12-hour labels, e.g. "4:30 PM".
- Chips stagger in per group. Selected chip turns bubblegum with white text and pops.
- If the chosen date is today, past slots are disabled.
- Special chip at top, visible only if the date is today and it is before `lastSlot`: **"Right now (emergency)"** — picks now + 15 min rounded up to 5 min, flashes with little siren hearts rotating around it.
- Human caption under the clock: "4:30 PM on Friday. Noted."

#### Step 3 — Place: "Where should we meet?"
- 2×2 grid of place cards: pixel icon (48px) on top, place name exactly as given (FOOD COURT, SR BLOCK, CV BLOCK, NAB) in Silkscreen 14px, one playful line in Fredoka:
  - FOOD COURT: "Snacks are on me."
  - SR BLOCK: "The classic spot."
  - CV BLOCK: "Quiet corner, loud heart."
  - NAB: "Meet you at the top."
- Cards have 3D tilt that follows the pointer (desktop) or `deviceorientation` (mobile, only if permission not required; skip silently otherwise), max 10°.
- Select: the card lifts (translateZ + shadow grows), a pixel map pin drops onto it and bounces twice, other cards dim slightly and shrink to 0.96. A dashed pixel path animates from a tiny pixel heart "you are here" at the top of the card area to the selected card.

#### Step 4 — Reason: "What's the occasion?"
- Multi-select reason chips (at least one chip or a note is required):
  "Missing you", "Food date", "Walk and talk", "Hug emergency", "Study date (we won't study)", "Just because", "I have gossip".
  Chips bounce in; selecting one fills it with a liquid pink fill from the tap point (radial clip-path) and bursts hearts.
- Optional note: textarea, 140 chars, placeholder "Anything else he should know?". Each keystroke floats a tiny heart up from the textarea's right edge. Counter in Silkscreen: `23/140`.
- **Miss-o-meter** slider "How much do you miss me?" 1–100. Custom range input: track is a pink-to-blue gradient, thumb is a heart that scales 1 → 1.8 with value. The value label shows words at thresholds: 1–20 "a little", 21–50 "quite a lot", 51–80 "a lot a lot", 81–99 "unreasonably", 100 "∞". At 100: the screen does one gentle shake, hearts rain for 1.5s, `fanfare` lite.

#### Step 5 — Payment: "Appointment fee"
- Receipt-style card. Line items in Silkscreen:
  ```
  appointment fee ........ 1 cute pic
  cards / UPI / cash ..... not accepted
  ```
- Two buttons: **"Take a selfie"** (`<input type="file" accept="image/*" capture="user">`) and **"Choose from gallery"** (`accept="image/*"`). Also support drag and drop on desktop.
- Processing (`image.ts`): reject non-images and files > 20 MB with a clear toast; decode with `createImageBitmap(file, { imageOrientation: 'from-image' })` (fallback to `<img>`); draw to canvas at max 1080px long edge; export JPEG 0.85 → `booking.photo`. Also make a 160px thumbnail data URL for history.
- Preview: the photo drops in as a **polaroid** (white frame, thicker bottom, a strip of translucent pink washi tape on top), rotating from -20° to -4° with `EASE.bouncy`. Then a pixel **PAID** stamp slams onto the corner (scale 3 → 1, slight rotation, screen micro-shake, `pop`). Caption on the polaroid bottom in Fredoka: "payment received".
- "Retake" link under it.
- **No photo = no booking.** While no photo: the Next button shows a pixel padlock. Tapping it shakes the padlock and toasts: "Payment pending: one cute pic." (`aria-live`). Also enforce the same check again at confirm time.

#### Step 6 — Review: "Your appointment pass"
- A boarding-pass style ticket (`ticketView.ts`): left side polaroid of her photo; right side rows (Silkscreen labels, Fredoka values): Guest Tanvi · Date · Time · Place · Reason(s) · Miss-o-meter. Perforated edge down the middle with notches. Bottom: a barcode made of thin vertical bars where some bars are tiny hearts, plus the ticket id `LOVE-7Q3K` (4 chars from an unambiguous alphabet, no 0/O/1/I).
- The ticket prints in: slides up from a slot at the top of the card like a receipt printer, line by line.
- Each row is tappable to jump back and edit that step (then Next returns straight to Review).
- **Confirm = hold button** (`holdButton.ts`): "Hold to confirm". Pressing and holding for 1.2s fills a heart outline inside the button from bottom to top with pink liquid; releasing early drains it back. On complete: button bursts. Keyboard Enter/Space and test mode confirm instantly.
- Small print under the ticket in ink-soft: "Cancellation policy: cancellations are not accepted."

### 6.3 Success — the big moment (the most elaborate animation in the site)

Timeline (one master GSAP timeline, ~5s, then settles into an idle loop):
1. **0.0s** Everything else fades; the screen floods white from the confirm button outward (clip-path circle).
2. **0.2s** A giant pixel heart assembles in the centre from 90 pixel squares flying in from all edges (use particle engine in `pixel` mode with target positions).
3. **0.9s** The pixel heart morphs into a smooth vector heart (MorphSVG) and beats twice; with each beat a ring shockwave expands.
4. **1.4s** Heart explosion: 150 burst particles (hearts, petals, sparkles), `fanfare` sound, `haptics.success()` (pattern `[30, 40, 30, 40, 80]`).
5. **1.7s** Title "Appointment booked" drops in with SplitText, then subline "See you there, Tanvi."
6. **2.2s** **The love bar**: a large version of the pixel love bar appears and fills 0 → 100% segment by segment with rising pitch ticks. At 100% it **overflows**: the bar stretches past both screen edges, segments crack and spill hearts, and the percentage label glitches `100%` → `999%` → `∞` with a pixel scramble effect. Caption: "love bar: full. overflowing."
7. **3.4s** Flowers rain from the top (petal particles in rain mode) and the corner garden blooms fully (all 12 flowers).
8. **3.8s** The appointment pass slides up with a paper-flutter wobble.
9. **4.3s** Action buttons stagger in:
   - **"Send to {myName || "him"}"** (primary): `share.ts` → render ticket PNG, then `navigator.canShare({ files })` ? `navigator.share({ files, title, text })` : download the PNG and open `https://wa.me/{myWhatsApp}?text={encoded text}` (omit the number if empty).
   - **"Save pass"**: download the PNG.
   - **"Add to calendar"**: download a `.ics` (1 hour, `DTSTART` converted to UTC, `SUMMARY: Appointment with {myName || "him"}`, `LOCATION: {place}`, `DESCRIPTION: reasons + note`).
   - **"Book another"**: resets state, returns to Hello with a wipe.
10. Idle loop: ambient hearts continue slightly denser than before, the big heart beats every 2s.

Share text:
```
New appointment booked 💌
Guest: Tanvi
When: Friday, 3 October at 4:30 PM
Where: FOOD COURT
Why: Missing you, Food date
Miss-o-meter: ∞
Pass: LOVE-7Q3K
Fee paid: 1 cute pic (attached)
```

### 6.4 Ticket PNG (`ticketPng.ts`)
Canvas 1080×1920 (phone story ratio). White background with a soft blush-to-sky gradient, scattered small hearts, the polaroid of her photo (cover-cropped, tape on top, rotated -4°), the PAID stamp, then the ticket rows, heart barcode and id, and a pixel love bar at 100% with "∞" at the bottom. Fonts must be loaded first. Export with `canvas.toBlob('image/png')`. File name `tanvi-appointment-LOVE-7Q3K.png`.

### 6.5 History (small extra)
Every confirmed booking is saved to localStorage (no full photo; thumbnail only; wrap in try/catch and cap at 20 entries). On Hello, a pixel heart counter top-right shows the count; tapping opens a bottom sheet listing mini tickets (date, time, place, thumbnail) sorted soonest first, each one re-shareable. Empty state never appears because the counter hides at 0.

---

## 7. Copy rules
Sentence case. Short. Sweet, a little cheeky, never cringe-heavy. Use exactly the copy given above; for anything not specified, match that voice. Errors say what happened and what to do ("That photo is too big. Pick one under 20 MB.").

---

## 8. Phases (execute in order, verify each)

**Phase 1 — Scaffold.** `npm create vite@latest . -- --template vanilla-ts` (scaffold into the current directory; if not empty, scaffold into `./app` and work there). Install `gsap`. Dev deps: `typescript`, `@playwright/test`. Set up `vite.config.ts` (`base: './'`), strict tsconfig, scripts: `dev`, `build` (`tsc --noEmit && vite build`), `preview`, `test`. Delete template boilerplate. Add fonts, tokens.css, base.css, favicon. ✅ `npm run build` passes.

**Phase 2 — Motion core.** gsap registration, shared loop, particles, flowers, trail, burst, sfx, haptics, transitions, loveBar, pixelArt, toast, state store. Temporary playground in main.ts proving each works. ✅ build passes.

**Phase 3 — Boot + Hello.** Everything in 6.0 and 6.1 including runaway button and easter egg. ✅ build passes.

**Phase 4 — Wizard steps 1–4.** Calendar, clock + slots, places, reasons + miss-o-meter, validation, back/forward, history API, step deck transitions, love bar progress, growing garden. ✅ build passes.

**Phase 5 — Payment + Review.** Image pipeline, polaroid, PAID stamp, padlock gating, ticket view, edit-jump, hold button. ✅ build passes.

**Phase 6 — Success + outputs.** Master success timeline, love bar overflow, ticket PNG, share, ics, history sheet, reset. ✅ build passes.

**Phase 7 — Polish pass.** Reduced-motion paths, focus rings, aria-live, safe areas, 360px layout check, desktop layout (center column max 480px, extra flowers along the sides), tidy copy, remove playground code, remove all `console.log`.

**Phase 8 — Verify.**
1. `npm run build`; report gzipped JS and CSS sizes; if over budget, find and fix the cause.
2. Try `npx playwright install chromium`. If it works, write `tests/flow.spec.ts` at viewport 390×844 using `?test=1`: Hello → book → pick first available date → pick first enabled slot → pick NAB → pick "Missing you" → try Next without photo and assert the "Payment pending" toast → upload an in-memory PNG via `setInputFiles({ name, mimeType, buffer })` → Next → confirm → assert "Appointment booked" is visible and the share/save buttons exist. Also take screenshots of every scene into `screenshots/` at 390×844 and 1440×900, then **look at them yourself** and fix anything ugly, clipped, overlapping or misaligned. Re-run until green.
3. If Playwright cannot install, skip browser tests, say so in the report, and do a careful manual code review of the flow instead.

**Phase 9 — Ship.** Try, in order, and stop at the first that works without needing any login prompt:
1. `gh auth status` succeeds → create a public repo `tanvi-appointments`, push, deploy `dist/` to GitHub Pages with `npx gh-pages -d dist`, enable Pages on the `gh-pages` branch via `gh api`, and report the URL.
2. `npx vercel whoami` succeeds → `npx vercel deploy --prod --yes` from `dist/` and report the URL.
3. Neither is logged in → do not attempt any login. Zip `dist/` to `tanvi-appointments-dist.zip`, start `npx vite preview --host` so it can be opened on a phone on the same Wi-Fi, and in the report give the single command the user can run later to deploy (`npx vercel deploy --prod dist` after `npx vercel login`, or dragging the zip onto app.netlify.com/drop).

---

## 9. Definition of done
- [ ] Hello Tanvi scene with elaborate intro, flowers, heartbeat button, runaway button, easter egg
- [ ] Date, time, place (FOOD COURT, SR BLOCK, CV BLOCK, NAB), reason all animated and validated
- [ ] Booking impossible without a photo, enforced twice
- [ ] Success animation with hearts, love bar fill + overflow to ∞, flower rain
- [ ] Shareable PNG pass with her photo; WhatsApp/share works on Android and iOS; .ics works
- [ ] White/pink/blue only; Fredoka + Silkscreen only
- [ ] Reduced motion respected; keyboard can finish the flow
- [ ] JS ≤ 120 KB gz, CSS ≤ 20 KB gz
- [ ] Tests green or clearly reported as skipped
- [ ] Deployed or packaged per Phase 9

## 10. Final report (print this at the end, nothing else long)
1. Live URL, or how to open it locally.
2. Bundle sizes.
3. Test result + screenshot folder path.
4. How to set his name and WhatsApp number later: edit `src/config.ts`, then `npm run build` and redeploy (one line).
5. Anything that could not be done and why.
