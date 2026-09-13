import express from 'express';
import { createServer } from 'vite';
import { validFrame } from './src/display';
const app=express();app.use(express.json({limit:'32kb'}));
const mlb=async(path:string):Promise<unknown>=>{const r=await fetch(`https://statsapi.mlb.com${path}`,{signal:AbortSignal.timeout(10000)});if(!r.ok)throw new Error(`MLB response ${r.status}`);return r.json();};
app.get('/api/games',async(req,res)=>{try{const date=String(req.query.date??new Date().toISOString().slice(0,10));if(!/^\d{4}-\d{2}-\d{2}$/.test(date))throw new Error('Invalid date');res.json(await mlb(`/api/v1/schedule?sportId=1&teamId=111&date=${date}`));}catch(e){res.status(502).json({error:String(e)});}});
app.get('/api/game/:id',async(req,res)=>{try{if(!/^\d+$/.test(req.params.id))throw new Error('Invalid game ID');res.json(await mlb(`/api/v1.1/game/${req.params.id}/feed/live`));}catch(e){res.status(502).json({error:String(e)});}});
app.post('/api/frame',async(req,res)=>{try{const {frame,endpoint}=req.body;if(!validFrame(frame))return void res.status(400).send('Invalid RGB frame');const url=new URL(endpoint);if(url.protocol!=='https:'||url.hostname!=='sundai.willsarg.com'||!/^\/api\/i\/[a-zA-Z0-9-]+\/frame$/.test(url.pathname))return void res.status(400).send('Use a sundai.willsarg.com instance frame endpoint');const r=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(frame),signal:AbortSignal.timeout(8000)});res.status(r.status).send(await r.text());}catch(e){res.status(502).send(String(e));}});
const vite=await createServer({server:{middlewareMode:true},appType:'spa'});app.use(vite.middlewares);app.listen(5173,'127.0.0.1',()=>console.log('Fenway Signal → http://localhost:5173'));
