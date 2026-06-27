/* ============================================================
   Responsible Medical AI Index — application logic
   Static, data-driven, no build step. Renders LIBRARY / TOPICS /
   GLOSSARY / TAXONOMY (loaded as globals) into #app via a hash router.
   ============================================================ */
(function () {
  "use strict";

  /* ---------- lookups & helpers ---------- */
  const entryById = new Map(LIBRARY.map((e) => [e.id, e]));
  const topicById = new Map(TOPICS.map((t) => [t.id, t]));
  const termById = new Map(GLOSSARY.map((g) => [g.id, g]));

  const taxList = (facet) => TAXONOMY[facet] || [];
  const taxItem = (facet, id) => taxList(facet).find((x) => x.id === id);
  const taxLabel = (facet, id) => (taxItem(facet, id) || {}).label || id;
  const taxDesc = (facet, id) => (taxItem(facet, id) || {}).description || "";

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }

  const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  function fmtDate(d) {
    if (!d) return "";
    const p = String(d).split("-");
    if (p.length === 3) return `${parseInt(p[2], 10)} ${MONTHS[+p[1] - 1]} ${p[0]}`;
    if (p.length === 2) return `${MONTHS[+p[1] - 1]} ${p[0]}`;
    return p[0];
  }
  function sortKey(d) {
    const p = String(d).split("-");
    const y = p[0] || "0000";
    const m = p[1] || "06";
    const day = p[2] || "15";
    return `${y}-${m.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }
  function entryRecency(e) {
    return (e.keyDates || []).reduce((mx, k) => (sortKey(k.date) > mx ? sortKey(k.date) : mx), "0000");
  }
  // "What's changed recently" feed: date each item by when the development
  // happened (explicit recentDate), NOT the entry's latest keyDate — which may
  // be a future applicability deadline (e.g. the EU AI Act's 2027/2028 dates).
  // Falls back to the latest keyDate only when recentDate is absent.
  function newsDateKey(e) { return e.recentDate ? sortKey(e.recentDate) : entryRecency(e); }
  function newsDateLabel(e) { return fmtDate(e.recentDate || entryRecency(e).slice(0, 7)); }

  /* ---------- facets ---------- */
  const FACETS = [
    { key: "themes", field: "themes", taxon: "themes", array: true, label: "Priority theme" },
    { key: "riskTypes", field: "riskTypes", taxon: "riskTypes", array: true, label: "Risk type" },
    { key: "jurisdictions", field: "jurisdiction", taxon: "jurisdictions", array: false, label: "Jurisdiction" },
    { key: "types", field: "type", taxon: "types", array: false, label: "Instrument type" },
    { key: "statuses", field: "status", taxon: "statuses", array: false, label: "Status" },
    { key: "appliesTo", field: "appliesTo", taxon: "appliesTo", array: true, label: "Applies to" },
    { key: "lifecycleStages", field: "lifecycleStages", taxon: "lifecycleStages", array: true, label: "Lifecycle stage" },
  ];
  // short query key <-> facet group
  const QUERY_MAP = { theme: "themes", risk: "riskTypes", jurisdiction: "jurisdictions", type: "types", status: "statuses", applies: "appliesTo", stage: "lifecycleStages" };
  const REV_QUERY = Object.fromEntries(Object.entries(QUERY_MAP).map(([k, v]) => [v, k]));

  /* ---------- state ---------- */
  const state = {
    search: "",
    filters: { themes: new Set(), riskTypes: new Set(), jurisdictions: new Set(), types: new Set(), statuses: new Set(), appliesTo: new Set(), lifecycleStages: new Set() },
    matrixAxis: "themes",
  };
  function clearFilters() {
    state.search = "";
    Object.values(state.filters).forEach((s) => s.clear());
  }
  function activeFilterCount() {
    return Object.values(state.filters).reduce((n, s) => n + s.size, 0) + (state.search ? 1 : 0);
  }

  /* ---------- filtering ---------- */
  function entryMatches(e) {
    if (state.search) {
      const q = state.search.toLowerCase();
      const hay = [e.shortName, e.fullTitle, e.focus, e.whyGenAIMedical, e.statusDetail, e.notes, taxLabel("bodies", e.body)]
        .filter(Boolean).join(" ").toLowerCase();
      if (!hay.includes(q)) return false;
    }
    for (const f of FACETS) {
      const sel = state.filters[f.key];
      if (!sel.size) continue;
      const val = e[f.field];
      const vals = f.array ? val || [] : [val];
      if (!vals.some((v) => sel.has(v))) return false;
    }
    return true;
  }
  const filteredEntries = () => LIBRARY.filter(entryMatches);

  /* ---------- small render helpers ---------- */
  function statusBadge(e) {
    return `<span class="badge status-${esc(e.status)}" title="${esc(taxDesc("statuses", e.status))}"><span class="badge-dot"></span>${esc(taxLabel("statuses", e.status))}</span>`;
  }
  function provisionalBadge(e) {
    return e.isProvisional ? `<span class="badge status-provisional" title="Moving target — verify against the primary source.">⚠ Verify</span>` : "";
  }
  function themeChips(ids, clickable) {
    return (ids || []).map((id) =>
      `<${clickable ? "a" : "span"} class="chip theme-chip theme-${esc(id)}"${clickable ? ` data-link="#/library?theme=${esc(id)}"` : ""} title="${esc(taxDesc("themes", id))}">${esc(taxLabel("themes", id))}</${clickable ? "a" : "span"}>`
    ).join("");
  }
  function riskChips(ids, clickable) {
    return (ids || []).map((id) =>
      `<${clickable ? "a" : "span"} class="chip"${clickable ? ` data-link="#/library?risk=${esc(id)}"` : ""} title="${esc(taxDesc("riskTypes", id))}">${esc(taxLabel("riskTypes", id))}</${clickable ? "a" : "span"}>`
    ).join("");
  }
  const ICON = {
    search: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></svg>',
    ext: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/></svg>',
    back: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>',
    arrow: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>',
  };

  /* ---------- entry card ---------- */
  function entryCard(e) {
    return `<a class="entry-card" data-link="#/entry/${esc(e.id)}">
      <div class="flex items-center gap-2 flex-wrap">${statusBadge(e)}${provisionalBadge(e)}
        <span class="badge badge-type">${esc(taxLabel("types", e.type))}</span></div>
      <div>
        <div class="font-extrabold text-base" style="color:var(--c-ink);letter-spacing:-.01em">${esc(e.shortName)}</div>
        <div class="tiny muted" style="margin-top:2px">${esc(e.fullTitle)}</div>
      </div>
      <p class="text-sm" style="margin:0;color:var(--c-body)">${esc(e.focus)}</p>
      <div class="flex flex-wrap gap-1" style="margin-top:auto">${themeChips(e.themes, false)}</div>
      <div class="flex items-center justify-between tiny muted" style="border-top:1px solid var(--c-border);padding-top:10px;margin-top:4px">
        <span><span class="badge badge-body">${esc(taxLabel("bodies", e.body))}</span></span>
        <span>Verified ${esc(fmtDate(e.lastVerified))}</span>
      </div>
    </a>`;
  }

  /* ---------- VIEW: Home ---------- */
  function renderHome() {
    const news = LIBRARY.filter((e) => e.recentNote).sort((a, b) => newsDateKey(b).localeCompare(newsDateKey(a)));
    const jurisdictionCount = new Set(LIBRARY.map((e) => e.jurisdiction)).size;
    const bodyCount = new Set(LIBRARY.map((e) => e.body)).size;

    const worlds = [
      { t: "General AI standards & frameworks", d: "ISO/IEC 42001, NIST AI RMF — govern any AI system", c: "#3b82f6" },
      { t: "Medical-device standards", d: "ISO 14971, IEC 62304, AAMI TIR34971 — device safety & quality", c: "#2563eb" },
      { t: "Regional regulation", d: "EU AI Act + MDR/IVDR, US FDA, UK MHRA — the binding law", c: "#1d4ed8" },
      { t: "International guidance", d: "WHO, IMDRF, GMLP — convergence & best practice", c: "#1e3a8a" },
    ];

    const paths = [
      { t: "Regulatory & QA", d: "Start with the binding regulations and submission guidance.", link: "#/library?type=regulation,guidance" },
      { t: "ML / Data scientist", d: "Guardrails, robustness and GenAI-specific risks.", link: "#/topic/guardrails" },
      { t: "Clinical & safety", d: "Safety assessment, usability and the human–AI team.", link: "#/topic/safety-assessment" },
      { t: "Product & project lead", d: "Risk management and the lifecycle big picture.", link: "#/topic/risk-management" },
    ];

    document.getElementById("app").innerHTML = `
    <section class="hero">
      <div class="container" style="padding:56px 20px 60px">
        <span class="pill">Where AI engineering meets medical-device regulation</span>
        <h1 style="font-size:clamp(28px,4vw,44px);margin:18px 0 14px;max-width:900px">
          Practise responsible AI for medical devices, <span style="color:#7cb0ff">from principle to evidence</span></h1>
        <p class="lede" style="font-size:18px;max-width:820px;margin:0 0 26px">
          A working reference for the <strong style="color:#fff">responsible medical-AI practitioner</strong> — turning the regulations, standards and guidance that govern GenAI-enabled medical devices into <strong style="color:#fff">defensible practice</strong> across risk management, safety assessment, guardrails, ongoing monitoring and best practice.</p>
        <div class="flex flex-wrap gap-3">
          <a class="btn btn-primary" data-link="#/library">Explore the library ${ICON.arrow}</a>
          <a class="btn btn-ghost-light" data-link="#/matrix">See the coverage matrix</a>
          <a class="btn btn-ghost-light" data-link="#/topics">Browse by topic</a>
        </div>
        <div class="grid gap-3" style="grid-template-columns:repeat(auto-fit,minmax(210px,1fr));margin-top:34px">
          ${paths.map((p) => `<a class="path-card" data-link="${p.link}" style="text-decoration:none">
            <h4>${esc(p.t)} ${ICON.arrow}</h4><p>${esc(p.d)}</p></a>`).join("")}
        </div>
      </div>
    </section>

    <div class="container view-enter" style="padding:40px 20px 60px">
      <!-- stats -->
      <div class="grid gap-3" style="grid-template-columns:repeat(auto-fit,minmax(150px,1fr));margin-bottom:42px">
        <div class="stat-tile"><div class="stat-num">${LIBRARY.length}</div><div class="stat-label">Instruments catalogued</div></div>
        <div class="stat-tile"><div class="stat-num">${jurisdictionCount}</div><div class="stat-label">Jurisdictions</div></div>
        <div class="stat-tile"><div class="stat-num">${bodyCount}</div><div class="stat-label">Issuing bodies</div></div>
        <div class="stat-tile"><div class="stat-num">${TOPICS.length}</div><div class="stat-label">Priority themes</div></div>
        <div class="stat-tile"><div class="stat-num">${GLOSSARY.length}</div><div class="stat-label">Glossary terms</div></div>
      </div>

      <!-- the landscape -->
      <div class="grid gap-6" style="grid-template-columns:repeat(auto-fit,minmax(300px,1fr));margin-bottom:46px">
        <div>
          <h2 style="font-size:24px;margin:0 0 10px">The landscape, in four layers</h2>
          <p class="muted" style="margin:0 0 14px">A GenAI medical device sits where four worlds meet. Nothing replaces the
            others — they <strong>stack</strong>. Read from the bottom up: international good practice informs regional law,
            which sits on device-safety standards, with general-AI governance wrapping the whole organisation.</p>
          <p class="tiny muted" style="margin:0">Use the <a data-link="#/matrix">coverage matrix</a> to see exactly which instrument
            addresses which risk, or jump into a <a data-link="#/topics">topic</a>.</p>
        </div>
        <div class="flex flex-col gap-2">
          ${worlds.map((w) => `<div class="card card-pad" style="border-left:5px solid ${w.c}">
            <div class="font-bold" style="color:var(--c-ink)">${esc(w.t)}</div>
            <div class="tiny muted">${esc(w.d)}</div></div>`).join("")}
        </div>
      </div>

      <!-- topics -->
      <h2 style="font-size:24px;margin:0 0 6px">Explore by priority theme</h2>
      <p class="muted" style="margin:0 0 18px">The five areas your team flagged. Each is a plain-language explainer that links to the relevant instruments.</p>
      <div class="grid gap-4" style="grid-template-columns:repeat(auto-fit,minmax(260px,1fr));margin-bottom:48px">
        ${TOPICS.map((t) => {
          const n = LIBRARY.filter((e) => e.themes.includes(t.id)).length;
          return `<a class="topic-card theme-${esc(t.id)}" data-link="#/topic/${esc(t.id)}" style="--accent:var(--th-${esc(t.id)});text-decoration:none">
            <h3 style="font-size:18px;margin:0 0 6px;display:flex;align-items:center;gap:8px">
              <span style="width:10px;height:10px;border-radius:50%;background:var(--th-${esc(t.id)})"></span>${esc(t.title)}</h3>
            <p class="text-sm muted" style="margin:0 0 12px">${esc(t.tagline)}</p>
            <div class="tiny" style="color:var(--c-primary-dark);font-weight:700">${n} related instruments ${ICON.arrow}</div>
          </a>`;
        }).join("")}
      </div>

      <!-- what's new -->
      <div class="grid gap-6" style="grid-template-columns:1.3fr 1fr">
        <div>
          <h2 style="font-size:24px;margin:0 0 6px">What's changed recently</h2>
          <p class="muted" style="margin:0 0 8px">Key 2024–2026 developments. This is the fastest-moving part of the field — verify before relying on any single date.</p>
          <div class="card card-pad">
            ${news.map((e) => `<div class="news-item">
              <div class="news-date">${esc(newsDateLabel(e))}</div>
              <div><a class="font-bold" data-link="#/entry/${esc(e.id)}" style="color:var(--c-ink)">${esc(e.shortName)}</a>
                <div class="tiny muted" style="margin-top:2px">${esc(e.recentNote)}</div></div>
            </div>`).join("")}
          </div>
        </div>
        <div>
          <h2 style="font-size:24px;margin:0 0 6px">How to use this site</h2>
          <div class="card card-pad text-sm" style="display:flex;flex-direction:column;gap:10px">
            <div>📚 <strong>Library</strong> — search & filter every instrument by theme, risk, jurisdiction, type and lifecycle stage.</div>
            <div>🧭 <strong>Topics</strong> — learn a concept first, then drill into the instruments that govern it.</div>
            <div>🔲 <strong>Compare</strong> — the matrix shows coverage and gaps at a glance.</div>
            <div>🔄 <strong>Lifecycle</strong> — see what applies at each stage, from design to change management.</div>
            <div>📖 <strong>Glossary</strong> — plain definitions, cross-linked to the instruments.</div>
            <hr class="divider" style="margin:4px 0"/>
            <div class="tiny muted">Every entry shows a <strong>Last verified</strong> date and links to the primary source. This is an educational reference, not legal or regulatory advice.</div>
          </div>
        </div>
      </div>
    </div>`;
  }

  /* ---------- VIEW: Library ---------- */
  function renderLibrary() {
    const facetsHtml = FACETS.map((f) => {
      const sel = state.filters[f.key];
      const chips = taxList(f.taxon).map((v) =>
        `<button class="filter-chip ${sel.has(v.id) ? "on" : ""}" data-filter-group="${f.key}" data-filter-id="${esc(v.id)}" title="${esc(v.description)}">${esc(v.label)}</button>`
      ).join("");
      return `<div style="margin-bottom:16px">
        <div class="detail-section-title" style="margin-bottom:8px">${esc(f.label)}</div>
        <div class="flex flex-wrap gap-2">${chips}</div></div>`;
    }).join('<hr class="divider" style="margin:14px 0">');

    document.getElementById("app").innerHTML = `
    <div class="container view-enter" style="padding:28px 20px 60px">
      <h1 style="font-size:28px;margin:0 0 4px">Standards & Regulations Library</h1>
      <p class="muted" style="margin:0 0 20px">Search and filter the full catalogue. Filters combine across groups; within a group, any match counts.</p>
      <div class="grid gap-6" style="grid-template-columns:280px 1fr;align-items:start">
        <aside class="card card-pad" style="position:sticky;top:80px">
          <div style="position:relative;margin-bottom:16px">
            <span style="position:absolute;left:14px;top:50%;transform:translateY(-50%);color:var(--c-faint)">${ICON.search}</span>
            <input id="searchBox" class="search-input" type="search" placeholder="Search instruments…" value="${esc(state.search)}"/>
          </div>
          <div class="flex items-center justify-between" style="margin-bottom:10px">
            <span class="detail-section-title" style="margin:0">Filters</span>
            <button id="clearBtn" class="tiny" style="background:none;border:0;color:var(--c-primary);font-weight:700;cursor:pointer">Clear all</button>
          </div>
          ${facetsHtml}
        </aside>
        <div>
          <div id="resultMeta" class="flex items-center justify-between flex-wrap gap-2" style="margin-bottom:14px"></div>
          <div id="resultGrid" class="grid gap-4" style="grid-template-columns:repeat(auto-fill,minmax(290px,1fr))"></div>
        </div>
      </div>
    </div>`;

    document.getElementById("searchBox").addEventListener("input", (ev) => {
      state.search = ev.target.value.trim();
      updateLibraryResults();
    });
    document.getElementById("clearBtn").addEventListener("click", () => { clearFilters(); renderLibrary(); });
    updateLibraryResults();
  }

  function updateLibraryResults() {
    const list = filteredEntries();
    const grid = document.getElementById("resultGrid");
    const meta = document.getElementById("resultMeta");
    if (!grid) return;
    grid.innerHTML = list.length
      ? list.map(entryCard).join("")
      : `<div class="card card-pad muted" style="grid-column:1/-1">No instruments match these filters. <a id="resetLink" style="cursor:pointer">Reset</a>.</div>`;

    // active filter pills
    const pills = [];
    if (state.search) pills.push(`<span class="chip">“${esc(state.search)}” <button data-clear-search style="border:0;background:none;cursor:pointer;color:inherit;font-weight:800">×</button></span>`);
    for (const f of FACETS) {
      for (const id of state.filters[f.key]) {
        pills.push(`<span class="chip">${esc(taxLabel(f.taxon, id))} <button data-clear-filter data-g="${f.key}" data-i="${esc(id)}" style="border:0;background:none;cursor:pointer;color:inherit;font-weight:800">×</button></span>`);
      }
    }
    meta.innerHTML = `<div class="text-sm"><strong>${list.length}</strong> of ${LIBRARY.length} instruments</div>
      <div class="flex flex-wrap gap-2 items-center">${pills.join("")}</div>`;

    // sync URL (shareable) without triggering a re-route
    syncLibraryUrl();

    // wire pill removers
    meta.querySelectorAll("[data-clear-filter]").forEach((b) =>
      b.addEventListener("click", () => { state.filters[b.dataset.g].delete(b.dataset.i); renderLibrary(); }));
    const cs = meta.querySelector("[data-clear-search]");
    if (cs) cs.addEventListener("click", () => { state.search = ""; renderLibrary(); });
    const rl = document.getElementById("resetLink");
    if (rl) rl.addEventListener("click", () => { clearFilters(); renderLibrary(); });
  }

  function syncLibraryUrl() {
    const parts = [];
    for (const f of FACETS) {
      if (state.filters[f.key].size) parts.push(`${REV_QUERY[f.key]}=${[...state.filters[f.key]].join(",")}`);
    }
    if (state.search) parts.push(`q=${encodeURIComponent(state.search)}`);
    const hash = "#/library" + (parts.length ? "?" + parts.join("&") : "");
    history.replaceState(null, "", hash);
  }

  function toggleFilter(group, id) {
    const set = state.filters[group];
    if (!set) return;
    set.has(id) ? set.delete(id) : set.add(id);
    // re-render sidebar chip state + results
    const btn = document.querySelector(`[data-filter-group="${group}"][data-filter-id="${id}"]`);
    if (btn) btn.classList.toggle("on", set.has(id));
    updateLibraryResults();
  }

  /* ---------- VIEW: Entry detail ---------- */
  function renderEntry(id) {
    const e = entryById.get(id);
    if (!e) return renderNotFound();
    const related = (e.related || []).map((rid) => entryById.get(rid)).filter(Boolean);
    const terms = (e.glossaryTerms || []).map((t) => termById.get(t)).filter(Boolean);

    document.getElementById("app").innerHTML = `
    <div class="container view-enter" style="padding:24px 20px 64px;max-width:980px">
      <a class="btn" data-link="#/library" style="margin-bottom:18px">${ICON.back} Back to library</a>
      <div class="flex items-center gap-2 flex-wrap" style="margin-bottom:10px">
        ${statusBadge(e)}${provisionalBadge(e)}
        <span class="badge badge-type">${esc(taxLabel("types", e.type))}</span>
        <span class="badge badge-body">${esc(taxLabel("bodies", e.body))}</span>
        <span class="badge badge-body">${esc(taxLabel("jurisdictions", e.jurisdiction))}</span>
      </div>
      <h1 style="font-size:30px;margin:0 0 4px;letter-spacing:-.02em">${esc(e.shortName)}</h1>
      <p style="font-size:16px;color:var(--c-body);margin:0 0 18px">${esc(e.fullTitle)}</p>

      ${e.isProvisional || (e.notes && /provisional|verify/i.test(e.notes)) ? `<div class="callout" style="margin-bottom:18px"><strong>Verify before relying on this.</strong> ${esc(e.notes || "This is a moving target; confirm the current status against the primary source.")}</div>` : ""}

      <div class="grid gap-6" style="grid-template-columns:1fr 300px;align-items:start">
        <div class="flex flex-col gap-6">
          <div class="card card-pad">
            <div class="detail-section-title">Focus</div>
            <p style="margin:0 0 16px;font-size:15px;color:var(--c-ink);font-weight:600">${esc(e.focus)}</p>
            <div class="detail-section-title">Why it matters for GenAI medical devices</div>
            <p style="margin:0;font-size:15px">${esc(e.whyGenAIMedical)}</p>
            ${e.notes && !(e.isProvisional) ? `<div class="callout info" style="margin-top:16px"><strong>Note.</strong> ${esc(e.notes)}</div>` : ""}
          </div>

          <div class="card card-pad">
            <div class="detail-section-title">Priority themes</div>
            <div class="flex flex-wrap gap-2" style="margin-bottom:16px">${themeChips(e.themes, true) || '<span class="muted tiny">—</span>'}</div>
            <div class="detail-section-title">Risk types addressed</div>
            <div class="flex flex-wrap gap-2" style="margin-bottom:16px">${riskChips(e.riskTypes, true) || '<span class="muted tiny">—</span>'}</div>
            <div class="detail-section-title">Lifecycle stages</div>
            <div class="flex flex-wrap gap-2" style="margin-bottom:16px">${(e.lifecycleStages || []).map((s) => `<a class="chip" data-link="#/lifecycle" title="${esc(taxDesc("lifecycleStages", s))}">${esc(taxLabel("lifecycleStages", s))}</a>`).join("") || '<span class="muted tiny">—</span>'}</div>
            <div class="detail-section-title">Applies to</div>
            <div class="flex flex-wrap gap-2">${(e.appliesTo || []).map((s) => `<span class="chip" title="${esc(taxDesc("appliesTo", s))}">${esc(taxLabel("appliesTo", s))}</span>`).join("") || '<span class="muted tiny">—</span>'}</div>
          </div>

          ${terms.length ? `<div class="card card-pad">
            <div class="detail-section-title">Related glossary terms</div>
            <div class="flex flex-col gap-2">${terms.map((t) => `<div><a class="font-bold" data-link="#/glossary#${esc(t.id)}">${esc(t.term)}</a> <span class="tiny muted">— ${esc(t.definition)}</span></div>`).join("")}</div>
          </div>` : ""}
        </div>

        <div class="flex flex-col gap-6">
          <div class="card card-pad">
            <div class="detail-section-title">Status</div>
            <p class="text-sm" style="margin:0 0 16px">${esc(e.statusDetail)}</p>
            <div class="detail-section-title">Timeline</div>
            <ul class="timeline">${(e.keyDates || []).map((k) => `<li><div class="font-bold tiny" style="color:var(--c-ink)">${esc(fmtDate(k.date))}</div><div class="tiny muted">${esc(k.label)}</div></li>`).join("")}</ul>
          </div>

          <div class="card card-pad">
            <div class="detail-section-title">Primary sources</div>
            <div class="flex flex-col gap-2">${(e.sources || []).map((s) => `<a class="source-link" href="${esc(s.url)}" target="_blank" rel="noopener">${ICON.ext}<span>${esc(s.label)}${s.primary ? "" : " (secondary)"}</span></a>`).join("")}</div>
            <div class="tiny muted" style="margin-top:14px;border-top:1px solid var(--c-border);padding-top:10px">Last verified <strong>${esc(fmtDate(e.lastVerified))}</strong></div>
          </div>

          ${related.length ? `<div class="card card-pad">
            <div class="detail-section-title">Related instruments</div>
            <div class="flex flex-col gap-2">${related.map((r) => `<a data-link="#/entry/${esc(r.id)}" class="text-sm font-bold">${esc(r.shortName)}</a>`).join("")}</div>
          </div>` : ""}
        </div>
      </div>
    </div>`;
    window.scrollTo(0, 0);
  }

  /* ---------- VIEW: Topics index ---------- */
  function renderTopics() {
    document.getElementById("app").innerHTML = `
    <div class="container view-enter" style="padding:28px 20px 60px">
      <h1 style="font-size:28px;margin:0 0 4px">Topics</h1>
      <p class="muted" style="margin:0 0 24px">Five priority areas for GenAI-enabled medical devices. Start here to understand a concept, then follow the links into the instruments that govern it.</p>
      <div class="grid gap-5" style="grid-template-columns:repeat(auto-fit,minmax(300px,1fr))">
        ${TOPICS.map((t) => {
          const insts = LIBRARY.filter((e) => e.themes.includes(t.id));
          return `<a class="topic-card theme-${esc(t.id)}" data-link="#/topic/${esc(t.id)}" style="--accent:var(--th-${esc(t.id)});text-decoration:none">
            <h3 style="font-size:19px;margin:0 0 6px;display:flex;align-items:center;gap:8px">
              <span style="width:11px;height:11px;border-radius:50%;background:var(--th-${esc(t.id)})"></span>${esc(t.title)}</h3>
            <p class="text-sm muted" style="margin:0 0 14px">${esc(t.tagline)}</p>
            <div class="flex flex-wrap gap-1" style="margin-bottom:12px">${insts.slice(0, 4).map((e) => `<span class="badge badge-body">${esc(e.shortName)}</span>`).join("")}${insts.length > 4 ? `<span class="badge badge-body">+${insts.length - 4}</span>` : ""}</div>
            <div class="tiny" style="color:var(--c-primary-dark);font-weight:700">Open topic ${ICON.arrow}</div>
          </a>`;
        }).join("")}
      </div>
    </div>`;
  }

  /* ---------- VIEW: Single topic ---------- */
  function renderTopic(id) {
    const t = topicById.get(id);
    if (!t) return renderNotFound();
    const insts = LIBRARY.filter((e) => e.themes.includes(t.id));
    const featured = (t.featuredIds || []).map((i) => entryById.get(i)).filter(Boolean);
    const rest = insts.filter((e) => !(t.featuredIds || []).includes(e.id));
    const ordered = [...featured, ...rest];
    const terms = (t.relatedGlossary || []).map((g) => termById.get(g)).filter(Boolean);

    document.getElementById("app").innerHTML = `
    <div class="hero" style="background:linear-gradient(180deg,#0b1e45,#16357a)">
      <div class="container" style="padding:34px 20px 38px">
        <a class="btn btn-ghost-light" data-link="#/topics" style="margin-bottom:16px">${ICON.back} All topics</a>
        <div class="flex items-center gap-3" style="margin-bottom:8px">
          <span style="width:16px;height:16px;border-radius:50%;background:var(--th-${esc(t.id)});box-shadow:0 0 0 4px rgba(255,255,255,.15)"></span>
          <h1 style="font-size:32px;margin:0">${esc(t.title)}</h1>
        </div>
        <p class="lede" style="font-size:17px;margin:0;max-width:780px">${esc(t.tagline)}</p>
      </div>
    </div>
    <div class="container view-enter" style="padding:34px 20px 60px;max-width:1080px">
      <div class="grid gap-8" style="grid-template-columns:1fr 300px;align-items:start">
        <div>
          <div class="card card-pad" style="margin-bottom:24px">
            ${t.intro.map((p) => `<p style="margin:0 0 12px;font-size:15.5px">${p}</p>`).join("")}
            <div class="callout info" style="margin-top:8px"><strong>How these fit together.</strong> ${t.narrative}</div>
          </div>

          <h2 style="font-size:22px;margin:0 0 4px">Instruments for this theme</h2>
          <p class="muted tiny" style="margin:0 0 16px">${ordered.length} instrument(s), most relevant first.</p>
          <div class="grid gap-4" style="grid-template-columns:repeat(auto-fill,minmax(260px,1fr))">
            ${ordered.map(entryCard).join("")}
          </div>
        </div>
        <aside class="flex flex-col gap-5" style="position:sticky;top:80px">
          <div class="card card-pad">
            <div class="detail-section-title">Key takeaways</div>
            <ul style="margin:0;padding-left:18px;font-size:14px;display:flex;flex-direction:column;gap:8px">
              ${t.keyPoints.map((k) => `<li>${esc(k)}</li>`).join("")}
            </ul>
          </div>
          ${terms.length ? `<div class="card card-pad">
            <div class="detail-section-title">Glossary</div>
            <div class="flex flex-col gap-2">${terms.map((g) => `<a class="text-sm font-bold" data-link="#/glossary#${esc(g.id)}">${esc(g.term)}</a>`).join("")}</div>
          </div>` : ""}
          <a class="btn" data-link="#/matrix">View in the matrix ${ICON.arrow}</a>
        </aside>
      </div>
    </div>`;
    window.scrollTo(0, 0);
  }

  /* ---------- VIEW: Matrix ---------- */
  const MATRIX_AXES = [
    { id: "themes", label: "Priority themes" },
    { id: "riskTypes", label: "Risk types" },
    { id: "lifecycleStages", label: "Lifecycle stages" },
  ];
  function renderMatrix() {
    const axis = state.matrixAxis;
    const cols = taxList(axis);
    const colLink = (c) => (axis === "themes" ? `#/topic/${c.id}` : `#/library?${REV_QUERY[axis]}=${c.id}`);

    const rows = LIBRARY.map((e) => {
      const cells = cols.map((c) => {
        const on = (e[FACETS.find((f) => f.key === axis).field] || []).includes(c.id);
        return `<td><a class="cell ${on ? "on" : "off"}" data-link="#/entry/${esc(e.id)}" title="${esc(e.shortName)} ${on ? "addresses" : "does not directly address"} ${esc(c.label)}"><span class="mark"></span></a></td>`;
      }).join("");
      return `<tr><th><a data-link="#/entry/${esc(e.id)}" style="color:var(--c-ink)">${esc(e.shortName)}</a><small>${esc(taxLabel("bodies", e.body))}</small></th>${cells}</tr>`;
    }).join("");

    document.getElementById("app").innerHTML = `
    <div class="container view-enter" style="padding:28px 20px 60px">
      <h1 style="font-size:28px;margin:0 0 4px">Coverage Matrix</h1>
      <p class="muted" style="margin:0 0 18px">Which instrument addresses which concern. ● = directly addressed. Click a row to open the instrument; click a column header to explore it.</p>
      <div class="flex items-center gap-3 flex-wrap" style="margin-bottom:18px">
        <span class="detail-section-title" style="margin:0">Columns:</span>
        <div class="seg">${MATRIX_AXES.map((a) => `<button data-axis="${a.id}" class="${axis === a.id ? "on" : ""}">${a.label}</button>`).join("")}</div>
      </div>
      <div class="matrix-wrap">
        <table class="matrix">
          <thead><tr><th style="text-align:left">Instrument</th>${cols.map((c) => `<th><a data-link="${colLink(c)}" title="${esc(c.description)}" style="color:var(--c-body)">${esc(c.label)}</a></th>`).join("")}</tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    </div>`;
  }

  /* ---------- VIEW: Lifecycle ---------- */
  function renderLifecycle() {
    const stages = taxList("lifecycleStages");
    document.getElementById("app").innerHTML = `
    <div class="container view-enter" style="padding:28px 20px 60px">
      <h1 style="font-size:28px;margin:0 0 4px">Lifecycle View</h1>
      <p class="muted" style="margin:0 0 24px">What governs a GenAI medical device at each stage, from design through to managing model changes. Click any instrument to open it.</p>
      <div class="grid gap-4" style="grid-template-columns:repeat(auto-fit,minmax(260px,1fr))">
        ${stages.map((s, i) => {
          const insts = LIBRARY.filter((e) => (e.lifecycleStages || []).includes(s.id));
          return `<div class="lc-stage">
            <h4><span class="lc-num">${i + 1}</span>${esc(s.label)}</h4>
            <p class="tiny muted" style="margin:0 0 12px">${esc(s.description)}</p>
            <div class="flex flex-col gap-2">${insts.map((e) => `<a class="text-sm" data-link="#/entry/${esc(e.id)}" style="font-weight:600">${esc(e.shortName)}</a>`).join("") || '<span class="tiny muted">—</span>'}</div>
          </div>`;
        }).join("")}
      </div>
    </div>`;
  }

  /* ---------- VIEW: Glossary ---------- */
  function renderGlossary(anchor) {
    const sorted = [...GLOSSARY].sort((a, b) => a.term.localeCompare(b.term));
    const letters = [...new Set(sorted.map((g) => g.term[0].toUpperCase()))];
    document.getElementById("app").innerHTML = `
    <div class="container view-enter" style="padding:28px 20px 60px;max-width:900px">
      <h1 style="font-size:28px;margin:0 0 4px">Glossary</h1>
      <p class="muted" style="margin:0 0 16px">Plain-language definitions of the key terms, cross-linked to the instruments that define and use them.</p>
      <div class="alpha-nav flex flex-wrap gap-1" style="margin-bottom:20px">${letters.map((l) => `<a href="#/glossary#letter-${l}">${l}</a>`).join("")}</div>
      <div class="flex flex-col gap-3">
        ${sorted.map((g) => {
          const insts = (g.relatedInstruments || []).map((i) => entryById.get(i)).filter(Boolean);
          const see = (g.seeAlso || []).map((s) => termById.get(s)).filter(Boolean);
          return `<div id="${esc(g.id)}" class="card card-pad glossary-term" data-letter="${g.term[0].toUpperCase()}">
            <h3 style="font-size:17px;margin:0 0 6px">${esc(g.term)}</h3>
            <p class="text-sm" style="margin:0 0 10px">${esc(g.definition)}</p>
            <div class="flex flex-wrap gap-2 items-center">
              ${insts.map((e) => `<a class="badge badge-type" data-link="#/entry/${esc(e.id)}">${esc(e.shortName)}</a>`).join("")}
              ${see.length ? `<span class="tiny muted">See also: ${see.map((s) => `<a data-link="#/glossary#${esc(s.id)}">${esc(s.term)}</a>`).join(", ")}</span>` : ""}
              ${g.source ? `<a class="tiny" href="${esc(g.source.url)}" target="_blank" rel="noopener">${esc(g.source.label)} ↗</a>` : ""}
            </div>
          </div>`;
        }).join("")}
      </div>
    </div>`;
    // add letter anchors
    letters.forEach((l) => {
      const first = document.querySelector(`.glossary-term[data-letter="${l}"]`);
      if (first) { const a = document.createElement("span"); a.id = `letter-${l}`; a.style.cssText = "position:absolute;margin-top:-90px"; first.prepend(a); }
    });
    if (anchor) { const el = document.getElementById(anchor); if (el) el.scrollIntoView({ behavior: "smooth", block: "start" }); }
  }

  /* ---------- VIEW: Resources ---------- */
  function renderResources() {
    const byBody = {};
    LIBRARY.forEach((e) => {
      (e.sources || []).filter((s) => s.primary).forEach((s) => {
        (byBody[e.body] = byBody[e.body] || []).push({ label: s.label, url: s.url, inst: e.shortName, id: e.id });
      });
    });
    document.getElementById("app").innerHTML = `
    <div class="container view-enter" style="padding:28px 20px 60px;max-width:980px">
      <h1 style="font-size:28px;margin:0 0 4px">Resources & Methodology</h1>
      <p class="muted" style="margin:0 0 22px">Primary sources for every instrument, grouped by issuing body, plus how this reference is maintained.</p>

      <div class="card card-pad" style="margin-bottom:24px">
        <div class="detail-section-title">Methodology & maintenance</div>
        <ul style="margin:0;padding-left:18px;font-size:14px;display:flex;flex-direction:column;gap:8px">
          <li>Each entry was checked against primary sources (ISO, FDA / Federal Register, EUR-Lex, WHO, IMDRF, NIST) and carries a <strong>Last verified</strong> date.</li>
          <li>Regulatory status changes — items marked <span class="badge status-provisional">⚠ Verify</span> or <span class="badge status-draft"><span class="badge-dot"></span>Draft</span> are moving targets. Always confirm against the source before relying on them.</li>
          <li>This is an <strong>educational reference, not legal or regulatory advice</strong>. Consult the primary texts and qualified advisors for compliance decisions.</li>
          <li>Content lives in editable data files (<code>data/*.js</code>); a subject-matter expert can update a fact in one place. A quarterly review cadence is recommended.</li>
        </ul>
      </div>

      ${Object.keys(byBody).sort((a, b) => taxLabel("bodies", a).localeCompare(taxLabel("bodies", b))).map((body) => `
        <div style="margin-bottom:22px">
          <h3 style="font-size:17px;margin:0 0 10px">${esc(taxLabel("bodies", body))}</h3>
          <div class="grid gap-2" style="grid-template-columns:repeat(auto-fill,minmax(320px,1fr))">
            ${byBody[body].map((s) => `<a class="source-link" href="${esc(s.url)}" target="_blank" rel="noopener">${ICON.ext}<span><strong>${esc(s.inst)}</strong><br><span class="tiny muted">${esc(s.label)}</span></span></a>`).join("")}
          </div>
        </div>`).join("")}
    </div>`;
  }

  function renderNotFound() {
    document.getElementById("app").innerHTML = `<div class="container" style="padding:80px 20px;text-align:center">
      <h1 style="font-size:26px">Not found</h1><p class="muted">That page doesn't exist.</p>
      <a class="btn btn-primary" data-link="#/">Go home</a></div>`;
  }

  /* ---------- routing ---------- */
  function parseHash() {
    let h = location.hash.replace(/^#/, "");
    if (!h || h === "/") return { path: [""], query: {}, anchor: "" };
    let anchor = "";
    // allow a secondary #anchor (e.g. #/glossary#term)
    const hashIdx = h.indexOf("#", 1);
    if (hashIdx >= 0) { anchor = h.slice(hashIdx + 1); h = h.slice(0, hashIdx); }
    const [pathStr, queryStr] = h.split("?");
    const path = pathStr.split("/").filter(Boolean);
    const query = {};
    if (queryStr) queryStr.split("&").forEach((kv) => { const [k, v] = kv.split("="); query[k] = decodeURIComponent(v || ""); });
    return { path, query, anchor };
  }

  function applyLibraryQuery(query) {
    clearFilters();
    if (query.q) state.search = query.q;
    for (const [qk, group] of Object.entries(QUERY_MAP)) {
      if (query[qk]) query[qk].split(",").filter(Boolean).forEach((id) => state.filters[group].add(id));
    }
  }

  function setActiveNav(route) {
    document.querySelectorAll("[data-nav]").forEach((a) => {
      a.classList.toggle("active", a.getAttribute("data-nav") === route);
    });
  }

  function router() {
    const { path, query, anchor } = parseHash();
    const route = path[0] || "";
    switch (route) {
      case "": renderHome(); setActiveNav("home"); break;
      case "library": applyLibraryQuery(query); renderLibrary(); setActiveNav("library"); break;
      case "entry": renderEntry(path[1]); setActiveNav("library"); break;
      case "topics": renderTopics(); setActiveNav("topics"); break;
      case "topic": renderTopic(path[1]); setActiveNav("topics"); break;
      case "matrix": renderMatrix(); setActiveNav("matrix"); break;
      case "lifecycle": renderLifecycle(); setActiveNav("lifecycle"); break;
      case "glossary": renderGlossary(anchor); setActiveNav("glossary"); break;
      case "resources": renderResources(); setActiveNav("resources"); break;
      default: renderNotFound(); setActiveNav("");
    }
  }

  /* ---------- global delegated clicks ---------- */
  document.addEventListener("click", (e) => {
    const link = e.target.closest("[data-link]");
    if (link) { e.preventDefault(); const h = link.getAttribute("data-link"); if (location.hash === h) router(); else location.hash = h; return; }
    const fc = e.target.closest("[data-filter-group]");
    if (fc) { toggleFilter(fc.dataset.filterGroup, fc.dataset.filterId); return; }
    const axisBtn = e.target.closest("[data-axis]");
    if (axisBtn) { state.matrixAxis = axisBtn.dataset.axis; renderMatrix(); return; }
  });

  window.addEventListener("hashchange", router);
  document.addEventListener("DOMContentLoaded", router);
  if (document.readyState !== "loading") router();
})();
