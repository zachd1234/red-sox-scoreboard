import type { Frame } from './display';
export class FrameTransport {
  private pending: Frame|null=null;
  private busy=false;
  private timer: ReturnType<typeof setTimeout>|undefined;
  private failures=0;
  private last='';
  enabled=false;
  endpoint='https://sundai.willsarg.com/api/i/icy-otter/frame';
  maxFps=10;
  onStatus: (message:string)=>void=()=>{};
  offer(frame:Frame):void { const key=JSON.stringify(frame);if(!this.enabled||key===this.last)return;this.last=key;this.pending=frame;void this.flush(); }
  stop():void {this.enabled=false;this.pending=null;this.last='';clearTimeout(this.timer);if(this.timer)this.busy=false;this.timer=undefined;}
  private async flush():Promise<void>{
    if(this.busy||!this.enabled||!this.pending)return;
    this.busy=true;const frame=this.pending;this.pending=null;
    try{const response=await fetch('/api/frame',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({endpoint:this.endpoint,frame}),signal:AbortSignal.timeout(10000)});if(!response.ok)throw new Error(await response.text());this.failures=0;this.onStatus('Frame delivered');}
    catch(error){this.failures++;this.pending??=frame;this.onStatus(`Retrying · ${error instanceof Error?error.message:'Transport error'}`);}
    this.timer=setTimeout(()=>{this.timer=undefined;this.busy=false;void this.flush();},this.failures?Math.min(1000*2**(this.failures-1),30000):1000/this.maxFps);
  }
}
