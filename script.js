const defaultProjects = [
 {id:"sample-1",title:"Film Dokumenter — Tinta Emas di Bumi Batavia",category:"Voice Over",year:"2024",description:"Pengisian narasi untuk film dokumenter dalam proyek Bank Indonesia Provinsi Bengkulu. Ganti tautan dengan video atau cuplikan karya yang dapat dilihat publik.",link:"",cover:"VOICE OVER"},
 {id:"sample-2",title:"Editing Film & Video Kampus",category:"Video Editing",year:"2021–2025",description:"Penyuntingan gambar, pengolahan audio, dan finalisasi video tugas perkuliahan maupun video promosi kampus.",link:"",cover:"VIDEO EDITING"},
 {id:"sample-3",title:"Press Release & Informasi Publik",category:"Kehumasan",year:"2025–2026",description:"Contoh hasil penulisan press release, materi broadcast, atau publikasi kegiatan selama magang kehumasan. Tambahkan tautan dokumen publik.",link:"",cover:"PUBLIC RELATIONS"},
 {id:"sample-4",title:"Desain Brosur / Poster",category:"Desain Grafis",year:"2026",description:"Galeri desain brosur atau poster yang dibuat menggunakan Canva. Tambahkan tautan portofolio atau folder karya.",link:"",cover:"DESIGN"},
 {id:"sample-5",title:"Penulisan Berita Televisi",category:"Penulisan",year:"2024",description:"Contoh naskah berita yang disusun selama magang jurnalistik di BETV. Pastikan dokumen yang dibagikan tidak memuat informasi internal.",link:"",cover:"NEWS SCRIPT"},
 {id:"sample-6",title:"Pengolahan Data & Metodologi Penelitian",category:"Penelitian & Data",year:"2026",description:"Contoh proyek olah data kuantitatif/kualitatif dan metodologi penelitian. Gunakan data dummy atau hasil yang sudah diizinkan klien untuk dipublikasikan.",link:"",cover:"RESEARCH"}
];
const defaultCredentials = [
 {id:"cred-1",title:"Beasiswa My Scholarship YBM BRILiaN",issuer:"YBM BRILiaN",year:"2022–2025",link:""},
 {id:"cred-2",title:"Wisudawan Terbaik",issuer:"IAIN Curup",year:"2025",link:""},
 {id:"cred-3",title:"Yudisium Terbaik Program Studi Komunikasi dan Penyiaran Islam",issuer:"IAIN Curup",year:"2025",link:""},
 {id:"cred-4",title:"Peserta Magang Hub Kemnaker RI",issuer:"Kementerian Ketenagakerjaan RI",year:"2025",link:""},
 {id:"cred-5",title:"Beasiswa PPG Prajabatan",issuer:"Universitas Negeri Surabaya",year:"2026",link:""}
];
const clone = x => JSON.parse(JSON.stringify(x));
let projects = load("fdy_portfolio_projects", defaultProjects);
let credentials = load("fdy_portfolio_credentials", defaultCredentials);
let activeFilter = "Video Editing";
const isLocalManagementView=location.protocol==="file:"||location.hostname==="localhost";
const MEDIA_DB_NAME = "fdy_portfolio_media";
const MEDIA_STORE_NAME = "project-media";
let mediaDatabasePromise;
const projectMediaUrls = new Map();
function load(key, fallback){try{const val=localStorage.getItem(key);return val?JSON.parse(val):clone(fallback)}catch(e){return clone(fallback)}}
function save(){try{localStorage.setItem("fdy_portfolio_projects",JSON.stringify(projects));localStorage.setItem("fdy_portfolio_credentials",JSON.stringify(credentials))}catch(e){alert("Browser tidak mengizinkan penyimpanan lokal. Silakan simpan perubahan langsung di kode HTML.")}}
function safe(s=""){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
function validUrl(url){try{const u=new URL(url);return ["http:","https:"].includes(u.protocol)?u.href:""}catch(e){return ""}}
function projectEmbedUrl(link){
 const safeLink=validUrl(link);
 if(!safeLink)return "";
 const url=new URL(safeLink);
 if(url.hostname==="drive.google.com"){
  const match=url.pathname.match(/\/file\/d\/([^/]+)/);
  return match?`https://drive.google.com/file/d/${encodeURIComponent(match[1])}/preview`:"";
 }
 if(url.hostname==="youtu.be")return `https://www.youtube-nocookie.com/embed/${encodeURIComponent(url.pathname.slice(1))}`;
 if(["youtube.com","www.youtube.com","m.youtube.com"].includes(url.hostname)){
  const videoId=url.searchParams.get("v")||url.pathname.match(/\/(?:embed|shorts)\/([^/]+)/)?.[1];
  return videoId?`https://www.youtube-nocookie.com/embed/${encodeURIComponent(videoId)}`:"";
 }
 return "";
}
let dialogMediaUrl="";
let credentialDialogMediaUrl="";
let activeCredentialId="";
async function openProjectDialog(project){
 const dialog=document.getElementById("projectDialog");
 const mediaContainer=document.getElementById("projectDialogMedia");
 const link=validUrl(project.link);
 document.getElementById("projectDialogCategory").textContent=project.category;
 document.getElementById("projectDialogTitle").textContent=project.title;
 document.getElementById("projectDialogDescription").textContent=project.description;
 document.getElementById("projectDialogYear").textContent=project.year||"Proyek";
 const originalLink=document.getElementById("projectDialogLink");
 originalLink.href=link;
 originalLink.hidden=!link;
 mediaContainer.innerHTML="";
 if(dialogMediaUrl){URL.revokeObjectURL(dialogMediaUrl);dialogMediaUrl=""}
 if(!dialog.open)dialog.showModal();
 let file;
 try{file=await getProjectMedia(project.id)}catch(e){file=null}
 if(!dialog.open||document.getElementById("projectDialogTitle").textContent!==project.title)return;
 if(file){
  dialogMediaUrl=URL.createObjectURL(file);
  const media=document.createElement(file.type.startsWith("video/")?"video":"img");
  media.src=dialogMediaUrl;
  media.className="project-dialog-local-media";
  if(media instanceof HTMLVideoElement){media.controls=true;media.playsInline=true;media.preload="metadata"}
  else media.alt=project.title;
  mediaContainer.append(media);
  return;
 }
 const embedUrl=projectEmbedUrl(link);
 if(embedUrl){
  const frame=document.createElement("iframe");
  frame.src=embedUrl;
  frame.title=`Pratinjau ${project.title}`;
  frame.allow="autoplay; encrypted-media; picture-in-picture";
  frame.allowFullscreen=true;
  mediaContainer.append(frame);
 }else if(!link){
  const placeholder=document.createElement("div");
  placeholder.className="project-dialog-placeholder";
  placeholder.textContent="Belum ada foto, video, atau tautan untuk proyek ini.";
  mediaContainer.append(placeholder);
 }
}
function openMediaDatabase(){
 if(!mediaDatabasePromise)mediaDatabasePromise=new Promise((resolve,reject)=>{
  if(!window.indexedDB){reject(new Error("Penyimpanan media tidak tersedia."));return}
  const request=indexedDB.open(MEDIA_DB_NAME,1);
  request.onupgradeneeded=()=>request.result.createObjectStore(MEDIA_STORE_NAME);
  request.onsuccess=()=>resolve(request.result);
  request.onerror=()=>reject(request.error||new Error("Database media tidak dapat dibuka."));
 });
 return mediaDatabasePromise;
}
function storeProjectMedia(id,file){
 return openMediaDatabase().then(database=>new Promise((resolve,reject)=>{
  const transaction=database.transaction(MEDIA_STORE_NAME,"readwrite");
  transaction.objectStore(MEDIA_STORE_NAME).put(file,id);
  transaction.oncomplete=resolve;
  transaction.onerror=()=>reject(transaction.error||new Error("Media tidak dapat disimpan."));
  transaction.onabort=()=>reject(transaction.error||new Error("Penyimpanan media dibatalkan."));
 }));
}
function getProjectMedia(id){
 return openMediaDatabase().then(database=>new Promise((resolve,reject)=>{
  const request=database.transaction(MEDIA_STORE_NAME,"readonly").objectStore(MEDIA_STORE_NAME).get(id);
  request.onsuccess=()=>resolve(request.result||null);
  request.onerror=()=>reject(request.error||new Error("Media tidak dapat dibaca."));
 }));
}
function removeProjectMedia(id){
 return openMediaDatabase().then(database=>new Promise((resolve,reject)=>{
  const transaction=database.transaction(MEDIA_STORE_NAME,"readwrite");
  transaction.objectStore(MEDIA_STORE_NAME).delete(id);
  transaction.oncomplete=resolve;
  transaction.onerror=()=>reject(transaction.error||new Error("Media tidak dapat dihapus."));
 }));
}
function clearProjectMedia(){
 return openMediaDatabase().then(database=>new Promise((resolve,reject)=>{
  const transaction=database.transaction(MEDIA_STORE_NAME,"readwrite");
    const store=transaction.objectStore(MEDIA_STORE_NAME);
    const request=store.openCursor();
    request.onsuccess=()=>{const cursor=request.result;if(!cursor)return;if(!String(cursor.key).startsWith("credential:"))cursor.delete();cursor.continue()};
  transaction.oncomplete=resolve;
  transaction.onerror=()=>reject(transaction.error||new Error("Media tidak dapat dihapus."));
 }));
}
function clearCredentialMedia(){
 return openMediaDatabase().then(database=>new Promise((resolve,reject)=>{
    const transaction=database.transaction(MEDIA_STORE_NAME,"readwrite");
    const request=transaction.objectStore(MEDIA_STORE_NAME).openCursor();
    request.onsuccess=()=>{const cursor=request.result;if(!cursor)return;if(String(cursor.key).startsWith("credential:"))cursor.delete();cursor.continue()};
    transaction.oncomplete=resolve;
    transaction.onerror=()=>reject(transaction.error||new Error("Sertifikat lokal tidak dapat dihapus."));
 }));
}
function openCredentialDialog(credential){
 const dialog=document.getElementById("credentialDialog");
 const mediaContainer=document.getElementById("credentialDialogMedia");
 activeCredentialId=credential.id;
 document.getElementById("credentialDialogTitle").textContent=credential.title;
 document.getElementById("credentialDialogYear").textContent=[credential.issuer,credential.year].filter(Boolean).join(" · ");
 const link=validUrl(credential.link);
 const originalLink=document.getElementById("credentialDialogLink");
 originalLink.href=link;
 originalLink.hidden=!link;
 document.getElementById("credentialUploadControl").hidden=!isLocalManagementView;
 mediaContainer.replaceChildren();
 if(credentialDialogMediaUrl){URL.revokeObjectURL(credentialDialogMediaUrl);credentialDialogMediaUrl=""}
 if(!dialog.open)dialog.showModal();
 getProjectMedia(`credential:${credential.id}`).then(file=>{
    if(!dialog.open||activeCredentialId!==credential.id)return;
    if(file){
     credentialDialogMediaUrl=URL.createObjectURL(file);
     if(file.type.startsWith("image/")){const image=document.createElement("img");image.src=credentialDialogMediaUrl;image.alt=credential.title;image.className="project-dialog-local-media";mediaContainer.append(image)}
     else{const frame=document.createElement("iframe");frame.src=credentialDialogMediaUrl;frame.title=`Sertifikat ${credential.title}`;mediaContainer.append(frame)}
     return;
    }
    const embedUrl=projectEmbedUrl(link)||link;
    if(embedUrl){const frame=document.createElement("iframe");frame.src=embedUrl;frame.title=`Sertifikat ${credential.title}`;mediaContainer.append(frame)}
    else{const placeholder=document.createElement("div");placeholder.className="project-dialog-placeholder";placeholder.textContent=isLocalManagementView?"Sertifikat belum ditambahkan. Unggah file PDF atau gambar di bawah.":"Sertifikat belum tersedia.";mediaContainer.append(placeholder)}
 }).catch(()=>{});
}
async function renderProjectMedia(){
 projectMediaUrls.forEach(url=>URL.revokeObjectURL(url));
 projectMediaUrls.clear();
 const containers=[...document.querySelectorAll("[data-project-media]")];
 await Promise.all(containers.map(async container=>{
  let file;
  try{file=await getProjectMedia(container.dataset.projectMedia)}catch(e){return}
  if(!file)return;
  const url=URL.createObjectURL(file);
  const media=document.createElement(file.type.startsWith("video/")?"video":"img");
  media.className="project-media";
  media.src=url;
  if(media instanceof HTMLVideoElement){media.controls=true;media.playsInline=true;media.preload="metadata"}
  else media.alt=container.dataset.projectTitle||"Media proyek";
  container.replaceChildren(media);
  projectMediaUrls.set(container.dataset.projectMedia,url);
 }));
}
function renderProjects(){
 const grid=document.getElementById("projectGrid");
 const visible=projects.filter(p=>p.category===activeFilter);
 grid.innerHTML=visible.length?visible.map(p=>`<article class="project-card"><div class="project-cover" data-project-media="${safe(p.id)}" data-project-title="${safe(p.title)}">${safe(p.cover||p.category.toUpperCase())}</div><div class="project-content"><span class="category-tag">${safe(p.category)}</span><h3>${safe(p.title)}</h3><p>${safe(p.description)}</p><div class="project-meta"><span>${safe(p.year||"Proyek")}</span></div><div class="project-actions"><button class="btn btn-secondary project-open" type="button" data-open-project="${safe(p.id)}">Lihat proyek</button>${isLocalManagementView&&!p.id.startsWith("sample-")?`<button class="tiny-btn delete-btn" data-delete-project="${safe(p.id)}">Hapus karya</button>`:""}</div></div></article>`).join(""):'<div class="empty">Belum ada karya dalam kategori ini. Tambahkan karya melalui form di bawah.</div>';
 renderProjectMedia();
 grid.querySelectorAll("[data-open-project]").forEach(btn=>btn.addEventListener("click",()=>{const project=projects.find(item=>item.id===btn.dataset.openProject);if(project)openProjectDialog(project)}));
 grid.querySelectorAll("[data-delete-project]").forEach(btn=>btn.addEventListener("click",()=>{if(confirm("Hapus karya ini dari portofolio di browser ini?")){const id=btn.dataset.deleteProject;projects=projects.filter(p=>p.id!==id);removeProjectMedia(id).catch(()=>{});save();renderProjects()}}));
}
function renderCredentials(){
 const grid=document.getElementById("credentialGrid");
 grid.innerHTML=credentials.map(c=>`<article class="credential"><div class="credential-icon">✦</div><h3>${safe(c.title)}</h3><p>${safe(c.issuer||"Sertifikat / Pencapaian")}</p><div class="credential-meta"><span class="year">${safe(c.year||"")}</span><button class="btn btn-secondary credential-open" type="button" data-open-credential="${safe(c.id)}">Buka</button></div>${isLocalManagementView&&!c.id.startsWith("cred-")?`<div style="margin-top:13px"><button class="tiny-btn delete-btn" data-delete-credential="${safe(c.id)}">Hapus</button></div>`:""}</article>`).join("");
 grid.querySelectorAll("[data-open-credential]").forEach(btn=>btn.addEventListener("click",()=>{const credential=credentials.find(item=>item.id===btn.dataset.openCredential);if(credential)openCredentialDialog(credential)}));
 grid.querySelectorAll("[data-delete-credential]").forEach(btn=>btn.addEventListener("click",()=>{if(confirm("Hapus sertifikat ini?")){const id=btn.dataset.deleteCredential;credentials=credentials.filter(c=>c.id!==id);removeProjectMedia(`credential:${id}`).catch(()=>{});save();renderCredentials()}}));
}
document.getElementById("filters").addEventListener("click",e=>{const b=e.target.closest("[data-filter]");if(!b)return;activeFilter=b.dataset.filter;document.querySelectorAll(".filter").forEach(x=>x.classList.toggle("active",x===b));renderProjects()});
document.getElementById("closeProjectDialog").addEventListener("click",()=>document.getElementById("projectDialog").close());
document.getElementById("projectDialog").addEventListener("click",e=>{if(e.target===e.currentTarget)e.currentTarget.close()});
document.getElementById("projectDialog").addEventListener("close",()=>{if(dialogMediaUrl){URL.revokeObjectURL(dialogMediaUrl);dialogMediaUrl=""}document.getElementById("projectDialogMedia").replaceChildren()});
document.getElementById("closeCredentialDialog").addEventListener("click",()=>document.getElementById("credentialDialog").close());
document.getElementById("credentialDialog").addEventListener("click",e=>{if(e.target===e.currentTarget)e.currentTarget.close()});
document.getElementById("credentialDialog").addEventListener("close",()=>{activeCredentialId="";if(credentialDialogMediaUrl){URL.revokeObjectURL(credentialDialogMediaUrl);credentialDialogMediaUrl=""}document.getElementById("credentialDialogMedia").replaceChildren()});
document.getElementById("credentialDialogUpload").addEventListener("change",async e=>{const file=e.target.files[0];if(!file||!activeCredentialId)return;if(!file.type.startsWith("image/")&&file.type!=="application/pdf"){alert("Pilih file PDF atau gambar.");e.target.value="";return}try{await storeProjectMedia(`credential:${activeCredentialId}`,file);const credential=credentials.find(item=>item.id===activeCredentialId);if(credential)openCredentialDialog(credential)}catch(error){alert("Sertifikat gagal disimpan. Periksa ruang penyimpanan browser.")}e.target.value=""});
document.getElementById("projectForm").addEventListener("submit",async e=>{e.preventDefault();const file=document.getElementById("pMedia").files[0];if(file&&!/^(image|video)\//i.test(file.type)){alert("Pilih file gambar atau video yang didukung browser.");return}const id="p-"+Date.now();try{if(file)await storeProjectMedia(id,file);const category=document.getElementById("pCategory").value;projects.unshift({id,title:document.getElementById("pTitle").value.trim(),category,year:document.getElementById("pYear").value.trim(),link:validUrl(document.getElementById("pLink").value.trim()),description:document.getElementById("pDesc").value.trim(),cover:document.getElementById("pCover").value.trim()||category.toUpperCase()});save();activeFilter=category;document.querySelectorAll(".filter").forEach(x=>x.classList.toggle("active",x.dataset.filter===activeFilter));renderProjects();e.target.reset();alert("Karya dan media ditambahkan ke portofolio pada browser ini.")}catch(error){alert("Media gagal disimpan. Coba file yang lebih kecil atau periksa ruang penyimpanan browser.")}});
document.getElementById("credentialForm").addEventListener("submit",e=>{e.preventDefault();credentials.unshift({id:"c-"+Date.now(),title:document.getElementById("cTitle").value.trim(),issuer:document.getElementById("cIssuer").value.trim(),year:document.getElementById("cYear").value.trim(),link:validUrl(document.getElementById("cLink").value.trim())});save();renderCredentials();e.target.reset();alert("Sertifikat ditambahkan ke portofolio pada browser ini.");});
document.getElementById("resetProjects").addEventListener("click",()=>{if(confirm("Pulihkan daftar contoh karya? Karya tambahan dan media yang tersimpan akan dihapus.")){projects=clone(defaultProjects);activeFilter="Video Editing";document.querySelectorAll(".filter").forEach(x=>x.classList.toggle("active",x.dataset.filter===activeFilter));clearProjectMedia().catch(()=>{});save();renderProjects()}});
document.getElementById("resetCredentials").addEventListener("click",()=>{if(confirm("Pulihkan data sertifikat awal? Sertifikat tambahan dan file sertifikat lokal akan dihapus.")){credentials=clone(defaultCredentials);clearCredentialMedia().catch(()=>{});save();renderCredentials()}});
document.getElementById("menuBtn").addEventListener("click",()=>document.getElementById("navlinks").classList.toggle("open"));
document.querySelectorAll("#navlinks a").forEach(a=>a.addEventListener("click",()=>document.getElementById("navlinks").classList.remove("open")));
document.getElementById("yearNow").textContent=new Date().getFullYear();
if(!isLocalManagementView)document.querySelectorAll(".admin-panel").forEach(panel=>panel.hidden=true);
renderProjects();renderCredentials();
