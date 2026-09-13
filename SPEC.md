Implementation revision: automatic mock game and confetti

Demo mode now starts in the top of the first at 0–0 and progresses through
all nine innings, scoring for both teams and holding the logo between halves.
Boston bats in the bottom half. A 6–5 walk-off ends the game; after a 12-second
final hold, the 305-second timeline repeats. Pause, Resume, and Restart are
available; manual controls and fixtures pause the timeline.
Boston scoring replaces edge streamers with sparse falling red-and-white
confetti over the stationary B, followed by the updated score. Live Boston
scoring uses the same celebration. This supersedes earlier demo and streamer
behavior; all demo scores remain explicitly fictional.

---

Implementation revision: centered standard layout and opponent color

When both scores are below 10, move the score/inning composition down two rows:
scores occupy rows 3–7, separator row 5, inning rows 10–14, and the right-hand
arrow rows 11–13. This leaves two empty rows above and three below.
Keep the stacked overflow layout in its existing positions.
Boston remains red regardless of home/away; the opponent uses amber
[255, 190, 65] (#FFBE41). Inning, arrow, and separator remain white.
This supersedes standard-layout positions and opponent white below.

---

Implementation revision: Boston B logo

Use a hand-authored red Boston B based on the supplied reference, replacing
all hanging-socks artwork in loop, break, fallback, and celebration screens.
Preserve the two black counters, hooked left serifs, and pointed right lobes.
At 9 × 17, prioritize the red silhouette and black negative space over a navy
outline. The mask remains editable using the existing palette.
This supersedes the socks artwork requirements below.

---

Implementation revision: game-connected screen program

During live play, repeat socks logo (2 seconds) and score and inning (7 seconds).
Add a 240 ms leftward pixel slide between screens; holds are fully stationary.
The complete cycle is 9.48 seconds, including transitions.
The separate count screen and balls, strikes, and outs controls are removed.

A new Boston score increase during active play interrupts with 1.8 seconds
of socks and red edge streamers, then the updated score for 7 seconds.
Repeated responses and downward score corrections do not replay a celebration.
A walk-off can celebrate once, then holds the final score without the arrow.
Breaks, delays, suspensions, pregame, unsupported states, and stale data keep
the static logo behavior. Returning to live play restarts the logo-first loop.
Selecting a game or recovering stale data does not celebrate historical runs.
Manual logo and calibration modes take precedence over the program.

This replaces the original during-play static-screen behavior. The original
exclusions of balls, strikes, outs, and other additional game details still apply.

---

Implementation revision: half-inning indicator placement

The half-inning arrow now sits to the RIGHT of the inning number in both
score layouts. For single-digit innings, the digit occupies columns 2–4
and the compact 3×3 arrow occupies columns 6–8, vertically centered beside
it. For two-digit innings, digits occupy columns 1–7, column 8 stays blank,
and column 9 has a top/bottom indicator at the first/last digit row.
Final innings remain centered without an arrow. This supersedes the
arrow placement and inning columns in the original specification below.

---

Red Sox Building Scoreboard — MVP Specification

Goal

Turn a 9-column × 17-row building display into a readable live Red Sox scoreboard. During play, show the score and inning. Between half-innings, replace the scoreboard with a full-display Red Sox socks logo.

This document is ready to add to an independent repository as SPEC.md. It specifies the first build; it is not an implemented or tested simulator client.

Agreed product decisions

Display is 9 pixels wide, 17 pixels tall, with 153 RGB pixels total.

During play: score, inning number, and top/bottom indicator.

Between half-innings: Red Sox logo, using the entire grid.

Boston's score is always on the left in red; the opponent's score is on the right in white, regardless of home/away assignment.

Exclude occupied bases, outs, balls, strikes, player names, and opponent name/logo from the MVP.

Target a 30 fps animation/render loop. Live baseball data updates independently; it does not need to update 30 times per second.

Do not assume a particular playoff matchup or qualification. Select the actual game explicitly.

The layouts, palette, failure behavior, and implementation structure below are proposed engineering defaults. The core score/inning/logo scope is the agreed requirement.

Pixel system

Logical coordinates: frame[y][x], where x = 0..8, y = 0..16.

Design origin: top left; x increases rightward, y increases downward.

Verify that orientation against the simulator using a corner test before sending artwork.

Every pixel is an integer RGB triplet [r, g, b], each channel from 0 through 255.

No transparency, antialiasing, subpixels, or browser text rendering in transmitted frames.

Draw glyphs from hand-authored pixel masks. Scale previews with nearest-neighbor rendering.

Clear the frame to black before composing each new frame.

Initial palette

Role

RGB

Hex

Off/background

[0, 0, 0]

#000000

Boston score and logo

[255, 40, 60]

#FF283C

Opponent score, inning, arrow

[235, 245, 255]

#EBF5FF

Logo accent, if needed

[235, 245, 255]

#EBF5FF

These are display colors, not a claim of exact brand color matching. Make brightness configurable with a single multiplier, clamping final channel values to integers in range.

During-play layout

Standard layout: both scores below 10

Rows and columns in the following table are one-based for design review.

Element

Rows

Columns

Treatment

Boston score

1–5

1–3

One 3×5 digit, red

Score separator

3

5

One white pixel

Opponent score

1–5

7–9

One 3×5 digit, white

Spacing

6–7

All

Black

Inning

8–12

4–6 for one digit; 2–8 for two

White 3×5 digits; one blank column between digits

Spacing

13

All

Black

Top/bottom arrow

14–16

3–7

White, centered

Bottom margin

17

All

Black

Arrow masks use a five-pixel-wide box: top arrow rows light its center pixel, then middle three pixels, then all five pixels. Bottom arrow reverses that order. The arrow represents top or bottom of the inning, not which team is batting.

For a 1–1 game in the top of the fifth, show red 1, white separator, white 1, centered white 5, and an upward arrow. Keep this screen steady while the state remains unchanged.

Overflow layout: either score is 10 or higher

Two two-digit scores cannot fit next to each other with readable 3×5 digits. Switch to a stacked layout for both teams together:

Element

Rows

Columns

Boston score, red

1–5

Centered; 3 pixels for one digit, 7 for two

Spacing

6

All

Opponent score, white

7–11

Centered; 3 pixels for one digit, 7 for two

Spacing

12

All

Inning

13–17

4–6 for one digit; 2–8 for two

Compact half-inning arrow

13–15

1–3, only for a single-digit inning

Use a 3×3 arrow in the compact layout: center pixel, full middle row, full bottom row for up; reverse for down. For a two-digit inning, put a single half indicator at column 9, row 13 for top or row 17 for bottom, avoiding the digits in columns 2–8.

Support scores 0–99 and innings 1–99 without clipping or silently truncating. Treat values outside that supported range as an explicit unsupported state in the controller, with an error logged and a neutral logo fallback.

Between-half-innings logo

Use a hand-drawn pixel-art interpretation of the Red Sox hanging socks emblem, not a text wordmark.

Give the logo the full 9×17 canvas; retain black negative space so the silhouette reads at a distance.

Start with a static red silhouette; add white accents only if they improve recognition at native resolution.

Store the logo as an editable 17-row × 9-column mask with a small palette. Validate every row length.

Preview on a flat grid and the simulator's full-building and across-the-river views. The exact mask is a design deliverable for implementation, not finalized in this spec.

Optional later enhancement: a restrained brightness pulse at 30 fps. Static display is sufficient for MVP.

Enter logo mode on an explicit feed-reported half-inning break; return to the scoreboard as soon as play resumes. Do not substitute a fixed timer or wait for the next score change.

Show the logo at both the middle and end of an inning. If a game ends instead, use the final-state behavior below.

Display states and priority

State

Display

Demo

Manually controlled fixture; external controller labels it as demo

No selected game / pregame

Static logo

Active half-inning

Scoreboard with current score, inning, half

Middle/end of inning

Full-screen logo

Delay / suspended

Static logo; show reason in controller/logs

Final

Hold the final score and last played inning with the half arrow removed

Missing or stale live data

Hold last valid state briefly, then static logo; controller clearly marks data unavailable

Final status takes precedence over an inning-break event, including walk-off endings. A late or out-of-order update must not roll the display back to an earlier state.

Proposed stale threshold: 60 seconds without a successful valid response. Measure freshness from successful retrieval, not from when the score last changed. A healthy feed may report the same game state for many minutes.

Game-data boundary

Start with mock fixtures and manual controls. Add a live provider behind an adapter after the display works. No live provider, authentication scheme, endpoint, or polling allowance is specified or verified here.

The renderer should consume a normalized state such as:

type GameState = {
  gameId: string;
  status: 'pregame' | 'live' | 'break' | 'delayed' | 'suspended' | 'final';
  bostonScore: number;
  opponentScore: number;
  inning: number | null;
  half: 'top' | 'bottom' | null;
  fetchedAt: string; // ISO timestamp of last successful retrieval
};

Map Boston by team identity, not by assuming it is always home or always away.

Select an explicit game ID; account for doubleheaders rather than silently choosing the first scheduled game.

Use provider status to distinguish active play, breaks, delays, and final. If break status is unavailable, add a manual override; do not infer it from inactivity alone.

A proposed initial polling interval is 5 seconds, subject to the chosen provider's actual limits.

Allow manual score, inning, half, and display-mode overrides during development.

Simulator connection

Connection details below were supplied by the user. They have not been live-tested for this document.

Setting

Value

Instance

icy-otter

Frame endpoint

https://sundai.willsarg.com/api/i/icy-otter/frame

HTTP method

POST

Content type

application/json

Payload

Raw array of 17 rows, each containing 9 RGB triplets

Send the frame array directly, with no invented wrapper such as { "frame": ... }.

Generate a valid calibration payload

import json

frame = [[[0, 0, 0] for x in range(9)] for y in range(17)]
frame[0][0] = [255, 0, 0]     # logical top-left: red
frame[0][8] = [0, 255, 0]     # logical top-right: green
frame[16][0] = [0, 0, 255]    # logical bottom-left: blue
frame[16][8] = [255, 255, 255] # logical bottom-right: white

with open('frame.json', 'w') as f:
    json.dump(frame, f)

Send with curl

curl -X POST https://sundai.willsarg.com/api/i/icy-otter/frame \
  -H 'Content-Type: application/json' \
  -d @frame.json

Supplied Python SDK example

from gbsim import WebDisplay, Color

d = WebDisplay('icy-otter', 'https://sundai.willsarg.com/api')
f = d.makeframe()
f[0][0] = Color(255, 0, 0)
d.send(f)

The source/install instructions for gbsim were not supplied. Use direct HTTP initially if the SDK is not available; do not assume a package installation command.

The simulator provides Close-up, Full building, and Across the river views, with optional GPU bloom, water, haze, and grain. Check readability both with and without those effects.

Rendering and transport

Suggested stack: TypeScript with Node or Bun, a pure frame renderer, and a small local browser preview. Python is also suitable; the protocol does not depend on language.

Keep the live-data adapter, display-state selection, pixel renderer, and HTTP transport separate.

Render animations against elapsed time at a target of 30 fps (approximately 33.3 ms per frame).

Treat 30 fps as the desired local render rate, not a verified server throughput guarantee. Measure supported send rate during integration.

For static screens, send on change unless simulator testing reveals a heartbeat requirement.

Permit at most one HTTP frame request in flight. Keep only the newest pending frame, dropping superseded animation frames rather than building a queue.

On transport failures, use bounded backoff and retain the newest frame. Log errors without blocking data updates or local preview.

Configure the endpoint, brightness, polling interval, and animation/send limits independently.

Build order

Implement frame validation, 3×5 digits, both score layouts, inning arrows, and local preview.

Create the socks pixel mask and review it at native resolution and enlarged without smoothing.

Add manual fixtures for live, break, final, and stale states.

Connect to the simulator and verify corner orientation, color, readability, and send behavior.

Implement the selected live-data adapter and event-driven state transitions.

Acceptance checks

Every frame is exactly 17×9×3, with integer channels in range.

A 1–1 score is red on the left and white on the right; inning and half are unambiguous.

Innings 9, 10, and 11 render completely.

Scores 9–9, 10–2, 2–10, and 12–11 render without clipped digits.

Top → break → bottom → break → next inning switches screens correctly.

A walk-off goes directly to final, not an indefinite break logo.

Disconnecting the data source produces the documented stale fallback; healthy unchanged responses remain fresh.

Returning data restores the correct screen without replaying old frames.

Simulator orientation matches the calibration frame and the display remains readable across the river.

Slow frame requests do not cause an unbounded queue or delayed playback.

Definition of done

A developer can run the project in mock mode, preview and edit the exact pixel designs, send valid frames to icy-otter, and then enable a verified live-data adapter that automatically alternates between the score/inning display and the between-half-innings socks logo.