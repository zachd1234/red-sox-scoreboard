# Fenway Signal

A local Red Sox building-scoreboard control desk. Start with `npm install` and
`npm run dev`, then open http://localhost:5173. `npm test` runs rendering and
provider checks; `npm run build` checks TypeScript and builds the browser bundle.
The Node server is needed for the feed and simulator proxies.

During live play the program holds logo for 2 seconds and score/inning for 7,
with 240 ms sideways slides between stationary screens (9.48 seconds per cycle).
Boston runs trigger a 1.8-second red-streamer celebration followed by 7 seconds
of updated score. Breaks hold the logo; a walk-off celebrates once and holds final.

Demo mode includes score/inning controls, a Boston scores +1 button,
and live, break, overflow, final, and stale fixtures. Display settings includes the editable 17 × 9 Boston B mask,
calibration, endpoint, polling interval, and send-rate limit. Export produces the
raw RGB array accepted by the simulator. Masks persist in local browser storage.

Live feed: choose a date, find Boston games, explicitly select a game, and connect.
The MLB Stats API schedule and game endpoints were retrieved successfully on
2026-09-13 (game 824708, pregame). Boston maps by team ID 111; Middle/End maps to
break, with Final taking priority. Live in-game transitions still require a
full-game integration observation. No provider SLA or polling allowance has been
verified; the initial interval is 10 seconds, configurable to 5 seconds or longer.
Manual controls can override a live state until the next poll; use Demo mode for
persistent manual control. A healthy unchanged response refreshes freshness.
A retrieval failure holds the state until 60 seconds after the last valid
response, then displays the Boston B logo. Older revisions cannot roll the game backward.

Simulator: Connect initially sends only four calibration corners. Open the
simulator, verify their orientation, then check the confirmation in Display
settings and choose Automatic. Outgoing requests carry raw 17 × 9 × 3 arrays.
The transport sends changed frames only, retains one newest pending frame,
limits concurrency to one request, and retries with 1–30 second bounded backoff.
The local 30 fps loop does not imply 30 fps server throughput. Building and river
previews are CSS approximations; actual simulator readability needs visual review.

Implementation: `src/display.ts` is the pure renderer and state validation,
`src/program.ts` owns timed playback and score reactions,
`src/provider.ts` is the MLB adapter, `src/transport.ts` owns sending/backoff,
`src/main.ts` owns the control desk, and `server.ts` proxies HTTP locally.
See SPEC.md for the supplied specification.

The default logo is a hand-authored red Boston B based on the supplied reference,
with black counters and hooked serifs adapted to 9 × 17 pixels. The B editor uses
a new storage key so earlier saved socks masks do not replace the new design;
older saved artwork remains in browser storage.

Single-digit scores use a vertically centered composition; scores of 10 or more
retain the stacked layout. Boston is red, the opponent amber (#FFBE41), and
inning/half indicators white, regardless of which team is home or away.

Simulator integration was tested on September 13, 2026. Open
https://sundai.willsarg.com/icy-otter?view=river to watch. With the local server
running, `npm run sim:test` sends a short mock game sequence and restores the logo.
Use `npm run sim:frame -- score` (or logo, overflow, final, calibration) for a
static fixture. See [the test report](docs/SIMULATOR-TEST.md) for results,
latency measurements, limitations, and next improvements.

For continuous rotation, run `npm run sim:loop` instead of `sim:test`.
This keeps sending the 2-second B logo / 7-second score-and-inning cycle until
stopped with Ctrl+C. It uses a mocked 1–1 score in the top of the fifth.
Stop this sender before connecting the live control page to the same instance.
