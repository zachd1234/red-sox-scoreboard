# Simulator test — September 13, 2026

Instance: https://sundai.willsarg.com/icy-otter?view=river

Tested the actual remote simulator, using explicitly mocked game states.
The test ended and restored the neutral Boston B logo; it is not running a live game.

## Results

- Calibration verified visually: red top-left, green top-right, blue bottom-left,
  white bottom-right. No transpose or flip required.
- Inspected close-up, full-building, and river views. Red Boston score and amber
  opponent score were distinct; the Boston B silhouette was recognizable.
- Inspected GPU effects enabled and disabled. Both displayed correctly.
- Sent 12–11, bottom of inning 10 in stacked layout and inspected the river view
  with the real-tree-line option. Lower inning rows overlap the tree-covered
  facade. The simulator still draws bright lights there, so this is not proof
  of real-world visibility. Keep the requested layout for now; evaluate an
  alternative that avoids relying on the bottom two rows before physical use.
- Ran the production DisplayProgram and FrameTransport through 32 seconds of
  normal loop, Boston scoring, inning break, resumed bottom half, and final.
- 23 frame requests, zero HTTP errors. Median HTTP latency 65 ms, p95 412 ms.
  Measured to the local proxy response, including its simulator POST.
- Static screens send on change. A slow response can exceed the 240 ms slide;
  newest-frame coalescing avoids queued playback but can skip slide steps.
- The viewer says "live · waiting for frames" after a static hold even while
  continuing to display the frame. This alone does not indicate a lost connection.
- Type checks for the new scripts and production build passed.

This short run does not establish a sustained frame-rate limit, a provider SLA,
or end-to-end live MLB transition correctness. MLB integration still needs
observation during an actual game.

## Repeat the test

Keep `npm run dev` running. Open the instance viewer, and pause any other sender
using icy-otter so test frames do not compete with the control page.

- `npm run sim:frame -- calibration`
- `npm run sim:frame -- logo`
- `npm run sim:frame -- score`
- `npm run sim:frame -- overflow`
- `npm run sim:frame -- final`
- `npm run sim:test`

The sequence prints its stages and metrics, then restores the logo. Allow about
43 seconds including the final wait for any in-flight request to complete.

## Recommended next work

1. Move polling, program timing, and frame transport into a single server worker.
   The browser should control the worker, not be required to keep it running.
2. Show selected matchup, game status, last successful fetch, last delivered
   frame, and retry status distinctly. Persist explicit game selection.
3. Tune slide duration/send cadence from measured latency, and provide a
   tree-line-aware overflow option without changing the current default.
4. Observe a live game and record normalized updates for repeatable playback of
   scoring, inning breaks, delays, stale recovery, and walk-offs.
