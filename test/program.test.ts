import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DisplayProgram, slide } from '../src/program';
import { defaultLogo, render, validFrame, type GameState } from '../src/display';
const wall = Date.now();
const state = (patch: Partial<GameState> = {}): GameState => ({
  gameId: 'demo', status: 'live', bostonScore: 1, opponentScore: 1,
  inning: 5, half: 'top',
  fetchedAt: new Date(wall).toISOString(), ...patch,
});
const next = (p: DisplayProgram, time: number, s = state(), mode = 'auto') =>
  p.next(s, mode, 1, defaultLogo, time, wall);

test('full 2/7 second stationary holds with 240ms sideways transitions', () => {
  const p = new DisplayProgram();
  const first = next(p, 0);
  assert.equal(first.screen, 'logo');
  assert.deepEqual(next(p, 1999).frame, first.frame);
  assert.equal(next(p, 2000).sliding, true);
  assert.equal(next(p, 2240).screen, 'score');
  const score = next(p, 2240).frame;
  assert.deepEqual(next(p, 9239).frame, score);
  assert.equal(next(p, 9240).sliding, true);
  assert.equal(next(p, 9480).screen, 'logo');
  assert.deepEqual(next(p, 11479).frame, first.frame);
  assert.equal(next(p, 11480).sliding, true);
  assert.equal(next(p, 11720).screen, 'score');
});

test('Boston scoring interrupts once, then holds updated score for seven seconds', () => {
  const p = new DisplayProgram();
  next(p, 0);
  const scored = state({ bostonScore: 2 });
  assert.equal(next(p, 1000, scored).screen, 'score');
  assert.deepEqual(next(p, 1000, scored).frame, render(scored));
  assert.equal(next(p, 2800, scored).screen, 'score');
  assert.equal(next(p, 7999, scored).sliding, false);
  assert.equal(next(p, 8000, scored).sliding, true);
  next(p, 10000, state({ bostonScore: 1 }));
  assert.equal(next(p, 11000, scored).screen, 'score');
});

test('breaks hold logo; resumption and recovered data start fresh without celebrations', () => {
  const p = new DisplayProgram();
  next(p, 0);
  for (const status of ['break', 'delayed', 'suspended', 'pregame'] as const) {
    assert.equal(next(p, 5000, state({ status })).screen, 'logo');
    assert.equal(next(p, 20000, state({ status })).sliding, false);
  }
  assert.equal(next(p, 22000, state({ bostonScore: 4 })).screen, 'logo');
  assert.equal(next(p, 24240, state({ bostonScore: 4 })).screen, 'score');
  assert.equal(next(p, 25000, state({ fetchedAt: new Date(wall - 61000).toISOString() })).screen, 'logo');
  assert.equal(next(p, 26000, state({ bostonScore: 5 })).screen, 'logo');
});

test('walk-off immediately holds final score indefinitely', () => {
  const p = new DisplayProgram();
  next(p, 0);
  const final = state({ status: 'final', bostonScore: 2, half: 'bottom', inning: 9 });
  assert.equal(next(p, 500, final).screen, 'score');
  assert.equal(next(p, 2300, final).screen, 'score');
  assert.equal(next(p, 99999, final).screen, 'score');
  assert.ok(next(p, 99999, final).frame.slice(14).flat().every(pixel => pixel.every(c => c === 0)));
});

test('new games, opponent runs, resets and forced modes preserve logo-first playback', () => {
  const p = new DisplayProgram();
  next(p, 0);
  assert.equal(next(p, 100, state({ opponentScore: 2 })).screen, 'logo');
  assert.equal(next(p, 200, state({ gameId: 'new', bostonScore: 8 })).screen, 'logo');
  p.reset();
  assert.equal(next(p, 300, state({ bostonScore: 12 })).screen, 'logo');
  assert.equal(next(p, 400, state({ bostonScore: 13 }), 'logo').screen, 'logo');
});

test('sideways transitions between logo and score keep valid frames', () => {
  const logo = render(null);
  const score = render(state());
  assert.deepEqual(slide(logo, score, 0), logo);
  assert.deepEqual(slide(logo, score, 1), score);
  for (let i = 0; i <= 9; i++) {
    assert.ok(validFrame(slide(logo, score, i / 9)));
    assert.ok(validFrame(slide(score, logo, i / 9)));
  }
});
