import{initializeApp}from"https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import{getAuth,onAuthStateChanged,signInWithEmailAndPassword as si,createUserWithEmailAndPassword as su,GoogleAuthProvider,signInWithPopup,signOut,sendPasswordResetEmail,deleteUser}from"https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import{initializeFirestore,persistentLocalCache,doc,getDoc,setDoc,addDoc,getDocs,updateDoc,deleteDoc,collection,query,orderBy,where,limit,onSnapshot,runTransaction,serverTimestamp,Timestamp,writeBatch}from"https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
import{firebaseConfig}from"./firebase-config.js";
const app=initializeApp(firebaseConfig),auth=getAuth(app),db=initializeFirestore(app,{localCache:persistentLocalCache()});
const $=s=>document.querySelector(s),esc=s=>String(s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const fmt=n=>(n/100).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2}),cents=v=>{const n=Number.parseFloat(v||0);if(!Number.isFinite(n))return 0;const c=Math.round(n*100);return Number.isSafeInteger(c)?c:0};
const localDate=(d=new Date())=>{const y=d.getFullYear(),m=String(d.getMonth()+1).padStart(2,"0"),day=String(d.getDate()).padStart(2,"0");return `${y}-${m}-${day}`},monthKey=(d=new Date())=>localDate(d).slice(0,7);
const KINDS=["Bank","Mobile banking","Stock market","Insurance","Cash","Other"],TYPES=["Savings","Current","DPS (recurring deposit)","Fixed deposit","Mobile wallet (MFS)","Investment","Insurance","Loan","Credit card","Cash"],DEBT=["Loan","Credit card"];
const CATS=["Food","Transport","Bills","Rent","Shopping","Health","Education","Entertainment","Savings","Salary","Other"],EXTRA=["categories","debts","goals"],bad=e=>alert(e.message||e);
let dueBusy=0,dueAt=0,cfg=null,slT=null,back=6,recSub=null,lim=50,fr=[],ea=null,es=null,uid,cur="BDT",D={institutions:[],accounts:[],records:[],scheduled:[],budgets:[],categories:[],debts:[],goals:[]},L={},subs=[],due=0,autoBackupStarted=false;
const show=id=>["auth","onboard","app"].forEach(s=>$("#"+s).hidden=s!==id);
const uref=(...p)=>doc(db,"users",uid,...p),ucol=n=>collection(db,"users",uid,n),add=(n,d)=>addDoc(ucol(n),{...d,createdAt:serverTimestamp()}).catch(bad);
const cred=()=>[auth,$("#email").value.trim(),$("#pass").value],err=e=>$("#err").textContent=e.message;
$("#login").onclick=()=>si(...cred()).catch(err);$("#signup").onclick=()=>su(...cred()).catch(err);
$("#google").onclick=()=>signInWithPopup(auth,new GoogleAuthProvider()).catch(err);$("#out").onclick=()=>signOut(auth);
onAuthStateChanged(auth,async u=>{subs.forEach(f=>f());subs=[];L={};due=0;autoBackupStarted=false;if(!u)return show("auth");uid=u.uid;try{let p=null;try{p=JSON.parse(localStorage.getItem("mw:p:"+uid))}catch(e){}if(!p){p=(await getDoc(uref())).data();if(p?.onboarded)localStorage.setItem("mw:p:"+uid,JSON.stringify({onboarded:true,currency:p.currency||"BDT"}))}if(!p?.onboarded)return show("onboard");cur=p.currency||"BDT";run();lock();}catch(e){show("auth");err(e)}});
$("#start").onclick=async()=>{try{cur=$("#cur").value.trim().toUpperCase()||"BDT";await setDoc(uref(),{currency:cur,onboarded:true});run();tab("acc");}catch(e){bad(e)}};
const sub=(n,q)=>subs.push(onSnapshot(q||ucol(n),s=>{D[n]=s.docs.map(d=>({id:d.id,...d.data()}));L[n]=1;draw();}));
function run(){show("app");$("#date").value=$("#sdate").value=localDate();["institutions","accounts","scheduled","budgets","categories","debts","goals"].forEach(n=>sub(n));subRec();autoBackupStarted=false;setTimeout(()=>maybeAutoCloudBackup(),5000);loadSite();checkAccount();}
function subRec(){recSub&&recSub();const d=new Date(),from=new Date(d.getFullYear(),d.getMonth()-back+1,1);recSub=onSnapshot(query(ucol("records"),where("date",">=",Timestamp.fromDate(from)),orderBy("date","desc")),s=>{D.records=s.docs.map(x=>({id:x.id,...x.data()}));L.records=1;draw()});subs.push(recSub)}
const themeModes=["auto","light","dark"];
function applyTheme(mode){
  const root=document.documentElement;
  if(mode==="auto")root.removeAttribute("data-theme");else root.setAttribute("data-theme",mode);
  const b=$("#themeToggle");if(b){b.textContent="Theme: "+mode[0].toUpperCase()+mode.slice(1);b.setAttribute("aria-label","Appearance: "+mode);}
  try{localStorage.setItem("mw-theme",mode)}catch(e){}
}
let themeMode="auto";
try{themeMode=themeModes.includes(localStorage.getItem("mw-theme"))?localStorage.getItem("mw-theme"):"auto"}catch(e){}
applyTheme(themeMode);
$("#themeToggle").onclick=()=>{themeMode=themeModes[(themeModes.indexOf(themeMode)+1)%themeModes.length];applyTheme(themeMode)};
document.addEventListener("click",e=>{
 const b=e.target.closest("[data-quick]");if(!b)return;
 const kind=b.dataset.quick;tab("rec");$("#type").value=kind;$("#type").dispatchEvent(new Event("change"));
 $("#date").value=localDate();$("#amt").focus();window.scrollTo({top:0,behavior:"smooth"});
});
const tab=t=>{if(t==="rep"&&back<12&&uid){back=12;subRec()}document.querySelectorAll(".tab").forEach(e=>e.hidden=e.id!=="t-"+t);document.querySelectorAll("#nav button").forEach(b=>b.classList.toggle("on",b.dataset.t===t));};
$("#nav").onclick=e=>e.target.dataset.t&&tab(e.target.dataset.t);tab("home");
const o=(l,f=x=>x)=>l.map(x=>`<option>${esc(f(x))}</option>`).join(""),bar=(p,x)=>`<div class="bar"><i class="${x?"over":""}" style="width:${Math.min(100,p||0)}%"></i></div>`;
for(const id of["ikind"])$("#"+id).innerHTML=o(KINDS);$("#atype").innerHTML=o(TYPES);for(const id of["cat","scat","bcat"])$("#"+id).innerHTML=o(CATS);
$("#bcat").innerHTML=o(["Total",...CATS]);
const cats=()=>[...CATS,...D.categories.map(c=>c.name).filter(n=>!CATS.includes(n))];
const nameOf=id=>{const a=D.accounts.find(x=>x.id===id);if(!a)return"?";const i=D.institutions.find(x=>x.id===a.instId);return(i?i.name+" / ":"")+a.name};
const day=r=>localDate(r.date.toDate());
function draw(){
if(!due&&L.accounts&&L.scheduled){due=1;dueAt=Date.now();runDue();}
const ao=D.accounts.map(a=>`<option value="${a.id}">${esc(nameOf(a.id))}</option>`).join("");
for(const id of["from","to","sfrom","sto"]){const e=$("#"+id),v=e.value;e.innerHTML=(id==="sto"?'<option value="">To: none (expense)</option>':id==="sfrom"?'<option value="">From: none (income)</option>':"")+ao;if(v)e.value=v;}
const fv=$("#rfil").value,cv=$("#rcatfil").value;$("#rfil").innerHTML='<option value="">All accounts</option>'+ao;$("#rfil").value=fv;
const catOptions=cats();$("#rcatfil").innerHTML='<option value="">All categories</option>'+catOptions.map(c=>`<option value="${esc(c)}">${esc(c)}</option>`).join("");$("#rcatfil").value=cv;
for(const[id,pre]of[["cat",[]],["scat",[]],["bcat",["Total"]]]){const e=$("#"+id),v=e.value;e.innerHTML=o([...pre,...cats()]);if(v)e.value=v}
$("#cmgr").innerHTML=D.categories.map(c=>`<li data-c="${c.id}"><span>${esc(c.name)}</span><button class="alt" data-c="${c.id}" aria-label="Delete category">×</button></li>`).join("")||"<li>No custom categories yet.</li>";
const iv=$("#ainst").value;$("#ainst").innerHTML=D.institutions.map(i=>`<option value="${i.id}">${esc(i.name)}</option>`).join("");if(iv)$("#ainst").value=iv;
const m=monthKey(),sp={};let inc=0,exp=0,ast=0,dbt=0;
D.accounts.forEach(a=>a.balance>0?ast+=a.balance:dbt+=a.balance);
D.records.forEach(r=>{if(day(r).slice(0,7)!==m)return;if(r.type==="income")inc+=r.amount;if(r.type==="expense"){exp+=r.amount;sp[r.category]=(sp[r.category]||0)+r.amount;}});
$("#net").textContent=fmt(ast+dbt)+" "+cur;$("#ast").textContent=fmt(ast);$("#dbt").textContent=fmt(-dbt);$("#inc").textContent=fmt(inc);$("#exp").textContent=fmt(exp);$("#cashflow").innerHTML=bars();
$("#cats").innerHTML=Object.entries(sp).sort((a,b)=>b[1]-a[1]).map(([c,v])=>`<li><span>${esc(c)}${bar(v/exp*100)}</span><b>${fmt(v)}</b></li>`).join("")||"<li>No spending this month yet.</li>";
const loose=D.accounts.some(a=>!D.institutions.some(i=>i.id===a.instId));
$("#insts").innerHTML=[...D.institutions,...(loose?[{id:"",name:"Unassigned",kind:"Older accounts"}]:[])].map(i=>{const l=D.accounts.filter(a=>i.id?a.instId===i.id:!D.institutions.some(x=>x.id===a.instId));return`<h4 ${i.id?`data-i="${i.id}"`:""}>${esc(i.name)}<small>${esc(i.kind)}, ${fmt(l.reduce((s,a)=>s+a.balance,0))}</small></h4><div class="tiles">${l.map(a=>`<div class="tile" data-a="${a.id}"><small>${esc(a.name)}</small><b class="${a.balance<0?"expense":""}">${a.balance<0?"-":""}${cur} ${fmt(Math.abs(a.balance))}</b></div>`).join("")}${i.id?`<div class="tile new" data-n="${i.id}">+ Add account</div>`:""}</div>`}).join("")||"<p class='hint'>Add an institution first, such as a bank, mobile banking or insurance provider.</p>";
$("#recs").innerHTML=(fr=D.records.filter(r=>(!$("#rfil").value||r.accountId===$("#rfil").value||r.toAccountId===$("#rfil").value)&&(!$("#rsearch").value||(r.note+" "+r.category+" "+nameOf(r.accountId)+" "+(r.toAccountId?nameOf(r.toAccountId):"")).toLowerCase().includes($("#rsearch").value.toLowerCase()))&&(!$("#rtype").value||r.type===$("#rtype").value)&&(!$("#rcatfil").value||r.category===$("#rcatfil").value)&&(!$("#rfromdate").value||day(r)>=$("#rfromdate").value)&&(!$("#rtodate").value||day(r)<=$("#rtodate").value))).slice(0,lim).map(r=>`<li data-r="${r.id}"><span>${r.type==="transfer"?esc(nameOf(r.accountId))+" to "+esc(nameOf(r.toAccountId)):esc(r.category)+", "+esc(nameOf(r.accountId))}<small>${day(r)} ${esc(r.note||"")}</small></span><b class="${r.type}">${r.type==="expense"?"-":r.type==="income"?"+":""}${fmt(r.amount)}</b><button class="alt" data-id="${r.id}" aria-label="Delete record">×</button></li>`).join("")||"<li>No records yet.</li>";$("#more").textContent=fr.length>lim?"Show more":"Load older records ("+back+" months loaded)";$("#more").hidden=fr.length<=lim&&back>=240;
$("#schs").innerHTML=D.scheduled.map(s=>`<li data-e="${s.id}"><span>${esc(s.name)}<small>${s.fromId?esc(nameOf(s.fromId)):"Income"}${s.toId?" to "+esc(nameOf(s.toId)):", "+esc(s.cat)}, ${s.freq}, ${sline(s)}</small></span><b>${fmt(s.amount)}</b><button class="alt" data-s="${s.id}" aria-label="Delete schedule">×</button></li>`).join("")||"<li>No schedules yet.</li>";
$("#buds").innerHTML=D.budgets.map(b=>{const v=b.cat==="Total"?exp:sp[b.cat]||0,remain=Math.max(0,b.limit-v),pct=Math.round(v/b.limit*100);return`<li class="progress-item"><span><strong>${esc(b.cat)}</strong><small>${fmt(v)} spent of ${fmt(b.limit)} · ${pct}% used</small>${bar(v/b.limit*100,v>b.limit)}<small class="${v>b.limit?"expense":""}">${v>b.limit?fmt(v-b.limit)+" over budget":fmt(remain)+" remaining"}</small></span><button class="alt" data-b="${b.id}" aria-label="Delete budget">×</button></li>`}).join("")||"<li>No budgets yet.</li>";
const today=localDate(),reminderEnd=new Date();reminderEnd.setDate(reminderEnd.getDate()+7);const reminderCutoff=localDate(reminderEnd);
const dueSchedules=D.scheduled.filter(s=>left(s)!==0&&s.next<=reminderCutoff).sort((a,b)=>a.next.localeCompare(b.next));
$("#reminders").innerHTML=dueSchedules.map(s=>{const days=Math.round((new Date(s.next+"T00:00:00")-new Date(today+"T00:00:00"))/864e5),label=days<0?"Overdue by "+Math.abs(days)+" days":days===0?"Due today":"Due in "+days+" days";return`<li><span><strong>${esc(s.name)}</strong><small>${label} · ${fmt(s.amount)}</small></span><button class="alt" data-e="${s.id}">View</button></li>`}).join("")||"<li>No payments due in the next 7 days.</li>";
$("#upc").innerHTML=D.scheduled.filter(s=>left(s)!==0).sort((a,b)=>a.next<b.next?-1:1).slice(0,5).map(s=>`<li><span>${esc(s.name)}<small>${s.next}</small></span><b>${fmt(s.amount)}</b></li>`).join("")||"<li>No upcoming schedules.</li>";$("#alerts").innerHTML=D.budgets.map(b=>{const v=b.cat==="Total"?exp:sp[b.cat]||0,p=v/b.limit*100;return p>=80?`<li><span>${esc(b.cat)} budget<small>${p>=100?"Over budget":"Reached "+Math.round(p)+"%"}: ${fmt(v)} of ${fmt(b.limit)}</small></span></li>`:""}).join("")||"<li>No alerts.</li>";
$("#goals").innerHTML=D.goals.map(g=>{const pct=Math.round(g.saved/g.target*100),remaining=Math.max(0,g.target-g.saved);return`<li class="progress-item"><span><strong>${esc(g.name)}</strong><small>${fmt(g.saved)} saved of ${fmt(g.target)} · ${pct}%</small>${bar(g.saved/g.target*100)}<small>${remaining?fmt(remaining)+" to go":"Goal completed 🎉"}</small><small>Tap the progress area to add savings</small></span><button class="alt" data-gd="${g.id}" aria-label="Delete goal">×</button></li>`}).join("")||"<li>No goals yet.</li>";
let rc=0,ow=0;D.debts.forEach(d=>{const rm=d.amount-d.paid;d.dir==="lent"?rc+=rm:ow+=rm});
$("#debts").innerHTML=`<li><span>You will receive<small>People who owe you</small></span><b class="income">${fmt(rc)}</b></li><li><span>You owe<small>Money you must pay back</small></span><b class="expense">${fmt(ow)}</b></li>`+D.debts.map(d=>`<li data-p="${d.id}"><span>${esc(d.person)}${bar(d.paid/d.amount*100)}<small>${d.dir==="lent"?"Lent":"Borrowed"}, ${fmt(d.paid)} of ${fmt(d.amount)} settled${d.note?", "+esc(d.note):""}. Tap to record a payment</small></span><button class="alt" data-dd="${d.id}" aria-label="Delete">×</button></li>`).join("");
drawSmartInsights();drawRep();}
function drawSmartInsights(){
 const now=new Date(),m=monthKey(),prev=new Date(now.getFullYear(),now.getMonth()-1,1),pm=monthKey(prev);
 let income=0,expense=0,prevExpense=0;const categories={};
 D.records.forEach(r=>{const k=day(r).slice(0,7);if(k===m&&r.type==="income")income+=r.amount;if(k===m&&r.type==="expense"){expense+=r.amount;categories[r.category||"Other"]=(categories[r.category||"Other"]||0)+r.amount;}if(k===pm&&r.type==="expense")prevExpense+=r.amount;});
 const top=Object.entries(categories).sort((a,b)=>b[1]-a[1])[0],over=D.budgets.filter(b=>{const used=b.cat==="Total"?expense:categories[b.cat]||0;return used>=b.limit;});
 const tips=[];
 if(!D.records.length)tips.push("Add your first income or expense to unlock useful financial insights.");
 else if(income===0&&expense>0)tips.push("No income has been recorded this month. Add any missing income to get a clearer cash-flow picture.");
 else if(income>0&&expense>income)tips.push("Your recorded expenses are higher than income this month. Review non-essential spending and upcoming payments.");
 else if(income>0)tips.push(`Your recorded savings this month are ${fmt(Math.max(0,income-expense))} (${Math.round((income-expense)/income*100)}% of income).`);
 if(top)tips.push(`${top[0]} is your highest recorded spending category this month (${fmt(top[1])}).`);
 if(over.length)tips.push(`${over.length} budget${over.length>1?"s are":" is"} at or above the limit. Review the Plan tab.`);
 else if(prevExpense>0&&expense>0)tips.push(expense<prevExpense?`Spending is ${Math.round((prevExpense-expense)/prevExpense*100)}% lower than last month so far.`:`Spending is ${Math.round((expense-prevExpense)/prevExpense*100)}% higher than last month so far.`);
 $("#insights").innerHTML=tips.map(t=>`<li>${esc(t)}</li>`).join("")||"<li>Insights will appear as your financial activity grows.</li>";
}
const eff=r=>r.type==="income"?r.amount:-r.amount;
async function apply(r,sign,fn){await runTransaction(db,async t=>{
const s=await Promise.all([r.accountId,...(r.type==="transfer"?[r.toAccountId]:[])].map(i=>t.get(uref("accounts",i))));
if(s.some(x=>!x.exists()))throw new Error("The selected account no longer exists. Refresh and try again.");
const first=s[0].data().balance+sign*eff(r);if(!Number.isSafeInteger(first))throw new Error("This transaction would exceed the supported balance range.");
t.update(s[0].ref,{balance:first});if(s[1]){const second=s[1].data().balance-sign*eff(r);if(!Number.isSafeInteger(second))throw new Error("This transaction would exceed the supported balance range.");t.update(s[1].ref,{balance:second});}fn(t);});}
const adv=(d,f)=>{const [yy,mm,dd]=d.split("-").map(Number);if(f==="weekly"){const x=new Date(Date.UTC(yy,mm-1,dd+7));return x.toISOString().slice(0,10);}const addMonths=f==="quarterly"?3:f==="yearly"?12:1;const first=new Date(Date.UTC(yy,mm-1+addMonths,1));const last=new Date(Date.UTC(first.getUTCFullYear(),first.getUTCMonth()+1,0)).getUTCDate();return new Date(Date.UTC(first.getUTCFullYear(),first.getUTCMonth(),Math.min(dd,last))).toISOString().slice(0,10)};
async function runDue(){
const today=localDate();
for(const s of D.scheduled){
 let n=s.next,k=0;
 while(n<=today&&k++<12){
  const recordId="schedule_"+s.id+"_"+n, recordRef=doc(ucol("records"),recordId), scheduleRef=uref("scheduled",s.id);
  try{
   const advanced=await runTransaction(db,async t=>{
    const sr=await t.get(scheduleRef);
    if(!sr.exists())return false;
    const live=sr.data();
    if(live.next!==n || (live.total>0&&(live.done||0)>=live.total))return false;
    const rr=await t.get(recordRef);
    if(rr.exists())return false;
    const type=!live.fromId?"income":live.toId?"transfer":"expense";
    const accountIds=[live.fromId||live.toId,...(type==="transfer"?[live.toId]:[])],snaps=[];
    for(const id of accountIds)snaps.push(await t.get(uref("accounts",id)));
    if(snaps.some(x=>!x.exists()))throw new Error("A scheduled payment account no longer exists.");
    const amount=live.amount,sign=type==="income"?1:-1;
    const rec={type,amount,accountId:live.fromId||live.toId,category:type==="transfer"?"":live.cat,note:"Scheduled: "+live.name+(live.total>0?" ("+((live.done||0)+1)+"/"+live.total+")":""),date:Timestamp.fromDate(new Date(n+"T00:00:00Z")),createdAt:serverTimestamp()};
    if(type==="transfer")rec.toAccountId=live.toId;
    t.update(snaps[0].ref,{balance:snaps[0].data().balance+sign*amount});
    if(snaps[1])t.update(snaps[1].ref,{balance:snaps[1].data().balance-sign*amount});
    const next=adv(n,live.freq),done=(live.done||0)+1;
    t.set(recordRef,rec);t.update(scheduleRef,{next,done});return next;
   });
   if(!advanced)break;n=advanced;
  }catch(e){bad(e);break;}
 }
}
}
const left=s=>s.total>0?Math.max(0,s.total-(s.done||0)):null;
function endOf(s){const r=left(s);if(!r)return"";let e=s.next;for(let i=1;i<r;i++)e=adv(e,s.freq);return e}
function sline(s){const r=left(s);if(r===0)return"completed, "+s.total+"/"+s.total+" paid";const e=endOf(s),t=localDate();return (s.done||0)+(s.total>0?"/"+s.total:"")+" paid, next "+s.next+(e?", "+r+" left, ends "+e+" ("+Math.ceil((new Date(e)-new Date(t))/864e5)+" days)":"")}

const PAL=["#0f766e","#3cc4b8","#f59e0b","#ef4444","#6366f1","#ec4899","#84cc16","#0ea5e9","#a855f7","#94a3b8"];
const donut=en=>{const t=en.reduce((s,e)=>s+e[1],0);if(!t)return"<p class='hint'>No data yet.</p>";let o=25;const seg=en.map((e,i)=>{const p=e[1]/t*100,c=`<circle r="15.9155" cx="21" cy="21" fill="none" stroke="${PAL[i%10]}" stroke-width="6" stroke-dasharray="${p} ${100-p}" stroke-dashoffset="${o}"/>`;o-=p;return c}).join("");return`<div class="dn"><svg viewBox="0 0 42 42" role="img" aria-label="Chart">${seg}</svg><ul>${en.map((e,i)=>`<li><span><i class="sw" style="background:${PAL[i%10]}"></i>${esc(e[0])}</span><b>${fmt(e[1])} <small>${Math.round(e[1]/t*100)}%</small></b></li>`).join("")}</ul></div>`};
const lastMonths=n=>{const d=new Date(),a=[];for(let i=n-1;i>=0;i--)a.push(monthKey(new Date(d.getFullYear(),d.getMonth()-i,1)));return a};
const bars=()=>{const ms=lastMonths(6),S=Object.fromEntries(ms.map(k=>[k,[0,0]]));D.records.forEach(r=>{const k=day(r).slice(0,7);if(S[k]&&r.type!=="transfer")S[k][r.type==="income"?0:1]+=r.amount});const mx=Math.max(1,...ms.flatMap(k=>S[k]));
return`<svg class="ch" viewBox="0 0 300 140" role="img" aria-label="Income vs expense">${ms.map((k,i)=>{const x=10+i*48,a=S[k][0]/mx*100,b=S[k][1]/mx*100;return`<rect x="${x}" y="${110-a}" width="18" height="${a}" rx="2" fill="#0f766e"/><rect x="${x+20}" y="${110-b}" width="18" height="${b}" rx="2" fill="#ef4444"/><text x="${x+19}" y="128" text-anchor="middle" font-size="9">${k.slice(2)}</text>`}).join("")}</svg><p class="hint"><i class="sw" style="background:#0f766e;margin-left:0"></i>Income<i class="sw" style="background:#ef4444"></i>Expense</p>`};
const trend=()=>{const ms=lastMonths(12),nw=D.accounts.reduce((s,a)=>s+a.balance,0),v=ms.map(k=>nw-D.records.reduce((s,r)=>r.type!=="transfer"&&day(r).slice(0,7)>k?s+eff(r):s,0)),mn=Math.min(...v),mx=Math.max(...v),y=x=>105-(x-mn)/((mx-mn)||1)*85;
return`<svg class="ch" viewBox="0 0 300 135" role="img" aria-label="Net worth trend"><polyline fill="none" stroke="#0f766e" stroke-width="2" points="${v.map((x,i)=>(10+i*25.4).toFixed(1)+","+y(x).toFixed(1)).join(" ")}"/><text x="10" y="12" font-size="9">${fmt(mx)}</text><text x="10" y="118" font-size="9">${fmt(mn)}</text><text x="10" y="131" font-size="9">${ms[0]}</text><text x="290" y="131" font-size="9" text-anchor="end">${ms[11]}</text></svg>`};
const charts=X=>`<h3>Expense by category</h3>${donut(Object.entries(X).sort((a,b)=>b[1]-a[1]))}<h3>Income vs expense, last 6 months</h3>${bars()}<h3>Net worth trend, 12 months</h3>${trend()}<h3>Assets by account type</h3>${donut(Object.entries(D.accounts.filter(a=>a.balance>0).reduce((o,a)=>(o[a.type||"Other"]=(o[a.type||"Other"]||0)+a.balance,o),{})).sort((a,b)=>b[1]-a[1]))}`;
async function applyEdit(old,nw,id){await runTransaction(db,async t=>{const dx={},ad=(r,s)=>{dx[r.accountId]=(dx[r.accountId]||0)+s*eff(r);if(r.type==="transfer")dx[r.toAccountId]=(dx[r.toAccountId]||0)-s*eff(r)};ad(old,-1);ad(nw,1);
const ids=Object.keys(dx),sn=await Promise.all(ids.map(i=>t.get(uref("accounts",i))));
sn.forEach((s,k)=>{if(!s.exists())throw new Error("An account used by this record no longer exists.");const b=s.data().balance+dx[ids[k]];if(!Number.isSafeInteger(b))throw new Error("Balance out of range.");t.update(s.ref,{balance:b})});
t.set(uref("records",id),{...nw,...(old.createdAt?{createdAt:old.createdAt}:{})})})}
let er=null;
function editRec(r){er=r.id;$("#type").value=r.type;$("#type").onchange();$("#amt").value=r.amount/100;$("#from").value=r.accountId;if(r.toAccountId)$("#to").value=r.toAccountId;if(r.category)$("#cat").value=r.category;$("#date").value=day(r);$("#note").value=r.note||"";$("#save").textContent="Update record";$("#rcancel").hidden=false;scrollTo(0,0)}
const endRec=()=>{er=null;$("#amt").value=$("#note").value="";$("#date").value=localDate();$("#save").textContent="Save record";$("#rcancel").hidden=true};
$("#rcancel").onclick=endRec;const refreshRecordFilters=()=>{lim=50;draw()};
["rsearch","rfil","rtype","rcatfil","rfromdate","rtodate"].forEach(id=>$("#"+id).addEventListener(id==="rsearch"?"input":"change",refreshRecordFilters));
$("#rreset").onclick=()=>{["rsearch","rfil","rtype","rcatfil","rfromdate","rtodate"].forEach(id=>$("#"+id).value="");refreshRecordFilters()};
function editInst(id){const i=D.institutions.find(x=>x.id===id),n=prompt("Rename this institution. Leave empty to delete it (only possible when it has no accounts).",i.name);if(n===null)return;if(n.trim())return updateDoc(uref("institutions",id),{name:n.trim()}).catch(bad);if(D.accounts.some(a=>a.instId===id))return alert("Move or delete its accounts first.");deleteDoc(uref("institutions",id)).catch(bad)}
function reportRange(){
 const mode=$("#rperiod").value||"month";
 if(mode==="year"){
  const y=Math.max(2000,Math.min(2100,Number($("#ryear").value)||new Date().getFullYear()));
  $("#ryear").value=y;
  return {mode,key:String(y),label:String(y),start:`${y}-01-01`,end:`${y}-12-31`,year:y};
 }
 const m=$("#rmonth").value||monthKey();$("#rmonth").value=m;
 const [y,mo]=m.split("-").map(Number),last=new Date(y,mo,0).getDate();
 return {mode,key:m,label:m,start:`${m}-01`,end:`${m}-${String(last).padStart(2,"0")}`,year:y};
}
function drawRep(){
 const range=reportRange();
 const need=(new Date().getFullYear()-range.year)*12+new Date().getMonth()+2-(range.mode==="month"?Number(range.key.slice(5)):1);
 if(need>back){back=need;subRec();}
 const A=D.accounts,sm=l=>l.reduce((s,a)=>s+a.balance,0),I={},X={},byMonth={};let ti=0,te=0;
 const selected=D.records.filter(r=>{const d=day(r);return d>=range.start&&d<=range.end&&r.type!=="transfer"});
 selected.forEach(r=>{const o=r.type==="income"?I:X;o[r.category]=(o[r.category]||0)+r.amount;if(r.type==="income")ti+=r.amount;else te+=r.amount;const k=day(r).slice(0,7);if(!byMonth[k])byMonth[k]={income:0,expense:0};byMonth[k][r.type]+=r.amount});
 const li=(a,b,c,x)=>`<li><span>${a}${c?`<small>${c}</small>`:""}</span><b class="${x||""}">${b}</b></li>`,H=t=>`<h3>${t}</h3>`,nl=o=>Object.entries(o).sort((a,b)=>b[1]-a[1]).map(([k,v])=>li(esc(k),fmt(v))).join("");
 const pr=a=>{const z=D.scheduled.find(x=>x.toId===a.id);return z?esc(z.freq)+" "+fmt(z.amount)+", "+sline(z):""};
 const dep=A.filter(a=>["Savings","Current","DPS (recurring deposit)","Fixed deposit"].includes(a.type)),ln=A.filter(a=>DEBT.includes(a.type));
 const ast=A.reduce((s,a)=>a.balance>0?s+a.balance:s,0),dbt=sm(A)-ast,net=ti-te,rate=ti?Math.round(net/ti*100):0;
 const catRows=Object.entries(X).sort((a,b)=>b[1]-a[1]);
 const trend=range.mode==="year"?Object.entries(byMonth).sort((a,b)=>a[0].localeCompare(b[0])).map(([k,v])=>li(esc(k),fmt(v.income-v.expense),`Income ${fmt(v.income)} · Expense ${fmt(v.expense)}`,v.income>=v.expense?"income":"expense")).join(""):"";
 $("#rep").innerHTML=`<div class="report-title"><p class="eyebrow">MONEY TRACKER · FINANCIAL SUMMARY</p><h2>${range.mode==="year"?"Yearly":"Monthly"} report · ${esc(range.label)}</h2><p class="hint">${selected.length} income / expense transactions included · ${cur}</p></div>`
 +H("Income and expense overview")+`<div class="report-kpis"><div><small>Total income</small><b class="income">${fmt(ti)}</b></div><div><small>Total expenses</small><b class="expense">${fmt(te)}</b></div><div><small>Net cash flow</small><b class="${net>=0?"income":"expense"}">${fmt(net)}</b></div><div><small>Saving rate</small><b>${rate}%</b></div></div>`
 +H("Expense by category")+donut(catRows)
 +(range.mode==="year"?H("Monthly cash flow")+`<ul>${trend||"<li>No transactions in this year.</li>"}</ul>`:"")
 +H("Income by category")+`<ul>${nl(I)||"<li>No income in this period.</li>"}</ul>`
 +H("Expense by category details")+`<ul>${nl(X)||"<li>No expenses in this period.</li>"}</ul>`
 +H("Budget performance")+`<ul>${D.budgets.map(b=>{const v=b.cat==="Total"?te:X[b.cat]||0,remain=b.limit-v;return li(esc(b.cat)+bar(v/b.limit*100,v>b.limit),fmt(remain),`${fmt(v)} spent of ${fmt(b.limit)} · ${Math.round(v/b.limit*100)}% used${v>b.limit?" · over budget":" remaining"}`,v>b.limit?"expense":"")}).join("")||"<li>No budgets set.</li>"}</ul>`
 +H("Current account snapshot")+`<p class="hint">Balances below are current balances, not historical balances for the selected report period.</p><ul>${li("Assets",fmt(ast))}${li("Debts",fmt(-dbt),"","expense")}${li("Current net worth",fmt(ast+dbt),"","tot")}${li("Deposits",fmt(sm(dep)))}${li("Accounts",A.length)}${li("Institutions",D.institutions.length)}</ul>`
 +H("By institution")+`<ul>${D.institutions.map(i=>{const l=A.filter(a=>a.instId===i.id);return li(esc(i.name),fmt(sm(l)),esc(i.kind)+", "+l.length+" accounts")}).join("")||"<li>No institutions.</li>"}</ul>`
 +H("By account")+`<ul>${A.map(a=>li(esc(nameOf(a.id)),fmt(a.balance),esc(a.type||"")+(a.num?", "+esc(a.num):""),a.balance<0?"expense":"")).join("")||"<li>No accounts.</li>"}</ul>`
 +H("Deposit summary")+`<ul>${dep.map(a=>li(esc(a.name),fmt(a.balance),esc(a.type)+(pr(a)?", "+pr(a):""))).join("")||"<li>No deposit accounts.</li>"}</ul>`
 +H("Loan and credit card summary")+`<ul>${ln.map(a=>li(esc(a.name),fmt(-a.balance),esc(a.type)+(pr(a)?", "+pr(a):""),"expense")).join("")||"<li>No loans or cards.</li>"}</ul>`;
}
const refreshReport=()=>drawRep();
$("#rperiod").onchange=()=>{const y=new Date().getFullYear();$("#rmonth").hidden=$("#rperiod").value==="year";$("#ryear").hidden=$("#rperiod").value!=="year";if($("#rperiod").value==="year")$("#ryear").value=y;refreshReport()};
$("#rmonth").onchange=refreshReport;$("#ryear").onchange=refreshReport;
$("#rcsv").onclick=()=>{const range=reportRange(),rows=[["period","type","category","account","to_account","amount","note"],...D.records.filter(r=>day(r)>=range.start&&day(r)<=range.end).map(r=>[day(r),r.type,r.category||"",nameOf(r.accountId),r.toAccountId?nameOf(r.toAccountId):"",r.amount/100,r.note||""])],q=c=>'"'+String(c).replace(/"/g,'""')+'"';dl(new Blob([rows.map(r=>r.map(q).join(",")).join("\n")],{type:"text/csv;charset=utf-8"}),`money-report-${range.key}.csv`)};

function editAcc(a){ea=a.id;$("#ainst").value=a.instId||"";$("#atype").value=a.type||TYPES[0];$("#aname").value=a.name;$("#anum").value=a.num||"";$("#abal").value=Math.abs(a.balance)/100;$("#accForm").hidden=false;$("#addAcc").textContent="Update account";$("#acancel").hidden=$("#adel").hidden=false;scrollTo(0,0)}
const endAcc=()=>{$("#accForm").hidden=true;ea=null;["aname","anum","abal"].forEach(i=>$("#"+i).value="");$("#addAcc").textContent="Add account";$("#acancel").hidden=$("#adel").hidden=true};
function editSch(s){es=s.id;$("#sname").value=s.name;$("#samt").value=s.amount/100;$("#sfrom").value=s.fromId||"";$("#sto").value=s.toId||"";$("#scat").value=s.cat;$("#sfreq").value=s.freq;$("#sdate").value=s.next;$("#stotal").value=s.total||0;$("#sdone").value=s.done||0;$("#addSch").textContent="Update schedule";$("#scancel").hidden=false;scrollTo(0,0)}
const endSch=()=>{es=null;$("#sname").value=$("#samt").value="";$("#stotal").value=$("#sdone").value=0;$("#addSch").textContent="Add schedule";$("#scancel").hidden=true};
$("#acancel").onclick=endAcc;
$("#showInst").onclick=()=>$("#instForm").hidden=!$("#instForm").hidden;
const newAcc=id=>{endAcc();$("#accForm").hidden=false;$("#ainst").value=id;scrollTo(0,0)};
const dl=(b,n)=>{const a=document.createElement("a");a.href=URL.createObjectURL(b);a.download=n;a.click()},NAMES=["institutions","accounts","scheduled","budgets","records"];
$("#rdl").onclick=()=>{const range=reportRange();dl(new Blob([`<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Money report ${range.label}</title><style>body{font:15px system-ui;max-width:760px;margin:24px auto;padding:0 16px;color:#172337}ul{list-style:none;padding:0}li{display:flex;justify-content:space-between;gap:12px;border-bottom:1px solid #ddd;padding:8px 0}small{display:block;color:#667085}.bar{display:none}.dn{display:flex;gap:12px;flex-wrap:wrap}.dn svg{width:150px}.sw{display:inline-block;width:10px;height:10px;margin:0 6px}.expense{color:#b42318}.income{color:#087f68}.report-kpis{display:grid;grid-template-columns:repeat(2,1fr);gap:10px}.report-kpis>div{border:1px solid #ddd;border-radius:12px;padding:12px}.report-kpis small,.report-kpis b{display:block}</style><h1>Money Tracker</h1>${$("#rep").innerHTML}</html>`],{type:"text/html"}),`money-report-${range.key}.html`)};
$("#rpr").onclick=()=>{const old=document.title,range=reportRange();document.title=`Money Tracker Report ${range.label}`;document.body.classList.add("print-report");const done=()=>{document.title=old;document.body.classList.remove("print-report");window.removeEventListener("afterprint",done)};window.addEventListener("afterprint",done,{once:true});print();setTimeout(done,30000)};
$("#bak").onclick=async()=>{try{const j={app:"mywallet",currency:cur};for(const n of[...NAMES,...EXTRA])j[n]=(await getDocs(ucol(n))).docs.map(d=>({id:d.id,...Object.fromEntries(Object.entries(d.data()).map(([k,v])=>[k,v&&v.toDate?{__t:v.toDate().toISOString()}:v]))}));dl(new Blob([JSON.stringify(j)],{type:"application/json"}),"wallet-backup-"+localDate()+".json")}catch(e){bad(e)}};
// Version 2.0 cloud backup: chunked documents stay below Firestore's 1 MiB document limit.
const CLOUD_BACKUPS="cloudBackups",CLOUD_CHUNK_CHARS=450000;
const encodeBackupValue=v=>v instanceof Timestamp?{__t:v.toDate().toISOString()}:Array.isArray(v)?v.map(encodeBackupValue):v&&typeof v==="object"?Object.fromEntries(Object.entries(v).map(([k,x])=>[k,encodeBackupValue(x)])):v;
const decodeBackupValue=v=>Array.isArray(v)?v.map(decodeBackupValue):v&&typeof v==="object"?(typeof v.__t==="string"?Timestamp.fromDate(new Date(v.__t)):Object.fromEntries(Object.entries(v).map(([k,x])=>[k,decodeBackupValue(x)]))):v;
async function collectBackup(){const j={app:"mywallet",schemaVersion:2,currency:cur,createdAtISO:new Date().toISOString()};for(const n of[...NAMES,...EXTRA])j[n]=(await getDocs(ucol(n))).docs.map(d=>({id:d.id,...encodeBackupValue(d.data())}));return j;}
async function createCloudBackup(kind="manual"){
 if(!uid||!navigator.onLine)throw new Error("Connect to the internet and sign in before creating a cloud backup.");
 const data=JSON.stringify(await collectBackup()),parts=[];for(let i=0;i<data.length;i+=CLOUD_CHUNK_CHARS)parts.push(data.slice(i,i+CLOUD_CHUNK_CHARS));
 const ref=doc(ucol(CLOUD_BACKUPS));await setDoc(ref,{status:"uploading",kind,chunkCount:parts.length,sizeBytes:new Blob([data]).size,createdAt:serverTimestamp(),createdAtMs:Date.now(),schemaVersion:2});
 try{for(let i=0;i<parts.length;i+=400){const batch=writeBatch(db);parts.slice(i,i+400).forEach((part,j)=>batch.set(doc(collection(ref,"chunks"),String(i+j).padStart(6,"0")),{index:i+j,payload:part}));await batch.commit();}
  await updateDoc(ref,{status:"complete",completedAt:serverTimestamp()});
 }catch(e){try{await updateDoc(ref,{status:"failed",errorAt:serverTimestamp()})}catch(_){}throw e;}
 try{await pruneCloudBackups()}catch(e){console.warn("Cloud backup retention cleanup could not finish",e)}return ref.id;
}
async function pruneCloudBackups(){const snap=await getDocs(query(ucol(CLOUD_BACKUPS),orderBy("createdAt","desc")));const old=snap.docs.filter(d=>d.data().status==="complete").slice(4);for(const d of old){const chunks=await getDocs(collection(d.ref,"chunks"));for(let i=0;i<chunks.docs.length;i+=400){const b=writeBatch(db);chunks.docs.slice(i,i+400).forEach(x=>b.delete(x.ref));await b.commit();}await deleteDoc(d.ref);}}
async function maybeAutoCloudBackup(){if(autoBackupStarted||!uid||!navigator.onLine)return;autoBackupStarted=true;const lk="mw:bk:"+uid;if(Date.now()-(+localStorage.getItem(lk)||0)<14*864e5)return;try{const latest=await getDocs(query(ucol(CLOUD_BACKUPS),orderBy("createdAt","desc"),limit(1)));const d=latest.docs[0]?.data();if(d?.status==="complete"&&Date.now()-(d.createdAtMs||0)<14*864e5){localStorage.setItem(lk,d.createdAtMs||Date.now());return}const id=await createCloudBackup("automatic");localStorage.setItem(lk,Date.now());$("#cloudStatus").textContent="Automatic cloud backup completed · "+new Date().toLocaleString();}catch(e){$("#cloudStatus").textContent="Automatic backup not completed: "+(e.message||"Please try again later.");} }
window.addEventListener("online",()=>{autoBackupStarted=false;maybeAutoCloudBackup()});
$("#cloudBackup").onclick=async()=>{const b=$("#cloudBackup");b.disabled=true;$("#cloudStatus").textContent="Creating cloud backup…";try{const id=await createCloudBackup("manual");$("#cloudStatus").textContent="Cloud backup completed successfully.";alert("Cloud backup completed.");}catch(e){bad(e);$("#cloudStatus").textContent="Cloud backup failed: "+(e.message||e);}finally{b.disabled=false;}};
async function restoreLatestCloudBackup(){if(!uid||!navigator.onLine)return alert("Connect to the internet first.");const snap=await getDocs(query(ucol(CLOUD_BACKUPS),orderBy("createdAt","desc"),limit(20))),backup=snap.docs.find(d=>d.data().status==="complete");if(!backup)return alert("No completed cloud backup was found.");const meta=backup.data(),chunks=await getDocs(query(collection(backup.ref,"chunks"),orderBy("index")));if(chunks.size!==meta.chunkCount||chunks.docs.some((d,i)=>d.data().index!==i||typeof d.data().payload!=="string"))throw new Error("Cloud backup is incomplete. Your current data has not been changed.");const raw=chunks.docs.map(d=>d.data().payload).join(""),j=JSON.parse(raw),allowed=[...NAMES,...EXTRA];if(!j||j.app!=="mywallet"||!allowed.every(n=>Array.isArray(j[n])))throw new Error("Cloud backup validation failed. Your current data has not been changed.");
 const jobs=[];for(const n of allowed)for(const x of j[n]){if(!x||typeof x.id!=="string"||!/^[A-Za-z0-9_-]{1,128}$/.test(x.id))throw new Error("Cloud backup contains an invalid item ID.");const{id,...rawData}=x;jobs.push({ref:uref(n,id),data:decodeBackupValue(rawData)});}
 if(!confirm("Restore the latest cloud backup? Matching IDs will be overwritten; all existing items not present in this backup will remain. Your current data will not be deleted."))return;
 for(let i=0;i<jobs.length;i+=450){const batch=writeBatch(db);jobs.slice(i,i+450).forEach(x=>batch.set(x.ref,x.data));await batch.commit();}if(typeof j.currency==="string"&&/^[A-Z]{3}$/.test(j.currency)){cur=j.currency;await setDoc(uref(),{currency:cur,onboarded:true},{merge:true});}alert("Cloud restore completed. Reloading your wallet.");location.reload();
}
$("#cloudRestore").onclick=()=>restoreLatestCloudBackup().catch(bad);
$("#rbtn").onclick=()=>$("#restore").click();
$("#restore").onchange=async e=>{const f=e.target.files[0];if(!f)return;try{
const j=JSON.parse(await f.text()),allowed=["institutions","accounts","scheduled","budgets","records"];
if(!j||j.app!=="mywallet"||!allowed.every(n=>Array.isArray(j[n])))throw new Error("This is not a valid My Wallet backup.");
const ids=new Set();
for(const n of[...allowed,...EXTRA])for(const x of j[n]||[]){
 if(!x||typeof x!=="object"||typeof x.id!=="string"||!/^[A-Za-z0-9_-]{1,128}$/.test(x.id))throw new Error("Backup contains an invalid item ID.");
 const key=n+"/"+x.id;if(ids.has(key))throw new Error("Backup contains duplicate IDs.");ids.add(key);
 if(n==="records"&&(!Number.isSafeInteger(x.amount)||x.amount<=0||!["income","expense","transfer"].includes(x.type)))throw new Error("Backup contains an invalid transaction.");
 if(n==="accounts"&&!Number.isSafeInteger(x.balance))throw new Error("Backup contains an invalid account balance.");
 if(n==="scheduled"&&(!Number.isSafeInteger(x.amount)||x.amount<=0||typeof x.next!=="string"||!/^\d{4}-\d{2}-\d{2}$/.test(x.next)))throw new Error("Backup contains an invalid schedule.");
 if(n==="budgets"&&(!Number.isSafeInteger(x.limit)||x.limit<=0))throw new Error("Backup contains an invalid budget.");
}
if(!confirm("Restore this validated backup? Items with matching IDs will be overwritten. Existing items not present in the backup will remain."))return;
const jobs=[];for(const n of[...allowed,...EXTRA])for(const x of j[n]||[]){const{id,...raw}=x;const d=Object.fromEntries(Object.entries(raw).map(([k,v])=>[k,v&&v.__t?Timestamp.fromDate(new Date(v.__t)):v]));jobs.push({ref:uref(n,id),data:d});}
for(let i=0;i<jobs.length;i+=450){const batch=writeBatch(db);for(const job of jobs.slice(i,i+450))batch.set(job.ref,job.data);await batch.commit();}
if(typeof j.currency==="string"&&/^[A-Z]{3}$/.test(j.currency)){cur=j.currency;await setDoc(uref(),{currency:cur,onboarded:true},{merge:true});}
alert("Restore complete. Reloading your wallet...");location.reload();
}catch(er){bad(er)}finally{e.target.value=""}};$("#scancel").onclick=endSch;
$("#adel").onclick=()=>{if(D.scheduled.some(s=>s.fromId===ea||s.toId===ea))return alert("This account is used in a schedule. Delete or change the schedule first.");if(D.records.some(r=>r.accountId===ea||r.toAccountId===ea))return alert("This account has transaction history. Keep it to preserve your financial records; you can rename it instead.");if(confirm("Delete this account?"))deleteDoc(uref("accounts",ea)).then(endAcc).catch(bad)};
$("#type").onchange=()=>{const t=$("#type").value==="transfer";$("#to").hidden=!t;$("#cat").hidden=t;};$("#type").onchange();
$("#save").onclick=()=>{const type=$("#type").value,amount=cents($("#amt").value);
if(amount<=0||!Number.isSafeInteger(amount))return alert("Enter a valid amount greater than zero (maximum supported amount is limited for safe calculations).");if(!$("#date").value)return alert("Choose a transaction date.");if(!D.accounts.length)return alert("Add an account first.");
if(type==="transfer"&&$("#from").value===$("#to").value)return alert("Choose two different accounts.");
const r={type,amount,accountId:$("#from").value,category:type==="transfer"?"":$("#cat").value,note:$("#note").value,date:Timestamp.fromDate(new Date($("#date").value))};
if(type==="transfer")r.toAccountId=$("#to").value;
(er?applyEdit(D.records.find(x=>x.id===er),r,er):apply(r,1,t=>t.set(doc(ucol("records")),{...r,createdAt:serverTimestamp()}))).then(endRec).catch(bad);};
$("#addInst").onclick=()=>{if($("#iname").value.trim())add("institutions",{name:$("#iname").value.trim(),kind:$("#ikind").value}).then(()=>$("#iname").value="")};
$("#addAcc").onclick=()=>{if(!$("#ainst").value||!$("#aname").value.trim())return alert("Add an institution and enter an account name.");const t=$("#atype").value,b=Math.abs(cents($("#abal").value)),d={instId:$("#ainst").value,type:t,name:$("#aname").value.trim(),num:$("#anum").value.trim(),balance:DEBT.includes(t)?-b:cents($("#abal").value)};
Promise.resolve(ea?updateDoc(uref("accounts",ea),d):add("accounts",d)).then(endAcc).catch(bad)};
$("#addSch").onclick=()=>{const a=cents($("#samt").value);if(a<=0||!$("#sname").value.trim()||(!$("#sfrom").value&&!$("#sto").value)||$("#sfrom").value===$("#sto").value||!$("#sdate").value)return alert("Enter a name, an amount, a next due date, and different From and To accounts (leave From empty for income, To empty for an expense).");
const d={name:$("#sname").value.trim(),amount:a,fromId:$("#sfrom").value,toId:$("#sto").value,cat:$("#scat").value,freq:$("#sfreq").value,next:$("#sdate").value,total:Math.max(0,parseInt($("#stotal").value)||0),done:Math.max(0,parseInt($("#sdone").value)||0)};
Promise.resolve(es?updateDoc(uref("scheduled",es),d):add("scheduled",d)).then(endSch).catch(bad)};
$("#addBud").onclick=()=>{const l=cents($("#blim").value),ex=D.budgets.find(b=>b.cat===$("#bcat").value);if(l>0)Promise.resolve(ex?updateDoc(uref("budgets",ex.id),{limit:l}):add("budgets",{cat:$("#bcat").value,limit:l})).then(()=>$("#blim").value="")};
$("#forgot").onclick=()=>{const m=$("#email").value.trim();if(!m)return err({message:"Enter your email above first."});sendPasswordResetEmail(auth,m).then(()=>err({message:"Password reset email sent. Check your inbox and spam folder."})).catch(err)};
$("#pwreset").onclick=()=>auth.currentUser?.email&&sendPasswordResetEmail(auth,auth.currentUser.email).then(()=>alert("Password reset email sent.")).catch(bad);
$("#setb").onclick=()=>{tab("set");loadMsgs()};$("#more").onclick=()=>{if(fr.length>lim)lim+=50;else{back+=12;subRec()}draw()};
$("#addCat").onclick=()=>{const n=$("#cname").value.trim();if(!n||cats().some(c=>c.toLowerCase()===n.toLowerCase()))return alert("Enter a new category name.");add("categories",{name:n}).then(()=>$("#cname").value="")};
$("#delAll").onclick=async()=>{if(prompt("This permanently deletes your account and ALL your data. Type DELETE to confirm.")!=="DELETE")return;const u=auth.currentUser;if(Date.now()-new Date(u.metadata.lastSignInTime)>4*60*1000)return alert("For security, sign out, sign in again, then retry within a few minutes.");
try{subs.forEach(f=>f());subs=[];const cloud=await getDocs(ucol(CLOUD_BACKUPS));for(const backup of cloud.docs){const chunks=await getDocs(collection(backup.ref,"chunks"));for(let i=0;i<chunks.docs.length;i+=400){const b=writeBatch(db);chunks.docs.slice(i,i+400).forEach(d=>b.delete(d.ref));await b.commit()}await deleteDoc(backup.ref)}for(const n of[...NAMES,...EXTRA]){const s=await getDocs(ucol(n));for(let i=0;i<s.docs.length;i+=450){const b=writeBatch(db);s.docs.slice(i,i+450).forEach(d=>b.delete(d.ref));await b.commit()}}try{const ms=await getDocs(query(collection(db,"messages"),where("uid","==",uid)));for(const d of ms.docs)await deleteDoc(d.ref)}catch(e){}try{await deleteDoc(doc(db,"profiles",uid))}catch(e){}await deleteDoc(uref());await deleteUser(u);Object.keys(localStorage).filter(k=>k.startsWith("mw")&&k.includes(uid)).forEach(k=>localStorage.removeItem(k));alert("Your account and data were deleted.")}catch(e){bad(e)}};
let tt;const toast=(m,undo)=>{const e=$("#toast");e.innerHTML=esc(m)+(undo?' <button id="undo">Undo</button>':"");e.hidden=false;if(undo)$("#undo").onclick=()=>{e.hidden=true;undo()};clearTimeout(tt);tt=setTimeout(()=>e.hidden=true,7000)};
const bump=(col,id,field,cap,label)=>{const it=D[col].find(x=>x.id===id),v=cents(prompt(label));if(v<=0)return;updateDoc(uref(col,id),{[field]:Math.min(cap(it),it[field]+v)}).catch(bad)};
$("#addGoal").onclick=()=>{const t=cents($("#gtarget").value),n=$("#gname").value.trim();if(!n||t<=0)return alert("Enter a goal name and a target amount.");add("goals",{name:n,target:t,saved:0}).then(()=>{$("#gname").value=$("#gtarget").value=""})};
$("#addDebt").onclick=()=>{const a=cents($("#damt").value),n=$("#dwho").value.trim();if(!n||a<=0)return alert("Enter a person and an amount.");add("debts",{person:n,dir:$("#ddir").value,amount:a,paid:0,note:$("#dnote").value.trim()}).then(()=>{$("#dwho").value=$("#damt").value=$("#dnote").value=""})};
const lk=()=>"mwpin:"+uid,H=async p=>[...new Uint8Array(await crypto.subtle.digest("SHA-256",new TextEncoder().encode("mw:"+uid+p)))].map(b=>b.toString(16).padStart(2,"0")).join("");
function lock(){if(uid&&localStorage.getItem(lk())){$("#lock").hidden=false;$("#pin").value="";$("#pinerr").textContent="";$("#pin").focus()}}
$("#unlock").onclick=async()=>{if(await H($("#pin").value)===localStorage.getItem(lk()))$("#lock").hidden=true;else $("#pinerr").textContent="Wrong PIN."};
$("#setpin").onclick=async()=>{const p=prompt("Choose a 4 to 8 digit PIN");if(!p)return;if(!/^\d{4,8}$/.test(p))return alert("PIN must be 4 to 8 digits.");localStorage.setItem(lk(),await H(p));alert("PIN saved on this device.")};
$("#rmpin").onclick=()=>{localStorage.removeItem(lk());alert("PIN removed.")};
$("#forgotpin").onclick=()=>{localStorage.removeItem(lk());$("#lock").hidden=true;signOut(auth)};
let hid=0;document.addEventListener("visibilitychange",()=>{if(document.hidden)hid=Date.now();else if(hid&&Date.now()-hid>30000)lock()});
document.onclick=e=>{const el=e.target.closest("[data-id],[data-s],[data-b],[data-a],[data-e],[data-n],[data-r],[data-i],[data-c],[data-g],[data-gd],[data-p],[data-dd]"),d=el?el.dataset:{},r=D.records.find(x=>x.id===d.id);
if(r&&confirm("Delete this record? The balance will be restored."))apply(r,-1,t=>t.delete(uref("records",r.id))).then(()=>toast("Record deleted.",()=>{const{id,...x}=r;apply(x,1,t=>t.set(uref("records",id),x)).catch(bad)})).catch(bad);
if(d.s&&confirm("Delete this schedule?"))deleteDoc(uref("scheduled",d.s)).catch(bad);else if(d.e)editSch(D.scheduled.find(x=>x.id===d.e));
if(d.b)deleteDoc(uref("budgets",d.b)).catch(bad);if(d.c&&confirm("Delete this category? Existing records keep its name."))deleteDoc(uref("categories",d.c)).catch(bad);if(d.g)bump("goals",d.g,"saved",x=>x.target,"Amount to add to this goal:");if(d.p)bump("debts",d.p,"paid",x=>x.amount,"Payment amount received or paid:");if(d.gd&&confirm("Delete this goal?"))deleteDoc(uref("goals",d.gd)).catch(bad);if(d.dd&&confirm("Delete this entry?"))deleteDoc(uref("debts",d.dd)).catch(bad);if(d.r)editRec(D.records.find(x=>x.id===d.r));if(d.i)editInst(d.i);if(d.n)newAcc(d.n);if(d.a)editAcc(D.accounts.find(x=>x.id===d.a));};

document.addEventListener("visibilitychange",()=>{if(!document.hidden&&uid&&L.accounts&&L.scheduled&&!dueBusy&&Date.now()-dueAt>60000){dueBusy=1;dueAt=Date.now();runDue().catch(()=>{}).finally(()=>dueBusy=0)}});
const cacheOk=(k,h)=>{const t=+localStorage.getItem(k)||0;if(Date.now()-t<h*36e5)return true;localStorage.setItem(k,Date.now());return false};
async function loadSite(){const k="mw:site";try{const c=JSON.parse(localStorage.getItem(k)||"null");if(c&&Date.now()-c.t<6*36e5){cfg=c.d;drawSite();return}}catch(e){}
try{const s=await getDoc(doc(db,"site","config"));cfg=s.exists()?s.data():null;localStorage.setItem(k,JSON.stringify({t:Date.now(),d:cfg&&{notice:cfg.notice,noticeOn:cfg.noticeOn,slides:cfg.slides}}))}catch(e){cfg=null}drawSite()}
function drawSite(){const on=cfg&&cfg.noticeOn&&cfg.notice;$("#ticker").hidden=!on;if(on){$("#tkText").textContent=cfg.notice;$("#tkText").style.animationDuration=Math.max(14,cfg.notice.length*.4)+"s"}
const sl=((cfg&&cfg.slides)||[]).filter(x=>x.active!==false&&(x.title||x.text)),box=$("#slides");clearInterval(slT);$("#slidesWrap").hidden=!sl.length;
box.innerHTML=sl.map(x=>{const l=/^https:\/\//.test(x.link||""),c=/^#[0-9a-f]{6}$/i.test(x.color||"")?x.color:"#0f766e",t=l?`a href="${esc(x.link)}" target="_blank" rel="noopener noreferrer"`:"div";return`<${t} class="slide" style="--c:${c}">${x.tag?`<em>${esc(x.tag)}</em>`:""}<b>${esc(x.title||"")}</b><span>${esc(x.text||"")}</span>${l?"<small>Learn more →</small>":""}</${l?"a":"div"}>`}).join("");
$("#dots").innerHTML=sl.length>1?sl.map((_,i)=>`<i class="${i?"":"on"}"></i>`).join(""):"";
box.onscroll=()=>{const n=Math.round(box.scrollLeft/box.clientWidth);[...$("#dots").children].forEach((d,i)=>d.classList.toggle("on",i===n))};
if(sl.length>1)slT=setInterval(()=>{if(document.hidden)return;const w=box.clientWidth,n=Math.round(box.scrollLeft/w);box.scrollTo({left:((n+1)%sl.length)*w,behavior:"smooth"})},5000)}
async function checkAccount(){if(cacheOk("mw:chk:"+uid,6)){$("#adminBtn").hidden=localStorage.getItem("mw:adm:"+uid)!=="1";return}try{const pr=doc(db,"profiles",uid),s=await getDoc(pr),d=s.exists()?s.data():null;
if(d&&d.blocked){alert("Your account has been suspended. Please contact the administrator.");localStorage.removeItem("mw:chk:"+uid);signOut(auth);return}
const em=auth.currentUser.email||"";
if(!d)await setDoc(pr,{email:em,createdAt:serverTimestamp(),lastSeen:serverTimestamp(),blocked:false,note:"",appVersion:"2.4.0"});
else if(Date.now()-(d.lastSeen?.toMillis?.()||0)>24*3600*1000)await updateDoc(pr,{lastSeen:serverTimestamp(),email:em,appVersion:"2.4.0"})}catch(e){}
try{const ad=(await getDoc(doc(db,"admins",uid))).exists();$("#adminBtn").hidden=!ad;localStorage.setItem("mw:adm:"+uid,ad?"1":"0")}catch(e){}}
let msgAt=0;async function loadMsgs(force){if(!force&&Date.now()-msgAt<60000)return;msgAt=Date.now();try{const s=await getDocs(query(collection(db,"messages"),where("uid","==",uid))),l=s.docs.map(d=>({id:d.id,...d.data()})).sort((x,y)=>(y.createdAt?.seconds||0)-(x.createdAt?.seconds||0));$("#myMsgs").innerHTML=l.map(m=>`<li><span>${esc(m.text)}<small>${m.createdAt?m.createdAt.toDate().toLocaleString():"sending"}${m.reply?", Admin reply: "+esc(m.reply):", awaiting reply"}</small></span></li>`).join("")||"<li>No messages yet.</li>"}catch(e){$("#myMsgs").innerHTML="<li>Messages are unavailable right now.</li>"}}
$("#msgSend").onclick=async()=>{const t=$("#msgText").value.trim(),k="mwmsg:"+uid;if(!t)return alert("Write a message first.");if(Date.now()-(+localStorage.getItem(k)||0)<30000)return alert("Please wait a moment before sending another message.");try{await addDoc(collection(db,"messages"),{uid,email:auth.currentUser.email||"",text:t.slice(0,1000),status:"new",createdAt:serverTimestamp()});localStorage.setItem(k,Date.now());$("#msgText").value="";alert("Message sent to the admin.");loadMsgs(true)}catch(e){bad(e)}};
