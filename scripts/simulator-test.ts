import { DisplayProgram } from '../src/program';
import { FrameTransport } from '../src/transport';
import { defaultLogo, render, validFrame, type GameState } from '../src/display';

// Requires npm run dev. Uses mock game states, never presents these as live data.
const nativeFetch = globalThis.fetch;
const latencies: number[] = [];
let errors = 0;
globalThis.fetch = (async (input, init) => {
  const start = performance.now();
  const response = await nativeFetch(typeof input === 'string' && input.startsWith('/')
    ? `http://localhost:5173${input}` : input, init);
  latencies.push(performance.now() - start);
  if (!response.ok) errors++;
  return response;
}) as typeof fetch;
const transport = new FrameTransport();
transport.enabled = true;
transport.maxFps = 10;
transport.onStatus = (message): void => { if (message !== 'Frame delivered') console.error(message); };
const program = new DisplayProgram();
const state: GameState = { gameId: 'simulator-test', status: 'live', bostonScore: 1,
  opponentScore: 1, inning: 5, half: 'top', fetchedAt: new Date().toISOString() };
const start = performance.now();
let stage = '';
console.log('MOCK SIMULATOR TEST — icy-otter — 32 seconds');
try {
  while (performance.now() - start < 32000) {
    const elapsed = performance.now() - start;
    const nextStage = elapsed < 13000 ? 'normal loop' : elapsed < 20000 ? 'Boston scores'
      : elapsed < 23000 ? 'inning break' : elapsed < 28000 ? 'bottom half resumes' : 'final';
    if (nextStage !== stage) {
      stage = nextStage;
      console.log(`${Math.round(elapsed / 1000)}s: ${stage}`);
      if (stage === 'Boston scores') state.bostonScore = 2;
      if (stage === 'inning break') state.status = 'break';
      if (stage === 'bottom half resumes') Object.assign(state, { status: 'live', half: 'bottom' });
      if (stage === 'final') Object.assign(state, { status: 'final', inning: 9 });
    }
    state.fetchedAt = new Date().toISOString();
    const { frame } = program.next(state, 'auto', .85, defaultLogo, elapsed);
    if (!validFrame(frame)) throw new Error('Invalid animated frame');
    transport.offer(frame);
    await new Promise(resolve => setTimeout(resolve, 1000 / 30));
  }
} finally {
  transport.stop();
  // Allow the bounded in-flight request to finish before restoring the neutral logo.
  await new Promise(resolve => setTimeout(resolve, 10500));
  const response = await nativeFetch('http://localhost:5173/api/frame', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ endpoint: transport.endpoint, frame: render(null, 'logo', .85) }),
    signal: AbortSignal.timeout(12000),
  });
  if (!response.ok) throw new Error(`Could not restore logo: ${response.status}`);
  globalThis.fetch = nativeFetch;
}
latencies.sort((a, b) => a - b);
console.log(JSON.stringify({ requests: latencies.length, httpErrors: errors,
  medianMs: Math.round(latencies[Math.floor(latencies.length / 2)] ?? 0),
  p95Ms: Math.round(latencies[Math.floor(latencies.length * .95)] ?? 0),
  finalDisplay: 'Boston B logo; mock test stopped' }, null, 2));
