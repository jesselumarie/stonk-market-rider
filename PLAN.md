# Stonk Market Rider - Implementation Plan

## Overview

A Line Rider-inspired browser game where a Wall Street bro rides a suitcase along real stock price data. Built as a static site for GitHub Pages using Three.js for 2.5D rendering with a hand-drawn notebook aesthetic. The rider follows the stock price line with physics-based movement, detaches on steep drops, and can die on bad landings. Players can tap/click to jump. Death triggers a Resident Evil-style "YOU CAN'T TAKE IT WITH YOU" screen.

---

## Design Decisions (from interview)

| Decision | Choice |
|---|---|
| **Physics** | Rider detaches on steep drops with gravity/momentum |
| **Timeframe** | Default daily; user can switch (1D, 1M, 6M, 1Y, 5Y) |
| **Data source** | Client-side Yahoo Finance proxy API (no key, CORS-friendly) |
| **Death screen** | Resident Evil-style text: "YOU CAN'T TAKE IT WITH YOU" |
| **Visual style** | Sketch / notebook (pencil-on-paper aesthetic) |
| **Camera** | Dynamic zoom: tight when flat, pulls back before volatile sections |
| **Rider speed** | Physics-based: accelerates downhill, decelerates uphill |
| **Player input** | Tap/click to jump |
| **Tech stack** | Three.js for 2.5D rendering |
| **Sound** | Sketch SFX (pencil scratch, wind, thud) + death screen audio |
| **Sharing** | Shareable URL with encoded ticker + timeframe |
| **Death trigger** | Unclean landings (bad angle/impact force) |
| **Rider character** | Wall Street bro riding a suitcase |
| **Stock picker** | Company name search with autocomplete |
| **Mobile** | Supported with degraded rendering (no parallax, reduced effects) |
| **API** | Yahoo Finance community proxy (e.g., `query1.finance.yahoo.com` via a CORS proxy or `yahoo-finance2` style endpoint) |

---

## Architecture

### Directory Structure

```
stonk-market-rider/
├── index.html                  # Single entry point
├── css/
│   └── styles.css              # All styles (notebook theme, UI, death screen)
├── js/
│   ├── main.js                 # App entry point, state machine, event wiring
│   ├── config.js               # Constants, tuning params, physics defaults
│   ├── data/
│   │   ├── stockApi.js         # Yahoo Finance proxy fetch + data normalization
│   │   └── tickerSearch.js     # Company name autocomplete (local ticker list + fuzzy match)
│   ├── game/
│   │   ├── physics.js          # Gravity, momentum, slope detection, landing angle calc
│   │   ├── rider.js            # Rider state machine (riding, airborne, dead), jump logic
│   │   ├── terrain.js          # Convert price data → Three.js line geometry + collision mesh
│   │   └── camera.js           # Dynamic zoom controller, lookahead volatility scanner
│   ├── rendering/
│   │   ├── scene.js            # Three.js scene setup, notebook background, parallax layers
│   │   ├── riderModel.js       # Wall Street bro + suitcase sketch model (2D sprites or line art)
│   │   ├── effects.js          # Pencil-line shader, paper texture, sketch post-processing
│   │   └── deathScreen.js      # "YOU CAN'T TAKE IT WITH YOU" overlay + animation
│   ├── audio/
│   │   └── soundManager.js     # SFX loading, playback triggers (pencil, wind, thud, death)
│   ├── ui/
│   │   ├── stockPicker.js      # Search input, autocomplete dropdown, timeframe selector
│   │   ├── hud.js              # In-ride HUD (ticker, price, date, distance survived)
│   │   └── shareUrl.js         # URL encode/decode for shareable links
│   └── utils/
│       ├── math.js             # Vector math, angle calculations, interpolation
│       └── responsive.js       # Mobile detection, capability degradation, resize handling
├── assets/
│   ├── textures/
│   │   ├── paper.png           # Notebook paper background texture (lined or graph paper)
│   │   └── pencil-brush.png    # Pencil stroke texture for line rendering
│   ├── sprites/
│   │   ├── rider-idle.png      # Bro sitting on suitcase, relaxed
│   │   ├── rider-crouch.png    # Crouching on steep descent
│   │   ├── rider-air.png       # Arms flailing in air
│   │   ├── rider-jump.png      # Jump pose
│   │   └── rider-dead.png      # Ragdoll / wipeout pose
│   └── audio/
│       ├── pencil-loop.mp3     # Looping pencil-on-paper scratch (plays while riding)
│       ├── wind-loop.mp3       # Wind sound, volume scales with speed
│       ├── land-clean.mp3      # Satisfying thud for clean landing
│       ├── land-rough.mp3      # Rough landing crunch
│       ├── jump.mp3            # Jump whoosh
│       └── death.mp3           # Dramatic sting for death screen
├── data/
│   └── tickers.json            # List of ~8000 US tickers with company names for autocomplete
└── README.md
```

### State Machine

The app has 4 top-level states:

```
MENU → LOADING → RIDING → DEAD
  ↑                         |
  └─────────────────────────┘ (Play Again)
```

1. **MENU**: Stock picker UI visible. User searches company, picks timeframe, hits "Ride".
2. **LOADING**: Fetch stock data from API, build terrain geometry, preload assets. Show a pencil-drawing animation of the line being drawn.
3. **RIDING**: Active gameplay. Rider traverses the price line. Player can tap to jump. Camera follows dynamically. SFX play.
4. **DEAD**: Death screen overlay. "YOU CAN'T TAKE IT WITH YOU" in Resident Evil font. Show stats (ticker, how far survived, biggest drop). "Ride Again" and "Share" buttons.

---

## Detailed Implementation Plan

### Phase 1: Project Scaffolding & Static Site Setup

**Goal**: Get a blank Three.js scene rendering on GitHub Pages.

1. **Create `index.html`**
   - Single HTML file with:
     - `<canvas id="game-canvas">` for Three.js
     - `<div id="ui-overlay">` for HTML UI (stock picker, HUD, death screen)
     - Three.js loaded via CDN (`https://unpkg.com/three@0.160.0/build/three.module.js`) using ES module imports
     - `<script type="module" src="js/main.js">`
   - Meta tags for Open Graph (shareable links show a preview)
   - Viewport meta tag for mobile

2. **Create `css/styles.css`**
   - CSS reset
   - Notebook paper background on body (CSS pattern or texture)
   - Font: use a hand-drawn/sketch font from Google Fonts (e.g., `Caveat`, `Patrick Hand`, or `Indie Flower`) for UI
   - For the death screen: use a serif/gothic font (e.g., `Playfair Display` or `IM Fell English`) to mimic the RE "YOU DIED" screen
   - Overlay positioning for UI elements
   - Responsive breakpoints

3. **Create `js/main.js`**
   - Initialize Three.js renderer (WebGLRenderer with antialiasing)
   - Create scene, camera (PerspectiveCamera for 2.5D parallax), and render loop
   - Render a simple colored background to confirm setup works
   - App state machine stub (MENU / LOADING / RIDING / DEAD)

4. **Create `js/config.js`**
   - All tunable constants in one place:
     ```js
     export const PHYSICS = {
       GRAVITY: 980,            // pixels/s², tuned for feel not realism
       MAX_VELOCITY: 1200,      // cap to prevent insane speeds
       FRICTION: 0.98,          // rolling friction coefficient
       JUMP_FORCE: 450,         // initial upward velocity on jump
       DETACH_SLOPE_THRESHOLD: -1.2,  // slope steepness that causes detach (radians)
       LANDING_ANGLE_TOLERANCE: 0.4,  // radians of mismatch before "bad landing"
       LANDING_IMPACT_DEATH: 800,     // vertical velocity on impact that kills
       AIRTIME_DEATH_SECONDS: 4,      // backup death trigger if airborne too long
     };
     export const CAMERA = {
       LOOKAHEAD_POINTS: 30,    // how many data points ahead to scan for volatility
       MIN_ZOOM: 0.5,           // closest zoom
       MAX_ZOOM: 2.0,           // furthest zoom
       ZOOM_SPEED: 0.02,        // lerp factor for smooth zoom transitions
       VERTICAL_OFFSET: 0.3,    // camera sits slightly above rider
     };
     export const RENDERING = {
       LINE_WIDTH: 3,           // pencil line thickness
       PARALLAX_STRENGTH: 0.15, // depth parallax for notebook elements
       MOBILE_PARALLAX: false,  // disable on mobile
     };
     export const TIMEFRAMES = {
       '1D': { interval: '1m', range: '1d' },
       '1M': { interval: '1d', range: '1mo' },
       '6M': { interval: '1d', range: '6mo' },
       '1Y': { interval: '1d', range: '1y' },
       '5Y': { interval: '1wk', range: '5y' },
     };
     ```

### Phase 2: Stock Data Pipeline

**Goal**: Fetch real stock data and normalize it for terrain generation.

5. **Create `data/tickers.json`**
   - JSON array of `{ "symbol": "AAPL", "name": "Apple Inc." }` objects
   - Source: download a snapshot of major US exchange tickers (NYSE, NASDAQ)
   - ~5000-8000 entries. This is a static file, bundled in the repo
   - Keep file size reasonable (~200-400KB). Can be gzipped by GH Pages

6. **Create `js/data/tickerSearch.js`**
   - Load `tickers.json` on app init
   - Implement fuzzy search: match on both symbol and company name
   - Use a simple scoring algorithm: exact prefix match on symbol > prefix match on name > substring match
   - Return top 8 results for display in autocomplete
   - Debounce input to avoid excessive filtering (150ms)

7. **Create `js/data/stockApi.js`**
   - Primary endpoint: Use a CORS-friendly Yahoo Finance proxy
   - Recommended proxy pattern:
     ```js
     const YAHOO_BASE = 'https://query1.finance.yahoo.com/v8/finance/chart/';
     // If CORS blocked, use a public CORS proxy as fallback:
     const CORS_PROXY = 'https://corsproxy.io/?';
     ```
   - Function: `async fetchStockData(symbol, timeframe)`
     - Takes a ticker symbol and timeframe key (from `TIMEFRAMES` config)
     - Returns normalized array:
       ```js
       [{ timestamp, open, high, low, close, volume, date }, ...]
       ```
   - Error handling: show user-friendly error if ticker not found or API fails
   - Cache responses in `sessionStorage` to avoid re-fetching during "Play Again"

### Phase 3: Terrain Generation

**Goal**: Convert stock price data into a rideable Three.js terrain with collision.

8. **Create `js/game/terrain.js`**
   - `buildTerrain(priceData, sceneWidth)`:
     - Map each data point to an (x, y) coordinate
     - X: evenly spaced across `sceneWidth` (e.g., 10000 units for a full ride)
     - Y: map price to vertical position. Normalize prices to a consistent height range (e.g., 0-1000 units) regardless of stock price magnitude
     - Use Catmull-Rom spline interpolation between data points for smooth curves (avoid jagged segments between daily candles)
   - Create Three.js geometry:
     - `THREE.BufferGeometry` with the spline points as a line
     - Apply a custom pencil-stroke material (see Phase 5)
   - Create collision data:
     - Store the interpolated spline as an array of `{ x, y, slope }` segments
     - Slope = angle in radians between consecutive points
     - This is what the physics engine queries for "what's the ground here?"
   - Visual extras:
     - Faint grid lines in the background (like graph paper)
     - Y-axis price labels on the left margin
     - X-axis date labels below the line
     - Small dots at actual data points (like pencil dots on paper)

### Phase 4: Physics Engine

**Goal**: Rider follows the terrain with realistic physics, detaches on steep drops, and dies on bad landings.

9. **Create `js/game/physics.js`**
   - Core physics loop (called each frame with `dt`):
     - **ON_TERRAIN state**:
       - Rider position tracks along the terrain spline
       - Velocity determined by slope: `acceleration = GRAVITY * sin(slope) - FRICTION`
       - Speed increases going downhill, decreases going uphill
       - If slope exceeds `DETACH_SLOPE_THRESHOLD` (steep downward), rider detaches → AIRBORNE
       - If player presses jump → apply `JUMP_FORCE` upward → AIRBORNE
     - **AIRBORNE state**:
       - Standard projectile physics: `vy += GRAVITY * dt`, `x += vx * dt`, `y += vy * dt`
       - Check each frame: is rider position below the terrain line at current X?
         - If yes → LANDING event
       - If airborne > `AIRTIME_DEATH_SECONDS` → DEAD
     - **LANDING event**:
       - Calculate landing angle: angle of rider's velocity vector vs. angle of terrain at landing point
       - Calculate impact force: rider's vertical velocity at impact
       - If angle mismatch > `LANDING_ANGLE_TOLERANCE` OR impact > `LANDING_IMPACT_DEATH` → DEAD
       - Otherwise → back to ON_TERRAIN, preserve horizontal velocity
   - Expose functions:
     - `initPhysics(terrainData)` — set up physics state
     - `updatePhysics(dt, input)` — returns `{ x, y, vx, vy, rotation, state }`
     - `getState()` — returns current rider state (ON_TERRAIN, AIRBORNE, DEAD)

10. **Create `js/game/rider.js`**
    - Rider state machine:
      - `RIDING` → `AIRBORNE` → `RIDING` (clean landing) or `DEAD` (bad landing)
      - `RIDING` → `AIRBORNE` (jump or steep drop)
    - Jump logic:
      - On spacebar press or screen tap (while RIDING):
        - Set vy to `-JUMP_FORCE` (upward)
        - Transition to AIRBORNE
      - Cooldown: can't jump again for 300ms after landing
    - Sprite state:
      - Map rider state + velocity to the correct sprite:
        - `RIDING` + low speed → `rider-idle`
        - `RIDING` + high speed → `rider-crouch`
        - `AIRBORNE` + going up → `rider-jump`
        - `AIRBORNE` + going down → `rider-air`
        - `DEAD` → `rider-dead`
    - Rotation:
      - When ON_TERRAIN: rotation matches terrain slope
      - When AIRBORNE: rotation follows velocity vector angle, with slight drift
      - When DEAD: spin rapidly (ragdoll tumble)

### Phase 5: Rendering & Visual Style

**Goal**: Notebook/sketch aesthetic with 2.5D parallax depth.

11. **Create `js/rendering/scene.js`**
    - Three.js scene setup:
      - `PerspectiveCamera` with narrow FOV (30-40°) for subtle 2.5D effect
      - Background: paper texture quad at z=-10 (far back)
      - Notebook lines layer at z=-5 (ruled paper lines)
      - Stock terrain at z=0 (main gameplay plane)
      - Foreground doodle elements at z=2 (notebook margin doodles: dollar signs, arrows, etc.)
    - Parallax: as camera moves, layers shift at different rates based on Z-depth. This creates the 2.5D effect.
    - On mobile: flatten all layers to z=0 (disable parallax)
    - Lighting: ambient only (no dramatic lighting needed for sketch style)

12. **Create `js/rendering/riderModel.js`**
    - Load rider sprites as `THREE.SpriteMaterial` textures
    - The rider is a `THREE.Sprite` that swaps textures based on state
    - Position and rotate the sprite each frame based on physics output
    - Scale: rider should be roughly 40-60 units tall relative to terrain height range of 1000
    - Suitcase is part of the sprite (pre-drawn in the sprite sheets)
    - On death: switch to `rider-dead` sprite, apply spinning rotation, and let physics continue (ragdoll tumble off-screen or into terrain)

13. **Create `js/rendering/effects.js`**
    - **Pencil-line shader** for the terrain line:
      - Custom `THREE.ShaderMaterial` or use `THREE.Line2` (from Three.js examples: `LineGeometry`, `LineMaterial`)
      - Apply a pencil texture as an alpha map along the line to get that hand-drawn stroke feel
      - Line should have slight thickness variation (thicker on curves, thinner on straights)
    - **Paper texture**: overlay a subtle paper grain texture on the entire viewport using a full-screen quad or CSS
    - **Sketch post-processing** (optional, can be cut for performance):
      - Slight vignette at edges
      - Very subtle wobble on lines (pencil jitter) — can be done by perturbing line vertices slightly each frame
    - On mobile: skip post-processing, use simpler line rendering

14. **Create `js/rendering/deathScreen.js`**
    - Full-screen dark overlay that fades in over 1.5 seconds
    - Text animation:
      - "YOU CAN'T TAKE IT WITH YOU" appears letter-by-letter or fades in with a zoom effect (like Resident Evil's "YOU DIED")
      - Use the gothic serif font
      - Red text on dark background (or inverted: dark text on red flash)
    - Stats panel (fades in after text):
      - Ticker name and timeframe
      - "Survived X out of Y trading days"
      - "Biggest drop survived: -X%"
      - "Cause of death: [Bad landing / Terminal velocity / Lost in the void]"
    - Buttons: "Ride Again" (same stock) and "New Ride" (back to menu)
    - Play `death.mp3` sound when overlay appears

### Phase 6: Camera System

**Goal**: Dynamic camera that creates tension by zooming based on upcoming volatility.

15. **Create `js/game/camera.js`**
    - `CameraController` class:
      - Each frame, scan the next `LOOKAHEAD_POINTS` data points ahead of the rider
      - Calculate upcoming volatility: standard deviation of price changes in the lookahead window
      - Map volatility to target zoom level:
        - Low volatility (flat trading) → tight zoom (`MIN_ZOOM`) — fills screen, intimate
        - High volatility (approaching a crash/spike) → wide zoom (`MAX_ZOOM`) — pulls back to show the terrain
      - Lerp current zoom toward target zoom at `ZOOM_SPEED` for smooth transitions
    - Horizontal follow:
      - Camera X tracks rider X with a slight lead (camera is a bit ahead of rider so you see slightly more upcoming terrain than passed terrain)
    - Vertical follow:
      - Camera Y tracks rider Y with `VERTICAL_OFFSET` above
      - Smooth vertical following (lerp) so sudden drops create a momentary "left behind" effect before the camera catches up
    - On death:
      - Camera slowly zooms out and drifts upward (pulling away from the crash site)

### Phase 7: Audio

**Goal**: Immersive sketch-style SFX and a dramatic death sting.

16. **Create `js/audio/soundManager.js`**
    - Use Web Audio API for low-latency playback
    - Preload all audio files on app init (they're small)
    - Sound triggers:
      - **Pencil scratch loop**: plays during RIDING state. Volume scales with speed. Pitch scales slightly with speed.
      - **Wind loop**: plays during AIRBORNE state. Volume scales with vertical velocity.
      - **Jump**: one-shot on jump action
      - **Clean landing**: satisfying thud, plays on successful landing
      - **Rough landing**: crunchier version, plays on rough-but-survivable landing
      - **Death sting**: dramatic audio sting + low rumble, plays when DEAD state triggers
    - Cross-fade between pencil loop and wind loop based on state transitions
    - All audio respects mobile autoplay policies: only initialize AudioContext on first user interaction (click/tap)
    - Master mute toggle in UI (respect users who don't want sound)

### Phase 8: UI Layer

**Goal**: Stock picker, HUD, and share functionality.

17. **Create `js/ui/stockPicker.js`**
    - HTML/CSS overlay (not Three.js — this is standard DOM)
    - Components:
      - Search input with placeholder "Search a company or ticker..."
      - Autocomplete dropdown (powered by `tickerSearch.js`)
      - Timeframe selector: row of buttons [1D] [1M] [6M] [1Y] [5Y], default 1Y selected
      - "RIDE" button (disabled until a ticker is selected)
    - On "RIDE" click:
      - Transition to LOADING state
      - Show loading animation (pencil drawing the line progressively)
      - Fetch data, build terrain, then transition to RIDING

18. **Create `js/ui/hud.js`**
    - Minimal overlay during RIDING state:
      - Top-left: Ticker symbol + company name
      - Top-right: Current price at rider's position + date
      - Bottom-center: "SPACE or TAP to jump" hint (fades out after 5 seconds)
    - All HUD text in the sketch handwriting font
    - Semi-transparent so it doesn't obscure gameplay

19. **Create `js/ui/shareUrl.js`**
    - Encode ride parameters in URL query string:
      ```
      ?ticker=GME&range=1y
      ```
    - On page load: check for query params
      - If present: auto-populate stock picker and optionally auto-start the ride
    - "Share" button on death screen:
      - Copies the URL to clipboard
      - Shows "Link copied!" confirmation

### Phase 9: Mobile Support & Progressive Degradation

**Goal**: Playable on mobile with reduced visual fidelity.

20. **Create `js/utils/responsive.js`**
    - Detect capabilities:
      - `isMobile`: screen width < 768px or touch-primary input
      - `isLowPower`: check `navigator.hardwareConcurrency < 4` or `deviceMemory < 4`
    - Capability flags:
      - `enableParallax`: false on mobile
      - `enablePostProcessing`: false on mobile/low-power
      - `enablePencilShader`: simplified on mobile (basic line, no texture)
      - `maxSplinePoints`: reduced on mobile (500 vs 2000)
    - Touch input:
      - Tap anywhere on canvas = jump (equivalent to spacebar)
      - No swipe/drag needed
    - Resize handler:
      - Update Three.js renderer size
      - Update camera aspect ratio
      - Reposition UI elements

### Phase 10: Integration & Polish

**Goal**: Wire everything together, tune the feel, handle edge cases.

21. **Wire up `main.js` state machine**
    - MENU state: show stock picker, hide canvas
    - LOADING state: show loading animation, fetch data, build terrain
    - RIDING state: hide UI overlay, start physics loop, start audio, start camera
    - DEAD state: freeze physics, show death screen overlay, stop ride audio, play death sting
    - Handle transitions cleanly (dispose Three.js objects on new ride to prevent memory leaks)

22. **Edge cases to handle**:
    - Stock with very few data points (e.g., recently IPO'd): show warning "Short ride ahead!"
    - API failure: show error message with "Try again" button
    - Stock with 0 price change (delisted/halted): detect and warn "This stock is flatlined"
    - Extremely volatile stocks: cap terrain slope to prevent instant-death scenarios (give the player a chance)
    - Window losing focus: pause the ride, show "Paused" overlay
    - Browser tab backgrounded: pause `requestAnimationFrame` loop to avoid huge `dt` jumps on resume

23. **Performance targets**:
    - 60fps on desktop
    - 30fps minimum on mobile
    - First paint < 2 seconds
    - Time to interactive < 4 seconds (before data fetch)
    - Bundle size: < 500KB uncompressed JS (Three.js is ~150KB minified)

---

## Asset Creation Notes

The sprites and audio files need to be created. Here's guidance for the implementing LLM:

### Sprites (Wall Street Bro on Suitcase)
- Style: black pencil sketch on transparent background
- Size: 128x128 PNG each
- Character: stocky guy in a suit, sitting/crouching on a briefcase like a sled
- 5 poses needed: idle, crouch, jump, air (flailing), dead (ragdoll)
- These can be generated procedurally using Canvas 2D drawing commands if image generation isn't available. A stick-figure-plus version drawn with lines and arcs would fit the notebook aesthetic perfectly.

### Audio
- Pencil scratch: can be generated with Web Audio API (filtered white noise with envelope shaping)
- Wind: filtered noise with LFO modulation
- Impact sounds: short noise bursts with low-pass filter
- Death sting: low sine wave with reverb + filtered noise crash
- All audio can be procedurally generated using Web Audio API — no MP3 files needed! This keeps the repo lightweight and avoids asset licensing issues.

**Recommendation**: Generate ALL audio procedurally using Web Audio API oscillators, noise generators, and filters. Generate ALL sprites programmatically using Canvas 2D drawing. This means zero external asset files and the entire app is pure code.

---

## API Details

### Yahoo Finance Chart API

```
GET https://query1.finance.yahoo.com/v8/finance/chart/{SYMBOL}?range={RANGE}&interval={INTERVAL}

Example: https://query1.finance.yahoo.com/v8/finance/chart/AAPL?range=1y&interval=1d
```

This endpoint frequently has CORS issues when called from browsers. Solutions in priority order:

1. **Try direct call first** — some browsers/situations allow it
2. **Use a public CORS proxy** — e.g., `https://corsproxy.io/?url=` prepended to the Yahoo URL
3. **Alternative: use `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=AAPL&apikey=demo`** — the `demo` key works for a few tickers (AAPL, IBM, MSFT)

Response shape (Yahoo):
```json
{
  "chart": {
    "result": [{
      "timestamp": [1234567890, ...],
      "indicators": {
        "quote": [{
          "open": [...],
          "high": [...],
          "low": [...],
          "close": [...],
          "volume": [...]
        }]
      }
    }]
  }
}
```

### Ticker Autocomplete Data

Generate `data/tickers.json` from a static snapshot. A truncated list of ~2000-3000 of the most popular/traded tickers is sufficient and keeps file size manageable (~100KB).

---

## Shareable URL Spec

Format: `https://<username>.github.io/stonk-market-rider/?ticker=GME&range=1y`

Parameters:
- `ticker` (required): Stock ticker symbol
- `range` (optional, default `1y`): One of `1d`, `1mo`, `6mo`, `1y`, `5y`
- `autoplay` (optional): If `true`, skips the menu and starts riding immediately

On page load, `main.js` should parse `URLSearchParams` and pre-populate/auto-start accordingly.

---

## Implementation Order (Recommended)

Build in this order to have a playable prototype as early as possible:

1. **Scaffolding** (Phase 1): Get Three.js rendering a scene → ~30 min
2. **Terrain** (Phase 3): Hardcode sample data, render as a line → ~1 hour
3. **Physics** (Phase 4): Get a dot moving along the line with gravity → ~2 hours
4. **Rider visuals** (Phase 5 partial): Draw a simple shape as the rider → ~30 min
5. **Camera** (Phase 6): Basic follow camera → ~30 min

   **Milestone: Playable prototype with hardcoded data**

6. **Jump input** (Phase 4 addition): Spacebar/tap to jump → ~30 min
7. **Death detection** (Phase 4 addition): Bad landings trigger death → ~1 hour
8. **Death screen** (Phase 5): "YOU CAN'T TAKE IT WITH YOU" overlay → ~1 hour
9. **Stock API** (Phase 2): Fetch real data, replace hardcoded → ~1 hour
10. **Stock picker UI** (Phase 8): Search + timeframe selector → ~1.5 hours

    **Milestone: Feature-complete core gameplay**

11. **Sketch visuals** (Phase 5): Paper texture, pencil lines, parallax → ~2 hours
12. **Dynamic camera** (Phase 6): Volatility-based zoom → ~1 hour
13. **Audio** (Phase 7): Procedural SFX → ~1.5 hours
14. **Rider sprites** (Phase 5): Programmatic character drawing → ~1.5 hours
15. **Mobile** (Phase 9): Touch input, degraded rendering → ~1 hour
16. **Share URL** (Phase 8): Query string encode/decode → ~30 min
17. **Polish** (Phase 10): Edge cases, performance, tuning → ~2 hours

---

## Key Technical Risks & Mitigations

| Risk | Mitigation |
|---|---|
| Yahoo Finance CORS blocked | Use `corsproxy.io` or similar public proxy. Fall back to bundled sample data for demo. |
| Three.js bundle size too large | Use only the modules needed via ES module tree-shaking. Or use a CDN with the full bundle (~160KB gzipped). |
| Physics feels wrong | All physics constants are in `config.js` for easy tuning. Expose a debug panel (hidden, `?debug=true`) with sliders for real-time tuning. |
| Mobile performance | Degrade aggressively: disable parallax, simplify line rendering, reduce spline resolution. Target 30fps minimum. |
| Death too frequent/rare | Tune `LANDING_ANGLE_TOLERANCE` and `LANDING_IMPACT_DEATH` carefully. Default to forgiving, let the chart's drama speak for itself. Consider difficulty presets or adaptive difficulty. |
| Stale ticker data | The ticker list is static but stock data is live. If a ticker in `tickers.json` gets delisted, the API will return an error — handle gracefully with "Ticker not found" message. |

---

## GitHub Pages Deployment

- The site is entirely static — just push to the branch and enable GitHub Pages
- No build step required (all ES modules, no bundler)
- Ensure all paths are relative (not absolute) for GitHub Pages subdirectory hosting
- Add a `.nojekyll` file to prevent GitHub Pages from processing with Jekyll (which can strip files starting with `_`)
