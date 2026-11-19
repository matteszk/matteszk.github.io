# matteszk.github.io

The portfolio homepage of **Matthew Szklarz**, WordPress and frontend developer.

It's an interactive 3D title screen in the style of a certain late-90s console game. A black mountain goat gallops, prances, grazes and naps through a Carpathian landscape while the camera cuts between shots, like an attract-mode intro. Press **Start** and the camera glides to a rustic notice board in the world, where pinned notes link to my LinkedIn, GitHub and email.

**Live:** https://matteszk.github.io

---

## Highlights

- **Single static file.** One `index.html` with no build step, no framework and no backend.
- **Procedural everything.** Every model, texture and sound is generated in code at runtime. There are no image, model or audio assets.
- **Cinematic attract loop.** Six camera shots cut together with fades: a moonlit ridge, an overhead sweep, a village, an apple orchard, a mountain valley, and a castle with bats.
- **An in-world menu.** The notice board is part of the 3D scene, not an overlay. Its notes are real links, positioned every frame over the 3D note meshes so they work with a mouse, touch and keyboard.
- **Spatial audio.** Hoofbeats are synthesized per footfall and panned by where the goat is on screen. There's also chewing and snoring, plus an original flute-and-cimbalom score.
- **Retro rendering.** Smooth shading, soft low-contrast textures, a blob shadow under the goat, fog and a light CRT overlay, all tuned to evoke N64-era graphics.

## Features in detail

### Scenes

| # | Scene | What happens |
|---|-------|--------------|
| 1 | Moon ridge | The goat prances along a crest as a full moon sinks. The camera is nearly static. |
| 2 | Overhead sweep | A high orbiting camera follows the goat across the fields. |
| 3 | Village | A side-tracking shot past log cabins, a cabbage garden and a parked orange SUV, with a fir forest behind. |
| 4 | Apple orchard | The goat grazes from apples spilling out of a tipped barrel as the camera cranes down and holds. |
| 5 | Mountains | The goat gallops toward a snow-capped range. |
| 6 | Castle | A castle inspired by Bran Castle sits in a valley at the foot of the mountains, with bats circling its tower. |

### The goat

- Built from jointed box primitives: hips and knees on each leg, plus a neck, head, tail and segmented horns.
- Gaits are animated with per-leg phase offsets: a four-beat lope, a stiff-legged prance and a grazing idle.
- When sleeping, the breathing animation drives both the body scale and the snore sound, so they stay in sync. The snore starts just before each inhale.
- Placed on the terrain using the lower of the ground heights at its middle and its front and back legs, so it doesn't float on slopes.

### Rendering

- A heightfield terrain with per-face vertex colors gives large-scale grass and dirt variation. A small seamless blotch texture adds detail without obvious tiling.
- Grain and fur textures are generated on canvases and softened toward their mean color for a low-contrast, painted look.
- A final pass gives every remaining material a texture, so nothing renders flat.
- Each goat run is precomputed as a line segment. Any scattered prop close to one is removed at load, so the goat never clips through trees, rocks or houses.
- The board camera is responsive. Its distance is computed from the field of view and the window's aspect ratio, so the board and goat stay framed on any screen.

### Audio (Web Audio API)

- **Hooves:** a filtered noise burst plus a falling sine thud. Each hoof has its own base pitch, with random variation from step to step.
- **Chewing:** a sweeping band of noise with a quick flutter, timed to the goat's jaw.
- **Snoring:** a low, filtered sawtooth with a flutter, timed to the breathing animation.
- **Music:** an original piece. The cimbalom plays alone for the first minute, using detuned string pairs with inharmonic overtones, then an ocarina-style flute joins over a drone and faint wind, all through a generated reverb.
- Sound is off until the visitor turns it on, because browsers block audio until someone interacts with the page.

### Accessibility and resilience

- Every note, button and control can be reached with the keyboard, with a visible gold focus outline.
- Enter presses Start, and Escape or Backspace goes back to the film.
- If WebGL isn't available, a plain fallback page shows the same contact links.

## Controls

| Input | Action |
|-------|--------|
| Click **Start** / press **Enter** | Go to the notice board |
| **Back** / **Esc** | Return to the film |
| **Sound: Off/On** | Toggle all audio |
| Tab | Move between notes on the board |

**Dev mode:** add `#dev` to the URL (`https://matteszk.github.io/#dev`) to show a scene counter with ◀ ▶ buttons for jumping between shots.

## Tech

- [three.js](https://threejs.org/) r128, loaded from cdnjs
- Web Audio API, for all sound and music
- Canvas 2D, for every texture
- Google Fonts: Saira Extra Condensed (Start), Press Start 2P (UI), Pirata One and Caveat (notes)
- Plain HTML, CSS and JavaScript

## Running locally

There's no build step. Because the page loads its libraries from CDNs, serve it over HTTP rather than opening the file directly:

```bash
# any static server works
npx serve .
# or
python3 -m http.server 8000
```

Then open `http://localhost:8000`.

## Deployment

Hosted on **GitHub Pages** from the `main` branch of the `matteszk.github.io` repository. Pushing to `main` deploys automatically.

To use a custom domain:
1. Add a `CNAME` file at the repo root containing the domain, for example `matthewszklarz.com`.
2. Point the domain's DNS at GitHub Pages, following GitHub's custom domain instructions.
3. Turn on **Enforce HTTPS** in the repo's Settings → Pages.

## Project structure

```
index.html   # the entire site: markup, styles, scene, audio and UI
README.md
```

Inside `index.html`, the script is organized roughly in this order:

1. Renderer, camera, sky, moon and lights
2. Terrain, textures, trees, mountains, castle, village and props
3. The goat rig, gaits and blob shadow
4. Shot definitions and the shot-order list
5. The notice board, its notes and the clickable link layer
6. Audio: sound effects and music
7. The main loop: film mode and board mode

## Roadmap

- [ ] Project case studies as more notes on the board
- [ ] A "Skip intro" link to a fast, plain portfolio page
- [ ] Respect `prefers-reduced-motion`
- [ ] Lower grass and texture detail automatically on weak devices
- [ ] Self-host three.js and the fonts
- [ ] Custom domain

## Credits

Design and development by Matthew Szklarz.
Inspired by the attract screens of late-90s 3D console games. All models, textures, animation, sound effects and music are original and generated in code.

## Contact

- LinkedIn: [matthew-szklarz](https://www.linkedin.com/in/matthew-szklarz)
- GitHub: [matteszk](https://github.com/matteszk)
- Email: mszklarz@gmail.com
