export type RGB = [number, number, number];
export type Frame = RGB[][];
export type GameState = { gameId: string; status: 'pregame'|'live'|'break'|'delayed'|'suspended'|'final'; bostonScore: number; opponentScore: number; inning: number|null; half: 'top'|'bottom'|null; fetchedAt: string; revision?: string };
export const red: RGB = [255,40,60];
export const amber: RGB = [255, 190, 65];
export const white: RGB = [235,245,255];
export const digits = ['111/101/101/101/111','010/110/010/010/111','111/001/111/100/111','111/001/111/001/111','101/101/111/001/001','111/100/111/001/111','111/100/111/101/111','111/001/010/010/010','111/101/111/101/111','111/101/111/001/111'].map(x=>x.split('/'));
// Boston B: hooked left serifs, two open counters, and pointed outer lobes.
// At nine columns, black negative space preserves the silhouette better than an outline.
export const defaultLogo = [
  '011111100',
  '111111110',
  '111100110',
  '001100110',
  '001100111',
  '001100110',
  '001100110',
  '001111100',
  '011111000',
  '001111100',
  '001100110',
  '001100110',
  '001100111',
  '001100110',
  '111100110',
  '111111110',
  '011111100',
];
export const blank = (): Frame => Array.from({length:17},()=>Array.from({length:9},():RGB=>[0,0,0]));
export const validFrame = (f: unknown): f is Frame => Array.isArray(f)&&f.length===17&&f.every(r=>Array.isArray(r)&&r.length===9&&r.every(p=>Array.isArray(p)&&p.length===3&&p.every(c=>Number.isInteger(c)&&c>=0&&c<=255)));
export const validLogo = (mask: string[]): boolean => mask.length===17&&mask.every(r=>/^[012]{9}$/.test(r));
export const supported = (s: GameState): boolean => [s.bostonScore,s.opponentScore].every(n=>Number.isInteger(n)&&n>=0&&n<=99)&&(s.inning===null||Number.isInteger(s.inning)&&s.inning>=1&&s.inning<=99)&&(!['live','final'].includes(s.status)||s.inning!==null)&& (s.status!=='live'||s.half!==null);
export const render = (s: GameState|null, mode='auto', brightness=1, mask=defaultLogo, now=Date.now()): Frame => {
  const f=blank();
  const draw=(rows:string[],x:number,y:number,color:RGB):void=>{ rows.forEach((r,dy)=>[...r].forEach((v,dx)=>{if(v==='1'&&f[y+dy]?.[x+dx]) f[y+dy][x+dx]=[...color];})); };
  const number=(n:number,y:number,c:RGB,x?:number):void=>{const text=String(n);const left=x??Math.floor((9-(text.length*4-1))/2);[...text].forEach((v,i)=>draw(digits[+v],left+i*4,y,c));};
  if(mode==='calibration'){ f[0][0]=[255,0,0];f[0][8]=[0,255,0];f[16][0]=[0,0,255];f[16][8]=[255,255,255]; }
  else if(mode==='logo'||!s||!supported(s)||now-Date.parse(s.fetchedAt)>60000||!['live','final'].includes(s.status)){
    if(!validLogo(mask)) throw new Error('Logo must contain 17 rows of 9 palette indices.');
    mask.forEach((r,y)=>[...r].forEach((v,x)=>{f[y][x]=v==='1'?[...red]:v==='2'?[...white]:[0,0,0];}));
  } else {
    const overflow=s.bostonScore>=10||s.opponentScore>=10;const inning=s.inning!;
    if (overflow) {
      number(s.bostonScore, 0, red);
      number(s.opponentScore, 6, amber);
    } else {
      number(s.bostonScore, 2, red, 0);
      f[4][4] = [...white];
      number(s.opponentScore, 2, amber, 6);
    }
    const inningRow = overflow ? 12 : 9;
    const hasArrow = s.status !== 'final' && s.half !== null;
    number(inning, inningRow, white, hasArrow ? (inning < 10 ? 1 : 0) : undefined);
    if (hasArrow) {
      if (inning < 10) {
        const arrow = s.half === 'top' ? ['010', '111', '111'] : ['111', '111', '010'];
        draw(arrow, 5, inningRow + 1, white);
      } else {
        // Seven digit columns, one blank column, then the half indicator.
        f[inningRow + (s.half === 'top' ? 0 : 4)][8] = [...white];
      }
    }
  }
  const gain=Number.isFinite(brightness)?Math.max(0,Math.min(1,brightness)):1;
  return f.map(r=>r.map(p=>p.map(c=>Math.round(c*gain)) as RGB));
};
export const acceptState = (previous: GameState|null,next:GameState): boolean => !previous||previous.gameId!==next.gameId|| (!(previous.status==='final'&&next.status!=='final') && (next.revision??next.fetchedAt)>=(previous.revision??previous.fetchedAt));
