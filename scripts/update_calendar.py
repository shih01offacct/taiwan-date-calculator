"""Download official daily calendars; validate everything before replacing data."""
import csv, io, json, re, hashlib, sys, time
from datetime import date, timedelta, datetime, timezone
from pathlib import Path
from urllib.request import Request, urlopen
from urllib.parse import quote, urlsplit, unquote
ROOT = Path(__file__).resolve().parents[1]
API = 'https://data.gov.tw/api/v2/rest/dataset/14718'
SOURCE = 'https://data.gov.tw/dataset/14718'
MIN_YEAR = 2024

def get(url):
    if urlsplit(url).scheme != 'https' or urlsplit(url).hostname not in {'data.gov.tw','www.dgpa.gov.tw','dgpa.gov.tw'}:
        raise ValueError('來源不是核准的官方 HTTPS 網址')
    url = quote(url, safe=':/?=&%+;,@')
    for attempt in range(3):
        try:
            with urlopen(Request(url, headers={'User-Agent':'TaiwanDateCalculator/1.0'}), timeout=40) as r:
                if urlsplit(r.url).hostname not in {'data.gov.tw','www.dgpa.gov.tw','dgpa.gov.tw'}:
                    raise ValueError('來源重新導向非核准網域')
                data=r.read(5_000_001)
                if len(data)>5_000_000: raise ValueError('來源檔案過大')
                return data
        except Exception:
            if attempt==2: raise
            time.sleep(2)

def select_resources(resources):
    groups={}
    for r in resources:
        title=r.get('resourceDescription','')
        if r.get('resourceFormat','').upper()!='CSV' or 'google' in title.lower(): continue
        m=re.search(r'(?<!\d)(\d{3,4})年',title)
        if not m: continue
        y=int(m[1]); y=y+1911 if y<1911 else y
        if y<MIN_YEAR: continue
        # Explicit revision dates outrank originals; URL folder breaks dated ties.
        rev=re.search(r'\((\d{7,8})更新\)',title)
        stamp=int(rev[1]) if rev else 0
        if stamp and len(str(stamp))==7: stamp+=19110000
        folder=re.search(r'/files/(\d{6})/',unquote(r['resourceDownloadUrl']))
        rank=(bool(re.search('更新|修正',title)),stamp,int(folder[1]) if folder else 0)
        groups.setdefault(y,[]).append((rank,r))
    if not groups: raise ValueError('找不到官方逐日 CSV，資料結構可能已變更')
    selected={}
    for y,items in groups.items():
        best=max(rank for rank,r in items)
        winners=[r for rank,r in items if rank==best]
        if len({r['resourceDownloadUrl'] for r in winners})!=1:
            raise ValueError(f'{y} 年有多個無法判定先後的版本，需人工檢查')
        selected[y]=winners[0]
    return selected

def parse_csv(raw, year, encoding='UTF-8'):
    enc='cp950' if encoding.upper() in {'BIG5','BIG-5','CP950'} else 'utf-8-sig'
    text=raw.decode(enc).lstrip('\ufeff')
    rows=csv.DictReader(io.StringIO(text))
    if not rows.fieldnames: raise ValueError('CSV 沒有欄位')
    rows.fieldnames=[v.strip() for v in rows.fieldnames]
    if not {'西元日期','星期','是否放假','備註'} <= set(rows.fieldnames): raise ValueError('CSV 欄位不符')
    result={}
    for row in rows:
        v=(row.get('西元日期') or '').strip()
        if re.fullmatch(r'\d{8}',v): v=f'{v[:4]}-{v[4:6]}-{v[6:]}'
        elif re.fullmatch(r'\d{4}/\d{1,2}/\d{1,2}',v):
            a,b,c=map(int,v.split('/')); v=date(a,b,c).isoformat()
        d=date.fromisoformat(v)
        if d.year!=year or v in result: raise ValueError('日期重複或年度不符')
        flag=(row.get('是否放假') or '').strip()
        if flag not in {'0','2'}: raise ValueError(f'{v} 放假代碼無效')
        weekday=(row.get('星期') or '').strip().replace('星期','').replace('週','')
        if weekday != '一二三四五六日'[d.weekday()]: raise ValueError(f'{v} 星期不符')
        result[v]={'holiday':flag=='2','note':(row.get('備註') or '').strip()}
    expected=set(); d=date(year,1,1)
    while d.year==year:
        expected.add(d.isoformat()); d+=timedelta(days=1)
    if set(result)!=expected: raise ValueError(f'{year} 年日期不完整，不能更新')
    return result

def write_bundle(data):
    folder=ROOT/'site/data'; folder.mkdir(exist_ok=True)
    serial=json.dumps(data,ensure_ascii=False,separators=(',',':'))
    for name,content in [('calendar.json',serial),('calendar.js','window.CALENDAR_DATA='+serial+';\n')]:
        p=folder/name; tmp=p.with_suffix(p.suffix+'.tmp'); tmp.write_text(content,encoding='utf-8'); tmp.replace(p)

def update():
    metadata=json.loads(get(API))
    if metadata.get('success') is not True: raise ValueError('官方 API 未成功')
    resources=select_resources(metadata['result']['distribution'])
    path=ROOT/'site/data/calendar.json'
    old=json.loads(path.read_text()) if path.exists() else {'days':{},'years':[]}
    days=dict(old['days']); sources=dict(old.get('sources',{}))
    if set(old['years'])-set(resources): raise ValueError('已載入年度從來源消失，保留舊版並請人工檢查')
    for y,r in sorted(resources.items()):
        raw=get(r['resourceDownloadUrl']); parsed=parse_csv(raw,y,r.get('resourceCharacterEncoding','UTF-8'))
        days.update(parsed)
        sources[str(y)]={'title':r['resourceDescription'],'url':r['resourceDownloadUrl'],'sha256':hashlib.sha256(raw).hexdigest()}
        print(f'{y}: {len(parsed)} days validated')
    now=datetime.now(timezone.utc).isoformat()
    changed=days!=old['days'] or sources!=old.get('sources',{})
    data={'schema':1,'source':SOURCE,'checkedAt':now,'updatedAt':now if changed else old.get('updatedAt'),
          'years':sorted(resources),'sources':sources,'days':dict(sorted(days.items()))}
    write_bundle(data)
    print('Official calendar successfully checked; '+('data changed' if changed else 'no calendar changes'))

if __name__=='__main__':
    try: update()
    except Exception as e:
        print('更新失敗，未發布新日曆：'+str(e),file=sys.stderr); sys.exit(1)
