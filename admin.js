import{initializeApp}from"https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import{getAuth,onAuthStateChanged,signInWithEmailAndPassword,GoogleAuthProvider,signInWithPopup,signOut}from"https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import{getFirestore,doc,getDoc,setDoc,collection,getDocs,query,orderBy,limit,updateDoc,deleteDoc,serverTimestamp}from"https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
import{firebaseConfig}from"./firebase-config.js";
const app=initializeApp(firebaseConfig),auth=getAuth(app),db=getFirestore(app),$=s=>document.querySelector(s),esc=s=>String(s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c])),COL=["#0f766e","#1d4ed8","#b45309","#9d174d","#475569"],bad=e=>alert(e.message||e);
let slides=[];
$("#go").onclick=()=>signInWithEmailAndPassword(auth,$("#em").value.trim(),$("#pw").value).catch(bad);
$("#gg").onclick=()=>signInWithPopup(auth,new GoogleAuthProvider()).catch(bad);
$("#so").onclick=()=>signOut(auth);
onAuthStateChanged(auth,async u=>{$("#login").hidden=!!u;$("#panel").hidden=true;if(!u){$("#st").textContent="Sign in with an admin account.";return}
let ok=false;try{ok=(await getDoc(doc(db,"admins",u.uid))).exists()}catch(e){}
if(!ok){$("#st").textContent="This account is not an admin. Your user ID: "+u.uid;return}
$("#st").textContent="";$("#panel").hidden=false;$("#who").textContent=u.email||u.uid;
try{const c=await getDoc(doc(db,"site","config")),d=c.exists()?c.data():{};$("#nt").value=d.notice||"";$("#non").checked=!!d.noticeOn;slides=d.slides||[]}catch(e){bad(e)}
rs();inbox()});
function rs(){$("#sl").innerHTML=slides.map((s,i)=>`<div class="acard"><input data-i="${i}" data-k="tag" maxlength="20" placeholder="Tag, e.g. Offer or New" value="${esc(s.tag||"")}"><input data-i="${i}" data-k="title" maxlength="80" placeholder="Title" value="${esc(s.title||"")}"><input data-i="${i}" data-k="text" maxlength="200" placeholder="Text" value="${esc(s.text||"")}"><input data-i="${i}" data-k="link" placeholder="Link (https://...) optional" value="${esc(s.link||"")}"><select data-i="${i}" data-k="color">${COL.map(c=>`<option ${c===s.color?"selected":""}>${c}</option>`).join("")}</select><label><input type="checkbox" data-i="${i}" data-k="active" ${s.active!==false?"checked":""}>Active</label><div class="row"><button class="alt" data-up="${i}">Move up</button><button class="alt" data-del="${i}">Delete</button></div></div>`).join("")||"<p class='hint'>No slides yet.</p>"}
$("#sl").oninput=e=>{const d=e.target.dataset;if(d.k)slides[d.i][d.k]=e.target.type==="checkbox"?e.target.checked:e.target.value};
$("#sl").onclick=e=>{const d=e.target.dataset;if(d.del){slides.splice(+d.del,1);rs()}if(d.up&&+d.up>0){const i=+d.up;[slides[i-1],slides[i]]=[slides[i],slides[i-1]];rs()}};
$("#addsl").onclick=()=>{if(slides.length>=10)return alert("Maximum 10 slides.");slides.push({title:"",text:"",link:"",color:COL[0],active:true});rs()};
$("#save").onclick=async()=>{const clean=slides.slice(0,10).map(s=>({tag:(s.tag||"").slice(0,20),title:(s.title||"").slice(0,80),text:(s.text||"").slice(0,200),link:/^https:\/\//.test(s.link||"")?s.link.slice(0,300):"",color:COL.includes(s.color)?s.color:COL[0],active:s.active!==false}));
try{await setDoc(doc(db,"site","config"),{notice:$("#nt").value.slice(0,300),noticeOn:$("#non").checked,slides:clean,updatedAt:serverTimestamp()});slides=clean;rs();alert("Saved. Users see it the next time they open the app.")}catch(e){bad(e)}};
async function inbox(){try{const s=await getDocs(query(collection(db,"messages"),orderBy("createdAt","desc"),limit(50))),l=s.docs.map(d=>({id:d.id,...d.data()}));$("#mc").textContent="("+l.filter(m=>m.status==="new").length+" new)";
$("#inbox").innerHTML=l.map(m=>`<li style="display:block"><b>${esc(m.email||m.uid)}</b> <small>${m.createdAt?m.createdAt.toDate().toLocaleString():""}, ${esc(m.status||"")}</small><p>${esc(m.text)}</p>${m.reply?`<p class="hint">Reply: ${esc(m.reply)}</p>`:""}<textarea id="r-${m.id}" rows="2" maxlength="1000" placeholder="Write a reply"></textarea><div class="row"><button data-rep="${m.id}">Send reply</button><button class="alt" data-rd="${m.id}">Mark read</button><button class="alt" data-dm="${m.id}">Delete</button></div></li>`).join("")||"<li>No messages.</li>"}catch(e){bad(e)}}
$("#inbox").onclick=e=>{const d=e.target.dataset,up=(id,x)=>updateDoc(doc(db,"messages",id),x).then(inbox).catch(bad);
if(d.rep){const t=document.getElementById("r-"+d.rep).value.trim();if(t)up(d.rep,{reply:t.slice(0,1000),repliedAt:serverTimestamp(),status:"answered"})}
if(d.rd)up(d.rd,{status:"read"});if(d.dm&&confirm("Delete this message?"))deleteDoc(doc(db,"messages",d.dm)).then(inbox).catch(bad)};

let users=[];
async function loadUsers(){try{const s=await getDocs(query(collection(db,"profiles"),orderBy("lastSeen","desc"),limit(100)));users=s.docs.map(d=>({id:d.id,...d.data()}));drawUsers()}catch(e){bad(e)}}
function drawUsers(){const q=$("#uq").value.trim().toLowerCase(),wk=Date.now()-7*864e5;
$("#ustat").textContent="("+users.length+" users, "+users.filter(u=>(u.lastSeen?.toMillis?.()||0)>wk).length+" active in 7 days, "+users.filter(u=>u.blocked).length+" blocked)";
$("#ul").innerHTML=users.filter(u=>!q||(u.email||"").toLowerCase().includes(q)||u.id.toLowerCase().includes(q)).map(u=>`<li style="display:block"><b>${esc(u.email||"(no email)")}</b> ${u.blocked?'<span class="expense">Blocked</span>':""}<small>Joined ${u.createdAt?u.createdAt.toDate().toLocaleDateString():"?"}, last seen ${u.lastSeen?u.lastSeen.toDate().toLocaleString():"?"}</small>${u.note?`<small>Note: ${esc(u.note)}</small>`:""}<div class="row"><button class="alt" data-blk="${u.id}">${u.blocked?"Unblock":"Block"}</button><button class="alt" data-nt="${u.id}">Note</button><button class="alt" data-udel="${u.id}">Remove</button></div></li>`).join("")||"<li>No users.</li>"}
$("#uq").oninput=drawUsers;
$("#ul").onclick=async e=>{const d=e.target.dataset,u=users.find(x=>x.id===(d.blk||d.nt||d.udel));if(!u)return;try{
if(d.blk){if(u.id===auth.currentUser.uid)return alert("You cannot block your own account.");if(!u.blocked&&!confirm("Block "+(u.email||u.id)+"?"))return;await updateDoc(doc(db,"profiles",u.id),{blocked:!u.blocked})}
if(d.nt){const n=prompt("Note about this user (admin only):",u.note||"");if(n===null)return;await updateDoc(doc(db,"profiles",u.id),{note:n.slice(0,200)})}
if(d.udel&&confirm("Remove this entry? It is recreated when the user opens the app again. Their account and data are not deleted."))await deleteDoc(doc(db,"profiles",u.id));
loadUsers()}catch(er){bad(er)}};

$("#lu").onclick=loadUsers;
