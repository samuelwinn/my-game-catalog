// Inject before EmulatorJS scripts in srcdoc games. Keep the game iframe sandboxed.
function installEmulatorCompatibility() {
 'use strict';
 function memoryStorage() {
  const values = new Map();
  const storage = {
   getItem(key) {key=String(key);return values.has(key)?values.get(key):null},
   setItem(key,value) {values.set(String(key),String(value))},
   removeItem(key) {values.delete(String(key))},
   clear() {values.clear()},
   key(index) {return Array.from(values.keys())[index]??null},
   get length() {return values.size}
  };
  return new Proxy(storage, {
   get(target,key) {return key in target?Reflect.get(target,key):values.get(String(key))},
   set(target,key,value) {values.set(String(key),String(value));return true},
   deleteProperty(target,key) {values.delete(String(key));return true},
   ownKeys() {return [...values.keys()]},
   getOwnPropertyDescriptor(target,key) {if(values.has(String(key)))return {enumerable:true,configurable:true,value:values.get(String(key)),writable:true}}
  });
 }
 for(const name of ['localStorage','sessionStorage']) {
  try {
   const storage=window[name],key='__liqua_emulator_probe__';
   storage.setItem(key,'1');storage.removeItem(key);
  } catch(error) {
   try {Object.defineProperty(window,name,{configurable:true,value:memoryStorage()})} catch(ignored) {}
  }
 }
 // EmulatorJS already supports unavailable IndexedDB. An opaque sandbox origin
 // throws on access, so expose the same unavailable state instead of crashing.
 try {
  if(window.indexedDB) {
   const probe=window.indexedDB.open('__liqua_emulator_probe__');
   probe.onsuccess=function(){probe.result.close()};
  }
 } catch(error) {
  try {Object.defineProperty(window,'indexedDB',{configurable:true,value:undefined})} catch(ignored) {}
  window.EJS_disableDatabases=true;
 }
 if(typeof navigator.getGamepads==='function') {
  const getGamepads=navigator.getGamepads.bind(navigator);
  try {Object.defineProperty(navigator,'getGamepads',{configurable:true,value:function(){
   try {return getGamepads()} catch(error) {if(error.name==='SecurityError')return [];throw error}
  }})} catch(ignored) {}
 }
}
installEmulatorCompatibility();
