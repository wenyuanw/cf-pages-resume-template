(function () {
  const resumeEl = document.getElementById("resume");
  const panels = {
    zh: document.getElementById("resume-zh"),
    en: document.getElementById("resume-en"),
  };

  const MD_URLS = { zh: "./resume.md", en: "./resume.en.md" };

  const UI = {
    zh: {
      exportPdf: "导出 PDF",
      exportMd: "导出 Markdown",
      themeTitle: "切换深色/浅色模式",
      langTitle: "切换英文",
      langLabel: "En",
      mdFilename: (name) => `${name}-简历.md`,
    },
    en: {
      exportPdf: "Export PDF",
      exportMd: "Export Markdown",
      themeTitle: "Toggle dark/light mode",
      langTitle: "Switch to Chinese",
      langLabel: "中",
      mdFilename: (name) => `${name}-Resume.md`,
    },
  };

  let currentLocale = getLocale();
  const mdCache = { zh: null, en: null };

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

  function showPanel(locale) {
    for (const [key, panel] of Object.entries(panels)) {
      if (!panel) continue;
      panel.hidden = key !== locale;
    }
    const panel = panels[locale];
    if (panel && panel.dataset.title) {
      document.title = panel.dataset.title;
    }
  }

  async function animateLocaleSwap(locale) {
    if (prefersReducedMotion()) {
      showPanel(locale);
      return;
    }

    resumeEl.classList.add("resume--lang-out");
    await sleep(220);
    showPanel(locale);
    resumeEl.classList.remove("resume--lang-out");
    void resumeEl.offsetWidth;
    resumeEl.classList.add("resume--lang-in");
    await sleep(380);
    resumeEl.classList.remove("resume--lang-in");
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
      await animateLocaleSwap(next);
    });
  })();

  async function fetchMarkdown(locale) {
    if (mdCache[locale]) return mdCache[locale];
    const res = await fetch(MD_URLS[locale], { cache: "no-cache" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const text = await res.text();
    mdCache[locale] = text;
    return text;
  }

  function bindExportButtons() {
    const exportPdfBtn = document.getElementById("export-pdf");
    if (exportPdfBtn && !exportPdfBtn.dataset.bound) {
      exportPdfBtn.dataset.bound = "1";
      exportPdfBtn.addEventListener("click", () => window.print());
    }

    const exportMdBtn = document.getElementById("export-md");
    if (exportMdBtn && !exportMdBtn.dataset.bound) {
      exportMdBtn.dataset.bound = "1";
      exportMdBtn.addEventListener("click", async () => {
        const ui = UI[currentLocale];
        const panel = panels[currentLocale];
        const nameEl = panel && panel.querySelector(".resume__name");
        const name = nameEl ? nameEl.textContent.trim() : "";
        const filename = name ? ui.mdFilename(name) : "resume.md";

        try {
          const text = await fetchMarkdown(currentLocale);
          const blob = new Blob([text], { type: "text/markdown;charset=utf-8" });
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = filename;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        } catch (err) {
          alert(err.message);
        }
      });
    }
  }

  updateUiLabels();
  showPanel(currentLocale);
  bindExportButtons();
})();
