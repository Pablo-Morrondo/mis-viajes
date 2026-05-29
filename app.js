const KEY = "mis_viajes_pwa_v1";
const DARK_KEY = "mis_viajes_dark";
let currentView = "summary";
let activeTripId = null;

const sampleTrips = [
  {
    id: crypto.randomUUID(),
    name: "Bruselas 2026",
    dates: "4 - 8 septiembre 2026",
    destination: "Bruselas, Gante y Brujas",
    people: "Familia de 4",
    accommodation: "Zona Rue Sainte-Catherine",
    transport: "Vuelo desde Madrid + tren/metro",
    budget: "Aprox. 1.200 €",
    favorite: true,
    summary: "Viaje familiar con base en Bruselas y excursión a Gante y Brujas.",
    pending: ["Reservar tour Gante y Brujas", "Comprar entradas Atomium"],
    links: [
      { label: "Grand Place", url: "https://www.google.com/maps/search/Grand+Place+Bruselas" },
      { label: "Atomium", url: "https://www.google.com/maps/search/Atomium+Bruselas" }
    ],
    notes: "Usar transporte público. Llevar calzado cómodo.",
    days: [
      parseDayNote("Viernes 4 septiembre", `🇧🇪 BRUSELAS | VIERNES 4 SEPT 2026

🕘 CRONOGRAMA RÁPIDO
• 16:25 | ✈️ Llegada Aeropuerto Zaventem
• 17:25 | 🚆 Tren Aeropuerto → Centro
• 18:00 | 📍 Llegada a Bruxelles-Central
• 18:30 | 🏨 Check-in / Descanso
• 19:30 | 🚶 Paseo Centro Histórico
• 21:00 | 🍽 Cena Fin de Siècle o Chez Léon
• 22:30 | 🍺 Delirium Café

🚆 LOGÍSTICA: AEROPUERTO → CENTRO
Estación destino: Bruxelles-Central. Duración: ~20 min.

🔗 Enlaces útiles:
• https://www.google.com/maps/search/Brussels+Airport
• https://www.google.com/maps/search/Bruxelles-Central

🚶 RUTA ESCÉNICA AL ALOJAMIENTO
1. Mont des Arts
2. Galerías Saint Hubert
3. Grand Place

🍽 Restaurantes:
Fin de Siècle
Chez Léon

📝 Notas:
Día suave para llegar, instalarse y pasear.`)
    ]
  }
];

let trips = load();
activeTripId = trips[0]?.id || null;

function load() {
  const saved = localStorage.getItem(KEY);
  return saved ? JSON.parse(saved) : sampleTrips;
}

function save() {
  localStorage.setItem(KEY, JSON.stringify(trips));
}

function activeTrip() {
  return trips.find(t => t.id === activeTripId) || trips[0];
}

function toggleDark() {
  document.body.classList.toggle("dark");
  localStorage.setItem(DARK_KEY, document.body.classList.contains("dark"));
}

if (localStorage.getItem(DARK_KEY) === "true") document.body.classList.add("dark");

function toggleSidebar() {
  document.getElementById("sidebar").classList.toggle("open");
  document.getElementById("overlay").classList.toggle("show");
}

function setView(view) {
  currentView = view;
  render();
}

function render() {
  const trip = activeTrip();
  const content = document.getElementById("content");

  if (!trip) {
    content.innerHTML = `<div class="card empty">Crea tu primer viaje desde el menú lateral.</div>`;
    return;
  }

  document.getElementById("topTitle").textContent = trip.name;
  document.getElementById("heroName").textContent = trip.name;
  document.getElementById("heroMeta").textContent = trip.dates || "Sin fechas";
  document.getElementById("heroDest").textContent = trip.destination || "Sin destino";

  ["summary","days","pending","links"].forEach(v => {
    document.getElementById("tab-" + v).classList.toggle("active", currentView === v);
    document.getElementById("nav-" + v).classList.toggle("active", currentView === v);
  });

  renderTripList();

  if (currentView === "summary") content.innerHTML = summaryView(trip);
  if (currentView === "days") content.innerHTML = daysView(trip);
  if (currentView === "pending") content.innerHTML = pendingView(trip);
  if (currentView === "links") content.innerHTML = linksView(trip);
}

function renderTripList() {
  const list = document.getElementById("tripList");
  list.innerHTML = trips.map(t => `
    <div class="trip-item ${t.id === activeTripId ? "active" : ""}" onclick="selectTrip('${t.id}')">
      <div class="thumb"></div>
      <div>
        <strong>${t.favorite ? "★ " : ""}${escapeHtml(t.name)}</strong>
        <small>${escapeHtml(t.dates || "")}</small>
        <small>${escapeHtml(t.destination || "")}</small>
      </div>
    </div>
  `).join("");
}

function selectTrip(id) {
  activeTripId = id;
  currentView = "summary";
  toggleSidebar();
  render();
}

function summaryView(trip) {
  return `
    <div class="card">
      <h2>Resumen del viaje</h2>
      <p>${escapeHtml(trip.summary || "Sin resumen todavía.")}</p>
      <div>
        <div class="info-row"><div>👥</div><div><strong>Personas</strong><br><span class="muted">${escapeHtml(trip.people || "Sin indicar")}</span></div></div>
        <div class="info-row"><div>🚆</div><div><strong>Transporte</strong><br><span class="muted">${escapeHtml(trip.transport || "Sin indicar")}</span></div></div>
        <div class="info-row"><div>🏨</div><div><strong>Alojamiento</strong><br><span class="muted">${escapeHtml(trip.accommodation || "Sin indicar")}</span></div></div>
        <div class="info-row"><div>💶</div><div><strong>Presupuesto</strong><br><span class="muted">${escapeHtml(trip.budget || "Opcional")}</span></div></div>
      </div>
      <div class="actions">
        <button class="secondary" onclick="copyTripSummary()">Copiar resumen</button>
        <button class="secondary" onclick="openDayModal()">＋ Añadir día</button>
        <button class="danger" onclick="deleteTrip()">Eliminar viaje</button>
      </div>
    </div>

    <div class="card">
      <h3>Notas rápidas</h3>
      <textarea id="tripNotes">${escapeHtml(trip.notes || "")}</textarea>
      <button class="primary" onclick="saveTripNotes()">Guardar notas</button>
    </div>
  `;
}

function daysView(trip) {
  const q = document.getElementById("search").value.toLowerCase();
  const days = (trip.days || []).filter(d => JSON.stringify(d).toLowerCase().includes(q));

  return `
    <div class="card">
      <h2>Itinerario por días</h2>
      <p class="muted">Añade cada nota del iPhone como un día independiente.</p>
      <button class="primary" onclick="openDayModal()">＋ Añadir día desde Nota</button>
    </div>

    ${days.length ? days.map((d, i) => dayCard(d, i)).join("") : `<div class="empty">No hay días o no hay resultados.</div>`}
  `;
}

function dayCard(day, index) {
  return `
    <div class="card day-card">
      <div class="day-head">
        <div>
          <h3>${escapeHtml(day.title)}</h3>
          <p class="muted">${escapeHtml(day.subtitle || "Día del viaje")}</p>
        </div>
        <button class="secondary" onclick="copyDay(${index})">Copiar</button>
      </div>

      ${day.times.length ? `
        <div class="section-block">
          <h4>⏰ Cronograma rápido</h4>
          <div class="timeline">
            ${day.times.map(t => `
              <div class="time-item">
                <div class="time">${escapeHtml(t.time)}</div>
                <div>${linkify(escapeHtml(t.text))}</div>
              </div>
            `).join("")}
          </div>
        </div>
      ` : ""}

      ${day.logistics.length ? block("🚆 Logística / transporte", day.logistics) : ""}
      ${day.routes.length ? block("🗺 Rutas", day.routes) : ""}
      ${day.restaurants.length ? block("🍽 Restaurantes", day.restaurants) : ""}
      ${day.links.length ? linksBlock(day.links) : ""}
      ${day.pending.length ? block("☑ Pendiente", day.pending) : ""}
      ${day.notes.length ? block("📝 Notas importantes", day.notes) : ""}

      <details class="section-block">
        <summary><strong>Ver nota original</strong></summary>
        <p class="raw-note">${linkify(escapeHtml(day.raw))}</p>
      </details>

      <div class="actions">
        <button class="danger" onclick="deleteDay(${index})">Eliminar día</button>
      </div>
    </div>
  `;
}

function block(title, arr) {
  return `<div class="section-block"><h4>${title}</h4>${arr.map(x => `<p>• ${linkify(escapeHtml(x))}</p>`).join("")}</div>`;
}

function linksBlock(arr) {
  return `<div class="section-block"><h4>🔗 Enlaces útiles</h4>${arr.map(x => `
    <div class="link-card">
      <a href="${x.url}" target="_blank">${escapeHtml(x.label)}</a>
      <div class="muted">${escapeHtml(x.url)}</div>
    </div>
  `).join("")}</div>`;
}

function pendingView(trip) {
  return `
    <div class="card">
      <h2>Pendiente de reservar</h2>
      <input id="newPending" placeholder="Ej: Reservar restaurante, comprar entradas..." />
      <button class="primary" onclick="addPending()">Añadir pendiente</button>
    </div>
    <div class="card">
      ${(trip.pending || []).length ? trip.pending.map((p, i) => `
        <div class="checkbox-line">
          <span class="dot"></span>
          <div style="flex:1">${escapeHtml(p)}</div>
          <button class="danger" onclick="removePending(${i})">×</button>
        </div>
      `).join("") : `<p class="muted">No hay pendientes.</p>`}
    </div>
  `;
}

function linksView(trip) {
  return `
    <div class="card">
      <h2>Documentos / enlaces útiles</h2>
      <input id="newLinkLabel" placeholder="Nombre del enlace" />
      <input id="newLinkUrl" placeholder="URL de Google Maps, reserva, billete..." />
      <button class="primary" onclick="addLink()">Añadir enlace</button>
    </div>
    ${(trip.links || []).length ? trip.links.map((l, i) => `
      <div class="card">
        <a href="${l.url}" target="_blank">${escapeHtml(l.label)}</a>
        <p class="muted">${escapeHtml(l.url)}</p>
        <button class="danger" onclick="removeLink(${i})">Eliminar</button>
      </div>
    `).join("") : `<div class="empty">No hay enlaces todavía.</div>`}
  `;
}

function parseDayNote(title, raw) {
  const lines = raw.split(/\n/).map(l => l.trim()).filter(Boolean);
  const day = {
    id: crypto.randomUUID(),
    title: title || "Día sin título",
    subtitle: "",
    raw,
    times: [],
    logistics: [],
    routes: [],
    restaurants: [],
    links: [],
    pending: [],
    notes: []
  };

  const firstTitle = lines.find(l => l.length > 8 && /BRUSELAS|CONIL|SEVILLA|LONDRES|ROMA|DÍA|DIA/i.test(l));
  if (firstTitle) day.subtitle = firstTitle.replace(/[🇧🇪🇪🇸🇬🇧🇮🇹]/g, "").trim();

  let section = "notes";

  for (const line of lines) {
    const clean = line.replace(/^[-•]\s*/, "").trim();

    if (/CRONOGRAMA|HORARIO/i.test(clean)) { section = "times"; continue; }
    if (/LOGÍSTICA|LOGISTICA|TRANSPORTE|AEROPUERTO|METRO|TREN|BUS/i.test(clean)) { section = "logistics"; }
    if (/RUTA|PASEO|ESCÉNICA|ESCENICA|ITINERARIO/i.test(clean)) { section = "routes"; }
    if (/RESTAURANTE|CENA|COMIDA|DESAYUNO|BAR|CAFÉ|CAFE|TAPAS/i.test(clean)) { section = "restaurants"; }
    if (/ENLACES|MAPS|GOOGLE MAPS|UBICACIÓN|UBICACION/i.test(clean)) { section = "links"; }
    if (/PENDIENTE|RESERVAR|ENTRADAS|BILLETES|COMPRAR/i.test(clean)) { section = "pending"; }

    const timeMatch = clean.match(/(\d{1,2}:\d{2})\s*[|–-]?\s*(.*)/);
    if (timeMatch) {
      day.times.push({ time: timeMatch[1], text: timeMatch[2] || clean });
      continue;
    }

    const urlMatch = clean.match(/https?:\/\/\S+/);
    if (urlMatch) {
      day.links.push({ label: labelFromUrlOrLine(clean), url: urlMatch[0] });
      continue;
    }

    if (section === "logistics") day.logistics.push(clean);
    else if (section === "routes") day.routes.push(clean);
    else if (section === "restaurants") day.restaurants.push(clean);
    else if (section === "links") {
      if (clean.length > 4) day.links.push({ label: clean, url: googleSearchUrl(clean) });
    }
    else if (section === "pending") day.pending.push(clean);
    else day.notes.push(clean);
  }

  day.logistics = unique(day.logistics).filter(x => !/LOGÍSTICA|LOGISTICA/i.test(x));
  day.routes = unique(day.routes).filter(x => !/RUTA/i.test(x));
  day.restaurants = unique(day.restaurants).filter(x => !/RESTAURANTE/i.test(x));
  day.pending = unique(day.pending);
  day.notes = unique(day.notes).filter(x => x !== day.subtitle);

  return day;
}

function labelFromUrlOrLine(line) {
  const withoutUrl = line.replace(/https?:\/\/\S+/, "").replace(/[•🔗📍🎟]/g, "").trim();
  return withoutUrl || "Abrir enlace";
}

function googleSearchUrl(text) {
  return "https://www.google.com/maps/search/" + encodeURIComponent(text.replace(/[📍🎟🔗]/g, "").trim());
}

function unique(arr) { return [...new Set(arr.filter(Boolean))]; }
function linkify(text) { return text.replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" target="_blank">$1</a>'); }

function escapeHtml(str) {
  return String(str || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function openTripModal() { document.getElementById("tripModal").classList.add("show"); }
function closeTripModal() { document.getElementById("tripModal").classList.remove("show"); }
function openDayModal() { document.getElementById("dayModal").classList.add("show"); }
function closeDayModal() { document.getElementById("dayModal").classList.remove("show"); }

function saveNewTrip() {
  const name = document.getElementById("tripName").value.trim();
  if (!name) return alert("Pon un nombre al viaje.");

  const trip = {
    id: crypto.randomUUID(),
    name,
    dates: document.getElementById("tripDates").value.trim(),
    destination: document.getElementById("tripDestination").value.trim(),
    people: document.getElementById("tripPeople").value.trim(),
    accommodation: document.getElementById("tripAccommodation").value.trim(),
    transport: "",
    budget: "",
    favorite: false,
    summary: document.getElementById("tripSummary").value.trim(),
    pending: [],
    links: [],
    notes: "",
    days: []
  };

  trips.push(trip);
  activeTripId = trip.id;
  save();
  closeTripModal();
  render();
}

function saveDayFromNote() {
  const title = document.getElementById("dayTitle").value.trim();
  const text = document.getElementById("dayText").value.trim();
  if (!text) return alert("Pega la nota del día.");

  const trip = activeTrip();
  const parsed = parseDayNote(title || "Nuevo día", text);

  trip.days = trip.days || [];
  trip.days.push(parsed);
  trip.pending = unique([...(trip.pending || []), ...parsed.pending]);
  trip.links = [...(trip.links || []), ...parsed.links];

  save();
  document.getElementById("dayTitle").value = "";
  document.getElementById("dayText").value = "";
  closeDayModal();
  currentView = "days";
  render();
}

function toggleFavoriteActive() {
  const trip = activeTrip();
  trip.favorite = !trip.favorite;
  save();
  render();
}

function saveTripNotes() {
  activeTrip().notes = document.getElementById("tripNotes").value;
  save();
  alert("Notas guardadas");
}

function copyTripSummary() {
  const t = activeTrip();
  navigator.clipboard.writeText(`${t.name}\n${t.dates}\n${t.destination}\n\n${t.summary}`);
  alert("Resumen copiado");
}

function copyDay(index) {
  const d = activeTrip().days[index];
  navigator.clipboard.writeText(d.raw);
  alert("Día copiado");
}

function deleteDay(index) {
  if (!confirm("¿Eliminar este día?")) return;
  activeTrip().days.splice(index, 1);
  save();
  render();
}

function deleteTrip() {
  if (!confirm("¿Eliminar este viaje completo?")) return;
  trips = trips.filter(t => t.id !== activeTripId);
  activeTripId = trips[0]?.id || null;
  save();
  render();
}

function addPending() {
  const input = document.getElementById("newPending");
  const val = input.value.trim();
  if (!val) return;
  activeTrip().pending.push(val);
  save();
  render();
}

function removePending(i) {
  activeTrip().pending.splice(i, 1);
  save();
  render();
}

function addLink() {
  const label = document.getElementById("newLinkLabel").value.trim();
  const url = document.getElementById("newLinkUrl").value.trim();
  if (!label || !url) return alert("Pon nombre y URL.");
  activeTrip().links.push({ label, url });
  save();
  render();
}

function removeLink(i) {
  activeTrip().links.splice(i, 1);
  save();
  render();
}

render();
