import {test} from 'node:test';
import assert from 'node:assert/strict';
import {FrameTransport} from '../src/transport';
import {blank,type Frame} from '../src/display';
test('slow transport sends first and newest only, with one request in flight',async()=>{
 const original=globalThis.fetch;const sent:Frame[]=[];const releases:Array<()=>void>=[];let active=0,maxActive=0;
 globalThis.fetch=(async(_url,init)=>{sent.push(JSON.parse(String(init?.body)).frame);active++;maxActive=Math.max(active,maxActive);await new Promise<void>(r=>releases.push(r));active--;return new Response(null,{status:204});}) as typeof fetch;
 const transport=new FrameTransport();transport.enabled=true;transport.maxFps=30;
 try{const first=blank(),middle=blank(),last=blank();middle[0][0]=[1,0,0];last[0][0]=[2,0,0];transport.offer(first);transport.offer(middle);transport.offer(last);assert.equal(sent.length,1);releases.shift()!();await new Promise(r=>setTimeout(r,70));assert.equal(sent.length,2);assert.deepEqual(sent[1],last);assert.equal(maxActive,1);releases.shift()!();await new Promise(r=>setTimeout(r,50));transport.offer(last);assert.equal(sent.length,2);}finally{transport.stop();globalThis.fetch=original;}
});
