/* Genesys Field Cards v2 — app logic
   Hash routing, card rendering, glossary tooltips + drawer, cross-links. */

(function () {
  "use strict";

  const app = document.getElementById("app");
  const lensConceptBtn = document.getElementById("lens-concept");
  const lensTensionBtn = document.getElementById("lens-tension");
  const wordmark = document.getElementById("wordmark");

  /* ---------------- glossary auto-linking ---------------- */
  // Build a list of {regex, idx} sorted by match length desc so longer terms win.
  const matchers = [];
  GLOSSARY.forEach((g, idx) => {
    g.match.forEach((m) => matchers.push({ text: m, idx }));
  });
  matchers.sort((a, b) => b.text.length - a.text.length);

  function escapeReg(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }

  // Apply glossary spans to a fragment of (already trusted) HTML text.
  // We only wrap the FIRST occurrence of each glossary index within the field,
  // and avoid matching inside existing tags.
  function glossify(html, usedSet) {
    // Split on existing tags so we never inject inside <strong>, <em>, links, etc.
    const parts = html.split(/(<[^>]+>)/g);
    for (let p = 0; p < parts.length; p++) {
      if (parts[p].startsWith("<")) continue; // skip tags
      let segment = parts[p];
      for (const mt of matchers) {
        if (usedSet.has(mt.idx)) continue;
        // word-ish boundary: term may be acronym or phrase
        const re = new RegExp("(^|[^A-Za-z0-9_-])(" + escapeReg(mt.text) + ")(?![A-Za-z0-9_-])");
        const m = segment.match(re);
        if (m) {
          const g = GLOSSARY[mt.idx];
          const before = segment.slice(0, m.index);
          const lead = m[1];
          const hit = m[2];
          const after = segment.slice(m.index + m[0].length);
          const span = `${lead}<span class="gterm" data-g="${mt.idx}">${hit}</span>`;
          segment = before + span + after;
          usedSet.add(mt.idx);
        }
      }
      parts[p] = segment;
    }
    return parts.join("");
  }

  function fieldHTML(html) {
    const used = new Set();
    return glossify(html, used);
  }

  /* ---------------- cross-link parsing for tension "play" field ---------------- */
  // [[slug|visible]] -> clickable concept link
  function parsePlay(text) {
    const html = text.replace(/\[\[([^|\]]+)\|([^\]]+)\]\]/g, function (_, slug, label) {
      return `<a class="clink" href="#/concept/${slug}">${label}</a>`;
    });
    // split into sentences-as-lines for readability: keep as one paragraph but glossify
    return fieldHTML(html);
  }

  /* ---------------- card field renderers ---------------- */
  function conceptFields(c) {
    return `
      <div class="card-body two-col">
        <div class="field">
          <div class="field-label">The concept</div>
          <p>${fieldHTML(c.concept)}</p>
        </div>
        <div class="field">
          <div class="field-label">Why it matters in EMEA</div>
          <p>${fieldHTML(c.emea)}</p>
        </div>
        <div class="field">
          <div class="field-label genesys"><span class="fdot patina"></span> The Genesys angle</div>
          <p>${fieldHTML(c.genesys)}</p>
        </div>
        <div class="field">
          <div class="field-label pureplay"><span class="fdot amber"></span> The pureplay angle</div>
          <p>${fieldHTML(c.pureplay)}</p>
        </div>
      </div>`;
  }

  function tensionFields(t) {
    return `
      <div class="card-body two-col">
        <div class="field">
          <div class="field-label">The tension</div>
          <p>${fieldHTML(t.tension)}</p>
        </div>
        <div class="field">
          <div class="field-label">Why it persists</div>
          <p>${fieldHTML(t.persists)}</p>
        </div>
        <div class="field">
          <div class="field-label">Which concepts come into play</div>
          <p>${parsePlay(t.play)}</p>
        </div>
        <div class="field">
          <div class="field-label">How EMEA buyers reconcile it</div>
          <p>${fieldHTML(t.reconcile)}</p>
        </div>
      </div>`;
  }

  const dotKey = `
    <span class="dot-key">
      <span class="k"><span class="d patina"></span> Genesys</span>
      <span class="k"><span class="d amber"></span> Pureplay</span>
    </span>`;

  /* ---------------- collapsed card ---------------- */
  function collapsedCard(item, kind) {
    const thesis = item.thesis ? `<span class="thesis-flag">Thesis card</span>` : "";
    const label = kind === "concept" ? "Concept" : "Tension";
    return `
      <article class="card collapsed${item.thesis ? " thesis-card" : ""}" data-kind="${kind}" data-slug="${item.slug}" role="button" tabindex="0" aria-expanded="false">
        <div class="card-head">
          <span class="num">${label} ${String(item.n).padStart(2, "0")}</span>${thesis}
          <h3>${item.title}</h3>
          <p class="teaser">${item.teaser}</p>
        </div>
        <div class="card-foot">
          ${dotKey}
          <span class="read-cue">Read card <span class="chev">\u2193</span></span>
        </div>
      </article>`;
  }

  /* ---------------- expanded card ---------------- */
  function expandedCard(item, kind) {
    const thesis = item.thesis ? `<span class="thesis-flag">Thesis card</span>` : "";
    const label = kind === "concept" ? "Concept" : "Tension";
    const body = kind === "concept" ? conceptFields(item) : tensionFields(item);
    return `
      <article class="card expanded${item.thesis ? " thesis-card" : ""}" data-kind="${kind}" data-slug="${item.slug}" aria-expanded="true">
        <div class="card-head">
          <span class="num">${label} ${String(item.n).padStart(2, "0")}</span>${thesis}
          <h3>${item.title}</h3>
        </div>
        ${body}
        <div class="card-close">
          ${dotKey}
          <button class="collapse-btn" data-collapse="1">Close \u2191</button>
        </div>
      </article>`;
  }

  /* ---------------- views ---------------- */
  function masthead() {
    return `
      <section class="masthead">
        <div class="wrap">
          <div class="mast-grid">
            <div class="mast-card">
              <p class="eyebrow">A field study in Conversational CX</p>
              <h1>The end of the CX trade-off</h1>
              <p class="mast-sub">A field study in Conversational CX, built for an EMEA Specialist AI Sales Director.</p>
              <div class="mast-body">
                <p>For years, CX leaders worked inside a paradox: brands wanted customer loyalty <em>and</em> the operational efficiency to fund the work that creates it &mdash; yet every gain on one side seemed to cost the other. The service economy made that compromise feel inevitable. The experience economy has made it untenable. Genesys believes AI-powered experience orchestration now ends the paradox: coordinating people, data, systems and AI in real time so customer-facing and back-office teams work as one &mdash; delivering loyalty at scale, with the efficiency to keep building it.</p>
                <hr class="thesis-rule" />
                <p>A working tool built by Alex Abbott to learn Conversational CX, two perspectives at a time &mdash; how Genesys frames each concept, and how a pureplay AI vendor would frame the same thing differently.</p>
              </div>
            </div>
            <div class="mast-aside">
              <p class="eyebrow">The spine</p>
              <h2>One thesis runs through every card.</h2>
              <p>The loyalty&ndash;efficiency paradox is over, and AI-powered experience orchestration is what ends it.</p>
              <p>Each concept card carries two markers, visible at a glance: how Genesys frames it, and how a pureplay AI vendor frames the same thing differently.</p>
              <div class="pull">
                <span class="dot-key" style="gap:16px">
                  <span class="k"><span class="d patina" style="background:#18CAA8"></span> <strong>The Genesys angle</strong></span>
                </span>
                <br/>
                <span class="dot-key" style="gap:16px;margin-top:6px;display:inline-flex">
                  <span class="k"><span class="d amber" style="background:#F7AD00"></span> The pureplay angle</span>
                </span>
              </div>
            </div>
          </div>

          <div class="lens-tiles">
            <button class="lens-tile" data-go="concept">
              <div class="tile-k">Lens 1</div>
              <h3>By Concept</h3>
              <p>Ten tight cards on the building blocks of Conversational CX &mdash; from intent recognition to orchestration &mdash; each read two ways at once.</p>
              <div class="arrow">Open the concept library <span>&rarr;</span></div>
            </button>
            <button class="lens-tile" data-go="tension">
              <div class="tile-k">Lens 2</div>
              <h3>By Tension</h3>
              <p>Five cards on the trade-offs EMEA buyers actually wrestle with &mdash; and the concepts that come into play to reconcile each one.</p>
              <div class="arrow">Open the tension library <span>&rarr;</span></div>
            </button>
          </div>
        </div>
      </section>`;
  }

  function conceptView(openSlug) {
    const cards = CONCEPTS.map((c) =>
      c.slug === openSlug ? expandedCard(c, "concept") : collapsedCard(c, "concept")
    ).join("");
    return `
      <div class="wrap">
        <section class="lens-head">
          <button class="back-link" data-home="1">\u2190 Masthead</button>
          <p class="eyebrow">Lens 1 &mdash; By Concept</p>
          <h2>The building blocks of Conversational CX</h2>
          <p>Ten concepts, each read four ways: a plain-English definition, why it lands differently in EMEA, the Genesys angle <span style="color:#0E8E76;font-weight:700">&bull;</span>, and the pureplay angle <span style="color:#A07200;font-weight:700">&bull;</span>. Click any card to read it in full.</p>
        </section>
        <div class="grid concepts">${cards}</div>
      </div>`;
  }

  function tensionView(openSlug) {
    const cards = TENSIONS.map((t) =>
      t.slug === openSlug ? expandedCard(t, "tension") : collapsedCard(t, "tension")
    ).join("");
    return `
      <div class="wrap">
        <section class="lens-head">
          <button class="back-link" data-home="1">\u2190 Masthead</button>
          <p class="eyebrow">Lens 2 &mdash; By Tension</p>
          <h2>The trade-offs EMEA buyers wrestle with</h2>
          <p>Five tensions, each read four ways: what the two sides are, why it persists, which concepts come into play (click to jump), and how EMEA buyers reconcile it.</p>
        </section>
        <div class="grid tensions">${cards}</div>
      </div>`;
  }

  /* ---------------- router ---------------- */
  function parseHash() {
    const h = location.hash.replace(/^#\/?/, "");
    const seg = h.split("/").filter(Boolean);
    return { lens: seg[0] || "", slug: seg[1] || "" };
  }

  function setLensTabs(active) {
    lensConceptBtn.setAttribute("aria-selected", active === "concept" ? "true" : "false");
    lensTensionBtn.setAttribute("aria-selected", active === "tension" ? "true" : "false");
  }

  function render() {
    const { lens, slug } = parseHash();

    if (lens === "concept") {
      setLensTabs("concept");
      app.innerHTML = conceptView(slug);
    } else if (lens === "tension") {
      setLensTabs("tension");
      app.innerHTML = tensionView(slug);
    } else {
      setLensTabs("");
      app.innerHTML = masthead();
    }

    bindViewEvents();

    // Scroll behaviour: if a card is opened, bring it into view; else top.
    if (slug) {
      const openCard = app.querySelector(".card.expanded");
      if (openCard) {
        const y = openCard.getBoundingClientRect().top + window.scrollY - 90;
        window.scrollTo({ top: y < 0 ? 0 : y, behavior: "smooth" });
      }
    } else {
      window.scrollTo({ top: 0, behavior: "auto" });
    }
  }

  /* ---------------- event binding ---------------- */
  function bindViewEvents() {
    // lens tiles on masthead
    app.querySelectorAll("[data-go]").forEach((el) => {
      el.addEventListener("click", () => { location.hash = "#/" + el.dataset.go; });
    });
    // back to masthead
    app.querySelectorAll("[data-home]").forEach((el) => {
      el.addEventListener("click", () => { location.hash = ""; });
    });
    // collapsed card -> open
    app.querySelectorAll(".card.collapsed").forEach((card) => {
      const open = () => {
        const kind = card.dataset.kind;
        location.hash = "#/" + kind + "/" + card.dataset.slug;
      };
      card.addEventListener("click", open);
      card.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(); }
      });
    });
    // collapse button
    app.querySelectorAll("[data-collapse]").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const card = btn.closest(".card");
        location.hash = "#/" + card.dataset.kind;
      });
    });
    // cross-links (clink) - let hashchange handle; but ensure cross-lens switch works
    // they are anchors with #/concept/slug so router handles them automatically.

    // glossary terms
    app.querySelectorAll(".gterm").forEach(bindTooltip);
  }

  /* ---------------- tooltip ---------------- */
  const tooltip = document.getElementById("tooltip");
  let ttHideTimer = null;

  function showTooltip(target) {
    const idx = +target.dataset.g;
    const g = GLOSSARY[idx];
    if (!g) return;
    clearTimeout(ttHideTimer);
    tooltip.innerHTML =
      `<span class="tt-term">${g.term}</span>${g.def}<span class="tt-eq">${g.eq}</span>`;
    tooltip.classList.add("show");
    positionTooltip(target);
  }
  function positionTooltip(target) {
    const r = target.getBoundingClientRect();
    const tw = tooltip.offsetWidth;
    const th = tooltip.offsetHeight;
    let left = r.left + r.width / 2 - tw / 2;
    left = Math.max(12, Math.min(left, window.innerWidth - tw - 12));
    let top = r.top - th - 10;
    if (top < 12) top = r.bottom + 10; // flip below if no room above
    tooltip.style.left = left + "px";
    tooltip.style.top = top + "px";
  }
  function hideTooltip() {
    ttHideTimer = setTimeout(() => tooltip.classList.remove("show"), 80);
  }
  function bindTooltip(el) {
    el.addEventListener("mouseenter", () => showTooltip(el));
    el.addEventListener("mouseleave", hideTooltip);
    el.addEventListener("focus", () => showTooltip(el));
    el.addEventListener("blur", hideTooltip);
    el.setAttribute("tabindex", "0");
    // tap on mobile
    el.addEventListener("click", (e) => {
      e.stopPropagation();
      if (tooltip.classList.contains("show")) { hideTooltip(); }
      else { showTooltip(el); }
    });
  }
  tooltip.addEventListener("mouseenter", () => clearTimeout(ttHideTimer));
  tooltip.addEventListener("mouseleave", hideTooltip);
  document.addEventListener("scroll", () => tooltip.classList.remove("show"), true);

  /* ---------------- glossary drawer ---------------- */
  const drawer = document.getElementById("drawer");
  const overlay = document.getElementById("drawer-overlay");
  const glossList = document.getElementById("glossary-list");
  const glossSearch = document.getElementById("glossary-search");

  function tagFor(type) {
    if (type === "gx") return `<span class="tag gx">Genesys</span>`;
    if (type === "metric") return `<span class="tag metric">Metric</span>`;
    return `<span class="tag generic">CX term</span>`;
  }
  function renderGlossary(filter) {
    const f = (filter || "").trim().toLowerCase();
    glossList.innerHTML = GLOSSARY
      .filter((g) =>
        !f ||
        g.term.toLowerCase().includes(f) ||
        g.def.toLowerCase().includes(f)
      )
      .map(
        (g) => `
        <div class="gentry">
          <h4>${g.term}${tagFor(g.type)}</h4>
          <p>${g.def}</p>
          <p class="eq">${g.eq}</p>
        </div>`
      )
      .join("") || `<div class="gentry"><p>No terms match \u201C${filter}\u201D.</p></div>`;
  }
  function openDrawer() {
    renderGlossary("");
    glossSearch.value = "";
    drawer.classList.add("open");
    overlay.classList.add("open");
    drawer.setAttribute("aria-hidden", "false");
  }
  function closeDrawer() {
    drawer.classList.remove("open");
    overlay.classList.remove("open");
    drawer.setAttribute("aria-hidden", "true");
  }
  document.getElementById("glossary-open").addEventListener("click", openDrawer);
  document.getElementById("drawer-close").addEventListener("click", closeDrawer);
  overlay.addEventListener("click", closeDrawer);
  glossSearch.addEventListener("input", (e) => renderGlossary(e.target.value));
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") { closeDrawer(); tooltip.classList.remove("show"); }
  });

  /* ---------------- nav ---------------- */
  lensConceptBtn.addEventListener("click", () => { location.hash = "#/concept"; });
  lensTensionBtn.addEventListener("click", () => { location.hash = "#/tension"; });
  wordmark.addEventListener("click", () => { location.hash = ""; });
  wordmark.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); location.hash = ""; }
  });

  window.addEventListener("hashchange", render);
  render();
})();
