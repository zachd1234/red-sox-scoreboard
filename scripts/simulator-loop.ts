import { DisplayProgram } from '../src/program';
import { FrameTransport } from '../src/transport';
import { defaultLogo } from '../src/display';
import { demoState } from '../src/demo';

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
console.log('CONTINUOUS DEMO — icy-otter — nine-inning mock game, repeats every ~5 minutes.');
const started = performance.now();
const timer = setInterval(() => {
  const state = demoState(performance.now() - started);
  const output = program.next(state, 'auto', .85, defaultLogo, performance.now() - started);
  transport.offer(output.frame);
  if (!output.sliding && screen !== output.screen) {
    screen = output.screen;
    console.log(`${screen} · ${state.half} ${state.inning} · BOS ${state.bostonScore}–${state.opponentScore} OPP · ${delivered} frames delivered`);
  }
}, 1000 / 30);
const stop = (): void => {
  clearInterval(timer);
  transport.stop();
  console.log('Continuous demo stopped. The simulator holds the last frame.');
};
process.once('SIGINT', stop);
process.once('SIGTERM', stop);
