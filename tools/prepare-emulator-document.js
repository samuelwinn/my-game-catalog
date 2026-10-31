// Keep this function and installEmulatorCompatibility in sync with the embed files.
function prepareEmulatorDocument(html,game) {
 // The supplied Eaglercraft client also polls getGamepads during initialization.
 if(!/\bEJS_player\s*=/.test(html)&&game?.html!=='games/Minecraft 1.8.8 (EaglecraftX).html')return html;
 // Old source trees no longer deliver a complete, consistent emulator runtime.
 // Change only the runtime URLs; retain each game's ROM, BIOS and core settings.
 html=html.replace(/https:\/\/cdn\.jsdelivr\.net\/gh\/(?:genizy\/emu@master\/|EmulatorJS\/EmulatorJS@main\/data\/?|a456pur\/seraph@81f551ca0aa8e3d6018d32d8ac5904ac9bc78f76\/storage\/emulatorjs\/data\/?)/g,'https://cdn.jsdelivr.net/gh/bubbls/brogoofyahhmangogotonablacklistskullwiltingrose@7bf5cbb0b94866568d2aaa1fd42ebb5acd517e0d/');
 // Also repair cached copies of this game's file: jsDelivr rejects its ROM URL.
 html=html.replace('https://cdn.jsdelivr.net/gh/Stinkalistic/junk@main/grimacebday%20v.1.7.gb','https://raw.githubusercontent.com/Stinkalistic/junk/main/grimacebday%20v.1.7.gb');
 // Old Google Sites exports call a parent API that does not exist in srcdoc.
 html=html.replace(/<script\b[^>]*>\s*window\.parent\.maeExportApis_\(\);?\s*<\/script\s*>/gi,'');
 html=html.replace(/\bwindow\.parent\.maeExportApis_\(\);?/g,'');
 const boot='<script>('+installEmulatorCompatibility.toString()+')();<\/script>';
 return /<head\b[^>]*>/i.test(html)?html.replace(/<head\b[^>]*>/i,head=>head+boot):boot+html;
}
