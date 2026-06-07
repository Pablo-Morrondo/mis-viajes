const KEY="viajes_planes_v9_notes_mode";
let db=load(), view="home", activeTripId=db.trips[0]?.id||null, tab="notes";

const $=id=>document.getElementById(id);
function uid(){return Date.now().toString(36)+Math.random().toString(36).slice(2)}
function clean(s){s=String(s||"");let out="";for(let i=0;i<s.length;i++){let c=s.charCodeAt(i);if(c>=0xD800&&c<=0xDBFF){let n=s.charCodeAt(i+1);if(n>=0xDC00&&n<=0xDFFF){i++;continue}continue}if(c>=0xDC00&&c<=0xDFFF)continue;out+=s[i]}return out}
function esc(s){return clean(s).replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;")}
function save(){localStorage.setItem(KEY,JSON.stringify(db))}
function load(){try{let s=localStorage.getItem(KEY);if(s)return JSON.parse(s)}catch(e){}return {trips:[{id:uid(),name:"Conil 2026",dates:"14 - 22 julio 2026",destination:"Sevilla, Conil y Cádiz",people:"Familia",hotel:"",hotelMap:"",image:"",summary:"Viaje a Sevilla y Conil.",notes:[]}],events:[],reservations:[],docs:[]}}
function trip(){return db.trips.find(t=>t.id===activeTripId)||db.trips[0]}
function city(t=trip()){let b=((t?.destination||"")+" "+(t?.name||"")).toLowerCase();if(b.includes("bruselas"))return"Brussels Belgium";if(b.includes("conil")||b.includes("cadiz")||b.includes("cádiz"))return"Cádiz Spain";if(b.includes("sevilla"))return"Sevilla Spain";if(b.includes("londres"))return"London UK";if(b.includes("roma"))return"Rome Italy";return t?.destination||""}
function mapUrl(q,t=trip()){q=clean(q).replace(/[📍🎟🔗🗺️➡️➔]/g," ").replace(/\s+/g," ").trim();let c=city(t);if(c&&!q.toLowerCase().includes(c.toLowerCase().split(" ")[0]))q+=" "+c;return"https://www.google.com/maps/search/?api=1&query="+encodeURIComponent(q)}
function norm(s){return clean(s).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]+/g," ").trim()}

$("menuBtn").onclick=openSide;$("closeSide").onclick=closeSide;$("shade").onclick=closeSide;$("closeModal").onclick=closeModal;
$("darkBtn").onclick=()=>document.body.classList.toggle("dark");
$("addTrip").onclick=()=>tripForm();$("addEvent").onclick=()=>eventForm();$("addReservation").onclick=()=>reservationForm();
document.querySelectorAll("[data-view]").forEach(b=>b.onclick=()=>{view=b.dataset.view;closeSide();render()});
function openSide(){$("side").classList.add("open");$("shade").classList.add("show")}
function closeSide(){$("side").classList.remove("open");$("shade").classList.remove("show")}
function modal(title,html){$("modalTitle").textContent=title;$("modalBody").innerHTML=html;$("modal").classList.add("show")}
function closeModal(){$("modal").classList.remove("show");$("modalBody").innerHTML=""}

function render(){
  document.querySelectorAll("[data-view]").forEach(b=>b.classList.toggle("active",b.dataset.view===view));
  $("screenTitle").textContent={home:"Viajes & Planes",trips:"Viajes",events:"Eventos",reservations:"Reservas",docs:"Documentos"}[view]||"Viajes & Planes";
  if(view==="home")home();
  if(view==="trips")trips();
  if(view==="events")events();
  if(view==="reservations")reservations();
  if(view==="docs")docs();
}
function home(){
  $("app").innerHTML=`<section class="hero"><div class="txt"><h1>Viajes & Planes</h1><p>Modo Apple Notes: guarda tus notas tal cual</p></div></section>
  <div class="grid"><div class="stat"><span>${db.trips.length}</span>Viajes</div><div class="stat"><span>${db.events.length}</span>Eventos</div><div class="stat"><span>${db.reservations.length}</span>Reservas</div><div class="stat"><span>${db.docs.length}</span>Docs</div></div>
  <div class="card"><h2>Viajes</h2>${db.trips.map(tripRow).join("")||"<p class='muted'>Sin viajes.</p>"}</div>
  <div class="card"><h2>Eventos próximos</h2>${db.events.map(e=>`<p>🎟️ <b>${esc(e.name)}</b><br><span class="muted">${esc(e.date)} · ${esc(e.place)}</span></p>`).join("")||"<p class='muted'>Sin eventos.</p>"}</div>`;
}
function tripRow(t){return`<div class="item" onclick="activeTripId='${t.id}';view='trips';render()"><div class="thumb">${t.image?`<img src="${esc(t.image)}">`:"✈️"}</div><div><strong>${esc(t.name)}</strong><br><span class="muted">${esc(t.dates)} · ${esc(t.destination)}</span></div><div class="chev">›</div></div>`}
function trips(){
  const t=trip(); if(!t){$("app").innerHTML=`<div class="card"><button class="primary" onclick="tripForm()">+ Nuevo viaje</button></div>`;return}
  $("app").innerHTML=`<section class="hero">${t.image?`<img src="${esc(t.image)}">`:""}<div class="txt"><h1>${esc(t.name)}</h1><p>${esc(t.dates)}</p><p>${esc(t.destination)}</p></div></section>
  <div class="tabs"><button class="tab ${tab==='notes'?'active':''}" onclick="tab='notes';render()">📒 Notas</button><button class="tab ${tab==='maps'?'active':''}" onclick="tab='maps';render()">📍 Mapas</button><button class="tab ${tab==='docs'?'active':''}" onclick="tab='docs';render()">📂 Docs</button></div>
  <div class="card"><h2>${esc(t.name)}</h2><span class="pill">${t.notes.length} notas</span><span class="pill">${allLinks(t).length} enlaces</span><p>${esc(t.summary||"")}</p><p><b>👥 Personas:</b> ${esc(t.people||"Sin indicar")}</p><p><b>🏨 Hotel:</b> ${esc(t.hotel||"Sin indicar")} ${hotelLink(t)}</p><div class="actions"><button class="secondary" onclick="tripForm('${t.id}')">Editar viaje</button><button class="secondary" onclick="noteForm()">Añadir nota</button><button class="secondary" onclick="folderImport()">Importar carpeta</button><button class="danger" onclick="deleteTrip('${t.id}')">Eliminar</button></div></div>
  ${tripContent(t)}`;
}
function hotelLink(t){if(!t.hotel&&!t.hotelMap)return"";let q=t.hotelMap||t.hotel;let url=q.startsWith("http")?q:mapUrl(q,t);return`<br><a href="${esc(url)}" target="_blank">Abrir hotel en Maps</a>`}
function tripContent(t){
  if(tab==="notes")return t.notes.length?t.notes.map(noteCard).join(""):`<div class="empty">Añade o importa notas.</div>`;
  if(tab==="maps"){let links=allLinks(t);return links.length?links.map(l=>`<div class="card"><a href="${esc(l.url)}" target="_blank">🔗 ${esc(l.label)}</a><p class="muted">${esc(l.url)}</p></div>`).join(""):`<div class="empty">Sin enlaces detectados.</div>`}
  return `<div class="card"><h2>Documentos del viaje</h2><button class="primary" onclick="docForm('${t.id}')">+ Añadir documento</button>${db.docs.filter(d=>d.tripId===t.id).map(docCard).join("")||"<p class='muted'>Sin documentos.</p>"}</div>`;
}
function noteCard(n){
  const links=extractLinks(n.body);
  return`<div class="noteCard"><button class="noteHead" onclick="this.parentElement.classList.toggle('open')"><span>${noteIcon(n.title,n.body)}</span><strong>${esc(n.title)}</strong><span>⌄</span></button><div class="noteBody">${links.length?`<div class="quickLinks">${links.map(l=>`<a href="${esc(l.url)}" target="_blank">${esc(l.label)}</a>`).join("")}</div>`:""}<div class="noteText">${esc(n.body)}</div><div class="actions"><button class="secondary" onclick="copyNote('${n.id}')">Copiar</button><button class="danger" onclick="deleteNote('${n.id}')">Eliminar</button></div></div></div>`;
}
function noteIcon(title,body){let x=norm(title+" "+body);if(/parking|distancia|coche|tren|aeropuerto/.test(x))return"🚗";if(/casa juan|restaurante|comida|cena|bar|califa|cuartel/.test(x))return"🍽";if(/hotel|alojamiento|chalet|booking/.test(x))return"🏨";if(/entrada|concierto|teatro/.test(x))return"🎟️";return"📒"}
function extractLinks(text){
  let out=[]; let urlRe=/https?:\/\/[^\s]+/g; let m;
  while((m=urlRe.exec(text))!==null){out.push({label:m[0].includes("maps")||m[0].includes("google")?"Abrir Maps":"Abrir enlace",url:m[0]})}
  return out;
}
function allLinks(t){let arr=[];t.notes.forEach(n=>extractLinks(n.body).forEach(l=>arr.push(l)));return arr}

function tripForm(id=""){
  let t=id?db.trips.find(x=>x.id===id):{};
  modal(id?"Editar viaje":"Nuevo viaje",`<input id="fName" placeholder="Nombre" value="${esc(t.name||"")}"><input id="fDates" placeholder="Fechas" value="${esc(t.dates||"")}"><input id="fDest" placeholder="Destino" value="${esc(t.destination||"")}"><input id="fPeople" placeholder="Personas" value="${esc(t.people||"")}"><input id="fHotel" placeholder="Hotel / alojamiento" value="${esc(t.hotel||"")}"><input id="fHotelMap" placeholder="Dirección o enlace Maps hotel" value="${esc(t.hotelMap||"")}"><input id="fImage" placeholder="URL imagen portada" value="${esc(t.image||"")}"><textarea id="fSummary" placeholder="Resumen">${esc(t.summary||"")}</textarea><button class="primary" onclick="saveTrip('${id}')">Guardar</button>`);
}
function saveTrip(id=""){let t=id?db.trips.find(x=>x.id===id):{id:uid(),notes:[]};Object.assign(t,{name:fName.value.trim(),dates:fDates.value.trim(),destination:fDest.value.trim(),people:fPeople.value.trim(),hotel:fHotel.value.trim(),hotelMap:fHotelMap.value.trim(),image:fImage.value.trim(),summary:fSummary.value.trim()});if(!id){db.trips.push(t);activeTripId=t.id}save();closeModal();render()}
function deleteTrip(id){if(confirm("¿Eliminar viaje?")){db.trips=db.trips.filter(t=>t.id!==id);activeTripId=db.trips[0]?.id||null;save();render()}}
function noteForm(){
  modal("Añadir nota tal cual",`<input id="nTitle" placeholder="Título de la nota"><textarea id="nBody" placeholder="Pega aquí la nota desde Apple Notes"></textarea><button class="primary" onclick="saveNote()">Guardar nota</button>`);
}
function saveNote(){let t=trip();if(!nTitle.value.trim()&&!nBody.value.trim())return alert("Pega una nota");t.notes.push({id:uid(),title:nTitle.value.trim()||firstLine(nBody.value)||"Nota",body:nBody.value.trim()});save();closeModal();tab="notes";render()}
function firstLine(s){return clean(s).split("\\n").find(x=>x.trim())?.trim()||""}
function folderImport(){
  modal("Importar carpeta de Notas",`<p class="tip">Pega varias notas juntas. La app no interpreta ni reordena: las guarda casi tal cual. Separa cada nota con:</p><div class="sample">--- Martes 14 julio ---\\ncontenido...\\n\\n--- VIAJE CONIL - 15 JULIO - CHALET ---\\ncontenido...</div><textarea id="bulk" placeholder="Pega aquí el documento maestro de TextEdit"></textarea><button class="primary" onclick="saveFolder()">Importar carpeta</button>`);
}
function saveFolder(){let t=trip(), raw=bulk.value.trim();if(!raw)return alert("Pega el contenido");splitNotes(raw).forEach(n=>t.notes.push(n));save();closeModal();tab="notes";render();alert("Carpeta importada")}
function splitNotes(raw){
  let parts=raw.split(/\n\s*---+\s*/).map(x=>x.trim()).filter(Boolean);
  if(parts.length>1)return parts.map(p=>{let lines=p.split(/\n/);return{id:uid(),title:lines.shift().replace(/---+$/,"").trim(),body:lines.join("\\n").trim()}});
  return [{id:uid(),title:firstLine(raw)||"Nota importada",body:raw}];
}
function copyNote(id){let n=trip().notes.find(x=>x.id===id);navigator.clipboard.writeText((n.title? n.title+"\\n\\n":"")+n.body)}
function deleteNote(id){if(confirm("¿Eliminar nota?")){trip().notes=trip().notes.filter(n=>n.id!==id);save();render()}}

function events(){$("app").innerHTML=`<div class="card"><h2>🎟️ Eventos y entradas</h2><button class="primary" onclick="eventForm()">+ Nuevo evento</button></div>${db.events.map(eventCard).join("")||"<div class='empty'>Sin eventos.</div>"}`}
function eventCard(e){return`<div class="card"><h2>${esc(e.name)}</h2><p class="muted">${esc(e.date)} · ${esc(e.place)}</p>${e.link?`<p><a href="${esc(e.link)}" target="_blank">Abrir entrada / enlace</a></p>`:""}${e.map?`<p><a href="${esc(e.map.startsWith('http')?e.map:mapUrl(e.map))}" target="_blank">Abrir Maps</a></p>`:""}<p>${esc(e.notes||"")}</p></div>`}
function eventForm(){modal("Nuevo evento / entrada",`<input id="eName" placeholder="Nombre"><input id="eDate" placeholder="Fecha y hora"><input id="ePlace" placeholder="Lugar"><input id="eMap" placeholder="Dirección o Maps"><input id="eLink" placeholder="Enlace entrada / PDF / Wallet"><textarea id="eNotes" placeholder="Pega email o notas"></textarea><button class="primary" onclick="saveEvent()">Guardar evento</button>`)}
function saveEvent(){db.events.push({id:uid(),name:eName.value,date:eDate.value,place:ePlace.value,map:eMap.value,link:eLink.value,notes:eNotes.value});save();closeModal();view="events";render()}

function reservations(){$("app").innerHTML=`<div class="card"><h2>📧 Reservas</h2><button class="primary" onclick="reservationForm()">+ Nueva reserva desde email</button></div>${db.reservations.map(resCard).join("")||"<div class='empty'>Sin reservas.</div>"}`}
function resCard(r){return`<div class="card"><h2>${esc(r.name)}</h2><p class="muted">${esc(r.type)} · ${esc(r.date)}</p><p>${esc(r.locator||"")}</p>${r.address?`<a href="${esc(mapUrl(r.address))}" target="_blank">Abrir Maps</a>`:""}<details><summary><strong>Email / texto original</strong></summary><p class="noteText">${esc(r.raw||"")}</p></details></div>`}
function reservationForm(){modal("Nueva reserva",`<select id="rType"><option>Hotel</option><option>Vuelo</option><option>Tren</option><option>Restaurante</option><option>Entrada</option><option>Parking</option></select><input id="rName" placeholder="Nombre reserva"><input id="rDate" placeholder="Fecha"><input id="rLocator" placeholder="Localizador"><input id="rAddress" placeholder="Dirección"><textarea id="rRaw" placeholder="Pega aquí el email de confirmación"></textarea><button class="primary" onclick="saveReservation()">Guardar reserva</button>`)}
function saveReservation(){db.reservations.push({id:uid(),type:rType.value,name:rName.value,date:rDate.value,locator:rLocator.value,address:rAddress.value,raw:rRaw.value});save();closeModal();view="reservations";render()}

function docs(){$("app").innerHTML=`<div class="card"><h2>📂 Documentos</h2><button class="primary" onclick="docForm()">+ Añadir documento</button><p class="muted">Guarda enlaces a PDFs, capturas, entradas o archivos en iCloud/Drive.</p></div>${db.docs.map(docCard).join("")||"<div class='empty'>Sin documentos.</div>"}`}
function docCard(d){return`<div class="card"><h2>${esc(d.name)}</h2><p class="muted">${esc(d.type||"Documento")}</p>${d.link?`<a href="${esc(d.link)}" target="_blank">Abrir documento</a>`:""}<p>${esc(d.notes||"")}</p></div>`}
function docForm(tripId=""){modal("Nuevo documento",`<input id="dName" placeholder="Nombre"><select id="dType"><option>PDF reserva</option><option>Entrada</option><option>Captura QR</option><option>Email</option><option>Otro</option></select><input id="dLink" placeholder="Enlace al documento / archivo"><textarea id="dNotes" placeholder="Notas"></textarea><button class="primary" onclick="saveDoc('${tripId}')">Guardar documento</button>`)}
function saveDoc(tripId){db.docs.push({id:uid(),tripId,name:dName.value,type:dType.value,link:dLink.value,notes:dNotes.value});save();closeModal();render()}

render();
