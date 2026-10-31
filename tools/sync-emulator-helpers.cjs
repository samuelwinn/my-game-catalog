// Regenerate the shared inline helpers after editing their source files.
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const shim=fs.readFileSync(path.join(__dirname,'emulator-compatibility.js'),'utf8').replace(/installEmulatorCompatibility\(\);\s*$/,'').trim();
const prepare=fs.readFileSync(path.join(__dirname,'prepare-emulator-document.js'),'utf8').trim();
const helpers=shim+'\n'+prepare+'\n\n';
for(const file of ['index.html','GOOGLE-SITES-EMBED.html','GOOGLE-SITES-EMBED.txt']){
 const target=path.join(root,file),html=fs.readFileSync(target,'utf8');
 const marker=/\/\/ Inject before EmulatorJS scripts[\s\S]*?(?=async function decompressGzip)/;
 if(!marker.test(html))throw Error('Missing helper block in '+file);
 const updated=html.replace(marker,helpers);
 for(const script of updated.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi))new Function(script[1]);
 fs.writeFileSync(target,updated);
}
console.log('Updated all three inline emulator helper blocks.');
