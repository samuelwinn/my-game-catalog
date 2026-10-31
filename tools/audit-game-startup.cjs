// Run against a separate headless Chrome with --remote-debugging-port=9228.
// No browser libraries or npm installation required (Node 22+).
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const zlib = require('node:zlib');
const root = path.resolve(__dirname, '..');
const endpoint = 'http://127.0.0.1:9228';
const wait = ms => new Promise(r => setTimeout(r, ms));
const inventory = JSON.parse(fs.readFileSync(path.join(__dirname, 'emulator-audit-inventory.json'), 'utf8'));
for(const game of JSON.parse(fs.readFileSync(path.join(root,'games-catalog.json'),'utf8')))if(!inventory.some(item=>item.html===game.html))inventory.push(game);
const mode = process.argv[2] || 'baseline';
const vm = require('node:vm');
const helpers = {};
vm.createContext(helpers);
vm.runInContext(fs.readFileSync(path.join(__dirname,'emulator-compatibility.js'),'utf8').replace(/installEmulatorCompatibility\(\);\s*$/,'')+'\n'+fs.readFileSync(path.join(__dirname,'prepare-emulator-document.js'),'utf8'),helpers);
const names = process.argv.slice(3);
const samples = names.length ? inventory.filter(g => names.includes(g.name)) : inventory.filter(g => ['Advance Wars', 'Bomberman', '7 Grand Dad', 'Ducktales', 'Banjo-Kazooie', 'Famidash'].includes(g.name));
const escape = s => s.replaceAll('&', '&amp;').replaceAll('"', '&quot;');
function gameSource(game) {
 const p = path.join(root, game.html);
 let source = (p.endsWith('.gz') ? zlib.gunzipSync(fs.readFileSync(p)) : fs.readFileSync(p)).toString('utf8');
 if(mode.startsWith('fixed')) {
  source = helpers.prepareEmulatorDocument(source);
 }
 return source;
}
const server = http.createServer((req, res) => {
 const url = new URL(req.url, 'http://localhost');
 const game = samples.find(g => g.name === url.searchParams.get('game'));
 res.setHeader('Content-Type', 'text/html; charset=utf-8');
 // Google Sites and HTML viewers can deny controllers to embedded pages.
 res.setHeader('Permissions-Policy', 'gamepad=()');
 if(!game) {res.end('Unknown test game');return;}
 const source = gameSource(game);
 const sandbox = game.name === 'Famidash' || mode==='fixed-open' ? '' : 'sandbox="allow-scripts allow-forms allow-modals allow-pointer-lock allow-downloads"';
 res.end('<!doctype html><html><body style="margin:0"><iframe style="border:0;width:100vw;height:100vh" '+sandbox+' allow="autoplay;fullscreen;gamepad" srcdoc="'+escape(source)+'"></iframe></body></html>');
});
class CDP {
 constructor(ws) {this.ws=ws;this.id=0;this.pending=new Map();this.handlers=[];ws.addEventListener('message',e=>{const m=JSON.parse(e.data);if(m.id){const p=this.pending.get(m.id);if(p){clearTimeout(p.timer);p.resolve(m);this.pending.delete(m.id)}}else for(const h of this.handlers)h(m)});}
 static async connect(url){const ws=new WebSocket(url);await new Promise((r,j)=>{ws.addEventListener('open',r,{once:true});ws.addEventListener('error',j,{once:true})});return new CDP(ws);}
 send(method,params={},sessionId) {return new Promise((resolve,reject)=>{const id=++this.id;const timer=setTimeout(()=>{this.pending.delete(id);reject(Error('Timed out: '+method))},20000);this.pending.set(id,{resolve,timer});this.ws.send(JSON.stringify({id,method,params,sessionId}))});}
 close(){this.ws.close();}
}
async function test(game, port) {
 const target = await (await fetch(endpoint+'/json/new?about:blank',{method:'PUT'})).json();
 const cdp = await CDP.connect(target.webSocketDebuggerUrl);
 const errors=[], network=[], contexts=new Map(), consoleMessages=[];
 let bytes=0;
 cdp.handlers.push(m=>{
  if(m.method==='Target.attachedToTarget'){
   cdp.send('Runtime.enable',{},m.params.sessionId).catch(()=>{});
   cdp.send('Network.enable',{},m.params.sessionId).catch(()=>{});
  }
  if(m.method==='Runtime.executionContextCreated')contexts.set((m.sessionId||'')+':'+m.params.context.id,{...m.params.context,sessionId:m.sessionId});
  if(m.method==='Runtime.executionContextDestroyed')contexts.delete((m.sessionId||'')+':'+m.params.executionContextId);
  if(m.method==='Runtime.exceptionThrown') {const d=m.params.exceptionDetails;errors.push(d.exception?.description || d.text);}
  if(m.method==='Runtime.consoleAPICalled'&&['error','warning'].includes(m.params.type))consoleMessages.push(m.params.args.map(a=>a.value||a.description).join(' ').slice(0,600));
  if(m.method==='Network.loadingFailed' && !m.params.canceled)network.push(m.params.errorText);
  if(m.method==='Network.responseReceived' && m.params.response.status>=400)network.push(m.params.response.status+' '+m.params.response.url);
  if(m.method==='Network.loadingFinished')bytes+=m.params.encodedDataLength||0;
 });
 const evaluate = async (expression, context) => {
  const result=await cdp.send('Runtime.evaluate',{expression,contextId:context.id,returnByValue:true,userGesture:true,awaitPromise:true},context.sessionId);
  return result.result?.result?.value;
 };
 try {
  await cdp.send('Target.setAutoAttach',{autoAttach:true,waitForDebuggerOnStart:false,flatten:true});
  await cdp.send('Runtime.enable');await cdp.send('Network.enable');await cdp.send('Page.enable');
  await cdp.send('Page.bringToFront');
  await cdp.send('Page.navigate',{url:'http://127.0.0.1:'+port+'/?game='+encodeURIComponent(game.name)});
  await wait(1800);
  const tree=(await cdp.send('Page.getFrameTree')).result.frameTree;
  const frame=tree.childFrames?.[0]?.frame;
  let context=[...contexts.values()].find(x=>x.auxData?.frameId===frame?.id&&x.auxData?.isDefault);
  if(!context)context=[...contexts.values()].find(x=>x.sessionId&&x.auxData?.isDefault);
  if(!context)throw Error('Missing child execution context: '+JSON.stringify([...contexts.values()]));
  const clicked=await evaluate(`(()=>{const b=document.querySelector('#startButton, #start-button');if(b){b.click();return b.textContent}return null})()`,context);
  await wait(Number(process.env.GAME_AUDIT_WAIT_MS||18000));
  // Some EmulatorJS builds show a second built-in start button.
  await evaluate(`(()=>{const b=document.querySelector('.ejs_start_button');if(b)b.click()})()`,context);
  await wait(2500);
  await cdp.send('Page.bringToFront');
  await evaluate(`document.querySelector('#game')?.focus()`,context);
  await cdp.send('Input.dispatchMouseEvent',{type:'mousePressed',x:380,y:240,button:'left',clickCount:1});
  await cdp.send('Input.dispatchMouseEvent',{type:'mouseReleased',x:380,y:240,button:'left',clickCount:1});
  await cdp.send('Input.dispatchKeyEvent',{type:'keyDown',key:'Enter',code:'Enter',windowsVirtualKeyCode:13});
  await wait(100);
  await cdp.send('Input.dispatchKeyEvent',{type:'keyUp',key:'Enter',code:'Enter',windowsVirtualKeyCode:13});
  // Give the foreground tab enough time to advance through console boot screens.
  await wait(6000);
  const state=await evaluate(`(()=>{const c=document.querySelector('canvas');const r=c?.getBoundingClientRect();let emulator;try{emulator=window.EJS_emulator}catch{}return {text:document.body.innerText.slice(0,700),emulator:typeof emulator,started:emulator?.started,core:window.EJS_core,canvas:c?{width:c.width,height:c.height,visibleWidth:r.width,visibleHeight:r.height}:null,gameDisplay:document.querySelector('#game')?getComputedStyle(document.querySelector('#game')).display:null,storage:(()=>{try{return typeof localStorage}catch(e){return e.name}})()}})()`,context);
  const result={name:game.name,mode,clicked,state,errors:[...new Set(errors)],network:[...new Set(network)],consoleMessages:[...new Set(consoleMessages)],bytes};
  if(state?.canvas?.visibleWidth>0){
   const shot=await cdp.send('Page.captureScreenshot',{format:'png'});
   const dir=path.join(root,'.tmp-game-audit');fs.mkdirSync(dir,{recursive:true});
   fs.writeFileSync(path.join(dir,game.name.replace(/[^a-z0-9]+/gi,'-')+'-'+mode+'.png'),Buffer.from(shot.result.data,'base64'));
  }
  return result;
 }catch(error){return {name:game.name,mode,error:String(error),errors,network,bytes};}
 finally {if(!process.env.GAME_AUDIT_KEEP)await fetch(endpoint+'/json/close/'+target.id).catch(()=>{});cdp.close();}
}
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const port=server.address().port;const results=[];let next=0;
 await Promise.all(Array.from({length:Math.min(Number(process.env.GAME_AUDIT_CONCURRENCY||3),samples.length)},async()=>{while(next<samples.length){const game=samples[next++];const result=await test(game,port);results.push(result);console.log(JSON.stringify(result));}}));
 const output=path.join(__dirname,'game-startup-audit-'+mode+'.json');
 const previous=fs.existsSync(output)?JSON.parse(fs.readFileSync(output,'utf8')).results:[];
 const merged=[...previous.filter(old=>!results.some(result=>result.name===old.name)),...results];
 fs.writeFileSync(output,JSON.stringify({mode,runAt:new Date().toISOString(),results:merged},null,2)+'\n');
 server.close();
})().catch(e=>{console.error(e);server.close();process.exitCode=1});
