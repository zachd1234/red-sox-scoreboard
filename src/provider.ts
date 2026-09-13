import type { GameState } from './display';
type Feed = {metaData:{timeStamp:string};gameData:{game:{pk:number};teams:{home:{id:number};away:{id:number}};status:{abstractGameState:string;detailedState:string}};liveData:{linescore:{currentInning?:number;inningState?:string;isTopInning?:boolean;teams:{home:{runs?:number};away:{runs?:number}}}}};
export const normalize=(data:Feed):GameState=>{
 const g=data.gameData,l=data.liveData.linescore;const bostonHome=g.teams.home.id===111;
 if(!bostonHome&&g.teams.away.id!==111)throw new Error('Selected game does not include Boston');
 const detail=g.status.detailedState.toLowerCase();
 const status:GameState['status']=g.status.abstractGameState==='Final'?'final':detail.includes('suspend')?'suspended':/delay|postpon|cancel/.test(detail)?'delayed':g.status.abstractGameState==='Preview'?'pregame':['Middle','End'].includes(l.inningState??'')?'break':'live';
 return {gameId:String(g.game.pk),status,bostonScore:(bostonHome?l.teams.home:l.teams.away).runs??0,opponentScore:(bostonHome?l.teams.away:l.teams.home).runs??0,inning:l.currentInning??null,half:l.isTopInning===undefined?null:l.isTopInning?'top':'bottom',fetchedAt:new Date().toISOString(),revision:data.metaData.timeStamp};
};
