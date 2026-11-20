import{initializeApp}from"https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import{getAuth,onAuthStateChanged,signInWithEmailAndPassword as si,createUserWithEmailAndPassword as su,GoogleAuthProvider,signInWithPopup,signOut}from"https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import{initializeFirestore,persistentLocalCache,doc,getDoc,setDoc,addDoc,deleteDoc,collection,query,orderBy,limit,onSnapshot,runTransaction,serverTimestamp,Timestamp}from"https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
import{firebaseConfig}from"./firebase-config.js";
const app=initializeApp(firebaseConfig),auth=getAuth(app),db=initializeFirestore(app,{localCache:persistentLocalCache()});
const $=s=>document.querySelector(s),esc=s=>String(s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const fmt=n=>(n/100).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2}),cents=v=>Math.round(parseFloat(v||0)*100)||0;
const KINDS=["Bank","Mobile banking","Stock market","Insurance","Cash","Other"],TYPES=["Savings","Current","DPS (recurring deposit)","Fixed deposit","Mobile wallet (MFS)","Investment","Insurance","Loan","Credit card","Cash"],DEBT=["Loan","Credit card"];
const CATS=["Food","Transport","Bills","Rent","Shopping","Health","Education","Entertainment","Savings","Salary","Other"],bad=e=>alert(e.message||e);
let uid,cur="BDT",D={institutions:[],accounts:[],records:[],scheduled:[],budgets:[]},L={},subs=[],due=0;
const show=id=>["auth","onboard","app"].forEach(s=>$("#"+s).hidden=s!==id);
const uref=(...p)=>doc(db,"users",uid,...p),ucol=n=>collection(db,"users",uid,n),add=(n,d)=>addDoc(ucol(n),{...d,createdAt:serverTimestamp()}).catch(bad);
const cred=()=>[auth,$("#email").value.trim(),$("#pass").value],err=e=>$("#err").textContent=e.message;
$("#login").onclick=()=>si(...cred()).catch(err);$("#signup").onclick=()=>su(...cred()).catch(err);
$("#google").onclick=()=>signInWithPopup(auth,new GoogleAuthProvider()).catch(err);$("#out").onclick=()=>signOut(auth);
onAuthStateChanged(auth,async u=>{subs.forEach(f=>f());subs=[];L={};due=0;if(!u)return show("auth");uid=u.uid;const p=(await getDoc(uref())).data();if(!p?.onboarded)return show("onboard");cur=p.currency;run();});
$("#start").onclick=async()=>{try{cur=$("#cur").value.trim().toUpperCase()||"BDT";await setDoc(uref(),{currency:cur,onboarded:true});run();tab("acc");}catch(e){bad(e)}};
const sub=(n,q)=>subs.push(onSnapshot(q||ucol(n),s=>{D[n]=s.docs.map(d=>({id:d.id,...d.data()}));L[n]=1;draw();}));
function run(){show("app");$("#date").valueAsDate=$("#sdate").valueAsDate=new Date();["institutions","accounts","scheduled","budgets"].forEach(n=>sub(n));sub("records",query(ucol("records"),orderBy("date","desc"),limit(300)));}
const tab=t=>{document.querySelectorAll(".tab").forEach(e=>e.hidden=e.id!=="t-"+t);document.querySelectorAll("#nav button").forEach(b=>b.classList.toggle("on",b.dataset.t===t));};
$("#nav").onclick=e=>e.target.dataset.t&&tab(e.target.dataset.t);tab("home");
const o=(l,f=x=>x)=>l.map(x=>`<option>${esc(f(x))}</option>`).join(""),bar=(p,x)=>`<div class="bar"><i class="${x?"over":""}" style="width:${Math.min(100,p||0)}%"></i></div>`;
for(const id of["ikind"])$("#"+id).innerHTML=o(KINDS);$("#atype").innerHTML=o(TYPES);for(const id of["cat","scat","bcat"])$("#"+id).innerHTML=o(CATS);
const nameOf=id=>{const a=D.accounts.find(x=>x.id===id);if(!a)return"?";const i=D.institutions.find(x=>x.id===a.instId);return(i?i.name+" / ":"")+a.name};
const day=r=>r.date.toDate().toISOString().slice(0,10);
function draw(){
if(!due&&L.accounts&&L.scheduled){due=1;runDue();}
const ao=D.accounts.map(a=>`<option value="${a.id}">${esc(nameOf(a.id))}</option>`).join("");
for(const id of["from","to","sfrom","sto"]){const e=$("#"+id),v=e.value;e.innerHTML=(id==="sto"?'<option value="">To: none (expense)</option>':"")+ao;if(v)e.value=v;}
const iv=$("#ainst").value;$("#ainst").innerHTML=D.institutions.map(i=>`<option value="${i.id}">${esc(i.name)}</option>`).join("");if(iv)$("#ainst").value=iv;
const m=new Date().toISOString().slice(0,7),sp={};let inc=0,exp=0,ast=0,dbt=0;
D.accounts.forEach(a=>a.balance>0?ast+=a.balance:dbt+=a.balance);
D.records.forEach(r=>{if(day(r).slice(0,7)!==m)return;if(r.type==="income")inc+=r.amount;if(r.type==="expense"){exp+=r.amount;sp[r.category]=(sp[r.category]||0)+r.amount;}});
$("#net").textContent=fmt(ast+dbt)+" "+cur;$("#ast").textContent=fmt(ast);$("#dbt").textContent=fmt(-dbt);$("#inc").textContent=fmt(inc);$("#exp").textContent=fmt(exp);
$("#cats").innerHTML=Object.entries(sp).sort((a,b)=>b[1]-a[1]).map(([c,v])=>`<li><span>${esc(c)}${bar(v/exp*100)}</span><b>${fmt(v)}</b></li>`).join("")||"<li>No spending this month yet.</li>";
const loose=D.accounts.some(a=>!D.institutions.some(i=>i.id===a.instId));
$("#insts").innerHTML=[...D.institutions,...(loose?[{id:"",name:"Unassigned",kind:"Older accounts"}]:[])].map(i=>{const l=D.accounts.filter(a=>i.id?a.instId===i.id:!D.institutions.some(x=>x.id===a.instId));return`<h4>${esc(i.name)}<small>${esc(i.kind)}, ${fmt(l.reduce((s,a)=>s+a.balance,0))}</small></h4><ul>${l.map(a=>`<li><span>${esc(a.name)}<small>${esc(a.type||"")}</small></span><b class="${a.balance<0?"expense":""}">${fmt(a.balance)}</b></li>`).join("")||"<li>No accounts yet.</li>"}</ul>`}).join("")||"<p class='hint'>Add an institution first, such as a bank, mobile banking or insurance provider.</p>";
$("#recs").innerHTML=D.records.map(r=>`<li><span>${r.type==="transfer"?esc(nameOf(r.accountId))+" to "+esc(nameOf(r.toAccountId)):esc(r.category)+", "+esc(nameOf(r.accountId))}<small>${day(r)} ${esc(r.note||"")}</small></span><b class="${r.type}">${r.type==="expense"?"-":r.type==="income"?"+":""}${fmt(r.amount)}</b><button class="alt" data-id="${r.id}" aria-label="Delete record">×</button></li>`).join("")||"<li>No records yet.</li>";
$("#schs").innerHTML=D.scheduled.map(s=>`<li><span>${esc(s.name)}<small>${esc(nameOf(s.fromId))}${s.toId?" to "+esc(nameOf(s.toId)):", "+esc(s.cat)}, ${s.freq}, next ${s.next}</small></span><b>${fmt(s.amount)}</b><button class="alt" data-s="${s.id}" aria-label="Delete schedule">×</button></li>`).join("")||"<li>No schedules yet.</li>";
$("#buds").innerHTML=D.budgets.map(b=>{const v=sp[b.cat]||0;return`<li><span>${esc(b.cat)}, ${fmt(v)} of ${fmt(b.limit)}${bar(v/b.limit*100,v>b.limit)}</span><button class="alt" data-b="${b.id}" aria-label="Delete budget">×</button></li>`}).join("")||"<li>No budgets yet.</li>";}
const eff=r=>r.type==="income"?r.amount:-r.amount;
async function apply(r,sign,fn){await runTransaction(db,async t=>{
const s=await Promise.all([r.accountId,...(r.type==="transfer"?[r.toAccountId]:[])].map(i=>t.get(uref("accounts",i))));
t.update(s[0].ref,{balance:s[0].data().balance+sign*eff(r)});if(s[1])t.update(s[1].ref,{balance:s[1].data().balance-sign*eff(r)});fn(t);});}
const adv=(d,f)=>{const x=new Date(d);f==="weekly"?x.setUTCDate(x.getUTCDate()+7):f==="yearly"?x.setUTCFullYear(x.getUTCFullYear()+1):x.setUTCMonth(x.getUTCMonth()+1);return x.toISOString().slice(0,10)};
async function runDue(){const today=new Date().toISOString().slice(0,10);
for(const s of D.scheduled){let n=s.next,k=0;while(n<=today&&k++<12){const r={type:s.toId?"transfer":"expense",amount:s.amount,accountId:s.fromId,category:s.toId?"":s.cat,note:"Scheduled: "+s.name,date:Timestamp.fromDate(new Date(n))};if(s.toId)r.toAccountId=s.toId;n=adv(n,s.freq);const nx=n;
try{await apply(r,1,t=>{t.set(doc(ucol("records")),{...r,createdAt:serverTimestamp()});t.update(uref("scheduled",s.id),{next:nx});});}catch(e){bad(e);break}}}}
$("#type").onchange=()=>{const t=$("#type").value==="transfer";$("#to").hidden=!t;$("#cat").hidden=t;};$("#type").onchange();
$("#save").onclick=()=>{const type=$("#type").value,amount=cents($("#amt").value);
if(amount<=0)return alert("Enter an amount greater than zero.");if(!D.accounts.length)return alert("Add an account first.");
if(type==="transfer"&&$("#from").value===$("#to").value)return alert("Choose two different accounts.");
const r={type,amount,accountId:$("#from").value,category:type==="transfer"?"":$("#cat").value,note:$("#note").value,date:Timestamp.fromDate(new Date($("#date").value))};
if(type==="transfer")r.toAccountId=$("#to").value;
apply(r,1,t=>t.set(doc(ucol("records")),{...r,createdAt:serverTimestamp()})).then(()=>{$("#amt").value=$("#note").value="";}).catch(bad);};
$("#addInst").onclick=()=>{if($("#iname").value.trim())add("institutions",{name:$("#iname").value.trim(),kind:$("#ikind").value}).then(()=>$("#iname").value="")};
$("#addAcc").onclick=()=>{if(!$("#ainst").value||!$("#aname").value.trim())return alert("Add an institution and enter an account name.");const t=$("#atype").value,b=Math.abs(cents($("#abal").value));
add("accounts",{instId:$("#ainst").value,type:t,name:$("#aname").value.trim(),balance:DEBT.includes(t)?-b:cents($("#abal").value)}).then(()=>{$("#aname").value=$("#abal").value=""})};
$("#addSch").onclick=()=>{const a=cents($("#samt").value);if(a<=0||!$("#sname").value.trim()||!$("#sfrom").value)return alert("Enter a name, an amount and a source account.");
add("scheduled",{name:$("#sname").value.trim(),amount:a,fromId:$("#sfrom").value,toId:$("#sto").value,cat:$("#scat").value,freq:$("#sfreq").value,next:$("#sdate").value}).then(()=>{$("#sname").value=$("#samt").value=""})};
$("#addBud").onclick=()=>{const l=cents($("#blim").value);if(l>0)add("budgets",{cat:$("#bcat").value,limit:l}).then(()=>$("#blim").value="")};
document.onclick=e=>{const d=e.target.dataset,r=D.records.find(x=>x.id===d.id);
if(r&&confirm("Delete this record? The balance will be restored."))apply(r,-1,t=>t.delete(uref("records",r.id))).catch(bad);
if(d.s&&confirm("Delete this schedule?"))deleteDoc(uref("scheduled",d.s)).catch(bad);if(d.b)deleteDoc(uref("budgets",d.b)).catch(bad);};
