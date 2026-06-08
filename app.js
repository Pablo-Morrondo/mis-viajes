const KEY="viajes_plans_4_data";let db=load(),view="home",activeTripId=null;const $=id=>document.getElementById(id);
function uid(){return Date.now().toString(36)+Math.random().toString(36).slice(2)}function clean(s){return String(s||"").replace(/\r\n/g,"\n").replace(/\r/g,"\n").replace(/\\n/g,"\n")}function esc(s){return clean(s).replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;")}function save(){localStorage.setItem(KEY,JSON.stringify(db))}function load(){try{let s=localStorage.getItem(KEY);if(s)return JSON.parse(s)}catch(e){}return{trips:[],events:[],reservations:[],docs:[]}}function dl(name,text){let a=document.createElement("a");a.href=URL.createObjectURL(new Blob([text],{type:"application/json"}));a.download=name;a.click()}function mapLink(t){let u=String(t||"").match(/https?:\/\/\S+/);return u?u[0]:"https://www.google.com/maps/search/?api=1&query="+encodeURIComponent(t||"")}
function parseTripDate(s){
  s=String(s||"").trim();
  if(!s)return null;

  // yyyy-mm-dd
  let m=s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if(m)return new Date(Number(m[1]),Number(m[2])-1,Number(m[3]));

  // dd/mm/yyyy or dd-mm-yyyy
  m=s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if(m)return new Date(Number(m[3]),Number(m[2])-1,Number(m[1]));

  // "14 al 21 Julio 2026" / "14 Julio 2026"
  const months={enero:0,febrero:1,marzo:2,abril:3,mayo:4,junio:5,julio:6,agosto:7,septiembre:8,setiembre:8,octubre:9,noviembre:10,diciembre:11};
  let low=s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"");
  m=low.match(/(\d{1,2})(?:\s*al\s*\d{1,2})?\s+([a-z]+)\s+(\d{4})/);
  if(m && months[m[2]]!==undefined)return new Date(Number(m[3]),months[m[2]],Number(m[1]));

  let d=new Date(s);
  return isNaN(d)?null:d;
}
function countdown(dateStr){
  let d=parseTripDate(dateStr);
  if(!d)return"Fecha inicio";
  let today=new Date();today.setHours(0,0,0,0);
  d.setHours(0,0,0,0);
  let days=Math.ceil((d-today)/86400000);
  if(days>1)return`${days} días`;
  if(days===1)return"1 día";
  if(days===0)return"Hoy";
  return"Ya realizado";
}
menuBtn.onclick=()=>{side.classList.add("open");shade.classList.add("show")};closeSide.onclick=shade.onclick=()=>{side.classList.remove("open");shade.classList.remove("show")};closeModal.onclick=()=>modal.classList.remove("show");darkBtn.onclick=()=>document.body.classList.toggle("dark");addTrip.onclick=()=>tripForm();addEvent.onclick=()=>eventForm();addReservation.onclick=()=>reservationForm();addDoc.onclick=()=>docForm();document.querySelectorAll("[data-view]").forEach(b=>b.onclick=()=>{view=b.dataset.view;side.classList.remove("open");shade.classList.remove("show");render()});function showModal(t,h){modalTitle.textContent=t;modalBody.innerHTML=h;modal.classList.add("show")}
function render(){document.querySelectorAll("[data-view]").forEach(b=>b.classList.toggle("active",b.dataset.view===view));screenTitle.textContent={home:"Inicio",trips:"Viajes",events:"Eventos",reservations:"Reservas",docs:"Documentos",sync:"Exportar / Importar"}[view];if(view==="home")home();if(view==="trips")trips();if(view==="events")events();if(view==="reservations")reservations();if(view==="docs")docs();if(view==="sync")syncView()}
function home(){app.innerHTML=`<section class=hero><div class=txt><h1>Viajes & Plans 8</h1><p>V8: chinchetas y Maps de Apple Notes convertidos a botones</p></div></section><div class=grid><div class=stat><span>${db.trips.length}</span>Viajes</div><div class=stat><span>${db.events.length}</span>Eventos</div><div class=stat><span>${db.reservations.length}</span>Reservas</div><div class=stat><span>${db.docs.length}</span>Docs</div></div><div class=card><h2>Próximos viajes</h2>${db.trips.map(t=>`<p><b>${esc(t.name)}</b><br><span class=muted>${esc(t.dates)} ${countdown(t.startDate||t.dates)?'· '+countdown(t.startDate||t.dates):''}</span></p>`).join("")||"<p class=muted>Sin viajes.</p>"}</div><div class=card><h2>Acciones rápidas</h2><button class=primary onclick=tripForm()>+ Viaje</button><button class=primary onclick=eventForm()>+ Evento</button><button class=primary onclick=reservationForm()>+ Reserva</button><button class=primary onclick=docForm()>+ Documento</button><button class=secondary onclick="view='sync';render()">Exportar / importar datos</button></div>`}
function linkBox(title,url){return url?`<div class=linkBox><b>🔗 ${esc(title)}</b><br><a class=mapBtn href="${esc(url)}" target=_blank>Abrir</a></div>`:""}
function activeTrip(){
  if(activeTripId)return db.trips.find(t=>t.id===activeTripId)||null;
  return db.trips[0]||null;
}
function tripDestination(){
  let t=activeTrip();
  return (t?.destination||t?.name||"").replace(/\d{4}/g,"").trim();
}
function cleanPlaceForMaps(q){
  return String(q||"")
    .replace(/<[^>]*>/g," ")
    .replace(/^[\s•\-\d.]+/," ")
    .replace(/[🇧🇪📍🔗➡️➔→]/g," ")
    .replace(/\bMaps\b/gi," ")
    .replace(/\bDirecci[oó]n:?/gi," ")
    .replace(/\|/g," ")
    .replace(/\s+/g," ")
    .trim();
}
function googleMapsSearch(q){
  let dest=tripDestination();
  let text=cleanPlaceForMaps(q);
  if(dest && !text.toLowerCase().includes(dest.toLowerCase().split(",")[0].trim())) text += " " + dest;
  return "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(text);
}
function linkify(txt){
  txt = txt.replace(/https?:\/\/[^\s<]+/g,u=>`<a target=_blank href="${u}">${u.includes("maps")||u.includes("google")?"Abrir Maps":"Abrir enlace"}</a>`);

  txt = txt.replace(/^\s*[•\-]?\s*📍\s*(.{2,120})$/gmi,(m,place)=>{
    let p=place.trim();
    return `📍 ${p}<br><a class=mapBtn target=_blank href="${googleMapsSearch(p)}">Abrir Maps</a>`;
  });

  txt = txt.replace(/^(.{2,120})\n\s*Maps\s*$/gmi,(m,place)=>`${place}\n<a class=mapBtn target=_blank href="${googleMapsSearch(place)}">Abrir Maps</a>`);
  txt = txt.replace(/^(.{2,140}?)(?:\s*[→➔➡|]\s*📍?\s*)Maps\s*$/gmi,(m,place)=>`${place} <a class=mapBtn target=_blank href="${googleMapsSearch(place)}">Abrir Maps</a>`);
  txt = txt.replace(/^(\s*\d+\.\s*.{2,120}?[→➔➡])\s*\n\s*Maps\s*$/gmi,(m,place)=>`${place.replace(/[→➔➡]\s*$/,"")} <a class=mapBtn target=_blank href="${googleMapsSearch(place)}">Abrir Maps</a>`);
  txt = txt.replace(/^(.{2,140}?)\s+Maps\s*$/gmi,(m,place)=>`${place} <a class=mapBtn target=_blank href="${googleMapsSearch(place)}">Abrir Maps</a>`);
  return txt;
}
function trips(){app.innerHTML=`<div class=card><h2>✈️ Viajes</h2><button class=primary onclick=tripForm()>+ Nuevo viaje</button></div>${db.trips.map(tripCard).join("")||"<div class=empty>Sin viajes.</div>"}`}
function tripCard(t){return`<div class=card>${tripHero(t)}<p>${esc(t.summary||"")}</p><div class=grid><div class=stat><span>${countdown(t.startDate||t.dates)||"—"}</span>Cuenta atrás</div><div class=stat><span>${esc(t.budget||"—")}</span>Presupuesto</div></div><p><b>🏨 Hotel:</b> ${esc(t.hotel||"Sin indicar")}</p>${t.hotelMap?`<p><a class=mapBtn target=_blank href="${mapLink(t.hotelMap)}">Abrir hotel en Maps</a></p>`:""}${linkBox("Carpeta del viaje",t.folderLink)}<span class=pill>${(t.notes||[]).length} notas</span><div class=actions><button class=secondary onclick="activeTripId='${t.id}';noteForm()">+ Nota</button><button class=secondary onclick="tripForm('${t.id}')">Editar</button><button class=danger onclick="del('trips','${t.id}')">Eliminar</button></div>${(t.notes||[]).map(n=>noteCard(n,t.id)).join("")}</div>`}
function tripHero(t){return`<section class=tripHero>${t.cover?`<img src="${esc(t.cover)}">`:""}<div class=overlay></div><div class=txt><h2>${esc(t.name)}</h2><p>${esc(t.dates)}</p><p>${esc(t.destination)}</p></div></section>`}
function noteCard(n,tid){return`<div class=noteCard><button class=noteHead onclick="this.parentElement.classList.toggle('open')"><span>📒</span><strong>${esc(n.title)}</strong><span>⌄</span></button><div class=noteBody><div class=noteText>${linkify(esc(n.body))}</div><div class=actions><button class=secondary onclick="noteForm('${tid}','${n.id}')">Editar</button><button class=danger onclick="deleteNote('${tid}','${n.id}')">Eliminar</button></div></div></div>`}
function events(){app.innerHTML=`<div class=card><h2>🎟️ Eventos</h2><button class=primary onclick=eventForm()>+ Nuevo evento</button></div>${db.events.map(e=>`<div class=card><h2>${esc(e.name)}</h2><p class=muted>${esc(e.type)} · ${esc(e.date)} · ${esc(e.place)}</p>${linkBox("Entrada / documento",e.docLink)}${e.map?`<p><a class=mapBtn target=_blank href="${mapLink(e.map)}">Abrir Maps</a></p>`:""}<p>${esc(e.notes||"")}</p><div class=actions><button class=secondary onclick="eventForm('${e.id}')">Editar</button><button class=danger onclick="del('events','${e.id}')">Eliminar</button></div></div>`).join("")||"<div class=empty>Sin eventos.</div>"}`}
function reservations(){app.innerHTML=`<div class=card><h2>📧 Reservas</h2><button class=primary onclick=reservationForm()>+ Nueva reserva</button></div>${db.reservations.map(r=>`<div class=card><h2>${esc(r.name)}</h2><p class=muted>${esc(r.type)} · ${esc(r.date)}</p>${r.locator?`<p><b>Localizador:</b> ${esc(r.locator)}</p>`:""}${r.address?`<p><a class=mapBtn target=_blank href="${mapLink(r.address)}">Abrir Maps</a></p>`:""}${linkBox("PDF / documento reserva",r.docLink)}<details><summary><b>Email / texto original</b></summary><div class=noteText>${linkify(esc(r.raw||""))}</div></details><div class=actions><button class=secondary onclick="reservationForm('${r.id}')">Editar</button><button class=danger onclick="del('reservations','${r.id}')">Eliminar</button></div></div>`).join("")||"<div class=empty>Sin reservas.</div>"}`}
function docs(){app.innerHTML=`<div class=card><h2>📂 Documentos</h2><button class=primary onclick=docForm()>+ Añadir documento</button></div>${db.docs.map(d=>`<div class=card><h2>${esc(d.name)}</h2><p class=muted>${esc(d.type)}</p>${linkBox("Abrir documento",d.link)}<p>${esc(d.notes||"")}</p><div class=actions><button class=secondary onclick="docForm('${d.id}')">Editar</button><button class=danger onclick="del('docs','${d.id}')">Eliminar</button></div></div>`).join("")||"<div class=empty>Sin documentos.</div>"}`}
function tripForm(id=""){let t=id?db.trips.find(x=>x.id===id):{};showModal(id?"Editar viaje":"Nuevo viaje",`<input id=f1 placeholder=Nombre value="${esc(t.name||"")}"><input id=f2 placeholder=Fechas value="${esc(t.dates||"")}"><input id=f3 placeholder=Destino value="${esc(t.destination||"")}"><input id=f4 type=date placeholder="Fecha inicio" value="${esc(t.startDate||"")}"><textarea id=f5 placeholder=Resumen>${esc(t.summary||"")}</textarea><input id=f6 placeholder="URL imagen portada" value="${esc(t.cover||"")}"><input id=f7 placeholder="Hotel principal" value="${esc(t.hotel||"")}"><input id=f8 placeholder="Dirección/Maps hotel" value="${esc(t.hotelMap||"")}"><input id=f9 placeholder="Presupuesto opcional" value="${esc(t.budget||"")}"><input id=f10 placeholder="Enlace carpeta iCloud/Drive del viaje" value="${esc(t.folderLink||"")}"><button class=primary onclick="saveTrip('${id}')">Guardar</button>`)}
function saveTrip(id=""){let t=id?db.trips.find(x=>x.id===id):{id:uid(),notes:[]};Object.assign(t,{name:f1.value,dates:f2.value,destination:f3.value,startDate:f4.value,summary:f5.value,cover:f6.value,hotel:f7.value,hotelMap:f8.value,budget:f9.value,folderLink:f10.value});if(!id)db.trips.push(t);save();modal.classList.remove("show");view="trips";render()}
function noteForm(tid=activeTripId,nid=""){let t=db.trips.find(x=>x.id===tid),n=nid?(t.notes||[]).find(x=>x.id===nid):{};showModal(nid?"Editar nota":"Añadir nota",`<input id=n1 placeholder=Título value="${esc(n.title||"")}"><textarea id=n2 placeholder="Pega nota de Apple Notes">${esc(n.body||"")}</textarea><button class=primary onclick="saveNote('${tid}','${nid}')">Guardar</button>`)}function saveNote(tid,nid=""){let t=db.trips.find(x=>x.id===tid);t.notes=t.notes||[];let n=nid?t.notes.find(x=>x.id===nid):{id:uid()};n.title=n1.value||clean(n2.value).split("\n")[0]||"Nota";n.body=n2.value;if(!nid)t.notes.push(n);save();modal.classList.remove("show");render()}function deleteNote(tid,nid){let t=db.trips.find(x=>x.id===tid);t.notes=t.notes.filter(n=>n.id!==nid);save();render()}
function eventForm(id=""){let e=id?db.events.find(x=>x.id===id):{};showModal(id?"Editar evento":"Nuevo evento",`<input id=e1 placeholder=Nombre value="${esc(e.name||"")}"><select id=e2><option>Concierto</option><option>Teatro</option><option>Deporte</option><option>Entrada</option><option>Otro</option></select><input id=e3 placeholder=Fecha value="${esc(e.date||"")}"><input id=e4 placeholder=Lugar value="${esc(e.place||"")}"><input id=e5 placeholder="Dirección / Maps" value="${esc(e.map||"")}"><input id=e6 placeholder="Enlace entrada/PDF iCloud/Drive" value="${esc(e.docLink||"")}"><textarea id=e7 placeholder=Notas>${esc(e.notes||"")}</textarea><button class=primary onclick="saveEvent('${id}')">Guardar</button>`);if(e.type)e2.value=e.type}function saveEvent(id=""){let e=id?db.events.find(x=>x.id===id):{id:uid()};Object.assign(e,{name:e1.value,type:e2.value,date:e3.value,place:e4.value,map:e5.value,docLink:e6.value,notes:e7.value});if(!id)db.events.push(e);save();modal.classList.remove("show");view="events";render()}
function reservationForm(id=""){let r=id?db.reservations.find(x=>x.id===id):{};showModal(id?"Editar reserva":"Nueva reserva",`<input id=r1 placeholder=Nombre value="${esc(r.name||"")}"><select id=r2><option>Hotel</option><option>Restaurante</option><option>Vuelo</option><option>Tren</option><option>Parking</option><option>Entrada</option><option>Otro</option></select><input id=r3 placeholder=Fecha value="${esc(r.date||"")}"><input id=r4 placeholder=Localizador value="${esc(r.locator||"")}"><input id=r5 placeholder="Dirección / Maps" value="${esc(r.address||"")}"><input id=r6 placeholder="Enlace PDF/documento iCloud/Drive" value="${esc(r.docLink||"")}"><textarea id=r7 placeholder="Pega email de confirmación">${esc(r.raw||"")}</textarea><button class=primary onclick="saveReservation('${id}')">Guardar</button>`);if(r.type)r2.value=r.type}function saveReservation(id=""){let r=id?db.reservations.find(x=>x.id===id):{id:uid()};Object.assign(r,{name:r1.value,type:r2.value,date:r3.value,locator:r4.value,address:r5.value,docLink:r6.value,raw:r7.value});if(!id)db.reservations.push(r);save();modal.classList.remove("show");view="reservations";render()}
function docForm(id=""){let d=id?db.docs.find(x=>x.id===id):{};showModal(id?"Editar documento":"Nuevo documento",`<input id=d1 placeholder=Nombre value="${esc(d.name||"")}"><select id=d2><option>PDF reserva</option><option>Entrada</option><option>Captura QR</option><option>Email</option><option>Imagen</option><option>Otro</option></select><input id=d3 placeholder="Enlace iCloud/Drive/URL" value="${esc(d.link||"")}"><textarea id=d4 placeholder=Notas>${esc(d.notes||"")}</textarea><button class=primary onclick="saveDoc('${id}')">Guardar</button>`);if(d.type)d2.value=d.type}function saveDoc(id=""){let d=id?db.docs.find(x=>x.id===id):{id:uid()};Object.assign(d,{name:d1.value,type:d2.value,link:d3.value,notes:d4.value});if(!id)db.docs.push(d);save();modal.classList.remove("show");view="docs";render()}
function del(c,id){if(confirm("¿Eliminar?")){db[c]=db[c].filter(x=>x.id!==id);save();render()}}function syncView(){app.innerHTML=`<div class=card><h2>🔄 Exportar / Importar</h2><p class=muted>Forma rápida de pasar datos del Mac al iPhone.</p><button class=primary onclick=exportAll()>Exportar todo</button><label>Importar archivo JSON</label><input id=importFile type=file accept="application/json"><button class=primary onclick=importAll()>Importar</button></div>`}function exportAll(){dl("viajes-plans-backup.json",JSON.stringify(db,null,2))}function importAll(){let f=importFile.files[0];if(!f)return alert("Elige el JSON");let r=new FileReader();r.onload=()=>{try{db=JSON.parse(r.result);save();alert("Importado");view="home";render()}catch(e){alert("Archivo no válido")}};r.readAsText(f)}render();