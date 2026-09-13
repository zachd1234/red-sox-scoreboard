import { red, render, supported, type Frame, type GameState } from './display';

export type Screen = 'logo' | 'score' | 'celebration' | 'calibration';
export const slideMs = 240;
const holds = { logo: 2000, score: 7000 };
const celebrationMs = 1800;

export const slide = (from: Frame, to: Frame, progress: number): Frame => {
  const offset = Math.max(0, Math.min(9, Math.floor(progress * 9)));
  return from.map((row, y) => row.map((_, x) => [...(x + offset < 9
    ? row[x + offset] : to[y][x + offset - 9])]));
};

export class DisplayProgram {
  private previous: GameState | null = null;
  private highScore = 0;
  private start = 0;
  private celebrateAt: number | null = null;
  private afterCelebration = false;
  private wasActive = false;

  reset(): void {
    this.previous = null;
    this.celebrateAt = null;
    this.wasActive = false;
    this.afterCelebration = false;
  }

  next(s: GameState, mode: string, brightness: number, mask: string[], now: number,
    wallTime = Date.now()): { frame: Frame; screen: Screen; sliding: boolean } {
    const fresh = Number.isFinite(Date.parse(s.fetchedAt)) && wallTime - Date.parse(s.fetchedAt) <= 60000;
    const active = mode === 'auto' && supported(s) && fresh && s.status === 'live';
    const sameGame = this.previous?.gameId === s.gameId;
    if (!sameGame) { this.reset(); this.highScore = s.bostonScore; }
    const scored = sameGame && this.wasActive && supported(s) && fresh &&
      mode === 'auto' && ['live', 'final'].includes(s.status) && s.bostonScore > this.highScore;
    this.highScore = Math.max(this.highScore, s.bostonScore);
    if (active && !this.wasActive) { this.start = now; this.afterCelebration = false; }
    if (scored) { this.celebrateAt = now; this.start = now + celebrationMs; this.afterCelebration = true; }
    this.previous = { ...s };
    this.wasActive = active;
    if (mode !== 'auto' || !fresh || !supported(s) || !['live', 'final'].includes(s.status)) {
      this.celebrateAt = null;
      return { frame: render(s, mode, brightness, mask, wallTime),
        screen: mode === 'calibration' ? 'calibration' : 'logo', sliding: false };
    }
    const screenFrame = (screen: Screen): Frame => render(s, screen === 'logo' || screen === 'celebration' ? 'logo' : 'auto', 1, mask, wallTime);
    const finish = (frame: Frame, screen: Screen, sliding = false): {frame: Frame; screen: Screen; sliding: boolean} => {
      const gain = Number.isFinite(brightness) ? Math.max(0, Math.min(1, brightness)) : 1;
      return { frame: frame.map(row => row.map(pixel => pixel.map(c => Math.round(c * gain)) as [number, number, number])), screen, sliding };
    };
    if (this.celebrateAt !== null && now - this.celebrateAt < celebrationMs) {
      const frame = screenFrame('celebration');
      // Red streamers travel along the edges without flashing the whole display.
      const step = Math.floor((now - this.celebrateAt) / 90);
      for (const x of [0, 8]) for (let y = 0; y < 17; y++) {
        if ((y + step + x) % 7 < 2) frame[y][x] = [...red];
      }
      return finish(frame, 'celebration');
    }
    this.celebrateAt = null;
    if (s.status === 'final') return finish(screenFrame('score'), 'score');
    let elapsed = Math.max(0, now - this.start);
    const order: Array<'logo' | 'score'> = this.afterCelebration
      ? ['score', 'logo'] : ['logo', 'score'];
    elapsed %= holds.logo + holds.score + slideMs * order.length;
    for (let i = 0; i < order.length; i++) {
      const screen = order[i];
      if (elapsed < holds[screen]) return finish(screenFrame(screen), screen);
      elapsed -= holds[screen];
      const next = order[(i + 1) % order.length];
      if (elapsed < slideMs) return finish(slide(screenFrame(screen), screenFrame(next), elapsed / slideMs), next, true);
      elapsed -= slideMs;
    }
    return finish(screenFrame('logo'), 'logo');
  }
}
