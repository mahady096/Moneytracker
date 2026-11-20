import{initializeApp}from"https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import{getAuth,onAuthStateChanged,signInWithEmailAndPassword as si,createUserWithEmailAndPassword as su,GoogleAuthProvider,signInWithPopup,signOut}from"https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import{initializeFirestore,persistentLocalCache,doc,getDoc,setDoc,addDoc,collection,query,orderBy,limit,onSnapshot,runTransaction,serverTimestamp,Timestamp}from"https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
import{firebaseConfig}from"./firebase-config.js";
const app=initializeApp(firebaseConfig),auth=getAuth(app),db=initializeFirestore(app,{localCache:persistentLocalCache()});
const $=s=>document.querySelector(s),esc=s=>String(s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const fmt=n=>(n/100).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2}),cents=v=>Math.round(parseFloat(v)*100);
const CATS=["Food","Transport","Bills","Shopping","Health","Salary","Other"],bad=e=>alert(e.message||e);
let uid,cur="BDT",accs=[],recs=[],subs=[];
const show=id=>["auth","onboard","app"].forEach(s=>$("#"+s).hidden=s!==id);
const uref=(...p)=>doc(db,"users",uid,...p),ucol=n=>collection(db,"users",uid,n);
const cred=()=>[auth,$("#email").value,$("#pass").value],err=e=>$("#err").textContent=e.message;
$("#login").onclick=()=>si(...cred()).catch(err);
$("#signup").onclick=()=>su(...cred()).catch(err);
$("#google").onclick=()=>signInWithPopup(auth,new GoogleAuthProvider()).catch(err);
$("#out").onclick=()=>signOut(auth);
onAuthStateChanged(auth,async u=>{subs.forEach(f=>f());subs=[];if(!u)return show("auth");uid=u.uid;const p=(await getDoc(uref())).data();if(!p?.onboarded)return show("onboard");cur=p.currency;run();});
$("#start").onclick=async()=>{try{const c=$("#cur").value.trim().toUpperCase()||"BDT";await setDoc(uref(),{currency:c,onboarded:true});await addDoc(ucol("accounts"),{name:$("#accName").value||"Cash",balance:cents($("#accBal").value||0)||0,createdAt:serverTimestamp()});cur=c;run();}catch(e){bad(e)}};
function run(){show("app");$("#date").valueAsDate=new Date();
subs.push(onSnapshot(ucol("accounts"),s=>{accs=s.docs.map(d=>({id:d.id,...d.data()}));draw();}));
subs.push(onSnapshot(query(ucol("records"),orderBy("date","desc"),limit(300)),s=>{recs=s.docs.map(d=>({id:d.id,...d.data()}));draw();}));}
function draw(){
const o=accs.map(a=>`<option value="${a.id}">${esc(a.name)}</option>`).join("");
for(const id of["from","to"]){const e=$("#"+id),v=e.value;e.innerHTML=o;if(v)e.value=v;}
const m=new Date().toISOString().slice(0,7);let i=0,x=0;
recs.forEach(r=>{if(r.date.toDate().toISOString().slice(0,7)!==m)return;if(r.type==="income")i+=r.amount;if(r.type==="expense")x+=r.amount;});
$("#tot").textContent=fmt(accs.reduce((s,a)=>s+a.balance,0))+" "+cur;$("#inc").textContent=fmt(i);$("#exp").textContent=fmt(x);
$("#accs").innerHTML=accs.map(a=>`<li><span>${esc(a.name)}</span><b>${fmt(a.balance)}</b></li>`).join("")||"<li>No accounts yet. Add one below.</li>";
const nm=id=>esc(accs.find(a=>a.id===id)?.name||"?");
$("#recs").innerHTML=recs.map(r=>`<li><span>${r.type==="transfer"?nm(r.accountId)+" to "+nm(r.toAccountId):esc(r.category)+", "+nm(r.accountId)}<small>${r.date.toDate().toISOString().slice(0,10)} ${esc(r.note||"")}</small></span><b class="${r.type}">${r.type==="expense"?"-":r.type==="income"?"+":""}${fmt(r.amount)}</b><button class="alt" data-id="${r.id}" aria-label="Delete record">×</button></li>`).join("")||"<li>No records yet. Add your first one above.</li>";}
const eff=r=>r.type==="income"?r.amount:-r.amount;
async function apply(r,sign,fn){await runTransaction(db,async t=>{
const ids=[r.accountId,...(r.type==="transfer"?[r.toAccountId]:[])];
const s=await Promise.all(ids.map(i=>t.get(uref("accounts",i))));
t.update(s[0].ref,{balance:s[0].data().balance+sign*eff(r)});
if(s[1])t.update(s[1].ref,{balance:s[1].data().balance-sign*eff(r)});
fn(t);});}
$("#cat").innerHTML=CATS.map(c=>`<option>${c}</option>`).join("");
$("#type").onchange=()=>{const t=$("#type").value==="transfer";$("#to").hidden=!t;$("#cat").hidden=t;};$("#type").onchange();
$("#save").onclick=()=>{const type=$("#type").value,amount=cents($("#amt").value);
if(!(amount>0))return alert("Enter an amount greater than zero.");
if(!accs.length)return alert("Add an account first.");
if(type==="transfer"&&$("#from").value===$("#to").value)return alert("Choose two different accounts.");
const r={type,amount,accountId:$("#from").value,category:type==="transfer"?"":$("#cat").value,note:$("#note").value,date:Timestamp.fromDate(new Date($("#date").value))};
if(type==="transfer")r.toAccountId=$("#to").value;
apply(r,1,t=>t.set(doc(ucol("records")),{...r,createdAt:serverTimestamp()})).then(()=>{$("#amt").value="";$("#note").value="";}).catch(bad);};
$("#recs").onclick=e=>{const id=e.target.dataset.id,r=recs.find(x=>x.id===id);if(r&&confirm("Delete this record? The balance will be restored."))apply(r,-1,t=>t.delete(uref("records",r.id))).catch(bad);};
$("#addAcc").onclick=()=>addDoc(ucol("accounts"),{name:$("#nAcc").value||"Account",balance:cents($("#nBal").value||0)||0,createdAt:serverTimestamp()}).then(()=>{$("#nAcc").value="";$("#nBal").value="";}).catch(bad);
