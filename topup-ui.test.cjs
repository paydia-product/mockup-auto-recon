const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const crypto = require('node:crypto').webcrypto;
const root = __dirname;
class MiniEvent {
  constructor(type, props = {}) { this.type = type; this.defaultPrevented = false; Object.assign(this, props); }
  preventDefault() { this.defaultPrevented = true; }
}
class Target {
  constructor() { this.listeners = new Map(); }
  addEventListener(type, fn) { const list=this.listeners.get(type)||[];list.push(fn);this.listeners.set(type,list); }
  dispatchEvent(e) { if(!e.target)e.target=this;e.currentTarget=this; e.pending ||= [];for(const fn of this.listeners.get(e.type)||[]){const p=fn(e);if(p?.then)e.pending.push(p);}if(e.bubbles&&this.parentElement)this.parentElement.dispatchEvent(e);return !e.defaultPrevented; }
}
function setup(nativePopover = true) {
  let document;
  const decode = value => value.replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/&lt;/g,'<').replace(/&gt;/g,'>');
  class Element extends Target {
    constructor(tag='div') { super();this.tagName=tag.toUpperCase();this.attributes={};this.dataset={};this.children=[];this.parentElement=null;this.style={};this._value=undefined;this.scrollTop=0;this.scrollLeft=0;this._text='';this._html='';this.files=[];this.open=false;this._popoverOpen=false;
      this.classList={add:(c)=>this.setAttribute('class',[...new Set((this.className+' '+c).trim().split(/\s+/))].join(' ')),remove:(c)=>this.setAttribute('class',this.className.split(/\s+/).filter(x=>x!==c).join(' ')),contains:(c)=>this.className.split(/\s+/).includes(c)};
      if(nativePopover){this.showPopover=()=>{for(const p of document.querySelectorAll('[popover]'))if(p!==this&&p._popoverOpen)p.hidePopover();this._popoverOpen=true;queueMicrotask(()=>this.dispatchEvent(new MiniEvent('toggle',{newState:this._popoverOpen?'open':'closed'})));};this.hidePopover=()=>{this._popoverOpen=false;queueMicrotask(()=>this.dispatchEvent(new MiniEvent('toggle',{newState:this._popoverOpen?'open':'closed'})));};}
    }
    setAttribute(name,value){this.attributes[name]=String(value);if(name.startsWith('data-'))this.dataset[name.slice(5).replace(/-([a-z])/g,(_,x)=>x.toUpperCase())]=String(value);}
    getAttribute(name){return this.attributes[name]??null;}
    removeAttribute(name){delete this.attributes[name];}
    get id(){return this.attributes.id||'';} set id(v){this.setAttribute('id',v);}
    get className(){return this.attributes.class||'';}set className(v){this.setAttribute('class',v);}
    get hidden(){return Object.hasOwn(this.attributes,'hidden');}set hidden(v){if(v)this.setAttribute('hidden','');else this.removeAttribute('hidden');}
    get disabled(){return Object.hasOwn(this.attributes,'disabled');}set disabled(v){if(v)this.setAttribute('disabled','');else this.removeAttribute('disabled');}
    get checked(){return Object.hasOwn(this.attributes,'checked');}set checked(v){if(v)this.setAttribute('checked','');else this.removeAttribute('checked');}
    get value(){if(this._value!==undefined)return this._value;if(this.tagName==='SELECT'){const os=this.querySelectorAll('option');return (os.find(o=>o.getAttribute('selected')!==null)||os[0])?.getAttribute('value')||'';}return this.attributes.value||'';}set value(v){this._value=String(v);}
    get isConnected(){let n=this;while(n){if(n===document.body)return true;n=n.parentElement;}return false;}
    appendChild(n){n.parentElement=this;this.children.push(n);return n;}
    prepend(n){n.parentElement=this;this.children.unshift(n);}
    replaceChildren(...nodes){for(const c of this.children)c.parentElement=null;this.children=[];nodes.forEach(n=>this.appendChild(n));this._text='';this._html='';}
    get textContent(){return this._text+this.children.map(c=>c.textContent).join('');}set textContent(v){this.replaceChildren();this._text=String(v);}
    set innerHTML(v){this.replaceChildren();this._html=String(v);const stack=[this];const re=/<\/?[a-zA-Z][^>]*>|[^<]+/g;let m;while((m=re.exec(this._html))){const t=m[0];if(t.startsWith('</')){if(stack.length>1)stack.pop();continue;}if(t.startsWith('<')){const tag=t.match(/^<([\w-]+)/)[1];const e=new Element(tag);const attrs=t.slice(tag.length+1,-1);const ar=/([\w:-]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g;let a;while((a=ar.exec(attrs)))e.setAttribute(a[1],decode(a[2]??a[3]??a[4]??''));stack.at(-1).appendChild(e);if(!/^(input|br|img|embed|link|meta|col|hr)$/i.test(tag)&&!t.endsWith('/>'))stack.push(e);}else stack.at(-1)._text+=decode(t);}}
    get innerHTML(){return this._html;}
    matches(selector){if(selector.includes(','))return selector.split(',').some(s=>this.matches(s.trim()));if(selector===':popover-open'){if(!nativePopover)throw Error('Unsupported selector');return this._popoverOpen;}if(selector.startsWith('#'))return this.id===selector.slice(1);if(selector.startsWith('.'))return this.classList.contains(selector.slice(1));if(selector.startsWith('[')){const a=selector.match(/^\[([\w-]+)(?:=["']?([^"'\]]+)["']?)?\]$/);if(!a)throw Error('Unsupported selector '+selector);return a[2]===undefined?this.getAttribute(a[1])!==null:this.getAttribute(a[1])===a[2];}return this.tagName===selector.toUpperCase();}
    querySelectorAll(selector){const out=[];for(const c of this.children){if(c.matches(selector))out.push(c);out.push(...c.querySelectorAll(selector));}return out;}
    querySelector(selector){return this.querySelectorAll(selector)[0]||null;}
    closest(selector){let p=this;while(p?.matches){if(p.matches(selector))return p;p=p.parentElement;}return null;}
    getBoundingClientRect(){return {top:240,bottom:274,right:1250,width:100,height:34};}
    focus(){document.activeElement=this;}
    showModal(){this.open=true;}
    close(){this.open=false;this.dispatchEvent(new MiniEvent('close'));}
    click(){if(this.disabled)return;return fire(this,'click',{bubbles:true});}
  }
  document=new Target();document.createElement=tag=>new Element(tag);document.body=new Element('body');document.body.parentElement=document;document.activeElement=document.body;
  document.querySelectorAll=s=>document.body.querySelectorAll(s);document.querySelector=s=>document.body.querySelector(s);document.getElementById=id=>document.querySelector('#'+id);
  document.body.innerHTML=fs.readFileSync(root+'/payin.html','utf8').match(/<body>([\s\S]*)<\/body>/)[1];
  const storage=new Map(),blobs=new Map(),urls=new Set(),revoked=[];let delayedPut=null,failPut=false,saveCalls=0;
  const window=new Target();Object.assign(window,{document,console,Blob,crypto,Date,Intl,Map,Event:MiniEvent,TextEncoder,innerWidth:1440,innerHeight:1000,scrollX:0,scrollY:0,setTimeout,clearTimeout});window.window=window;window.globalThis=window;window.scrollTo=(x,y)=>{window.scrollX=x;window.scrollY=y;};
  window.URL={createObjectURL:()=>{const u='blob:audit-'+Math.random();urls.add(u);return u;},revokeObjectURL:u=>{urls.delete(u);revoked.push(u);}};
  window.localStorage={getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)};
  window.__paydiaTopupEvidenceAdapter={put:async v=>{saveCalls++;if(failPut)throw Error('Audit storage failure');if(delayedPut)await delayedPut;blobs.set(v.id,v);},get:id=>blobs.get(id),clear:()=>blobs.clear()};
  const context=vm.createContext(window);vm.runInContext(fs.readFileSync(root+'/topup-state.js','utf8'),context);vm.runInContext(fs.readFileSync(root+'/topup-ui.js','utf8'),context);document.dispatchEvent(new MiniEvent('DOMContentLoaded'));
  function fire(el,type,props={}){const e=new MiniEvent(type,props);el.dispatchEvent(e);return e;}
  function q(s){const el=document.querySelector(s);assert.ok(el,'Missing '+s);return el;}
  function rowButton(id){return q(`[data-topup-status="${id}"]`);}
  async function open(id,action){rowButton(id).click();await tick();if(action!=='detail'){q(`[data-topup-${action}="${id}"]`).click();await tick();}}
  function snapshot(){return JSON.stringify(window.PaydiaTopup.getState());}
  function file(){const b=new Blob(['audit fixture'],{type:'application/pdf'});Object.defineProperty(b,'name',{value:'audit.pdf'});return b;}
  function attach(kind){const input=q(kind==='edit'?'#topup-edit-file':'#topup-approval-file');input.files=[file()];fire(input,'change');}
  return {document,window,storage,blobs,urls,revoked,q,fire,rowButton,open,snapshot,attach,getSaveCalls:()=>saveCalls,setFail:v=>failPut=v,setDelay:p=>delayedPut=p};
}
const tick=()=>new Promise(r=>setImmediate(r));
let passed=0;const note=s=>{passed++;console.log('PASS '+s);};
(async()=>{
  { const h=setup();assert.equal(h.document.querySelectorAll('[data-topup-menu]').length,0);assert.equal(h.document.querySelectorAll('[data-topup-status]').length,10);await h.open('TOPUP-004','detail');assert.equal(h.q('#topup-dialog-title').textContent,'Ubah Status Payin');assert.match(h.q('#topup-dialog-body').textContent,/ID Transaksi/);assert.match(h.q('#topup-dialog-body').textContent,/TOPUP-004/);note('Payin exposes direct Ubah Status action and opens only the selected transaction'); }
  for(const origin of ['detail'])for(const kind of ['edit','approve'])for(const exit of ['button','x','escape']){
    const h=setup();const initial=h.snapshot();const id='TOPUP-004';const wrapper=h.q('#topup-table').closest('.table-wrapper');wrapper.scrollLeft=132;h.window.scrollTo(4,480);h.q('#topup-search-input').value='unsent search';
    await h.open(id,'detail');h.q('#topup-dialog').scrollTop=77;h.q('#topup-dialog').querySelector(`[data-topup-${kind}="${id}"]`).click();
    if(kind==='edit'){h.q('#topup-proposed').value='1234';h.q('#topup-reason').value='discard this';}h.attach(kind);
    if(exit==='button')h.q('[data-topup-close]').click();else if(exit==='x')h.q('#topup-dialog-close').click();else{const event=h.fire(h.q('#topup-dialog'),'cancel');if(!event.defaultPrevented)h.q('#topup-dialog').close();}
    await tick();assert.equal(h.snapshot(),initial);assert.equal(h.getSaveCalls(),0);assert.equal(h.blobs.size,0);assert.equal(h.urls.size,0);
    if(origin==='detail'){assert.equal(h.q('#topup-dialog').open,true);assert.equal(h.q('#topup-dialog-title').textContent,'Ubah Status Payin');assert.equal(h.q('#topup-dialog').scrollTop,77);assert.equal(h.document.activeElement.dataset[kind==='edit'?'topupEdit':'topupApprove'],id);h.q('[data-topup-close]').click();await tick();}
    assert.equal(h.q('#topup-dialog').open,false);assert.equal(h.document.activeElement.dataset.topupStatus,id);assert.equal(wrapper.scrollLeft,132);assert.equal(h.window.scrollY,480);assert.equal(h.q('#topup-search-input').value,'unsent search');
    await h.open(id,kind);assert.equal(h.q(kind==='edit'?'#topup-edit-file':'#topup-approval-file').files.length,0);if(kind==='edit'){assert.equal(h.q('#topup-proposed').value,'');assert.equal(h.q('#topup-reason').value,'');}
    note(`${origin} ${kind} ${exit}: origin, scroll, focus, draft and persistent-state invariants`);
  }
  for(const kind of ['edit','approve']){
    const h=setup();const before=h.window.PaydiaTopup.getState();await h.open('TOPUP-001',kind);if(kind==='edit')h.q('#topup-proposed').value='123456';h.attach(kind);
    let release;h.setDelay(new Promise(r=>release=r));const ev=h.fire(h.q(kind==='edit'?'#topup-edit-form':'#topup-approval-form'),'submit');assert.equal(h.q('[data-topup-close]').disabled,true);assert.equal(h.q('#topup-dialog-close').disabled,true);const ce=h.fire(h.q('#topup-dialog'),'cancel');assert.equal(ce.defaultPrevented,true);assert.equal(h.q('#topup-dialog').open,true);release();await Promise.all(ev.pending);await tick();
    const after=h.window.PaydiaTopup.getState();assert.equal(after.requests.length,before.requests.length+1);assert.equal(after.requests.at(-1).transactionId,'TOPUP-001');assert.deepEqual(after.transactions,before.transactions);assert.deepEqual(after.dealers,before.dealers);assert.match(h.q('#topup-dialog-title').textContent,/terkirim/);h.q('[data-topup-close]').click();await tick();assert.equal(h.q('#topup-dialog').open,false);assert.equal(h.document.activeElement.dataset.topupStatus,'TOPUP-001');
    note(kind+' async submit locks cancellation, targets only one row, preserves balances, closes result normally');
  }
  {
    const h=setup();const before=h.window.PaydiaTopup.getState();await h.open('TOPUP-001','edit');h.q('#topup-proposed').value='123456';h.attach('edit');let e=h.fire(h.q('#topup-edit-form'),'submit');await Promise.all(e.pending);await tick();let request=h.window.PaydiaTopup.getState().requests.at(-1);h.q('[data-topup-close]').click();h.window.PaydiaTopup.setActiveAccount(4);h.window.PaydiaTopupUI.openRequest(request.id);assert.equal(h.q('#topup-dialog-title').textContent,'Permintaan Ubah Nominal Top Up Transfer Bank Pengguna Bisnis');assert.match(h.q('#topup-dialog-body').textContent,/Data Sekarang.*Permintaan Data.*Request Detail/);h.q('[data-topup-decision="approved"]').click();await tick();let current=h.window.PaydiaTopup.getState();assert.equal(current.transactions.find(t=>t.id==='TOPUP-001').effectiveAmount,123456);assert.equal(current.transactions.find(t=>t.id==='TOPUP-001').status,'Proses');assert.deepEqual(current.dealers,before.dealers);h.q('[data-topup-close]').click();h.window.PaydiaTopup.setActiveAccount(3);await h.open('TOPUP-001','approve');assert.equal(h.q('#topup-approval-file').files.length,0);h.attach('approve');e=h.fire(h.q('#topup-approval-form'),'submit');await Promise.all(e.pending);await tick();let request2=h.window.PaydiaTopup.getState().requests.at(-1);assert.notEqual(request.evidenceId,request2.evidenceId);h.q('[data-topup-close]').click();h.window.PaydiaTopup.setActiveAccount(6);h.window.PaydiaTopupUI.openRequest(request2.id);h.q('[data-topup-decision="approved"]').click();await tick();current=h.window.PaydiaTopup.getState();assert.equal(current.transactions.find(t=>t.id==='TOPUP-001').status,'Sukses');assert.equal(current.dealers['dealer-a'].balance,before.dealers['dealer-a'].balance+123456);assert.deepEqual(current.transactions.filter(t=>t.id!=='TOPUP-001'),before.transactions.filter(t=>t.id!=='TOPUP-001'));h.q('[data-topup-close]').click();assert.equal(h.q('#topup-dialog').open,false);const log=current.logs.find(l=>l.transactionId==='TOPUP-001'&&l.event==='Approve Topup');h.window.PaydiaTopupUI.openLog(log.id);await tick();h.q('#topup-dialog-close').click();assert.equal(h.q('#topup-dialog').open,false);note('Full actual UI+domain L1 Edit -> L3 approve -> fresh L2 evidence -> L2 approve -> Log close; single credit and other rows unchanged');
  }
  const h=setup();await h.open('TOPUP-004','detail');h.q('#topup-dialog').querySelector('[data-topup-approve="TOPUP-004"]').click();h.attach('approve');h.setFail(true);const e=h.fire(h.q('#topup-approval-form'),'submit');await Promise.all(e.pending);assert.equal(h.q('[data-topup-close]').disabled,false);assert.equal(h.q('#topup-dialog-close').disabled,false);h.q('[data-topup-close]').click();assert.equal(h.q('#topup-dialog-title').textContent,'Ubah Status Payin');note('Storage failure re-enables cancellation and returns to Ubah Status');
  console.log(JSON.stringify({passed,scope:'Executed actual unchanged UI and core scripts in a minimal DOM/event model; no CSS layout, browser rendering, or browser API conformance claim.'}));
})().catch(error=>{console.error(error);process.exitCode=1;});
