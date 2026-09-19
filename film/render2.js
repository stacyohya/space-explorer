// Renders film.html frame by frame through headless Chrome (CDP) into frames/*.jpg
const { spawn } = require('child_process'); const fs = require('fs'); const path = require('path'); const http = require('http');
const CH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const dir = __dirname, out = path.join(dir, process.env.OUT||'frames'); fs.mkdirSync(out, { recursive: true });
const FPS = +process.env.FPS || 30, DUR = +process.env.DUR || 20, PORT = 9333;
const chrome = spawn(CH, ['--headless=new','--no-sandbox','--disable-gpu-sandbox','--use-gl=angle','--use-angle=swiftshader-webgl','--enable-unsafe-swiftshader',
  '--window-size='+(process.env.SIZE||'1280,720'),'--remote-debugging-port='+PORT,'--user-data-dir='+path.join(process.env.TMPDIR||'/tmp','chrome-film'),'about:blank'], { stdio: 'ignore' });
const sleep = ms => new Promise(r => setTimeout(r, ms));
function getJSON(url){ return new Promise((res,rej)=>http.get(url,r=>{let s='';r.on('data',d=>s+=d);r.on('end',()=>{try{res(JSON.parse(s));}catch(e){rej(e);}});}).on('error',rej)); }
(async () => {
  let targets; for (let i=0;i<40;i++){ try { targets = await getJSON(`http://127.0.0.1:${PORT}/json/list`); if (targets.length) break; } catch(e){} await sleep(500); }
  const ws = new WebSocket(targets.find(t=>t.type==='page').webSocketDebuggerUrl);
  let id=0; const waits={};
  const send=(method,params)=>new Promise((res,rej)=>{const i=++id; waits[i]={res,rej}; ws.send(JSON.stringify({id:i,method,params}));});
  ws.onmessage=e=>{const m=JSON.parse(e.data); if(m.id&&waits[m.id]){ m.error?waits[m.id].rej(new Error(JSON.stringify(m.error))):waits[m.id].res(m.result); delete waits[m.id]; }};
  await new Promise(r=>ws.onopen=r);
  await send('Page.enable'); await send('Runtime.enable');
  await send('Page.navigate',{url:'file://'+path.join(dir,process.env.PAGE||'film.html')});
  for (let i=0;i<120;i++){ const r=await send('Runtime.evaluate',{expression:'!!window.__ready',returnByValue:true}); if(r.result.value) break; await sleep(500); }
  await sleep(1500);
  const N=Math.round(FPS*DUR); const t0=Date.now();
  for (let f=0; f<N; f++){
    const t=f/FPS;
    const r=await send('Runtime.evaluate',{expression:`window.captureFrame(${t})`,returnByValue:true});
    fs.writeFileSync(path.join(out,`f${String(f).padStart(5,'0')}.jpg`), Buffer.from(r.result.value.split(',')[1],'base64'));
    if (f%30===0) process.stdout.write(`\r${f}/${N} frames  ${((Date.now()-t0)/1000).toFixed(0)}s`);
  }
  console.log(`\ndone ${N} frames`);
  ws.close(); chrome.kill();
})().catch(e=>{ console.error(e); chrome.kill(); process.exit(1); });
