const KEY="viajes_planes_v14";
let db=load(), view="home", activeTripId=db.trips[0]?.id||null, tab="days";

const $=id=>document.getElementById(id);
function uid(){return Date.now().toString(36)+Math.random().toString(36).slice(2)}
function normalize(s){return String(s||"").replace(/\r\n/g,"\n").replace(/\r/g,"\n").replace(/\\n/g,"\n").replace(/\\\\n/g,"\n")}
function clean(s){s=normalize(s);let out="";for(let i=0;i<s.length;i++){let c=s.charCodeAt(i);if(c>=0xD800&&c<=0xDBFF){let n=s.charCodeAt(i+1);if(n>=0xDC00&&n<=0xDFFF){out+=s[i]+s[i+1];i++;continue}continue}if(c>=0xDC00&&c<=0xDFFF)continue;out+=s[i]}return out}
function esc(s){return clean(s).replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;")}
function save(){localStorage.setItem(KEY,JSON.stringify(db))}
function load(){try{let s=localStorage.getItem(KEY);if(s)return JSON.parse(s)}catch(e){}return {trips:[{id:uid(),name:"Conil 2026",dates:"14 - 22 julio 2026",destination:"Sevilla, Conil y Cádiz",people:"Familia",hotel:"",hotelMap:"",image:"",summary:"Viaje a Sevilla y Conil.",days:[]}],events:[],reservations:[],docs:[]}}
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
  $("app").innerHTML=`<section class="hero"><div class="txt"><h1>Viajes & Planes</h1><p>V14: URLs ocultas y mapas dentro de su bloque</p></div></section>
  <div class="grid"><div class="stat"><span>${db.trips.length}</span>Viajes</div><div class="stat"><span>${db.events.length}</span>Eventos</div><div class="stat"><span>${db.reservations.length}</span>Reservas</div><div class="stat"><span>${db.docs.length}</span>Docs</div></div>
  <div class="card"><h2>Viajes</h2>${db.trips.map(tripRow).join("")||"<p class='muted'>Sin viajes.</p>"}</div>`;
}
function tripRow(t){return`<div class="item" onclick="activeTripId='${t.id}';view='trips';render()"><div class="thumb">${t.image?`<img src="${esc(t.image)}">`:"✈️"}</div><div><strong>${esc(t.name)}</strong><br><span class="muted">${esc(t.dates)} · ${esc(t.destination)}</span></div><div class="chev">›</div></div>`}
function trips(){
  const t=trip();
  $("app").innerHTML=`<section class="hero">${t.image?`<img src="${esc(t.image)}">`:""}<div class="txt"><h1>${esc(t.name)}</h1><p>${esc(t.dates)}</p><p>${esc(t.destination)}</p></div></section>
  <div class="tabs"><button class="tab ${tab==='days'?'active':''}" onclick="tab='days';render()">📅 Días</button><button class="tab ${tab==='links'?'active':''}" onclick="tab='links';render()">📍 Enlaces</button><button class="tab ${tab==='docs'?'active':''}" onclick="tab='docs';render()">📂 Docs</button></div>
  <div class="card"><h2>${esc(t.name)}</h2><span class="pill">${t.days.length} días/notas</span><span class="pill">${allLinks(t).length} enlaces</span><p>${esc(t.summary||"")}</p><p><b>👥 Personas:</b> ${esc(t.people||"Sin indicar")}</p><p><b>🏨 Hotel:</b> ${esc(t.hotel||"Sin indicar")} ${hotelLink(t)}</p><div class="actions"><button class="secondary" onclick="tripForm('${t.id}')">Editar viaje</button><button class="secondary" onclick="dayForm()">Añadir día</button><button class="secondary" onclick="folderImport()">Importar varios</button><button class="danger" onclick="deleteTrip('${t.id}')">Eliminar</button></div></div>
  ${tripContent(t)}`;
}
function hotelLink(t){if(!t.hotel&&!t.hotelMap)return"";let q=t.hotelMap||t.hotel;let url=q.startsWith("http")?q:mapUrl(q,t);return`<br><a href="${esc(url)}" target="_blank">Abrir hotel en Maps</a>`}
function tripContent(t){
  if(tab==="days")return t.days.length?t.days.map(dayCard).join(""):`<div class="empty">Añade o importa días.</div>`;
  if(tab==="links"){let links=allLinks(t);return links.length?links.map(l=>`<div class="card"><a href="${esc(l.url)}" target="_blank">🔗 ${esc(l.label)}</a><p class="muted">${esc(l.url)}</p></div>`).join(""):`<div class="empty">Sin enlaces detectados.</div>`}
  return `<div class="card"><h2>Documentos del viaje</h2><button class="primary" onclick="docForm('${t.id}')">+ Añadir documento</button>${db.docs.filter(d=>d.tripId===t.id).map(docCard).join("")||"<p class='muted'>Sin documentos.</p>"}</div>`;
}
function dayCard(d){
  return`<div class="noteCard"><button class="noteHead" onclick="this.parentElement.classList.toggle('open')"><span>${iconForDay(d)}</span><strong>${esc(d.title)}</strong><span>⌄</span></button><div class="noteBody">${renderDay(d)}<details><summary><strong>Ver texto original</strong></summary><div class="rawText">${esc(d.raw)}</div></details><div class="actions"><button class="secondary" onclick="copyDay('${d.id}')">Copiar</button><button class="danger" onclick="deleteDay('${d.id}')">Eliminar</button></div></div></div>`;
}
function renderDay(d){
  return d.sections.map(sec=>{
    if(sec.type==="time"){
      return `<div class="timeLine"><b>${esc(sec.title)}</b><span>${sec.lines.map(formatInline).join("<br>")}</span></div>`;
    }
    return `<section class="noteSection"><h3>${esc(sec.title)}</h3>${sec.lines.map(formatLine).join("")}</section>`;
  }).join("") || `<div class="rawText">${esc(d.raw)}</div>`;
}
function formatInline(line){
  let u=line.match(/https?:\/\/\S+/);
  if(!u) return esc(line);
  let text=line.replace(u[0],"").trim();
  let label=isMap(u[0])?"Abrir Maps":"Abrir enlace";
  return `${text?esc(text)+" ":""}<a class="mapBtn" href="${esc(u[0])}" target="_blank">${label}</a>`;
}
function formatLine(line){
  line=clean(line).trim();
  if(!line || /^[-—_⸻]{2,}$/.test(line)) return "";
  let u=line.match(/https?:\/\/\S+/);
  if(u){
    let text=line.replace(u[0],"").trim();
    let label=isMap(u[0])?"Abrir Maps":"Abrir enlace";
    return `<p>${text?esc(text)+"<br>":""}<a class="mapBtn" href="${esc(u[0])}" target="_blank">${label}</a></p>`;
  }
  if(/^✅/.test(line)) return `<p>${esc(line)}</p>`;
  if(/^✔|^✓/.test(line)) return `<p>✅ ${esc(line.replace(/^✔|^✓/,"").trim())}</p>`;
  return `<p>${esc(line)}</p>`;
}
function isMap(url){return /maps|google/i.test(url)}

function parseDay(raw){
  raw=clean(raw).trim();
  let lines=raw.split("\n").map(x=>x.trim()).filter(Boolean);
  let title=lines[0]?.replace(/^---+|---+$/g,"").trim()||"Día";
  if(lines[1] && norm(lines[1])===norm(title)) lines.splice(1,1);
  let d={id:uid(),title,raw,sections:[],links:extractLinks(raw)};
  let current=null, lastNamed=null;

  function push(){ if(current && current.lines.length) d.sections.push(current); current=null; }
  function startSection(title){ push(); current={type:"section",title,lines:[]}; lastNamed=title; }
  function ensureSection(title="Notas"){ if(!current) current={type:"section",title,lines:[]}; }

  for(let i=1;i<lines.length;i++){
    let line=lines[i];

    if(/^[-—_⸻]{2,}$/.test(line)){ push(); continue; }

    let url=line.match(/https?:\/\/\S+/);
    if(url){
      // Never create a URL title. Attach URL to current block.
      ensureSection(lastNamed || "Enlace");
      current.lines.push(line);
      continue;
    }

    let time=line.match(/^([🍺🍽️🍸]?\s*\d{1,2}:\d{2}(?:\s*[–-]\s*\d{1,2}:\d{2})?)\s*(.*)$/);
    if(time){ push(); current={type:"time",title:time[1].trim(),lines:[]}; lastNamed=current.title; if(time[2]) current.lines.push(time[2]); continue; }

    if(isHeading(line)){ startSection(line); continue; }

    if(isPlaceName(line)){
      // If current is generic or already has unrelated content, create a named section.
      if(!current || current.title==="Notas" || current.lines.length>0) startSection(placeIcon(line)+" "+line);
      else current.lines.push(line);
      lastNamed=placeIcon(line)+" "+line;
      continue;
    }

    ensureSection("Notas");
    current.lines.push(line);
  }
  push();
  return d;
}
function isPlaceName(line){
  if(line.length>58) return false;
  if(/^✔|^✓|^✅/.test(line)) return false;
  if(/https?:\/\//.test(line)) return false;
  return /(Parking|Plaza de Cuba|Mercado de Triana|Obispo Galarza|María Trifulca|Maria Trifulca|Bar Embarcadero|Calle Betis|Capilla|Cristo|Triana 143|Casa Juan|Cuartel del Mar|Mercadona|Chiringuito|Restaurante)/i.test(line);
}
function placeIcon(line){
  if(/parking|plaza de cuba|obispo|mercado de triana/i.test(line)) return "🅿️";
  if(/trifulca|bar|casa juan|cuartel|restaurante|chiringuito|mercadona/i.test(line)) return "🍽️";
  if(/capilla|cristo|visita/i.test(line)) return "⛪";
  if(/triana 143|hotel|alojamiento/i.test(line)) return "🏨";
  return "📍";
}
function isHeading(line){
  if(line.length>55) return false;
  return /^(🏨|🅿️|⛪|🍺|🍽️|🍸|🚶|📅|📍|🏖|🚗|📝)/.test(line) || /^(Alojamiento|Parking|Visita|Cena|Cerveza|Copa|Vuelta|Plan del día|Playas|Restaurantes|Distancias|Transporte|CÁCERES|CACERES|SEVILLA)$/i.test(line);
}
function iconForDay(d){let x=norm(d.title+" "+d.raw);if(/parking|distancia|coche|tren|aeropuerto/.test(x))return"🚗";if(/restaurante|cena|comida|bar|cerveza|copa|trifulca|casa juan/.test(x))return"🍽";if(/hotel|alojamiento|chalet/.test(x))return"🏨";return"📅"}
function extractLinks(text){
  let out=[], urlRe=/https?:\/\/[^\s]+/g, m;
  while((m=urlRe.exec(clean(text)))!==null){out.push({label:isMap(m[0])?"Abrir Maps":"Abrir enlace",url:m[0]})}
  return out;
}
function allLinks(t){let arr=[];t.days.forEach(d=>d.links.forEach(l=>arr.push(l)));return arr}

function tripForm(id=""){
  let t=id?db.trips.find(x=>x.id===id):{};
  modal(id?"Editar viaje":"Nuevo viaje",`<input id="fName" placeholder="Nombre" value="${esc(t.name||"")}"><input id="fDates" placeholder="Fechas" value="${esc(t.dates||"")}"><input id="fDest" placeholder="Destino" value="${esc(t.destination||"")}"><input id="fPeople" placeholder="Personas" value="${esc(t.people||"")}"><input id="fHotel" placeholder="Hotel / alojamiento" value="${esc(t.hotel||"")}"><input id="fHotelMap" placeholder="Dirección o enlace Maps hotel" value="${esc(t.hotelMap||"")}"><input id="fImage" placeholder="URL imagen portada" value="${esc(t.image||"")}"><textarea id="fSummary" placeholder="Resumen">${esc(t.summary||"")}</textarea><button class="primary" onclick="saveTrip('${id}')">Guardar</button>`);
}
function saveTrip(id=""){let t=id?db.trips.find(x=>x.id===id):{id:uid(),days:[]};Object.assign(t,{name:fName.value.trim(),dates:fDates.value.trim(),destination:fDest.value.trim(),people:fPeople.value.trim(),hotel:fHotel.value.trim(),hotelMap:fHotelMap.value.trim(),image:fImage.value.trim(),summary:fSummary.value.trim()});if(!id){db.trips.push(t);activeTripId=t.id}save();closeModal();render()}
function deleteTrip(id){if(confirm("¿Eliminar viaje?")){db.trips=db.trips.filter(t=>t.id!==id);activeTripId=db.trips[0]?.id||null;save();render()}}
function dayForm(){modal("Añadir día desde Apple Notes",`<p class="tip">Copia una nota completa desde Apple Notes y pégala aquí.</p><textarea id="dayRaw" placeholder="Pega aquí la nota completa"></textarea><button class="primary" onclick="saveDay()">Guardar día</button>`)}
function saveDay(){let raw=clean(dayRaw.value).trim();if(!raw)return alert("Pega la nota");trip().days.push(parseDay(raw));save();closeModal();tab="days";render()}
function folderImport(){modal("Importar varios días/notas",`<p class="tip">Pega varias notas juntas separadas por títulos con guiones.</p><div class="sample">--- Martes 14 julio ---\ncontenido...\n\n--- VIAJE CONIL - 15 JULIO - CHALET ---\ncontenido...</div><textarea id="bulk" placeholder="Pega aquí varias notas"></textarea><button class="primary" onclick="saveFolder()">Importar</button>`)}
function saveFolder(){let raw=clean(bulk.value).trim();if(!raw)return alert("Pega contenido");splitNotes(raw).forEach(r=>trip().days.push(parseDay(r)));save();closeModal();tab="days";render();alert("Importado")}
function splitNotes(raw){raw=clean(raw);let parts=raw.split(/\n\s*---+\s*/).map(x=>x.trim()).filter(Boolean);if(parts.length>1)return parts.map(p=>p.startsWith("---")?p:"--- "+p);return [raw]}
function copyDay(id){let d=trip().days.find(x=>x.id===id);navigator.clipboard.writeText(d.raw)}
function deleteDay(id){if(confirm("¿Eliminar día?")){trip().days=trip().days.filter(d=>d.id!==id);save();render()}}

function events(){$("app").innerHTML=`<div class="card"><h2>🎟️ Eventos y entradas</h2><button class="primary" onclick="eventForm()">+ Nuevo evento</button></div>${db.events.map(eventCard).join("")||"<div class='empty'>Sin eventos.</div>"}`}
function eventCard(e){return`<div class="card"><h2>${esc(e.name)}</h2><p class="muted">${esc(e.date)} · ${esc(e.place)}</p>${e.link?`<p><a href="${esc(e.link)}" target="_blank">Abrir entrada / enlace</a></p>`:""}${e.map?`<p><a href="${esc(e.map.startsWith('http')?e.map:mapUrl(e.map))}" target="_blank">Abrir Maps</a></p>`:""}<p>${esc(e.notes||"")}</p></div>`}
function eventForm(){modal("Nuevo evento / entrada",`<input id="eName" placeholder="Nombre"><input id="eDate" placeholder="Fecha y hora"><input id="ePlace" placeholder="Lugar"><input id="eMap" placeholder="Dirección o Maps"><input id="eLink" placeholder="Enlace entrada / PDF / Wallet"><textarea id="eNotes" placeholder="Pega email o notas"></textarea><button class="primary" onclick="saveEvent()">Guardar evento</button>`)}
function saveEvent(){db.events.push({id:uid(),name:eName.value,date:eDate.value,place:ePlace.value,map:eMap.value,link:eLink.value,notes:eNotes.value});save();closeModal();view="events";render()}

function reservations(){$("app").innerHTML=`<div class="card"><h2>📧 Reservas</h2><button class="primary" onclick="reservationForm()">+ Nueva reserva desde email</button></div>${db.reservations.map(resCard).join("")||"<div class='empty'>Sin reservas.</div>"}`}
function resCard(r){return`<div class="card"><h2>${esc(r.name)}</h2><p class="muted">${esc(r.type)} · ${esc(r.date)}</p><p>${esc(r.locator||"")}</p>${r.address?`<a href="${esc(mapUrl(r.address))}" target="_blank">Abrir Maps</a>`:""}<details><summary><strong>Email / texto original</strong></summary><div class="rawText">${esc(r.raw||"")}</div></details></div>`}
function reservationForm(){modal("Nueva reserva",`<select id="rType"><option>Hotel</option><option>Vuelo</option><option>Tren</option><option>Restaurante</option><option>Entrada</option><option>Parking</option></select><input id="rName" placeholder="Nombre reserva"><input id="rDate" placeholder="Fecha"><input id="rLocator" placeholder="Localizador"><input id="rAddress" placeholder="Dirección"><textarea id="rRaw" placeholder="Pega aquí el email de confirmación"></textarea><button class="primary" onclick="saveReservation()">Guardar reserva</button>`)}
function saveReservation(){db.reservations.push({id:uid(),type:rType.value,name:rName.value,date:rDate.value,locator:rLocator.value,address:rAddress.value,raw:clean(rRaw.value)});save();closeModal();view="reservations";render()}

function docs(){$("app").innerHTML=`<div class="card"><h2>📂 Documentos</h2><button class="primary" onclick="docForm()">+ Añadir documento</button><p class="muted">Guarda enlaces a PDFs, capturas, entradas o archivos en iCloud/Drive.</p></div>${db.docs.map(docCard).join("")||"<div class='empty'>Sin documentos.</div>"}`}
function docCard(d){return`<div class="card"><h2>${esc(d.name)}</h2><p class="muted">${esc(d.type||"Documento")}</p>${d.link?`<a href="${esc(d.link)}" target="_blank">Abrir documento</a>`:""}<p>${esc(d.notes||"")}</p></div>`}
function docForm(tripId=""){modal("Nuevo documento",`<input id="dName" placeholder="Nombre"><select id="dType"><option>PDF reserva</option><option>Entrada</option><option>Captura QR</option><option>Email</option><option>Otro</option></select><input id="dLink" placeholder="Enlace al documento / archivo"><textarea id="dNotes" placeholder="Notas"></textarea><button class="primary" onclick="saveDoc('${tripId}')">Guardar documento</button>`)}
function saveDoc(tripId){db.docs.push({id:uid(),tripId,name:dName.value,type:dType.value,link:dLink.value,notes:dNotes.value});save();closeModal();render()}

render();
