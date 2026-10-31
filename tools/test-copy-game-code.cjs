// Browser regression check. Run with Node 22+ and separate Chrome on CDP port 9228.
const fs=require('node:fs');
const http=require('node:http');
const path=require('node:path');
const zlib=require('node:zlib');
const assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const endpoint='http://127.0.0.1:9228';
const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const source=fs.readFileSync(path.join(root,'GOOGLE-SITES-EMBED.html'),'utf8');
const server=http.createServer((req,res)=>{res.setHeader('Content-Type','text/html; charset=utf-8');res.end(source)});
class CDP {
 constructor(ws){this.ws=ws;this.id=0;this.pending=new Map();ws.addEventListener('message',event=>{const msg=JSON.parse(event.data);if(msg.id){const pending=this.pending.get(msg.id);if(pending){clearTimeout(pending.timer);this.pending.delete(msg.id);pending.resolve(msg)}}});}
 static async connect(url){const ws=new WebSocket(url);await new Promise((resolve,reject)=>{ws.addEventListener('open',resolve,{once:true});ws.addEventListener('error',reject,{once:true})});return new CDP(ws);}
 send(method,params={}){return new Promise((resolve,reject)=>{const id=++this.id;const timer=setTimeout(()=>{this.pending.delete(id);reject(Error('Timed out: '+method))},15000);this.pending.set(id,{resolve,timer});this.ws.send(JSON.stringify({id,method,params}))});}
 async evaluate(expression){const response=await this.send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true,userGesture:true});if(response.error||response.result?.exceptionDetails)throw Error(JSON.stringify(response));return response.result?.result?.value;}
}
(async()=>{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const origin='http://127.0.0.1:'+server.address().port;
 const target=await(await fetch(endpoint+'/json/new?about:blank',{method:'PUT'})).json();
 const cdp=await CDP.connect(target.webSocketDebuggerUrl);
 try{
  await cdp.send('Runtime.enable');await cdp.send('Page.bringToFront');
  const permissions=await cdp.send('Browser.grantPermissions',{origin,permissions:['clipboardReadWrite','clipboardSanitizedWrite']});
  assert.ok(!permissions.error,JSON.stringify(permissions));
  await cdp.send('Page.navigate',{url:origin});
  for(let i=0;i<50;i++){if(await cdp.evaluate("!!document.getElementById('copy')"))break;await pause(50)}
  assert.equal(await cdp.evaluate("document.getElementById('copy').disabled"),true);
  assert.equal(await cdp.evaluate("getComputedStyle(document.querySelector('.viewbar')).backgroundColor"),'rgb(0, 0, 0)');
  assert.deepEqual(await cdp.evaluate("[...document.querySelectorAll('.viewbar button')].map(button=>button.id)"),['retry','copy','blank','close']);
  const first='<!doctype html><html><head><title>Game A</title></head><body>Unique game A code</body></html>';
  const second='<!doctype html><html><head><title>Game B</title></head><body>Unique game B code</body></html>';
  const compressed='<!doctype html><html><head><title>Game C</title></head><body>Decompressed game C code</body></html>';
  const encoded=zlib.gzipSync(compressed).toString('base64');
  await cdp.evaluate(`window.realFetch=window.fetch;window.fetch=async function(input,options){const url=String(input);if(url.includes('clipboard-fixture-c.html.gz'))return new Response(Uint8Array.from(atob(${JSON.stringify(encoded)}),c=>c.charCodeAt(0)));if(url.includes('clipboard-fixture-a.html'))return new Response(${JSON.stringify(first)});if(url.includes('clipboard-fixture-b.html'))return new Response(${JSON.stringify(second)});return realFetch(input,options)}`);
  const open=async(name,compressed=false)=>{
   await cdp.evaluate('openGame('+JSON.stringify({name,html:'games/clipboard-fixture-'+name+'.html'+(compressed?'.gz':''),compressed})+')');
   assert.equal(await cdp.evaluate('els.copy.disabled'),false);
   return cdp.evaluate('els.frame.srcdoc');
  };
  const clickCopy=async()=>{
   const point=await cdp.evaluate('(()=>{const r=els.copy.getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2}})()');
   await cdp.send('Input.dispatchMouseEvent',{type:'mousePressed',...point,button:'left',clickCount:1});
   await cdp.send('Input.dispatchMouseEvent',{type:'mouseReleased',...point,button:'left',clickCount:1});
  };
  const expectCopy=async expected=>{
   await clickCopy();
   for(let i=0;i<50;i++){if(await cdp.evaluate('els.copy.textContent')==='Copied!')break;await pause(30)}
   assert.equal(await cdp.evaluate('els.copy.textContent'),'Copied!');
   assert.equal(await cdp.evaluate('navigator.clipboard.readText()'),expected);
  };
  const firstLoaded=await open('a');assert.ok(firstLoaded.includes('Unique game A code'));await expectCopy(firstLoaded);
  const secondLoaded=await open('b');assert.ok(secondLoaded.includes('Unique game B code'));assert.notEqual(secondLoaded,firstLoaded);await expectCopy(secondLoaded);
  const gzipLoaded=await open('c',true);assert.ok(gzipLoaded.includes('Decompressed game C code'));await expectCopy(gzipLoaded);
  // An embed may reject the async Clipboard API; the selection fallback must work.
  await cdp.evaluate("Object.defineProperty(navigator.clipboard,'writeText',{configurable:true,value:async()=>{throw new DOMException('Blocked by embed','NotAllowedError')}})");
  const fallbackLoaded=await open('a');await expectCopy(fallbackLoaded);
  // A pending old copy must not change feedback for a newly selected game.
  await cdp.evaluate("Object.defineProperty(navigator.clipboard,'writeText',{configurable:true,value:()=>new Promise(resolve=>window.resolveOldCopy=resolve)})");
  await clickCopy();assert.equal(await cdp.evaluate('els.copy.disabled'),true);
  await open('b');await cdp.evaluate('resolveOldCopy()');await pause(50);
  assert.equal(await cdp.evaluate('els.copy.textContent'),'Copy code');
  assert.equal(await cdp.evaluate('els.copy.disabled'),false);
  // Starting a slow game clears the previous game's copy payload immediately.
  await cdp.evaluate("window.fixtureFetch=window.fetch;window.fetch=(input,options)=>String(input).includes('clipboard-fixture-slow')?new Promise(resolve=>window.resolveSlow=()=>resolve(new Response('<html><body>Slow game</body></html>'))):fixtureFetch(input,options);window.slowOpen=openGame({name:'slow',html:'games/clipboard-fixture-slow.html'});undefined");
  assert.equal(await cdp.evaluate('els.copy.disabled'),true);
  assert.equal(await cdp.evaluate('currentGameCode'),'');
  await open('a');await cdp.evaluate('resolveSlow();slowOpen');
  assert.ok((await cdp.evaluate('currentGameCode')).includes('Unique game A code'));
  await cdp.send('Emulation.setDeviceMetricsOverride',{width:375,height:700,deviceScaleFactor:1,mobile:true});
  assert.equal(await cdp.evaluate('(()=>{const bar=document.querySelector(".viewbar");return bar.scrollWidth<=bar.clientWidth})()'),true);
  await cdp.evaluate('closeGame()');assert.equal(await cdp.evaluate('els.copy.disabled'),true);
  console.log('PASS: button order, black bar, actual clipboard writes, game switching, gzip, clipboard fallback, async races, close state and mobile width.');
 }finally{
  await fetch(endpoint+'/json/close/'+target.id).catch(()=>{});cdp.ws.close();server.close();
 }
})().catch(error=>{console.error(error);server.close();process.exitCode=1});
