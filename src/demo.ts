import type { GameState } from './display';

type DemoEvent = { at: number; state: Omit<GameState, 'gameId' | 'fetchedAt'> };
const opponentRuns = [0, 1, 0, 1, 0, 0, 2, 0, 1];
const bostonRuns = [1, 0, 2, 0, 0, 1, 0, 0, 2];
export const demoEvents: DemoEvent[] = [];
let bostonScore = 0;
let opponentScore = 0;
for (let inning = 1; inning <= 9; inning++) {
  for (const half of ['top', 'bottom'] as const) {
    const at = ((inning - 1) * 2 + (half === 'bottom' ? 1 : 0)) * 17000;
    const snapshot = (status: GameState['status']): DemoEvent['state'] => ({
      status, bostonScore, opponentScore, inning, half,
    });
    demoEvents.push({ at, state: snapshot('live') });
    if (half === 'top') opponentScore += opponentRuns[inning - 1];
    else bostonScore += bostonRuns[inning - 1];
    const walkOff = inning === 9 && half === 'bottom';
    demoEvents.push({ at: at + 4000, state: snapshot(walkOff ? 'final' : 'live') });
    if (!walkOff) demoEvents.push({ at: at + 14000, state: snapshot('break') });
  }
}
export const demoDurationMs = demoEvents[demoEvents.length - 1].at + 12000;

export const demoState = (elapsed: number, wallTime = Date.now()): GameState => {
  const time = Math.max(0, elapsed);
  const cycle = Math.floor(time / demoDurationMs);
  const offset = time % demoDurationMs;
  const event = [...demoEvents].reverse().find(item => item.at <= offset)!;
  return { ...event.state, gameId: `demo-game-${cycle}`, fetchedAt: new Date(wallTime).toISOString() };
};

export class DemoPlayback {
  private elapsed = 0;
  private last: number | null = null;
  playing = true;

  restart(): void { this.elapsed = 0; this.last = null; this.playing = true; }
  pause(): void { this.playing = false; }
  resume(): void { this.last = null; this.playing = true; }
  next(now: number): GameState {
    if (this.playing && this.last !== null) this.elapsed += Math.max(0, now - this.last);
    this.last = now;
    return demoState(this.elapsed);
  }
}
