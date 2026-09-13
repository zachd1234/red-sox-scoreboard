import { DisplayProgram } from '../src/program';
import { FrameTransport } from '../src/transport';
import { defaultLogo, type GameState } from '../src/display';

// Continuous mock display. Stop with Ctrl+C before connecting a live sender.
const nativeFetch = globalThis.fetch;
globalThis.fetch = (async (input, init) => nativeFetch(
  typeof input === 'string' && input.startsWith('/') ? `http://localhost:5173${input}` : input,
  init,
)) as typeof fetch;
const transport = new FrameTransport();
transport.enabled = true;
transport.maxFps = 10;
let screen = '';
let delivered = 0;
transport.onStatus = (message): void => {
  if (message === 'Frame delivered') delivered++;
  else console.error(message);
};
const program = new DisplayProgram();
const state: GameState = {
  gameId: 'continuous-demo', status: 'live', bostonScore: 1, opponentScore: 1,
  inning: 5, half: 'top', fetchedAt: new Date().toISOString(),
};
console.log('CONTINUOUS DEMO — icy-otter — mocked 1–1, top 5. Ctrl+C to stop.');
const started = performance.now();
const timer = setInterval(() => {
  state.fetchedAt = new Date().toISOString();
  const output = program.next(state, 'auto', .85, defaultLogo, performance.now() - started);
  transport.offer(output.frame);
  if (!output.sliding && screen !== output.screen) {
    screen = output.screen;
    console.log(`${screen} · ${delivered} frames delivered`);
  }
}, 1000 / 30);
const stop = (): void => {
  clearInterval(timer);
  transport.stop();
  console.log('Continuous demo stopped. The simulator holds the last frame.');
};
process.once('SIGINT', stop);
process.once('SIGTERM', stop);
