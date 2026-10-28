#!/usr/bin/env python3
"""Rebuild games-catalog.json from games/ on any machine with Python 3.8+."""
import json,pathlib
root=pathlib.Path(__file__).resolve().parents[1]
folder=root/'games'
path=root/'games-catalog.json'
old=json.loads(path.read_text(encoding='utf8')) if path.exists() else []
by_path={x['html']:x for x in old if isinstance(x,dict) and 'html' in x}
items=[]
for p in sorted(folder.iterdir(),key=lambda p:p.name.casefold()):
    if not p.is_file() or not (p.name.lower().endswith('.html') or p.name.lower().endswith('.html.gz')):continue
    rel='games/'+p.name
    name=p.name[:-8] if p.name.lower().endswith('.html.gz') else p.name[:-5]
    item=dict(by_path.get(rel,{}))
    item['name']=item.get('name',name)
    item['html']=rel
    if p.name.lower().endswith('.gz'):item['compressed']=True
    else:item.pop('compressed',None)
    items.append(item)
items.sort(key=lambda x:x['name'].casefold())
path.write_text(json.dumps(items,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
print(f'Wrote {len(items)} game entries into {path}')
