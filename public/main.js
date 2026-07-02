(async function () {
  const resumeEl = document.getElementById("resume");
  const MD_URLS = { zh: "./resume.md", en: "./resume.en.md" };

  const UI = {
    zh: {
      loadError: "简历加载失败",
      loadingLabel: "正在加载简历",
      titleSuffix: "个人简历",
      exportPdf: "导出 PDF",
      exportMd: "导出 Markdown",
      themeTitle: "切换深色/浅色模式",
      langTitle: "切换英文",
      langLabel: "En",
      mdFilename: (name) => `${name}-简历.md`,
    },
    en: {
      loadError: "Failed to load resume",
      loadingLabel: "Loading resume",
      titleSuffix: "Resume",
      exportPdf: "Export PDF",
      exportMd: "Export Markdown",
      themeTitle: "Toggle dark/light mode",
      langTitle: "Switch to Chinese",
      langLabel: "中",
      mdFilename: (name) => `${name}-Resume.md`,
    },
  };

  let currentLocale = getLocale();
  let currentText = "";
  const resumeCache = { zh: null, en: null };

  function prefersReducedMotion() {
    return window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  function pulseButton(btn, className) {
    if (!btn || prefersReducedMotion()) return;
    btn.classList.add(className);
    btn.addEventListener(
      "animationend",
      () => btn.classList.remove(className),
      { once: true }
    );
  }

  async function animateResumeSwap(updateFn) {
    if (prefersReducedMotion()) {
      updateFn();
      return;
    }

    resumeEl.classList.add("resume--lang-out");
    await sleep(220);
    updateFn();
    resumeEl.classList.remove("resume--lang-out");
    void resumeEl.offsetWidth;
    resumeEl.classList.add("resume--lang-in");
    await sleep(380);
    resumeEl.classList.remove("resume--lang-in");
  }

  function getLocale() {
    try {
      const saved = localStorage.getItem("resume-locale");
      if (saved === "en" || saved === "zh") return saved;
    } catch (e) {}
    return "zh";
  }

  function setLocale(locale) {
    currentLocale = locale;
    try {
      localStorage.setItem("resume-locale", locale);
    } catch (e) {}
    document.documentElement.lang = locale === "en" ? "en" : "zh-CN";
    updateUiLabels();
  }

  function updateUiLabels() {
    const ui = UI[currentLocale];
    const langBtn = document.getElementById("toggle-lang");
    const themeBtn = document.getElementById("toggle-theme");
    const exportPdfBtn = document.getElementById("export-pdf");
    const exportMdBtn = document.getElementById("export-md");

    if (langBtn) {
      langBtn.textContent = ui.langLabel;
      langBtn.title = ui.langTitle;
      langBtn.setAttribute("aria-label", ui.langTitle);
    }
    if (themeBtn) {
      themeBtn.title = ui.themeTitle;
      themeBtn.setAttribute("aria-label", ui.themeTitle);
    }
    if (exportPdfBtn) exportPdfBtn.textContent = ui.exportPdf;
    if (exportMdBtn) exportMdBtn.textContent = ui.exportMd;
  }

  (function initTheme() {
    const btn = document.getElementById("toggle-theme");
    if (!btn) return;
    const root = document.documentElement;

    function currentTheme() {
      return root.getAttribute("data-theme") === "dark" ? "dark" : "light";
    }

    const SUN_ICON =
      '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"></circle><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"></path></svg>';
    const MOON_ICON =
      '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>';

    function render() {
      btn.innerHTML = currentTheme() === "dark" ? SUN_ICON : MOON_ICON;
    }

    function applyTheme(theme) {
      root.setAttribute("data-theme", theme);
      try {
        localStorage.setItem("resume-theme", theme);
      } catch (e) {}
      render();
      pulseButton(btn, "is-switching");
    }

    function setTheme(theme, event) {
      if (prefersReducedMotion() || !document.startViewTransition) {
        applyTheme(theme);
        return;
      }

      const transition = document.startViewTransition(() => applyTheme(theme));
      transition.ready
        .then(() => {
          const rect = (event && event.currentTarget ? event.currentTarget : btn).getBoundingClientRect();
          const x = rect.left + rect.width / 2;
          const y = rect.top + rect.height / 2;
          const radius = Math.hypot(
            Math.max(x, window.innerWidth - x),
            Math.max(y, window.innerHeight - y)
          );

          document.documentElement.animate(
            {
              clipPath: [
                `circle(0px at ${x}px ${y}px)`,
                `circle(${radius}px at ${x}px ${y}px)`,
              ],
            },
            {
              duration: 480,
              easing: "ease-in-out",
              pseudoElement: "::view-transition-new(root)",
            }
          );
        })
        .catch(() => {});
    }

    render();
    btn.addEventListener("click", (event) => {
      setTheme(currentTheme() === "dark" ? "light" : "dark", event);
    });
  })();

  (function initLocale() {
    const btn = document.getElementById("toggle-lang");
    if (!btn) return;

    btn.addEventListener("click", async () => {
      const next = currentLocale === "zh" ? "en" : "zh";
      pulseButton(btn, "is-switching");
      setLocale(next);
      await loadResume(next, { switching: true });
    });
  })();

  if (window.marked) {
    marked.setOptions({ gfm: true, breaks: false });
  }

  function parseFrontmatter(text) {
    const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/.exec(text);
    if (!match) return { data: {}, body: text };

    const raw = match[1];
    const body = match[2];
    const data = {};
    let currentKey = null;

    for (const line of raw.split(/\r?\n/)) {
      if (/^\s*#/.test(line)) continue;
      const kv = /^([A-Za-z_][\w]*)\s*:\s*(.*)$/.exec(line);
      if (kv && !/^\s/.test(line)) {
        const key = kv[1];
        const val = kv[2].trim();
        if (val === "") {
          data[key] = [];
          currentKey = key;
        } else {
          data[key] = val;
          currentKey = null;
        }
      } else if (currentKey && /^\s+-\s+/.test(line)) {
        data[currentKey].push(line.replace(/^\s+-\s+/, "").trim());
      }
    }
    return { data, body };
  }

  function renderHeader(data) {
    const name = data.name || "";
    const info = Array.isArray(data.info) ? data.info : [];
    const highlights = Array.isArray(data.highlights) ? data.highlights : [];
    if (!name && info.length === 0 && highlights.length === 0) return "";

    let tagline = "";
    const contacts = [];

    for (const item of info) {
      const stripped = item.trim();
      if (/[@+]|github\.com|^(Email|Tel|GitHub):/i.test(stripped)) {
        contacts.push(stripped);
      } else if (!tagline) {
        tagline = stripped;
      } else {
        contacts.push(stripped);
      }
    }

    const contactsHtml = contacts
      .map((c) => {
        const emailMatch = /^Email:\s*(.+)$/i.exec(c);
        if (emailMatch) {
          const email = emailMatch[1].trim();
          return `<span><a href="mailto:${escapeHtml(email)}">${escapeHtml(c)}</a></span>`;
        }
        const telMatch = /^Tel:\s*(.+)$/i.exec(c);
        if (telMatch) {
          const tel = telMatch[1].trim();
          return `<span><a href="tel:${escapeHtml(tel.replace(/\s+/g, ""))}">${escapeHtml(c)}</a></span>`;
        }
        const gh = /github\.com\/[\w-]+/i.exec(c);
        if (gh) {
          const url = "https://" + gh[0];
          return `<span><a href="${url}" target="_blank" rel="noopener">${escapeHtml(c)}</a></span>`;
        }
        return `<span>${escapeHtml(c)}</span>`;
      })
      .join("");

    const highlightsHtml = highlights
      .map((h) => `<span>${escapeHtml(h.trim())}</span>`)
      .join('<span class="resume__sep">·</span>');

    return `
      <header class="resume__header">
        <h1 class="resume__name">${escapeHtml(name)}</h1>
        ${tagline ? `<p class="resume__tagline">${escapeHtml(tagline)}</p>` : ""}
        ${contactsHtml ? `<div class="resume__contacts">${contactsHtml}</div>` : ""}
        ${highlightsHtml ? `<div class="resume__highlights">${highlightsHtml}</div>` : ""}
      </header>
    `;
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  function decorateH3(html) {
    return html.replace(/<h3>([\s\S]*?)<\/h3>/g, (full, inner) => {
      const idx = inner.indexOf("|");
      if (idx === -1) return full;
      const left = inner.slice(0, idx).trim();
      const right = inner.slice(idx + 1).trim();
      return `<h3><span>${left}</span><span class="meta">${right}</span></h3>`;
    });
  }

  function decorateEducation(html) {
    return html.replace(
      /<h2>(教育经历|Education)<\/h2>\s*<ul>([\s\S]*?)<\/ul>/,
      (full, title, listInner) => {
        const entries = listInner.replace(/<li>([\s\S]*?)<\/li>/g, (liFull, inner) => {
          const text = inner.replace(/<\/?p>/g, "").trim();
          const idx = text.indexOf("|");
          if (idx === -1) return liFull;
          const left = text.slice(0, idx).trim();
          const right = text.slice(idx + 1).trim();
          return (
            `<div class="resume__entry">` +
            `<span class="resume__entry-title">${left}</span>` +
            `<span class="resume__entry-meta">${right}</span>` +
            `</div>`
          );
        });
        return `<h2>${title}</h2><div class="resume__entries">${entries}</div>`;
      }
    );
  }

  function renderSkeleton() {
    const tpl = document.getElementById("resume-skeleton");
    resumeEl.innerHTML = "";
    if (tpl) resumeEl.appendChild(tpl.content.cloneNode(true));
    const ui = UI[currentLocale];
    resumeEl.setAttribute("aria-busy", "true");
    resumeEl.setAttribute("aria-label", ui.loadingLabel);
  }

  function renderResumeContent(data, body, locale) {
    const ui = UI[locale];
    const headerHtml = renderHeader(data);
    let bodyHtml = window.marked ? marked.parse(body) : `<pre>${escapeHtml(body)}</pre>`;
    bodyHtml = decorateH3(bodyHtml);
    bodyHtml = decorateEducation(bodyHtml);
    resumeEl.innerHTML = `${headerHtml}<div class="resume__body">${bodyHtml}</div>`;
    resumeEl.removeAttribute("aria-busy");
    resumeEl.removeAttribute("aria-label");
    document.title = data.name ? `${data.name} · ${ui.titleSuffix}` : document.title;
    bindExportButtons(data);
  }

  async function fetchResume(locale) {
    if (resumeCache[locale]) return resumeCache[locale];
    const res = await fetch(MD_URLS[locale], { cache: "no-cache" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const text = await res.text();
    const { data, body } = parseFrontmatter(text);
    resumeCache[locale] = { text, data, body };
    return resumeCache[locale];
  }

  function prefetchLocale(locale) {
    if (resumeCache[locale]) return;
    fetchResume(locale).catch(() => {});
  }

  function bindExportButtons(data) {
    const exportPdfBtn = document.getElementById("export-pdf");
    if (exportPdfBtn && !exportPdfBtn.dataset.bound) {
      exportPdfBtn.dataset.bound = "1";
      exportPdfBtn.addEventListener("click", () => window.print());
    }

    const exportMdBtn = document.getElementById("export-md");
    if (exportMdBtn) {
      exportMdBtn.onclick = () => {
        const ui = UI[currentLocale];
        const filename = data.name ? ui.mdFilename(data.name) : "resume.md";
        const blob = new Blob([currentText], { type: "text/markdown;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      };
    }
  }

  async function loadResume(locale, options) {
    const ui = UI[locale];
    const switching = options && options.switching === true;
    const cached = resumeCache[locale];

    if (cached && switching) {
      await animateResumeSwap(() => {
        currentText = cached.text;
        renderResumeContent(cached.data, cached.body, locale);
      });
      return;
    }

    if (!cached && !switching) {
      renderSkeleton();
    } else if (switching) {
      if (prefersReducedMotion()) {
        resumeEl.classList.add("resume--switching");
      } else {
        resumeEl.classList.add("resume--lang-out");
        await sleep(220);
        resumeEl.classList.remove("resume--lang-out");
      }
    }

    try {
      const result = await fetchResume(locale);
      currentText = result.text;
      renderResumeContent(result.data, result.body, locale);
      resumeEl.classList.remove("resume--switching");

      if (switching && !prefersReducedMotion()) {
        void resumeEl.offsetWidth;
        resumeEl.classList.add("resume--lang-in");
        await sleep(380);
        resumeEl.classList.remove("resume--lang-in");
      }

      prefetchLocale(locale === "zh" ? "en" : "zh");
    } catch (err) {
      resumeEl.classList.remove("resume--switching", "resume--lang-out", "resume--lang-in");
      resumeEl.removeAttribute("aria-busy");
      resumeEl.removeAttribute("aria-label");
      resumeEl.innerHTML =
        `<div style="padding:40px;text-align:center;color:#b91c1c">` +
        `<p>${escapeHtml(ui.loadError)}</p><pre style="text-align:left;white-space:pre-wrap">${escapeHtml(err.message)}</pre></div>`;
    }
  }

  updateUiLabels();
  await loadResume(currentLocale);
  prefetchLocale(currentLocale === "zh" ? "en" : "zh");
})();
