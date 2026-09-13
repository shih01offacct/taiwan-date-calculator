'use strict';
const $=id=>document.getElementById(id), C=DateCore;
let data=window.CALENDAR_DATA||{days:{},years:[]},kind='range',overrides={};
const today=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Taipei',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
function display(s){const d=new Date(C.parse(s)*86400000);return `民國${d.getUTCFullYear()-1911}年${d.getUTCMonth()+1}月${d.getUTCDate()}日（${'日一二三四五六'[d.getUTCDay()]}）`;}
function time(s){return s?new Date(s).toLocaleString('zh-TW',{timeZone:'Asia/Taipei',hour12:false}):'尚未成功取得';}
$('today').textContent='臺灣今天\n'+display(today);$('start').value=today;$('end').value=C.add(today,10);$('overrideDate').value=today;
function validateOverrides(v){if(!v||typeof v!=='object'||Array.isArray(v)||Object.keys(v).length>500)throw Error('備份格式無效或超過500筆');for(const [s,i] of Object.entries(v)){C.parse(s);if(!i||typeof i.holiday!=='boolean'||typeof i.note!=='string'||!i.note.trim()||i.note.length>80)throw Error('特殊日期格式無效');}return v;}
try{overrides=validateOverrides(JSON.parse(localStorage.getItem('tw-date-overrides')||'{}'));}catch(e){$('overrideStatus').textContent='無法讀取先前設定：'+e.message;}
function renderOverrides(){const list=$('overrideList');list.replaceChildren();for(const [s,i] of Object.entries(overrides).sort()){const li=document.createElement('li');li.textContent=`${s} · ${i.holiday?'休假':'上班'} · ${i.note}`;const b=document.createElement('button');b.className='quiet';b.textContent='移除';b.type='button';b.onclick=()=>{delete overrides[s];saveOverrides();renderOverrides();calculate();};li.append(b);list.append(li);}}
function saveOverrides(){try{localStorage.setItem('tw-date-overrides',JSON.stringify(overrides));$('overrideStatus').textContent='已儲存於這個瀏覽器。';}catch(e){$('overrideStatus').textContent='瀏覽器無法儲存；設定只在本次有效，請匯出備份。';}}
function metadata(){
 $('status').textContent=data.years.length?'已載入年度：'+data.years.map(y=>`${y-1911}（${y}）`).join('、'):'尚未載入官方日曆；日曆日可先使用';
 const age=data.checkedAt?(Date.now()-Date.parse(data.checkedAt))/86400000:Infinity;
 $('warning').textContent=!data.years.length?'首次使用：請在 GitHub Actions 執行「更新日曆並發布網站」。取得官方資料後，才能計算工作日及假日調整。':age>7?'已超過7天未成功檢查官方資料，現有結果使用舊版日曆。請到 GitHub Actions 檢查更新狀態。':'';
 $('sourceMeta').textContent=`最後成功檢查：${time(data.checkedAt)}；日曆內容更新：${time(data.updatedAt)}（臺灣時間）。`;
 $('sourceList').replaceChildren();for(const [y,s] of Object.entries(data.sources||{})){const p=document.createElement('p'),a=document.createElement('a');a.textContent=s.title;a.href=s.url;a.target='_blank';a.rel='noopener';p.append(a);$('sourceList').append(p);}
}
function controls(){
 for(const id of ['amountField','directionField','adjustField'])$(id).hidden=kind!=='offset';
 for(const id of ['endField','includeEndField'])$(id).hidden=kind!=='range';
 $('end').required=kind==='range';$('amount').required=kind==='offset';
 for(const [id,k] of [['rangeTab','range'],['offsetTab','offset']]){$(id).classList.toggle('active',kind===k);$(id).setAttribute('aria-pressed',kind===k);}
 const mode=document.querySelector('[name=mode]:checked').value;
 $('ruleHint').textContent=(kind==='range'?'同日區間須同時勾選兩個端點才計1天。':'0天代表原日期；如有設定，仍會調整假日。')+(mode==='work'?' 工作日需要涵蓋計算範圍的官方資料。':'');
}
function calculate(){controls();$('detailBox').hidden=true;$('rows').replaceChildren();$('resultValue').className='result-value';$('resultNote').textContent='';
 try{const mode=document.querySelector('[name=mode]:checked').value,o={kind,mode,start:$('start').value,end:$('end').value,amount:$('amount').value,direction:$('direction').value,includeStart:$('includeStart').checked,includeEnd:$('includeEnd').checked,adjust:$('adjust').value};
 if(kind==='offset'&&o.amount==='')throw Error('請輸入天數');
 const r=C.calculate(o,data.days,overrides);$('resultLabel').textContent=kind==='range'?'區間天數':'推算日期';
 $('resultValue').textContent=kind==='range'?r.result+' 天':r.result;$('resultValue').classList.toggle('date',kind==='offset');
 $('resultSub').textContent=kind==='range'?`${o.start} 至 ${o.end} · ${mode==='work'?'工作日':'日曆日'}`:display(r.result);
 const used=r.rows.some(x=>overrides[x.date]);
 $('resultNote').textContent=`${o.includeStart?'計入':'不計入'}起算當天`+(kind==='range'?` · ${o.includeEnd?'計入':'不計入'}結束當天`:` · ${o.direction==='back'?'往前':'往後'}${o.amount}個${mode==='work'?'工作日':'日曆日'} · ${$('adjust').selectedOptions[0].textContent}`)+(used?'。本次範圍含自訂日期；工作日判定優先使用自訂設定。':'');
 const fragment=document.createDocumentFragment();for(const row of r.rows){const tr=document.createElement('tr');if(!row.included)tr.className='skip';for(const text of [row.date+'（'+'日一二三四五六'[new Date(C.parse(row.date)*86400000).getUTCDay()]+'）',row.included?'計入':'不計入',row.reason]){const td=document.createElement('td');td.textContent=text;tr.append(td);}fragment.append(tr);}$('rows').append(fragment);$('detailCount').textContent=`（${r.rows.length}筆）`;$('detailBox').hidden=false;
 }catch(e){$('resultValue').className='result-value error';$('resultValue').textContent='尚無法計算';$('resultSub').textContent=e.message;}
}
$('rangeTab').onclick=()=>{kind='range';calculate();};$('offsetTab').onclick=()=>{kind='offset';calculate();};$('form').onsubmit=e=>{e.preventDefault();calculate();};$('form').onchange=calculate;
$('overrideForm').onsubmit=e=>{e.preventDefault();try{const s=$('overrideDate').value;C.parse(s);const note=$('overrideNote').value.trim();if(!note)throw Error('請填寫原因');const next={...overrides,[s]:{holiday:$('overrideType').value==='holiday',note}};overrides=validateOverrides(next);saveOverrides();renderOverrides();calculate();}catch(e){$('overrideStatus').textContent=e.message;}};
$('export').onclick=()=>{const a=document.createElement('a'),u=URL.createObjectURL(new Blob([JSON.stringify({schema:1,overrides},null,2)],{type:'application/json'}));a.href=u;a.download='特殊日期備份.json';a.click();setTimeout(()=>URL.revokeObjectURL(u),1000);};
$('import').onchange=async e=>{try{const f=e.target.files[0];if(!f)return;if(f.size>200000)throw Error('檔案過大');const v=JSON.parse(await f.text());if(v.schema!==1)throw Error('備份版本不符');const next=validateOverrides({...overrides,...validateOverrides(v.overrides)});overrides=next;saveOverrides();renderOverrides();calculate();}catch(e){$('overrideStatus').textContent='匯入失敗：'+e.message;}finally{$('import').value='';}};
async function refresh(manual=false){if(location.protocol==='file:'){if(manual)$('warning').textContent='本機版請重新下載 GitHub 的最新專案，或改開線上網址取得最新日曆。';return;} $('refresh').disabled=true;try{const r=await fetch('data/calendar.json?t='+Date.now(),{cache:'no-store'});if(!r.ok)throw Error('HTTP '+r.status);const v=await r.json();if(v.schema!==1||!Array.isArray(v.years)||!v.days)throw Error('日曆資料格式不符');data=v;metadata();calculate();}catch(e){$('warning').textContent='無法讀取網站最新資料，保留目前版本。'+e.message;}finally{$('refresh').disabled=false;}}
$('refresh').onclick=()=>refresh(true);metadata();renderOverrides();calculate();refresh();
