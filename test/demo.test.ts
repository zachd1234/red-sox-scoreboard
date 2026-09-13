import { test } from 'node:test';
import assert from 'node:assert/strict';
import { demoState, demoEvents, demoDurationMs, DemoPlayback } from '../src/demo';
import { DisplayProgram } from '../src/program';
import { defaultLogo, render, supported, validFrame } from '../src/display';

test('demo progresses all half innings, ends on walk-off and repeats at 0–0', () => {
  assert.equal(demoState(0).inning, 1);
  assert.equal(demoState(0).bostonScore, 0);
  assert.equal(demoState(0).opponentScore, 0);
  assert.equal(demoState(14000).status, 'break');
  assert.equal(demoState(17000).half, 'bottom');
  assert.equal(demoState(21000).bostonScore, 1);
  const liveStarts = demoEvents.filter(event => event.at % 17000 === 0);
  assert.equal(liveStarts.length, 18);
  for (const event of demoEvents) assert.ok(supported(demoState(event.at)));
  const final = demoState(demoDurationMs - 1);
  assert.equal(final.status, 'final');
  assert.equal(final.bostonScore, 6);
  assert.equal(final.opponentScore, 5);
  assert.equal(final.inning, 9);
  const restart = demoState(demoDurationMs);
  assert.notEqual(restart.gameId, final.gameId);
  assert.equal(restart.inning, 1);
  assert.equal(restart.bostonScore, 0);
});

test('automatic game celebrates all four Boston scoring events including walk-off', () => {
  const program = new DisplayProgram();
  let previousScreen = '';
  let celebrations = 0;
  for (let time = 0; time < demoDurationMs + 1000; time += 100) {
    const state = demoState(time);
    const output = program.next(state, 'auto', .85, defaultLogo, time);
    assert.ok(validFrame(output.frame));
    if (output.screen === 'celebration' && previousScreen !== 'celebration') celebrations++;
    if (state.status === 'break') assert.equal(output.screen, 'logo');
    previousScreen = output.screen;
  }
  assert.equal(celebrations, 4);
});

test('pause freezes game time, resume continues, restart resets', () => {
  const playback = new DemoPlayback();
  playback.next(0);
  assert.equal(playback.next(21000).bostonScore, 1);
  playback.pause();
  assert.equal(playback.next(90000).inning, 1);
  playback.resume();
  assert.equal(playback.next(100000).inning, 1);
  assert.equal(playback.next(114000).inning, 2);
  playback.restart();
  assert.equal(playback.next(120000).bostonScore, 0);
  assert.equal(playback.playing, true);
});

test('confetti moves across valid frames then clears for the score', () => {
  const program = new DisplayProgram();
  program.next(demoState(17000), 'auto', 1, defaultLogo, 0);
  const scored = demoState(21000);
  const first = program.next(scored, 'auto', 1, defaultLogo, 100);
  const second = program.next(scored, 'auto', 1, defaultLogo, 600);
  assert.equal(first.screen, 'celebration');
  assert.notDeepEqual(first.frame, second.frame);
  assert.ok(first.frame.flat().some(p => p[0] === 235 && p[1] === 245));
  assert.deepEqual(program.next(scored, 'auto', 1, defaultLogo, 1900).frame, render(scored));
});
