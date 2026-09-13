(function(root){
'use strict';
const DAY=86400000;
function parse(s){if(!/^\d{4}-\d{2}-\d{2}$/.test(s))throw Error('請輸入完整日期');const n=Date.parse(s+'T00:00:00Z');if(!Number.isFinite(n)||new Date(n).toISOString().slice(0,10)!==s||+s.slice(0,4)<1912||+s.slice(0,4)>9998)throw Error('日期無效，支援西元1912至9998年');return n/DAY;}
function iso(n){const s=new Date(n*DAY).toISOString().slice(0,10);parse(s);return s;}
function add(s,n){return iso(parse(s)+n);}
function info(s,days,overrides={}){parse(s);const base=days[s];if(!base)throw Error(s+' 尚無官方日曆資料，無法判定工作日');const o=overrides[s];return o?{holiday:o.holiday,note:'自訂：'+o.note,custom:true}:base;}
function calculate(o,days,overrides={}){
 const start=parse(o.start), rows=[]; let result, counted=0;
 const push=(s,included,reason)=>rows.push({date:s,included,reason});
 const eligible=s=>o.mode==='work'?!info(s,days,overrides).holiday:true;
 const reason=s=>{if(o.mode!=='work')return '日曆日';const i=info(s,days,overrides);return i.note||(i.holiday?'休假日':'工作日');};
 if(o.kind==='range'){
  const end=parse(o.end);if(end<start)throw Error('結束日期不可早於開始日期');if(end-start>36600)throw Error('一次最多計算100年');
  for(let n=start;n<=end;n++){let s=iso(n);if((n===start&&!o.includeStart)||(n===end&&!o.includeEnd)){push(s,false,'不計入端點');continue;}let yes=eligible(s);if(yes)counted++;push(s,yes,reason(s));}result=counted;
 }else{
  const amount=Number(o.amount);if(!Number.isInteger(amount)||amount<0||amount>36600)throw Error('天數須為0至36600的整數');const direction=o.direction==='back'?-1:1;
  let n=start;if(amount===0){result=o.start;push(result,false,'0天：原日期');}
  else{if(!o.includeStart){push(o.start,false,'起算日不計入');n+=direction;}let steps=0;
   while(counted<amount){if(++steps>100000)throw Error('計算範圍過大');const s=iso(n),yes=eligible(s);push(s,yes,reason(s));if(yes)counted++;if(counted<amount)n+=direction;}result=iso(n);}
  if(o.adjust!=='none'){
   const shift=o.adjust==='next'?1:-1;let n=parse(result),steps=0;
   while(info(iso(n),days,overrides).holiday){if(++steps>3660)throw Error('找不到可用工作日');push(iso(n),false,'到期日遇假日，調整');n+=shift;}result=iso(n);if(steps)push(result,false,'調整後日期（不增加計算天數）');
  }
 }
 return {result,rows,counted};
}
const api={parse,iso,add,info,calculate};if(typeof module!=='undefined')module.exports=api;root.DateCore=api;
})(typeof window==='undefined'?globalThis:window);
