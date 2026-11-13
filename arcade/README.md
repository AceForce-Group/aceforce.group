# AceForce Arcade: website concept

A one-page 8-bit game version of the AceForce website. A magician in a top hat (the Ace) repairs an
intergalactic supply chain in five acts, then vanishes. The scroll position controls the story.
Concept preview: https://aceforce-arcade.pages.dev/ (this preview tells search engines not to index it).

## Run it

The site is static files. It has no build step and needs no network. In this folder:

```bash
python3 -m http.server 8794 --bind 127.0.0.1
```

Then open http://127.0.0.1:8794/. Add `?gate=1` to see the optional start screen with the sound choice.

## Put it on the official site

1. Upload the folder as it is. Keep the paths: `index.html`, `css/`, `js/`, `fonts/`, `img/`.
2. This copy has no `noindex` tag, `_headers` file or `robots.txt`. Add your own host settings.
3. Optional: cache `/fonts/*` for a long time. The font files do not change.
4. The page can be one section or a full replacement of the current site. That choice is yours.

## Approve before it goes public

- The client and brand names, and the team names, are text only. The live site publishes the same names.
  Use of them here needs the same approval as the live site.
- Copy now matches aceforce.group as of Nov 2026: hero lede, Connector, Warehouse Warden and the
  Shipping App (World 2-3 Power-ups), all 19 systems (World 2-2 Level Select, linking to the
  /systems/ pages), and the Everything else we run catalog (Inventory, under Pick a Card).
  The old Squarespace lines ("empowers", "solutions", "Not just a consultancy") are gone.
- Contact is a form that posts to the same Web3Forms inbox as the live site, tagged "Arcade".
  There are no mailto links on the page.
- The page is set to noindex. On aceforce.group it lives at /arcade/, reached from the 80s toggle
  in the homepage header and footer. "Back to the future" in the HUD goes back to the regular site.
- Find all five aces and the arcade dials up the 90s version of the site at /90s/ on aceforce.group.

## Where things are

```
index.html   the page; all copy is in the HTML
css/site.css layout, pixel borders, stepped motion
js/ui.js     HUD, score, cards, versus table, team roster (team bios are in this file), cheat code,
             mission form, Back to the future
js/world.js  the scroll-driven canvas world (planets, ship, the Ace)
js/game.js   the 30-second bonus game, Spreadsheet Storm
js/gfx.js    palette, sprites, pixel font
js/sfx.js    music and sound effects (Web Audio; no audio files)
fonts/       Press Start 2P and VT323 (SIL Open Font License, license files included), IBM Plex Mono
img/         wordmark, favicon, spade mask
```

All pixel art, music and sound come from code. There are no art or audio downloads.

## Secrets (for fun)

Five hidden aces unlock a green handheld palette. The code ↑ ↑ ↓ ↓ ← → ← → B A starts warp speed.
The top hat in the footer holds a rabbit. The page honors the reduced-motion setting.

## Tested

Headless Chromium: all interaction checks pass, and the cards show their full face at widths from
390 px to 1920 px. Not tested: Safari, Firefox, a real phone, and the sound by a person.
