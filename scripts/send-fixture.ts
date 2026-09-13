import { render, type GameState } from '../src/display';
const name = process.argv[2] ?? 'score';
const state: GameState = {
  gameId: 'simulator-test', status: 'live', bostonScore: 1, opponentScore: 1,
  inning: 5, half: 'top', fetchedAt: new Date().toISOString(),
};
if (name === 'overflow') Object.assign(state, { bostonScore: 12, opponentScore: 11, inning: 10, half: 'bottom' });
if (name === 'final') Object.assign(state, { bostonScore: 4, opponentScore: 3, inning: 9, status: 'final' });
if (!['score', 'overflow', 'final', 'logo', 'calibration'].includes(name)) throw new Error('Choose score, overflow, final, logo, or calibration');
const frame = render(state, ['logo', 'calibration'].includes(name) ? name : 'auto', 0.85);
const started = performance.now();
const response = await fetch('http://localhost:5173/api/frame', {
  method: 'POST', headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ endpoint: 'https://sundai.willsarg.com/api/i/icy-otter/frame', frame }),
  signal: AbortSignal.timeout(12000),
});
console.log(JSON.stringify({ fixture: name, status: response.status, milliseconds: Math.round(performance.now() - started) }));
if (!response.ok) throw new Error(await response.text());
