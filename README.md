# Responsible AI-enabled MD Hub

A guided, **static** reference website for the regulations, guidelines and ISO/IEC standards relevant to **GenAI‑enabled medical devices** — organised around the five priorities your team cares about:

1. **Risk management**
2. **Safety assessment**
3. **Guardrails** (jailbreak / prompt injection, toxic content, bias, confabulation)
4. **Monitoring & post‑market**
5. **Best practices**

It is intentionally **data‑driven and build‑free**: there is no Node.js, no bundler, and no server requirement. All content lives in plain JavaScript data files that anyone can edit.

---

## Run it locally

It's a static site, so any of these work:

- **Double‑click** `index.html` to open it in your browser (works over `file://`).
- Or serve it (nicer URLs, recommended):

  ```bash
  cd medai-compass
  python3 -m http.server 8000
  # then open http://localhost:8000
  ```

No installation or dependencies are required.

---

## What's inside

```
medai-compass/
├── index.html          # shell: nav + script loading
├── css/styles.css      # design system (brand palette, badges, matrix, cards)
├── js/app.js           # hash router + all views, faceted search/filter
├── data/
│   ├── taxonomy.js     # controlled vocabularies (filter facets) — TAXONOMY
│   ├── library.js      # the instrument catalogue — LIBRARY
│   ├── topics.js       # the 5 theme explainer pages — TOPICS
│   └── glossary.js     # key terms — GLOSSARY
└── README.md
```

### Pages
- **Overview** — the landscape, role‑based "start here" paths, and a *What's changed recently* feed (2024–2026).
- **Library** — searchable + filterable catalogue (theme, risk type, jurisdiction, type, status, applicability, lifecycle stage). Filters are shareable via the URL, e.g. `#/library?theme=guardrails&jurisdiction=eu`.
- **Topics** — a plain‑language explainer per priority theme that links to the relevant instruments.
- **Compare** — a coverage matrix (instruments × themes / risk types / lifecycle stages). Derived from the data, so it can never drift.
- **Lifecycle** — what governs the device at each stage, design → change management.
- **Glossary** — cross‑linked definitions.
- **Resources** — primary sources by issuing body + the maintenance methodology.

---

## Maintaining the content (no coding needed)

The content is **separate from the code**. To update it:

- **Add an instrument** → append one object to `LIBRARY` in `data/library.js` (copy an existing entry as a template). Set its `themes`, `riskTypes`, `lifecycleStages`, `appliesTo` using ids from `data/taxonomy.js`, add at least one **primary `source`**, and set an honest `lastVerified` date. It automatically appears in the Library, Matrix, Lifecycle and relevant Topic pages.
- **Add a glossary term** → append to `GLOSSARY` in `data/glossary.js`.
- **Edit a topic explainer** → edit `TOPICS` in `data/topics.js` (the `intro` strings allow simple HTML like `<strong>`).
- **Add a filter value** → append to the relevant array in `TAXONOMY`; the filter UI updates itself.

### Trust & accuracy
- Every entry shows a **Last verified** date and links to its primary source.
- Items with `status: "draft"` / `"provisional"` or `isProvisional: true` render a **⚠ Verify** badge — these are moving targets (e.g. the EU "Digital Omnibus" delay, the FDA draft lifecycle guidance).
- This site is an **educational reference, not legal or regulatory advice.**
- **Recommended:** review the catalogue **quarterly** — the *What's changed recently* panel doubles as a maintenance checklist.

---

## Deploy (public)

The site is plain static files, so it deploys anywhere. Two easy options:

### Option A — GitHub Pages
1. Create a repo and push this folder's contents to it.
2. In the repo: **Settings → Pages → Build and deployment → Source: Deploy from a branch**, branch `main`, folder `/ (root)`.
3. Your site is published at `https://<user>.github.io/<repo>/`.

> The included empty `.nojekyll` file tells GitHub Pages to serve the files as‑is.
> **Note:** GitHub Pages on a *private* repo requires a paid plan. Since all content here is public regulatory information, a **public** repo is the simplest path.

### Option B — Netlify (drag‑and‑drop)
Go to Netlify → **Add new site → Deploy manually**, and drag the `medai-compass` folder onto the page. Done — no build settings needed.

---

## Notes on the tech choices
- **No build step** is a deliberate trust/maintenance decision: a subject‑matter expert can change a regulatory fact in one data file and see it live, with no toolchain.
- Tailwind is loaded via CDN for layout utilities; the brand/design system is in `css/styles.css`. If you ever want to drop the CDN for a fully self‑contained build, the markup degrades gracefully to the custom stylesheet.
- Data files are loaded as classic scripts (globals), which is what lets the site run by simply opening `index.html` without a server.
