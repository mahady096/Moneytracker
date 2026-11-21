import{initializeApp}from"https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import{getAuth,onAuthStateChanged,signInWithEmailAndPassword as si,createUserWithEmailAndPassword as su,GoogleAuthProvider,signInWithPopup,signOut}from"https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import{initializeFirestore,persistentLocalCache,doc,getDoc,setDoc,addDoc,getDocs,updateDoc,deleteDoc,collection,query,orderBy,limit,onSnapshot,runTransaction,serverTimestamp,Timestamp}from"https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
import{firebaseConfig}from"./firebase-config.js";
const app=initializeApp(firebaseConfig),auth=getAuth(app),db=initializeFirestore(app,{localCache:persistentLocalCache()});
const $=s=>document.querySelector(s),esc=s=>String(s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const fmt=n=>(n/100).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2}),cents=v=>Math.round(parseFloat(v||0)*100)||0;
const KINDS=["Bank","Mobile banking","Stock market","Insurance","Cash","Other"],TYPES=["Savings","Current","DPS (recurring deposit)","Fixed deposit","Mobile wallet (MFS)","Investment","Insurance","Loan","Credit card","Cash"],DEBT=["Loan","Credit card"];
const CATS=["Food","Transport","Bills","Rent","Shopping","Health","Education","Entertainment","Savings","Salary","Other"],bad=e=>alert(e.message||e);
let ea=null,es=null,uid,cur="BDT",D={institutions:[],accounts:[],records:[],scheduled:[],budgets:[]},L={},subs=[],due=0;
const show=id=>["auth","onboard","app"].forEach(s=>$("#"+s).hidden=s!==id);
const uref=(...p)=>doc(db,"users",uid,...p),ucol=n=>collection(db,"users",uid,n),add=(n,d)=>addDoc(ucol(n),{...d,createdAt:serverTimestamp()}).catch(bad);
const cred=()=>[auth,$("#email").value.trim(),$("#pass").value],err=e=>$("#err").textContent=e.message;
$("#login").onclick=()=>si(...cred()).catch(err);$("#signup").onclick=()=>su(...cred()).catch(err);
$("#google").onclick=()=>signInWithPopup(auth,new GoogleAuthProvider()).catch(err);$("#out").onclick=()=>signOut(auth);
onAuthStateChanged(auth,async u=>{subs.forEach(f=>f());subs=[];L={};due=0;if(!u)return show("auth");uid=u.uid;const p=(await getDoc(uref())).data();if(!p?.onboarded)return show("onboard");cur=p.currency;run();});
$("#start").onclick=async()=>{try{cur=$("#cur").value.trim().toUpperCase()||"BDT";await setDoc(uref(),{currency:cur,onboarded:true});run();tab("acc");}catch(e){bad(e)}};
const sub=(n,q)=>subs.push(onSnapshot(q||ucol(n),s=>{D[n]=s.docs.map(d=>({id:d.id,...d.data()}));L[n]=1;draw();}));
function run(){show("app");$("#date").valueAsDate=$("#sdate").valueAsDate=new Date();["institutions","accounts","scheduled","budgets"].forEach(n=>sub(n));sub("records",query(ucol("records"),orderBy("date","desc"),limit(1000)));}
const tab=t=>{document.querySelectorAll(".tab").forEach(e=>e.hidden=e.id!=="t-"+t);document.querySelectorAll("#nav button").forEach(b=>b.classList.toggle("on",b.dataset.t===t));};
$("#nav").onclick=e=>e.target.dataset.t&&tab(e.target.dataset.t);tab("home");
const o=(l,f=x=>x)=>l.map(x=>`<option>${esc(f(x))}</option>`).join(""),bar=(p,x)=>`<div class="bar"><i class="${x?"over":""}" style="width:${Math.min(100,p||0)}%"></i></div>`;
for(const id of["ikind"])$("#"+id).innerHTML=o(KINDS);$("#atype").innerHTML=o(TYPES);for(const id of["cat","scat","bcat"])$("#"+id).innerHTML=o(CATS);
$("#bcat").innerHTML=o(["Total",...CATS]);
const nameOf=id=>{const a=D.accounts.find(x=>x.id===id);if(!a)return"?";const i=D.institutions.find(x=>x.id===a.instId);return(i?i.name+" / ":"")+a.name};
const day=r=>r.date.toDate().toISOString().slice(0,10);
function draw(){
if(!due&&L.accounts&&L.scheduled){due=1;runDue();}
const ao=D.accounts.map(a=>`<option value="${a.id}">${esc(nameOf(a.id))}</option>`).join("");
for(const id of["from","to","sfrom","sto"]){const e=$("#"+id),v=e.value;e.innerHTML=(id==="sto"?'<option value="">To: none (expense)</option>':id==="sfrom"?'<option value="">From: none (income)</option>':"")+ao;if(v)e.value=v;}
const fv=$("#rfil").value;$("#rfil").innerHTML='<option value="">All accounts</option>'+ao;$("#rfil").value=fv;
const iv=$("#ainst").value;$("#ainst").innerHTML=D.institutions.map(i=>`<option value="${i.id}">${esc(i.name)}</option>`).join("");if(iv)$("#ainst").value=iv;
const m=new Date().toISOString().slice(0,7),sp={};let inc=0,exp=0,ast=0,dbt=0;
D.accounts.forEach(a=>a.balance>0?ast+=a.balance:dbt+=a.balance);
D.records.forEach(r=>{if(day(r).slice(0,7)!==m)return;if(r.type==="income")inc+=r.amount;if(r.type==="expense"){exp+=r.amount;sp[r.category]=(sp[r.category]||0)+r.amount;}});
$("#net").textContent=fmt(ast+dbt)+" "+cur;$("#ast").textContent=fmt(ast);$("#dbt").textContent=fmt(-dbt);$("#inc").textContent=fmt(inc);$("#exp").textContent=fmt(exp);
$("#cats").innerHTML=Object.entries(sp).sort((a,b)=>b[1]-a[1]).map(([c,v])=>`<li><span>${esc(c)}${bar(v/exp*100)}</span><b>${fmt(v)}</b></li>`).join("")||"<li>No spending this month yet.</li>";
const loose=D.accounts.some(a=>!D.institutions.some(i=>i.id===a.instId));
$("#insts").innerHTML=[...D.institutions,...(loose?[{id:"",name:"Unassigned",kind:"Older accounts"}]:[])].map(i=>{const l=D.accounts.filter(a=>i.id?a.instId===i.id:!D.institutions.some(x=>x.id===a.instId));return`<h4>${esc(i.name)}<small>${esc(i.kind)}, ${fmt(l.reduce((s,a)=>s+a.balance,0))}</small></h4><div class="tiles">${l.map(a=>`<div class="tile" data-a="${a.id}"><small>${esc(a.name)}</small><b class="${a.balance<0?"expense":""}">${a.balance<0?"-":""}${cur} ${fmt(Math.abs(a.balance))}</b></div>`).join("")}${i.id?`<div class="tile new" data-n="${i.id}">+ Add account</div>`:""}</div>`}).join("")||"<p class='hint'>Add an institution first, such as a bank, mobile banking or insurance provider.</p>";
$("#recs").innerHTML=D.records.filter(r=>!$("#rfil").value||r.accountId===$("#rfil").value||r.toAccountId===$("#rfil").value).map(r=>`<li><span>${r.type==="transfer"?esc(nameOf(r.accountId))+" to "+esc(nameOf(r.toAccountId)):esc(r.category)+", "+esc(nameOf(r.accountId))}<small>${day(r)} ${esc(r.note||"")}</small></span><b class="${r.type}">${r.type==="expense"?"-":r.type==="income"?"+":""}${fmt(r.amount)}</b><button class="alt" data-id="${r.id}" aria-label="Delete record">×</button></li>`).join("")||"<li>No records yet.</li>";
$("#schs").innerHTML=D.scheduled.map(s=>`<li data-e="${s.id}"><span>${esc(s.name)}<small>${s.fromId?esc(nameOf(s.fromId)):"Income"}${s.toId?" to "+esc(nameOf(s.toId)):", "+esc(s.cat)}, ${s.freq}, ${sline(s)}</small></span><b>${fmt(s.amount)}</b><button class="alt" data-s="${s.id}" aria-label="Delete schedule">×</button></li>`).join("")||"<li>No schedules yet.</li>";
$("#buds").innerHTML=D.budgets.map(b=>{const v=b.cat==="Total"?exp:sp[b.cat]||0;return`<li><span>${esc(b.cat)}, ${fmt(v)} of ${fmt(b.limit)}${bar(v/b.limit*100,v>b.limit)}</span><button class="alt" data-b="${b.id}" aria-label="Delete budget">×</button></li>`}).join("")||"<li>No budgets yet.</li>";drawRep();}
const eff=r=>r.type==="income"?r.amount:-r.amount;
async function apply(r,sign,fn){await runTransaction(db,async t=>{
const s=await Promise.all([r.accountId,...(r.type==="transfer"?[r.toAccountId]:[])].map(i=>t.get(uref("accounts",i))));
t.update(s[0].ref,{balance:s[0].data().balance+sign*eff(r)});if(s[1])t.update(s[1].ref,{balance:s[1].data().balance-sign*eff(r)});fn(t);});}
const adv=(d,f)=>{const x=new Date(d);f==="weekly"?x.setUTCDate(x.getUTCDate()+7):f==="quarterly"?x.setUTCMonth(x.getUTCMonth()+3):f==="yearly"?x.setUTCFullYear(x.getUTCFullYear()+1):x.setUTCMonth(x.getUTCMonth()+1);return x.toISOString().slice(0,10)};
async function runDue(){const today=new Date().toISOString().slice(0,10);
for(const s of D.scheduled){let n=s.next,dn=s.done||0,k=0;while(n<=today&&k++<12&&!(s.total>0&&dn>=s.total)){const r={type:!s.fromId?"income":s.toId?"transfer":"expense",amount:s.amount,accountId:s.fromId||s.toId,category:s.fromId&&s.toId?"":s.cat,note:"Scheduled: "+s.name+(s.total>0?" ("+(dn+1)+"/"+s.total+")":""),date:Timestamp.fromDate(new Date(n))};if(s.toId&&s.fromId)r.toAccountId=s.toId;n=adv(n,s.freq);dn++;const nx=n,nd=dn;
try{await apply(r,1,t=>{t.set(doc(ucol("records")),{...r,createdAt:serverTimestamp()});t.update(uref("scheduled",s.id),{next:nx,done:nd});});}catch(e){bad(e);break}}}}
const left=s=>s.total>0?Math.max(0,s.total-(s.done||0)):null;
function endOf(s){const r=left(s);if(!r)return"";let e=s.next;for(let i=1;i<r;i++)e=adv(e,s.freq);return e}
function sline(s){const r=left(s);if(r===0)return"completed, "+s.total+"/"+s.total+" paid";const e=endOf(s),t=new Date().toISOString().slice(0,10);return (s.done||0)+(s.total>0?"/"+s.total:"")+" paid, next "+s.next+(e?", "+r+" left, ends "+e+" ("+Math.ceil((new Date(e)-new Date(t))/864e5)+" days)":"")}
function drawRep(){const m=$("#rmonth").value||(($("#rmonth").value=new Date().toISOString().slice(0,7)));const A=D.accounts,sm=l=>l.reduce((s,a)=>s+a.balance,0),I={},X={};let ti=0,te=0;
D.records.forEach(r=>{if(day(r).slice(0,7)!==m||r.type==="transfer")return;const o=r.type==="income"?I:X;o[r.category]=(o[r.category]||0)+r.amount;r.type==="income"?ti+=r.amount:te+=r.amount});
const li=(a,b,c,x)=>`<li><span>${a}${c?`<small>${c}</small>`:""}</span><b class="${x||""}">${b}</b></li>`,H=t=>`<h3>${t}</h3>`,nl=o=>Object.entries(o).map(([k,v])=>li(esc(k),fmt(v))).join("");
const pr=a=>{const s=D.scheduled.find(x=>x.toId===a.id);return s?esc(s.freq)+" "+fmt(s.amount)+", "+sline(s):""};
const dep=A.filter(a=>["Savings","Current","DPS (recurring deposit)","Fixed deposit"].includes(a.type)),ln=A.filter(a=>DEBT.includes(a.type));
const ast=A.reduce((s,a)=>a.balance>0?s+a.balance:s,0),dbt=sm(A)-ast;
$("#rep").innerHTML=H("Total summary")+`<ul>${li("Assets",fmt(ast))}${li("Debts",fmt(-dbt),"","expense")}${li("Net worth",fmt(ast+dbt),"","tot")}${li("Deposits",fmt(sm(dep)))}${li("Accounts",A.length)}${li("Institutions",D.institutions.length)}</ul>`
+H("By institution")+`<ul>${D.institutions.map(i=>{const l=A.filter(a=>a.instId===i.id);return li(esc(i.name),fmt(sm(l)),esc(i.kind)+", "+l.length+" accounts")}).join("")}</ul>`
+H("By account")+`<ul>${A.map(a=>li(esc(nameOf(a.id)),fmt(a.balance),esc(a.type||"")+(a.num?", "+esc(a.num):""),a.balance<0?"expense":"")).join("")}</ul>`
+H("Deposit summary")+`<ul>${dep.map(a=>li(esc(a.name),fmt(a.balance),esc(a.type)+(pr(a)?", "+pr(a):""))).join("")||"<li>No deposit accounts.</li>"}</ul>`
+H("Loan and credit card summary")+`<ul>${ln.map(a=>li(esc(a.name),fmt(-a.balance),esc(a.type)+(pr(a)?", "+pr(a):""),"expense")).join("")||"<li>No loans or cards.</li>"}</ul>`
+H("Income and expense, "+m)+`<ul>${nl(I)}${li("Total income",fmt(ti),"","income")}${nl(X)}${li("Total expense",fmt(te),"","expense")}${li("Net saving",fmt(ti-te),ti?Math.round((ti-te)/ti*100)+"% of income":"","tot")}</ul>`
+H("Budget summary, "+m)+`<ul>${D.budgets.map(b=>{const v=b.cat==="Total"?te:X[b.cat]||0;return li(esc(b.cat)+bar(v/b.limit*100,v>b.limit),fmt(b.limit-v),fmt(v)+" of "+fmt(b.limit)+(v>b.limit?", over budget":", left"),v>b.limit?"expense":"")}).join("")||"<li>No budgets set.</li>"}</ul>`;}
$("#rmonth").onchange=drawRep;
$("#csv").onclick=()=>{const q=c=>'"'+String(c).replace(/"/g,'""')+'"',rows=[["date","type","category","account","to","amount","note"],...D.records.map(r=>[day(r),r.type,r.category,nameOf(r.accountId),r.toAccountId?nameOf(r.toAccountId):"",r.amount/100,r.note||""])],a=document.createElement("a");a.href=URL.createObjectURL(new Blob([rows.map(r=>r.map(q).join(",")).join("\n")],{type:"text/csv"}));a.download="records.csv";a.click()};
function editAcc(a){ea=a.id;$("#ainst").value=a.instId||"";$("#atype").value=a.type||TYPES[0];$("#aname").value=a.name;$("#anum").value=a.num||"";$("#abal").value=Math.abs(a.balance)/100;$("#accForm").hidden=false;$("#addAcc").textContent="Update account";$("#acancel").hidden=$("#adel").hidden=false;scrollTo(0,0)}
const endAcc=()=>{$("#accForm").hidden=true;ea=null;["aname","anum","abal"].forEach(i=>$("#"+i).value="");$("#addAcc").textContent="Add account";$("#acancel").hidden=$("#adel").hidden=true};
function editSch(s){es=s.id;$("#sname").value=s.name;$("#samt").value=s.amount/100;$("#sfrom").value=s.fromId||"";$("#sto").value=s.toId||"";$("#scat").value=s.cat;$("#sfreq").value=s.freq;$("#sdate").value=s.next;$("#stotal").value=s.total||0;$("#sdone").value=s.done||0;$("#addSch").textContent="Update schedule";$("#scancel").hidden=false;scrollTo(0,0)}
const endSch=()=>{es=null;$("#sname").value=$("#samt").value="";$("#stotal").value=$("#sdone").value=0;$("#addSch").textContent="Add schedule";$("#scancel").hidden=true};
$("#acancel").onclick=endAcc;$("#rfil").onchange=draw;
$("#showInst").onclick=()=>$("#instForm").hidden=!$("#instForm").hidden;
const newAcc=id=>{endAcc();$("#accForm").hidden=false;$("#ainst").value=id;scrollTo(0,0)};
const dl=(b,n)=>{const a=document.createElement("a");a.href=URL.createObjectURL(b);a.download=n;a.click()},NAMES=["institutions","accounts","scheduled","budgets","records"];
$("#rdl").onclick=()=>dl(new Blob([`<!doctype html><meta charset=utf-8><title>Money report</title><style>body{font:15px system-ui;max-width:700px;margin:20px auto;padding:0 12px}ul{list-style:none;padding:0}li{display:flex;justify-content:space-between;border-bottom:1px solid #ddd;padding:6px 0}small{display:block;color:#666}.bar{display:none}.expense{color:#b42318}</style><h1>Money report, ${$("#rmonth").value}</h1>${$("#rep").innerHTML}`],{type:"text/html"}),"report-"+$("#rmonth").value+".html");
$("#rpr").onclick=()=>print();
$("#bak").onclick=async()=>{try{const j={app:"mywallet",currency:cur};for(const n of NAMES)j[n]=(await getDocs(ucol(n))).docs.map(d=>({id:d.id,...Object.fromEntries(Object.entries(d.data()).map(([k,v])=>[k,v&&v.toDate?{__t:v.toDate().toISOString()}:v]))}));dl(new Blob([JSON.stringify(j)],{type:"application/json"}),"wallet-backup-"+new Date().toISOString().slice(0,10)+".json")}catch(e){bad(e)}};
$("#rbtn").onclick=()=>$("#restore").click();
$("#restore").onchange=async e=>{const f=e.target.files[0];if(!f||!confirm("Restore this backup? Items with the same id will be overwritten."))return;try{const j=JSON.parse(await f.text());for(const n of NAMES)for(const x of j[n]||[]){const{id,...d}=x;await setDoc(uref(n,id),Object.fromEntries(Object.entries(d).map(([k,v])=>[k,v&&v.__t?Timestamp.fromDate(new Date(v.__t)):v])))}alert("Restore complete.")}catch(er){bad(er)}e.target.value=""};$("#scancel").onclick=endSch;
$("#adel").onclick=()=>{if(D.scheduled.some(s=>s.fromId===ea||s.toId===ea))return alert("This account is used in a schedule. Delete or change the schedule first.");if(confirm("Delete this account? Old records that used it will show as unknown."))deleteDoc(uref("accounts",ea)).then(endAcc).catch(bad)};
$("#type").onchange=()=>{const t=$("#type").value==="transfer";$("#to").hidden=!t;$("#cat").hidden=t;};$("#type").onchange();
$("#save").onclick=()=>{const type=$("#type").value,amount=cents($("#amt").value);
if(amount<=0)return alert("Enter an amount greater than zero.");if(!D.accounts.length)return alert("Add an account first.");
if(type==="transfer"&&$("#from").value===$("#to").value)return alert("Choose two different accounts.");
const r={type,amount,accountId:$("#from").value,category:type==="transfer"?"":$("#cat").value,note:$("#note").value,date:Timestamp.fromDate(new Date($("#date").value))};
if(type==="transfer")r.toAccountId=$("#to").value;
apply(r,1,t=>t.set(doc(ucol("records")),{...r,createdAt:serverTimestamp()})).then(()=>{$("#amt").value=$("#note").value="";}).catch(bad);};
$("#addInst").onclick=()=>{if($("#iname").value.trim())add("institutions",{name:$("#iname").value.trim(),kind:$("#ikind").value}).then(()=>$("#iname").value="")};
$("#addAcc").onclick=()=>{if(!$("#ainst").value||!$("#aname").value.trim())return alert("Add an institution and enter an account name.");const t=$("#atype").value,b=Math.abs(cents($("#abal").value)),d={instId:$("#ainst").value,type:t,name:$("#aname").value.trim(),num:$("#anum").value.trim(),balance:DEBT.includes(t)?-b:cents($("#abal").value)};
Promise.resolve(ea?updateDoc(uref("accounts",ea),d):add("accounts",d)).then(endAcc).catch(bad)};
$("#addSch").onclick=()=>{const a=cents($("#samt").value);if(a<=0||!$("#sname").value.trim()||(!$("#sfrom").value&&!$("#sto").value)||$("#sfrom").value===$("#sto").value||!$("#sdate").value)return alert("Enter a name, an amount, a next due date, and different From and To accounts (leave From empty for income, To empty for an expense).");
const d={name:$("#sname").value.trim(),amount:a,fromId:$("#sfrom").value,toId:$("#sto").value,cat:$("#scat").value,freq:$("#sfreq").value,next:$("#sdate").value,total:Math.max(0,parseInt($("#stotal").value)||0),done:Math.max(0,parseInt($("#sdone").value)||0)};
Promise.resolve(es?updateDoc(uref("scheduled",es),d):add("scheduled",d)).then(endSch).catch(bad)};
$("#addBud").onclick=()=>{const l=cents($("#blim").value);if(l>0)add("budgets",{cat:$("#bcat").value,limit:l}).then(()=>$("#blim").value="")};
document.onclick=e=>{const el=e.target.closest("[data-id],[data-s],[data-b],[data-a],[data-e],[data-n]"),d=el?el.dataset:{},r=D.records.find(x=>x.id===d.id);
if(r&&confirm("Delete this record? The balance will be restored."))apply(r,-1,t=>t.delete(uref("records",r.id))).catch(bad);
if(d.s&&confirm("Delete this schedule?"))deleteDoc(uref("scheduled",d.s)).catch(bad);else if(d.e)editSch(D.scheduled.find(x=>x.id===d.e));
if(d.b)deleteDoc(uref("budgets",d.b)).catch(bad);if(d.n)newAcc(d.n);if(d.a)editAcc(D.accounts.find(x=>x.id===d.a));};
